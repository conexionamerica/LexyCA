/**
 * Validador e Buscador Inteligente de CEP (Código de Endereçamento Postal) Brasil
 * Integração em tempo real com ViaCEP API
 */

export function formatCEP(value) {
  if (!value) return '';
  const clean = value.replace(/\D/g, '').slice(0, 8);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5)}`;
}

export function validateCEP(cepStr) {
  if (!cepStr) return false;
  const clean = cepStr.replace(/\D/g, '');
  return clean.length === 8;
}

export async function fetchAddressByCEP(cepStr) {
  if (!cepStr) return null;
  const clean = cepStr.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.erro) return null;

    return {
      postalCode: formatCEP(clean),
      address: data.logradouro || '',
      province: data.bairro || '',
      city: data.localidade || '',
      state: data.uf || ''
    };
  } catch (err) {
    console.warn('Erro ao consultar ViaCEP:', err);
    return null;
  }
}
