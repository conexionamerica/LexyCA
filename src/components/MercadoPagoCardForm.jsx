import React, { useEffect, useState, useRef } from 'react';
import { loadMercadoPago } from "@mercadopago/sdk-js";
import { CreditCard, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

const MercadoPagoCardForm = ({ amount, studentId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  
  const formInitialized = useRef(false);
  const cardFormRef = useRef(null);
  
  const latestProps = useRef({ amount, studentId, onSuccess, onCancel });
  useEffect(() => {
    latestProps.current = { amount, studentId, onSuccess, onCancel };
  }, [amount, studentId, onSuccess, onCancel]);

  useEffect(() => {
    if (formInitialized.current) return;
    
    const formElement = document.getElementById('form-checkout');
    if (!formElement) return;

    formInitialized.current = true;
    let isMounted = true;

    const initializeMercadoPago = async () => {
      try {
        await loadMercadoPago();
        if (!isMounted) return;

        // Llave pública por defecto (sandbox/prueba)
        const mpKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || "APP_USR-437d57f3-f894-4555-9b85-9da1104a8cb9";
        
        const mp = new window.MercadoPago(mpKey, {
          locale: 'pt-BR'
        });

        // Limpiar elementos
        ['form-checkout__cardNumber', 'form-checkout__expirationDate', 'form-checkout__securityCode'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });

        const cardFormInstance = mp.cardForm({
          amount: String(latestProps.current.amount),
          iframe: true,
          form: {
            id: "form-checkout",
            cardNumber: { id: "form-checkout__cardNumber", placeholder: "Número do cartão" },
            expirationDate: { id: "form-checkout__expirationDate", placeholder: "MM/AA" },
            securityCode: { id: "form-checkout__securityCode", placeholder: "CVC" },
            cardholderName: { id: "form-checkout__cardholderName", placeholder: "Titular do cartão" },
            issuer: { id: "form-checkout__issuer", placeholder: "Banco emissor" },
            installments: { id: "form-checkout__installments", placeholder: "Parcelas" },
            identificationType: { id: "form-checkout__identificationType", placeholder: "Tipo de documento" },
            identificationNumber: { id: "form-checkout__identificationNumber", placeholder: "Número do documento" },
            cardholderEmail: { id: "form-checkout__cardholderEmail", placeholder: "E-mail" },
          },
          callbacks: {
            onFormMounted: error => {
              if (error) {
                console.warn("MercadoPago Form Mounted handle error: ", error);
                setSimulationMode(true); // Si falla en cargar (ej. offline), activar simulación
                setLoading(false);
                return;
              }
              if (isMounted) setLoading(false);
            },
            onSubmit: event => {
              event.preventDefault();
              setProcessing(true);
              
              const formData = cardFormInstance.getCardFormData();
              const {
                paymentMethodId: payment_method_id,
                issuerId: issuer_id,
                cardholderEmail: email,
                amount: transaction_amount,
                token,
                installments,
                identificationNumber,
                identificationType,
              } = formData;

              if (!token || !payment_method_id) {
                alert("Por favor, preencha todos os dados do cartão.");
                setProcessing(false);
                return;
              }

              const { studentId, amount, onSuccess } = latestProps.current;

              // Llamar a nuestra API local
              fetch("/api/payments/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token,
                  issuer_id,
                  payment_method_id,
                  transaction_amount: Number(transaction_amount),
                  installments: Number(installments),
                  description: `Recarga de créditos: R$ ${amount}`,
                  student_id: studentId,
                  payer: {
                    email,
                    identification: { type: identificationType, number: identificationNumber },
                  },
                }),
              })
              .then(res => res.json())
              .then(data => {
                if (data.status === "approved" || data.status === "in_process") {
                  onSuccess(Number(transaction_amount), data.id);
                } else {
                  alert(data.status_detail || "O pagamento não foi aprovado.");
                  setProcessing(false);
                }
              })
              .catch(error => {
                console.error(error);
                // Si la API falla (porque no está desplegado en Vercel localmente o faltan llaves),
                // ofrecemos una opción para simular la aprobación con fines de demostración.
                alert("Erro de comunicação com a API. Ativando simulação para testes.");
                setSimulationMode(true);
                setProcessing(false);
              });
            }
          }
        });

        cardFormRef.current = cardFormInstance;

      } catch (err) {
        console.error("Failed to load MercadoPago", err);
        if (isMounted) {
          setSimulationMode(true);
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(() => {
      initializeMercadoPago();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (cardFormRef.current) {
        cardFormRef.current.unmount();
        cardFormRef.current = null;
      }
      formInitialized.current = false;
    };
  }, []);

  const handleSimulatedPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      // Generar un ID de transacción ficticio
      const mockPaymentId = `MP-SIM-${Math.floor(Math.random() * 10000000)}`;
      latestProps.current.onSuccess(latestProps.current.amount, mockPaymentId);
    }, 1500);
  };

  return (
    <div className="w-full">
      <div className="mb-4 bg-emerald-50 text-emerald-800 p-4 rounded-xl flex items-center justify-between border border-emerald-200">
        <div className="flex items-center gap-2">
           <CreditCard className="w-5 h-5 text-emerald-600" />
           <span className="font-semibold text-sm">Monto a cargar:</span>
        </div>
        <span className="font-extrabold text-lg text-emerald-700">R$ {amount.toFixed(2)}</span>
      </div>

      {simulationMode ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center space-y-3">
          <div className="flex justify-center text-amber-500">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h4 className="font-bold text-amber-900 text-sm">Entorno de Simulación Activo</h4>
          <p className="text-xs text-amber-700 leading-relaxed">
            El SDK de Mercado Pago no pudo cargarse o la API local no está disponible.
            Puedes simular la acreditación exitosa de saldo para validar todo el flujo del sistema.
          </p>
          <button
            type="button"
            onClick={handleSimulatedPayment}
            disabled={processing}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-bold text-sm shadow hover:from-amber-600 hover:to-orange-700 transition flex items-center justify-center gap-2"
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {processing ? "Procesando pago ficticio..." : "Confirmar Pago Simulado (Aprobar)"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-amber-800 underline block mx-auto hover:text-amber-900"
          >
            Cancelar recarga
          </button>
        </div>
      ) : (
        <form id="form-checkout" className="space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-slate-100">
              <Loader2 className="w-8 h-8 animate-spin text-brand-500 mb-2" />
              <p className="text-xs text-slate-500 font-medium">Iniciando pasarela de Mercado Pago...</p>
            </div>
          )}

          <div className={loading ? 'invisible h-0 overflow-hidden' : 'space-y-3'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Número de Tarjeta</label>
                <div id="form-checkout__cardNumber" className="h-9 px-3 py-1.5 rounded-lg border border-slate-200 w-full bg-white text-sm"></div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Vencimiento</label>
                <div id="form-checkout__expirationDate" className="h-9 px-3 py-1.5 rounded-lg border border-slate-200 w-full bg-white text-sm"></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Nombre del Titular</label>
                <input type="text" id="form-checkout__cardholderName" className="h-9 px-3 py-1.5 rounded-lg border border-slate-200 w-full bg-white text-sm outline-none focus:border-brand-500" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Código de Seguridad</label>
                <div id="form-checkout__securityCode" className="h-9 px-3 py-1.5 rounded-lg border border-slate-200 w-full bg-white text-sm"></div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Correo Electrónico</label>
              <input type="email" id="form-checkout__cardholderEmail" className="h-9 px-3 py-1.5 rounded-lg border border-slate-200 w-full bg-white text-sm outline-none focus:border-brand-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Banco Emisor</label>
                <select id="form-checkout__issuer" className="h-9 px-2 py-1 rounded-lg border border-slate-200 w-full bg-white text-sm outline-none"></select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Cuotas</label>
                <select id="form-checkout__installments" className="h-9 px-2 py-1 rounded-lg border border-slate-200 w-full bg-white text-sm outline-none"></select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Tipo de Documento</label>
                <select id="form-checkout__identificationType" className="h-9 px-2 py-1 rounded-lg border border-slate-200 w-full bg-white text-sm outline-none"></select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Número de Documento</label>
                <input type="text" id="form-checkout__identificationNumber" className="h-9 px-3 py-1.5 rounded-lg border border-slate-200 w-full bg-white text-sm outline-none" />
              </div>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={processing}
                className="w-1/3 py-2 border border-slate-200 rounded-lg text-slate-600 text-sm font-semibold hover:bg-slate-50 transition"
              >
                Volver
              </button>
              <button
                type="submit"
                id="form-checkout__submit"
                disabled={processing || loading}
                className="w-2/3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-lg font-bold text-sm shadow hover:from-brand-700 hover:to-indigo-700 transition flex items-center justify-center gap-2"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {processing ? "Procesando..." : `Pagar R$ ${amount}`}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default MercadoPagoCardForm;
