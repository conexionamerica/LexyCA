// Utilidades compartidas das funções serverless (arquivos com "_" não viram rotas na Vercel).
import { createClient } from '@supabase/supabase-js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// CORS: as chamadas do site são same-origin; a autenticação é feita por token Bearer
// (não por cookie), então liberar a origem não permite CSRF.
export function applyCors(req, res, methods = 'POST,OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

let cachedAdminClient = null;

// Cliente Supabase com service role. NUNCA cai para a anon key: sem a service role o servidor
// não consegue (e não deve tentar) ignorar o RLS.
export function getSupabaseAdmin() {
  if (cachedAdminClient) return cachedAdminClient;
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new HttpError(500, 'Servidor sem configuração do Supabase (SUPABASE_SERVICE_ROLE_KEY).');
  }
  cachedAdminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return cachedAdminClient;
}

// Valida o token de sessão do Supabase enviado pelo frontend e retorna { user, profile }.
export async function requireUser(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) throw new HttpError(401, 'Sessão expirada. Faça login novamente.');

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Sessão inválida. Faça login novamente.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, phone, document_number, postal_code, address, address_number, complement, province')
    .eq('id', data.user.id)
    .maybeSingle();

  return { user: data.user, profile: profile || { id: data.user.id, email: data.user.email, role: 'student' } };
}

export async function requireAdmin(req) {
  const auth = await requireUser(req);
  if (auth.profile?.role !== 'admin') throw new HttpError(403, 'Acesso restrito ao administrador.');
  return auth;
}

// Configuração do Asaas: somente variáveis de ambiente, sem chaves no código.
// O ambiente é deduzido pelo prefixo da chave ($aact_prod_ = produção, $aact_hmlg_ = sandbox),
// a menos que ASAAS_API_URL seja definido explicitamente.
export function getAsaasConfig() {
  // VITE_ASAAS_API_KEY aceito só por compatibilidade: o frontend não referencia mais essa
  // variável, então o Vite não a embute no bundle. Prefira ASAAS_API_KEY.
  const apiKey = process.env.ASAAS_API_KEY || process.env.VITE_ASAAS_API_KEY;
  if (!apiKey) throw new HttpError(500, 'Servidor sem configuração do Asaas (ASAAS_API_KEY).');

  const explicitUrl = process.env.ASAAS_API_URL || process.env.VITE_ASAAS_API_URL;
  const baseUrl = explicitUrl || (apiKey.includes('_hmlg_') ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3');

  return {
    apiKey,
    baseUrl: baseUrl.replace(/\/+$/, ''),
    walletId: process.env.ASAAS_WALLET_ID || process.env.VITE_ASAAS_WALLET_ID || null,
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey,
      'User-Agent': 'LexyIdiomas/1.0'
    }
  };
}

export async function asaasFetch(path, options = {}) {
  const cfg = getAsaasConfig();
  const res = await fetch(`${cfg.baseUrl}${path}`, { ...options, headers: { ...cfg.headers, ...(options.headers || {}) } });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  return { ok: res.ok, status: res.status, data };
}

export function asaasErrorMessage(data, fallback) {
  return data?.errors?.[0]?.description || fallback;
}

// Busca o cliente Asaas pelo CPF ou cria um novo. Nunca usa dados fictícios.
export async function findOrCreateAsaasCustomer({ name, email, cpf, phone, postalCode, address, addressNumber, province }) {
  const search = await asaasFetch(`/customers?cpfCnpj=${encodeURIComponent(cpf)}`);
  const payload = {
    name,
    email,
    cpfCnpj: cpf,
    ...(phone ? { mobilePhone: phone } : {}),
    ...(postalCode ? { postalCode } : {}),
    ...(address ? { address } : {}),
    ...(addressNumber ? { addressNumber } : {}),
    ...(province ? { province } : {})
  };

  if (search.ok && Array.isArray(search.data?.data) && search.data.data.length > 0) {
    const id = search.data.data[0].id;
    await asaasFetch(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }).catch(() => {});
    return id;
  }

  const created = await asaasFetch('/customers', {
    method: 'POST',
    body: JSON.stringify({ ...payload, notificationDisabled: true })
  });
  if (!created.ok) throw new HttpError(400, asaasErrorMessage(created.data, 'Erro ao registrar cliente no Asaas.'));
  return created.data.id;
}

export function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

export function sendError(res, err, logLabel) {
  const status = err instanceof HttpError ? err.status : 500;
  if (status >= 500) console.error(`[${logLabel}]`, err);
  return res.status(status).json({
    success: false,
    error: err instanceof HttpError ? err.message : 'Erro interno do servidor.'
  });
}
