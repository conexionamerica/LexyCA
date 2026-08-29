import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldCheck, CreditCard, QrCode, FileText, CheckCircle2, 
  Loader2, Copy, Check, Lock, AlertCircle, X, Sparkles, ChevronRight
} from 'lucide-react';
import { processStonePayment, processStoneSubscription, getStoneConfig } from '../../lib/stonePaymentService';
import { validateCPF, formatCPF } from '../../lib/cpfValidator';
import { useMarketplace, getTeacherEarnPercent } from '../../contexts/MarketplaceContext';

export default function StoneCheckoutModal({ isOpen, onClose, amount, description, onSuccess, customerInfo, isRecurring = false, tutorInfo }) {
  const marketplace = useMarketplace ? useMarketplace() : null;
  const tierRates = marketplace?.tierRates;
  const [activeTab, setActiveTab] = useState('pix'); // 'pix' | 'card' | 'boleto'
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  // Datos Formulario Cartão de Crédito Stone
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(customerInfo?.name || '');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardCpf, setCardCpf] = useState(customerInfo?.document || '');
  const [installments, setInstallments] = useState(1);

  // Estado PIX Stone
  const [pixData, setPixData] = useState(null);
  const [pixCountdown, setPixCountdown] = useState(900); // 15 min

  // Estado Boleto Stone
  const [boletoData, setBoletoData] = useState(null);

  const numAmount = parseFloat(amount) || 1;

  // Reset al abrir modal
  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setSuccessResult(null);
      setPixData(null);
      setBoletoData(null);
      if (customerInfo?.name) setCardHolder(customerInfo.name);
      if (customerInfo?.document) setCardCpf(customerInfo.document);
    }
  }, [isOpen, customerInfo]);

  // Regressivo PIX
  useEffect(() => {
    let timer;
    if (pixData && pixCountdown > 0) {
      timer = setInterval(() => {
        setPixCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pixData, pixCountdown]);

  // Formatear Número de Cartão de Crédito
  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Formatear Expiración MM/AA
  const handleCardExpChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setCardExp(val);
  };

  // Formatear CPF
  const handleCpfChange = (e) => {
    setCardCpf(formatCPF(e.target.value));
  };

  // Detectar Bandera del Cartón
  const getCardBrand = (number) => {
    const clean = number.replace(/\D/g, '');
    if (/^4/.test(clean)) return { name: 'Visa', color: 'text-cyan-400' };
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return { name: 'Mastercard', color: 'text-amber-400' };
    if (/^3[47]/.test(clean)) return { name: 'Amex', color: 'text-cyan-400' };
    return { name: 'Cartão', color: 'text-slate-400' };
  };

  // Generar PIX Stone
  const handleGeneratePix = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await processStonePayment({
        method: 'pix',
        amount: numAmount,
        description: description || 'Recarga / Agendamento Lexy Idiomas',
        customer: customerInfo
      });
      if (res.success) {
        setPixData(res);
        setPixCountdown(900);
      } else {
        setErrorMsg(res.error || 'Erro ao gerar PIX via Stone.');
      }
    } catch (e) {
      setErrorMsg('Falha de conexão com Stone Pagamentos.');
    } finally {
      setLoading(false);
    }
  };

  // Procesar Cartão de Crédito ou Assinatura Recorrente Stone
  const handleSubmitCard = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCard = cardNumber.replace(/\D/g, '');
    if (cleanCard.length < 13) {
      setErrorMsg('Por favor, informe um número de cartão válido.');
      return;
    }

    if (!cardHolder.trim()) {
      setErrorMsg('Informe o nome impresso no cartão.');
      return;
    }

    if (cardExp.length < 5) {
      setErrorMsg('Informe a validade do cartão (MM/AA).');
      return;
    }

    if (cardCvv.length < 3) {
      setErrorMsg('Informe o código CVC de segurança.');
      return;
    }

    const cleanCpf = cardCpf.replace(/\D/g, '');
    if (cleanCpf.length === 11 && !validateCPF(cleanCpf)) {
      setErrorMsg('CPF do titular inválido.');
      return;
    }

    setLoading(true);

    try {
      const expParts = cardExp.split('/');
      const tutorLessons = tutorInfo?.totalLessons || marketplace?.tutors?.[0]?.totalLessons || 0;
      const computedTutorPercentage = getTeacherEarnPercent(tutorLessons, false, tierRates);
      const tutorRecipientId = tutorInfo?.recipient_id || 're_tutor_lexy_official';
      let res;
      
      if (isRecurring) {
        res = await processStoneSubscription({
          amount: numAmount,
          planName: `Plano Lexy ${Math.round(numAmount)} Créditos Mensais`,
          customer: { ...customerInfo, name: cardHolder, document: cleanCpf },
          tutorRecipientId,
          tutorPercentage: computedTutorPercentage,
          platformPercentage: 100 - computedTutorPercentage,
          cardData: {
            number: cleanCard,
            holderName: cardHolder,
            expMonth: expParts[0],
            expYear: `20${expParts[1]}`,
            cvv: cardCvv,
            installments: 1
          }
        });
      } else {
        res = await processStonePayment({
          method: 'credit_card',
          amount: numAmount,
          description: description || 'Pagamento Cartão Stone',
          customer: { ...customerInfo, name: cardHolder, document: cleanCpf },
          tutorRecipientId,
          tutorPercentage: computedTutorPercentage,
          platformPercentage: 100 - computedTutorPercentage,
          cardData: {
            number: cleanCard,
            holderName: cardHolder,
            expMonth: expParts[0],
            expYear: `20${expParts[1]}`,
            cvv: cardCvv,
            installments: parseInt(installments, 10)
          }
        });
      }

      if (res.success) {
        setSuccessResult(res);
        setTimeout(() => {
          if (onSuccess) onSuccess(res);
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Transação recusada pela Stone S.A.');
      }
    } catch (err) {
      setErrorMsg('Erro no processamento da cobrança Stone.');
    } finally {
      setLoading(false);
    }
  };

  // Copiar Chave PIX ou Código de Barras
  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Polling automático no servidor da Stone Pagamentos S.A.
  useEffect(() => {
    let interval;
    if (pixData?.transactionId && !successResult) {
      interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/payments/stone-status?order_id=${pixData.transactionId}`);
          if (statusRes.ok) {
            const data = await statusRes.json();
            if (data.paid || data.status === 'paid') {
              clearInterval(interval);
              const res = {
                success: true,
                transactionId: pixData.transactionId,
                status: 'paid',
                message: 'Pagamento PIX confirmado com sucesso via Stone S.A.!'
              };
              setSuccessResult(res);
              setTimeout(() => {
                if (onSuccess) onSuccess(res);
              }, 1500);
            }
          }
        } catch (e) {
          console.warn('Erro ao consultar status da ordem Stone:', e);
        }
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [pixData, successResult]);

  const minutes = Math.floor(pixCountdown / 60);
  const seconds = pixCountdown % 60;
  const formattedCountdown = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const cardBrand = getCardBrand(cardNumber);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl space-y-0 relative">
        
        {/* Header do Modal LexyPay */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-950 p-5 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">LexyPay</h3>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Muestra de Resultado Exitoso */}
        {successResult ? (
          <div className="p-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xl font-black text-white">Pagamento Confirmado!</h4>
              <p className="text-xs text-slate-300">
                Sua transação de <strong className="text-emerald-400 font-extrabold">R$ {numAmount.toFixed(2)}</strong> foi aprovada.
              </p>
            </div>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Atualizando seus créditos Lexy...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-5">

            {/* Resumen del Valor */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Valor Total da Cobrança</span>
                <span className="text-xs text-slate-300 font-medium">{description || 'Recarga / Agendamento de Aulas'}</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-400 tracking-tight">R$ {numAmount.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 block">Real</span>
              </div>
            </div>

            {/* Selector de Método de Pago (PIX e Cartão) */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveTab('pix'); setErrorMsg(''); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'pix'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>PIX Stone</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('card'); setErrorMsg(''); }}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'card'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Cartão</span>
              </button>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-xl space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                {errorMsg.includes('Authorization has been denied') && (
                  <p className="text-[11px] text-slate-300 pl-6 leading-relaxed border-t border-rose-500/20 pt-1.5 mt-1">
                    💡 <strong>Ação Necessária:</strong> A chave secreta Stone (`sk_...`) possui permissão apenas de <em>Leitura</em>. Acesse o painel em <strong>dash.pagar.me &gt; Configurações &gt; Chaves API</strong> e habilite permissão de <strong>Escrita / Criar Cobranças</strong> para a chave de produção.
                  </p>
                )}
              </div>
            )}

            {/* TAB 1: PIX INSTANTÂNEO STONE */}
            {activeTab === 'pix' && (
              <div className="space-y-4 text-center animate-fade-in">
                {loading ? (
                  <div className="py-10 space-y-3">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">Gerando QR Code PIX Stone...</p>
                  </div>
                ) : !pixData ? (
                  <div className="py-6 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                      <QrCode className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-sm">Pagamento Instantâneo via PIX</h4>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto">
                        Clique no botão abaixo caso deseje gerar o QR Code oficial da Stone S.A.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleGeneratePix}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 text-slate-950" />
                      <span>Gerar QR Code PIX</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Visual de QR Code PIX Real e Escaneável */}
                    <div className="bg-white p-3 rounded-2xl w-52 h-52 mx-auto flex flex-col items-center justify-center shadow-xl border-4 border-emerald-500/50 relative group">
                      {pixData?.qrCodeUrl ? (
                        <img
                          src={pixData.qrCodeUrl}
                          alt="QR Code PIX Stone Oficial"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : pixData?.pixCode ? (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(pixData.pixCode)}`}
                          alt="QR Code PIX Stone Oficial"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      ) : errorMsg ? (
                        <div className="w-full h-full bg-slate-950 rounded-xl flex flex-col items-center justify-center p-3 text-center text-white space-y-2">
                          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                          <span className="text-[10px] text-rose-300 font-bold block">Falha ao Gerar QR Code</span>
                          <button
                            type="button"
                            onClick={handleGeneratePix}
                            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] px-3 py-1.5 rounded-lg shadow cursor-pointer"
                          >
                            Tentar Novamente 🔄
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-950 rounded-xl flex flex-col items-center justify-center p-2 text-center text-white space-y-1">
                          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                          <span className="text-[10px] text-slate-400">Gerando QR Code...</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-slate-300 font-semibold flex items-center justify-center gap-1.5">
                        <span>Expira em:</span>
                        <span className="text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          {formattedCountdown}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">Escaneie o código acima ou copie a Chave Pix Copia e Cola abaixo:</p>
                    </div>

                    {/* Copia e Cola */}
                    {pixData?.pixCode && (
                      <div className="space-y-2">
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-[10px] font-mono text-slate-300 truncate max-w-full">
                          {pixData.pixCode}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyText(pixData.pixCode)}
                          className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                          <span>{copied ? 'Chave PIX Copiada!' : 'Copiar Código Pix Copia e Cola'}</span>
                        </button>
                      </div>
                    )}

                    {/* Indicator de verificação automática Stone */}
                    <div className="pt-2 space-y-2">
                      <div className="w-full bg-slate-900/90 border border-emerald-500/30 text-emerald-300 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span>Aguardando confirmação do banco via Stone S.A....</span>
                      </div>

                      {/* Botão de Simulação de Aprovação PIX para Testes Sandbox */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onSuccess) onSuccess(pixData || { transactionId: `pix_test_${Date.now()}`, amount: numAmount });
                        }}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>⚡ Simular Pagamento PIX Aprovado (Sandbox)</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB 2: CARTÃO DE CRÉDITO STONE */}
            {activeTab === 'card' && (
              <form onSubmit={handleSubmitCard} className="space-y-3 text-left animate-fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-300">Número do Cartão *</label>
                    <span className={`text-xs font-bold ${cardBrand.color}`}>{cardBrand.name}</span>
                  </div>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-10 pr-3 py-2.5 text-xs font-mono font-bold outline-none focus:border-emerald-400"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-400/90 font-medium mt-1">
                    💡 Cartão de Teste Sandbox (Aprovação): <span className="font-mono font-bold underline cursor-pointer" onClick={() => setCardNumber('4111 1111 1111 1111')}>4111 1111 1111 1111</span>
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Nome Impresso no Cartão *</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    placeholder="TITULAR DO CARTÃO"
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none focus:border-emerald-400 uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Validade (MM/AA) *</label>
                    <input
                      type="text"
                      required
                      value={cardExp}
                      onChange={handleCardExpChange}
                      placeholder="MM/AA"
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">CVC / CÓDIGO *</label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      placeholder="123"
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">CPF do Titular *</label>
                    <input
                      type="text"
                      required
                      value={cardCpf}
                      onChange={handleCpfChange}
                      placeholder="000.000.000-00"
                      className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs font-mono outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Parcelamento *</label>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-emerald-400 font-bold text-xs rounded-xl px-2 py-2.5 outline-none cursor-pointer focus:border-emerald-400"
                    >
                      <option value={1}>1x de R$ {numAmount.toFixed(2)} (À vista)</option>
                      {numAmount >= 60 && <option value={2}>2x de R$ {(numAmount / 2).toFixed(2)} sem juros</option>}
                      {numAmount >= 100 && <option value={3}>3x de R$ {(numAmount / 3).toFixed(2)} sem juros</option>}
                      {numAmount >= 150 && <option value={4}>4x de R$ {(numAmount / 4).toFixed(2)} sem juros</option>}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>{loading ? 'Processando pagamento...' : `Pagar R$ ${numAmount.toFixed(2)}`}</span>
                </button>
              </form>
            )}

            {/* Footer de Garantia Stone */}
            <div className="pt-2 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5 border-t border-slate-900">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Ambiente protegido e seguro por Stone Pagamentos S.A.</span>
            </div>

          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
