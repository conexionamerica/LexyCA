// Services & API Handlers para Asaas API v3
// Suporta PIX Instantâneo e Cartão de Crédito (Boleto Removido)
// Ciclo Recorrente Oficial: 30 Dias (MONTHLY)
// Unidade de Crédito: Aulas de 45 minutos

const LOCAL_STORAGE_KEY_ASAAS_CONFIG = 'lexy_asaas_payment_config_v1';

export const DEFAULT_ASAAS_CONFIG = {
  mode: import.meta.env.VITE_ASAAS_ENVIRONMENT || 'sandbox', // 'sandbox' | 'production'
  apiKey: import.meta.env.VITE_ASAAS_API_KEY || '',
  walletId: import.meta.env.VITE_ASAAS_WALLET_ID || 'a985bddf-d92e-423b-881a-cf2d843d5ca9',
  apiUrl: import.meta.env.VITE_ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3',
  pixEnabled: true,
  cardEnabled: true,
  invoiceEnabled: true
};

export const getAsaasConfig = () => {
  return DEFAULT_ASAAS_CONFIG;
};

export const saveAsaasConfig = (newConfig) => {
  const updated = { ...getAsaasConfig(), ...newConfig };
  localStorage.setItem(LOCAL_STORAGE_KEY_ASAAS_CONFIG, JSON.stringify(updated));
  return updated;
};

/**
 * Processa um pagamento pontual via Asaas (PIX ou Cartão)
 */
export const processAsaasPayment = async (paymentData) => {
  try {
    const apiRes = await fetch('/api/payments/asaas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        method: paymentData.method, // 'pix' | 'credit_card'
        amount: paymentData.amount,
        description: paymentData.description,
        customer: paymentData.customer,
        cardData: paymentData.cardData,
        lessonsCount: paymentData.lessonsCount
      })
    });

    const data = await apiRes.json();
    if (apiRes.ok && data.success) {
      return data;
    } else {
      return {
        success: false,
        error: data.error || 'Erro de autorização na API do Asaas.',
        details: data
      };
    }
  } catch (err) {
    console.error('Erro chamando /api/payments/asaas:', err);
    return {
      success: false,
      error: 'Falha de conexão com o servidor de pagamentos Asaas.'
    };
  }
};

/**
 * Processa uma Assinatura Mensal Recorrente no Asaas (Ciclo 30 Dias)
 */
export const processAsaasSubscription = async (subData) => {
  try {
    const apiRes = await fetch('/api/payments/asaas-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: subData.amount,
        planName: subData.planName,
        customer: subData.customer,
        cardData: subData.cardData,
        method: subData.method || 'credit_card',
        lessonsCount: subData.lessonsCount
      })
    });

    const data = await apiRes.json();
    if (apiRes.ok && data.success) {
      return data;
    } else {
      return {
        success: false,
        error: data.error || 'Erro ao processar assinatura recorrente no Asaas.'
      };
    }
  } catch (err) {
    console.error('Erro chamando /api/payments/asaas-subscription:', err);
    return {
      success: false,
      error: 'Falha ao conectar com o servidor de assinaturas Asaas.'
    };
  }
};

/**
 * Solicita a emissão de Nota Fiscal Eletrônica (NFS-e) no Asaas
 */
export const issueAsaasInvoice = async (invoiceData) => {
  try {
    const apiRes = await fetch('/api/payments/asaas-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentId: invoiceData.paymentId,
        value: invoiceData.value,
        serviceDescription: invoiceData.serviceDescription,
        customerId: invoiceData.customerId
      })
    });

    const data = await apiRes.json();
    return data;
  } catch (err) {
    console.error('Erro chamando /api/payments/asaas-invoice:', err);
    return {
      success: false,
      error: 'Falha de conexão com o emissor de Nota Fiscal Asaas.'
    };
  }
};

/**
 * Request an automatic PIX transfer to a tutor
 */
export const processAsaasTransfer = async (transferData) => {
  try {
    const apiRes = await fetch('/api/payments/asaas-transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: transferData.amount,
        pixKey: transferData.pixKey,
        description: transferData.description
      })
    });

    const data = await apiRes.json();
    if (apiRes.ok && data.success) {
      return data;
    } else {
      return {
        success: false,
        error: data.error || 'Erro ao processar transferência no Asaas.',
        details: data
      };
    }
  } catch (err) {
    console.error('Erro chamando /api/payments/asaas-transfer:', err);
    return {
      success: false,
      error: 'Falha de conexão com o servidor Asaas para transferência.'
    };
  }
};

/**
 * Pausa uma Assinatura no Asaas (por até 20 dias)
 */
export const pauseAsaasSubscription = async ({ subscriptionId, pauseDays = 20 }) => {
  try {
    const apiRes = await fetch('/api/payments/asaas-pause-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, pauseDays })
    });
    const data = await apiRes.json();
    return data;
  } catch (err) {
    console.error('Erro chamando /api/payments/asaas-pause-subscription:', err);
    return { success: false, error: 'Falha ao pausar assinatura no Asaas.' };
  }
};

/**
 * Reativa uma Assinatura Pausada no Asaas
 */
export const resumeAsaasSubscription = async ({ subscriptionId }) => {
  try {
    const apiRes = await fetch('/api/payments/asaas-resume-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId })
    });
    const data = await apiRes.json();
    return data;
  } catch (err) {
    console.error('Erro chamando /api/payments/asaas-resume-subscription:', err);
    return { success: false, error: 'Falha ao reativar assinatura no Asaas.' };
  }
};

/**
 * Cancela a Renovação Automática da Assinatura no Asaas
 */
export const cancelAsaasSubscription = async ({ subscriptionId, reason }) => {
  try {
    const apiRes = await fetch('/api/payments/asaas-cancel-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId, reason })
    });
    const data = await apiRes.json();
    return data;
  } catch (err) {
    console.error('Erro chamando /api/payments/asaas-cancel-subscription:', err);
    return { success: false, error: 'Falha ao cancelar assinatura no Asaas.' };
  }
};

