// Services & API Handlers para Stone Pagamentos S.A. / Pagar.me API v5
// Suporta PIX Instantâneo, Cartão de Crédito e Boleto Bancário em R$ (BRL)

const LOCAL_STORAGE_KEY_STONE_CONFIG = 'lexy_stone_payment_config_v1';

export const DEFAULT_STONE_CONFIG = {
  mode: 'sandbox', // 'sandbox' | 'production'
  secretKey: import.meta.env.VITE_STONE_SECRET_KEY || 'sk_test_e281e8247d9842a58a07be13e0e5a577',
  publicKey: import.meta.env.VITE_STONE_PUBLIC_KEY || 'pk_test_Y5VB4W6sbZTWJa2O',
  accountId: import.meta.env.VITE_STONE_ACCOUNT_ID || 'acc_2bPVBbvinPimVa8j',
  pixEnabled: true,
  cardEnabled: true,
  boletoEnabled: false
};

export const getStoneConfig = () => {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY_STONE_CONFIG);
  if (saved) {
    try {
      return { ...DEFAULT_STONE_CONFIG, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Erro ao carregar configurações da Stone Pagamentos', e);
    }
  }
  return DEFAULT_STONE_CONFIG;
};

export const saveStoneConfig = (newConfig) => {
  const updated = { ...getStoneConfig(), ...newConfig };
  localStorage.setItem(LOCAL_STORAGE_KEY_STONE_CONFIG, JSON.stringify(updated));
  return updated;
};

/**
 * Processa um pagamento via Stone Pagamentos S.A.
 * @param {Object} paymentData
 * @param {string} paymentData.method - 'pix' | 'credit_card' | 'boleto'
 * @param {number} paymentData.amount - Valor em Reais (R$)
 * @param {string} paymentData.description - Descrição da transação
 * @param {Object} paymentData.customer - Dados do comprador (nome, email, cpf)
 * @param {Object} paymentData.cardData - Dados do cartão (se cartão)
 */
export const processStonePayment = async (paymentData) => {
  const config = getStoneConfig();

  // 1. Tentar chamada ao Endpoint Serverless Backend da Vercel (Sem CORS e com resposta oficial Stone)
  try {
    const apiRes = await fetch('/api/payments/stone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: paymentData.method,
        amount: paymentData.amount,
        description: paymentData.description,
        customer: paymentData.customer,
        cardData: paymentData.cardData
      })
    });

    const data = await apiRes.json();
    if (apiRes.ok && data.success) {
      return data;
    } else {
      return {
        success: false,
        error: data.error || 'Erro de autorização na API da Stone Pagamentos S.A.',
        details: data
      };
    }
  } catch (err) {
    console.error('Erro chamando /api/payments/stone:', err);
    return {
      success: false,
      error: 'Falha de conexão com o servidor de pagamentos da Stone S.A.'
    };
  }
};

/**
 * Processa uma Assinatura Mensal Recorrente via Stone Pagamentos S.A.
 */
export const processStoneSubscription = async (subData) => {
  try {
    const apiRes = await fetch('/api/payments/stone-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: subData.amount,
        planName: subData.planName,
        customer: subData.customer,
        cardData: subData.cardData,
        isRecurring: true
      })
    });

    const data = await apiRes.json();
    if (apiRes.ok && data.success) {
      return data;
    } else {
      return {
        success: false,
        error: data.error || 'Erro ao processar assinatura recorrente na Stone S.A.'
      };
    }
  } catch (err) {
    console.error('Erro chamando /api/payments/stone-subscription:', err);
    return {
      success: false,
      error: 'Falha ao conectar com o servidor de assinaturas da Stone S.A.'
    };
  }
};
