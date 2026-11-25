// Montagem e validação dos dados de cliente/cartão para o Asaas (sem dados fictícios).
import { onlyDigits, HttpError } from './server.js';

export function validateCpf(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

// Monta e valida os dados do cliente. Email e nome vêm da conta autenticada.
export function buildCustomer(user, profile, body, { requireAddress }) {
  const customer = body.customer || {};
  const cardData = body.cardData || {};

  const cpf = onlyDigits(customer.document || customer.cpfCnpj || profile?.document_number);
  if (!validateCpf(cpf)) throw new HttpError(400, 'CPF inválido. Verifique os dígitos.');

  const postalCode = onlyDigits(customer.postalCode || customer.cep || cardData.postalCode || profile?.postal_code);
  const addressNumber = String(customer.addressNumber || cardData.addressNumber || profile?.address_number || '').trim();
  if (requireAddress && (postalCode.length !== 8 || !addressNumber)) {
    throw new HttpError(400, 'Informe CEP e número do endereço do titular do cartão.');
  }

  return {
    name: String(profile?.full_name || customer.name || user.email.split('@')[0]).trim(),
    email: user.email,
    cpf,
    phone: onlyDigits(customer.phone || customer.mobilePhone || profile?.phone) || undefined,
    postalCode: postalCode.length === 8 ? postalCode : undefined,
    address: customer.address || profile?.address || undefined,
    addressNumber: addressNumber || undefined,
    province: customer.province || customer.bairro || profile?.province || undefined,
    complement: customer.complement || profile?.complement || undefined
  };
}

export function buildCreditCard(cardData, customer) {
  const number = onlyDigits(cardData.number);
  const ccv = onlyDigits(cardData.cvv);
  const expiryMonth = String(cardData.expMonth || '').padStart(2, '0');
  let expiryYear = String(cardData.expYear || '');
  if (expiryYear.length === 2) expiryYear = `20${expiryYear}`;
  const holderName = String(cardData.holderName || '').trim().toUpperCase();

  if (number.length < 13 || ccv.length < 3 || !/^\d{2}$/.test(expiryMonth) || !/^\d{4}$/.test(expiryYear) || !holderName) {
    throw new HttpError(400, 'Dados do cartão incompletos.');
  }

  return {
    creditCard: { holderName, number, expiryMonth, expiryYear, ccv },
    creditCardHolderInfo: {
      name: holderName,
      email: customer.email,
      cpfCnpj: customer.cpf,
      postalCode: customer.postalCode,
      addressNumber: customer.addressNumber,
      addressComplement: customer.complement || null,
      phone: customer.phone,
      mobilePhone: customer.phone
    }
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Descobre a assinatura do Asaas que pertence ao usuário autenticado.
// O frontend envia o id da assinatura no Supabase (ou, em versões antigas, um id local).
// Retorna { asaasId, row } ou lança HttpError. Nunca permite agir na assinatura de outra pessoa.
export async function resolveOwnedAsaasSubscription({ supabase, asaasFetch, user, profile, subscriptionId }) {
  const isAdmin = profile?.role === 'admin';
  const requestedId = String(subscriptionId || '').trim();
  if (!requestedId) throw new HttpError(400, 'ID da assinatura não fornecido.');

  // 1. Procurar a linha no Supabase
  let row = null;
  const byAsaas = await supabase.from('subscriptions').select('*').eq('asaas_subscription_id', requestedId).limit(1);
  if (byAsaas.data?.length) row = byAsaas.data[0];
  if (!row && UUID_RE.test(requestedId)) {
    const byId = await supabase.from('subscriptions').select('*').eq('id', requestedId).limit(1);
    if (byId.data?.length) row = byId.data[0];
  }

  const userEmail = String(user.email || '').toLowerCase();
  if (row && !isAdmin) {
    const ownsRow = row.student_id === user.id || String(row.student_email || '').toLowerCase() === userEmail;
    if (!ownsRow) throw new HttpError(403, 'Esta assinatura não pertence à sua conta.');
  }
  if (row?.asaas_subscription_id) return { asaasId: row.asaas_subscription_id, row };

  // 2. Assinaturas antigas não guardavam o id do Asaas: procurar pelas assinaturas ativas
  //    do cliente Asaas com o email do dono.
  const ownerEmail = isAdmin && row?.student_email ? String(row.student_email).toLowerCase() : userEmail;
  const customers = await asaasFetch(`/customers?email=${encodeURIComponent(ownerEmail)}`);
  const customerIds = (customers.data?.data || [])
    .filter(c => String(c.email || '').toLowerCase() === ownerEmail)
    .map(c => c.id);

  const candidates = [];
  for (const customerId of customerIds) {
    const subs = await asaasFetch(`/subscriptions?customer=${encodeURIComponent(customerId)}`);
    for (const s of subs.data?.data || []) {
      if (!s.deleted && s.status !== 'EXPIRED') candidates.push(s);
    }
  }

  // Planes pagos via PIX são cobranças avulsas: não existe assinatura no Asaas para alterar.
  if (candidates.length === 0) return { asaasId: null, row };

  const exact = candidates.find(s => s.id === requestedId);
  if (exact) return { asaasId: exact.id, row };
  const active = candidates.filter(s => s.status === 'ACTIVE' || s.status === 'INACTIVE');
  if (active.length === 1) return { asaasId: active[0].id, row };

  throw new HttpError(409, active.length > 1
    ? 'Encontramos mais de uma assinatura no Asaas para esta conta. Entre em contato com o suporte para concluir.'
    : 'Não encontramos uma assinatura ativa no Asaas para esta conta. Entre em contato com o suporte.');
}

// Guarda o id do Asaas na linha do Supabase (para as próximas operações).
export async function rememberAsaasSubscriptionId(supabase, row, asaasId) {
  if (row?.id && !row.asaas_subscription_id) {
    await supabase.from('subscriptions').update({ asaas_subscription_id: asaasId }).eq('id', row.id);
  }
}
