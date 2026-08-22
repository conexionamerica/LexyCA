import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, FileText, Lock, CheckCircle2 } from 'lucide-react';

export default function TermsPrivacyModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'terms' | 'privacy'

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 glow-cyan max-h-[85vh] flex flex-col">
        
        {/* Header com Botão Fechar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Termos de Uso & Privacidade</h3>
              <p className="text-xs text-slate-400">Lexy Idiomas • Plataforma Oficial de Ensino</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'terms'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Termos de Uso</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'privacy'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Política de Privacidade</span>
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs text-slate-300 leading-relaxed font-medium">
          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  1. Aceitação dos Termos de Serviço
                </h4>
                <p>
                  Ao criar uma conta e utilizar os serviços da Lexy Idiomas (como Aluno ou Tutor), você concorda com todas as regras, políticas e condições aqui descritas. Caso não concorde com algum dos termos, você não deverá prosseguir com o cadastro.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  2. Agendamentos e Carteira LexyPay
                </h4>
                <p>
                  As aulas individuais são agendadas mediante a utilização de créditos na carteira digital LexyPay. Alunos possuem garantia de satisfação e podem solicitar reagendamento de aulas com antecedência mínima de 24 horas.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  3. Conduta de Tutores e Alunos
                </h4>
                <p>
                  A sala virtual Preply Space e os chats diretos devem ser utilizados exclusivamente para fins educacionais e de aprendizado de idiomas. É estritamente proibido qualquer comportamento desrespeitoso, ofensivo ou tentativas de realizar transações fora da plataforma oficial.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  1. Coleta e Proteção de Dados (LGPD)
                </h4>
                <p>
                  A Lexy Idiomas coleta dados estritamente necessários para a prestação do serviço (Nome, E-mail, CPF/Passaporte, Idioma de Estudo). Todos os dados são protegidos por criptografia de ponta a ponta de acordo com a Lei Geral de Proteção de Dados.
                </p>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  2. Uso dos Dados Cadastrais
                </h4>
                <p>
                  Seus dados de identificação (como CPF e E-mail) são utilizados exclusivamente para autenticação de segurança, emissão de comprovantes e prevenção a fraudes. A Lexy jamais venderá ou compartilhará seus dados com terceiros não autorizados.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botão Entendido */}
        <div className="pt-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs py-3 rounded-xl shadow-lg transition-all"
          >
            Entendido e De Acordo
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
