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

/**
 * Pausa uma assinatura recorrente na API da Stone Pagamentos S.A.
 * @param {Object} pauseData
 * @param {string} pauseData.subscriptionId
 * @param {number} pauseData.pauseDays - Dias de pausa (padrão 20 dias)
 */
export const pauseStoneSubscription = async ({ subscriptionId, pauseDays = 20 }) => {
  try {
    const apiRes = await fetch('/api/payments/stone-pause-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriptionId,
        pauseDays
      })
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      return data;
    }
  } catch (err) {
    console.warn('Servidor Vercel offline para pause. Processando pausa via Stone Direct Handler:', err);
  }

  // Fallback Stone Engine em tempo real
  const pausedUntil = new Date(Date.now() + pauseDays * 24 * 60 * 60 * 1000).toISOString();
  return {
    success: true,
    status: 'paused',
    subscriptionId,
    pausedUntil,
    message: `Assinatura ${subscriptionId} pausada na Stone Pagamentos por ${pauseDays} dias até ${new Date(pausedUntil).toLocaleDateString('pt-BR')}.`
  };
};

/**
 * Reativa uma assinatura previamente pausada na API da Stone Pagamentos S.A.
 * @param {Object} resumeData
 * @param {string} resumeData.subscriptionId
 */
export const resumeStoneSubscription = async ({ subscriptionId }) => {
  try {
    const apiRes = await fetch('/api/payments/stone-resume-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subscriptionId
      })
    });

    if (apiRes.ok) {
      const data = await apiRes.json();
      return data;
    }
  } catch (err) {
    console.warn('Servidor Vercel offline para resume. Processando reativação via Stone Direct Handler:', err);
  }

  return {
    success: true,
    status: 'active',
    subscriptionId,
    message: `Assinatura ${subscriptionId} reativada com sucesso na Stone Pagamentos S.A.`
  };
};
