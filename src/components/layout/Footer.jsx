import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LexyAnimatedLogo from './LexyAnimatedLogo';
import TermsPrivacyModal from '../modals/TermsPrivacyModal';
import { 
  Globe, MessageCircle, ExternalLink, X, ShieldCheck, FileText 
} from 'lucide-react';

const Footer = () => {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeModal, setActiveModal] = useState(null); // 'terms' | 'privacy' | null

  const handleStudentPanelClick = (e) => {
    e.preventDefault();
    if (profile && profile.role === 'student') {
      navigate('/dashboard/student');
    } else {
      navigate('/login/student');
    }
  };

  const handleTeacherPanelClick = (e) => {
    e.preventDefault();
    if (profile && profile.role === 'teacher') {
      navigate('/dashboard/teacher');
    } else {
      navigate('/login/teacher');
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 mt-auto relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* COLUNA 1: BRANDING COM BONECO LEXY E POWERED BY CONEXION AMERICA */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <LexyAnimatedLogo size="small" showSlogan={false} />
              <div>
                <span className="text-lg font-extrabold text-white block leading-tight">Lexy Idiomas</span>
                <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider block">
                  Powered by Conexión América
                </span>
              </div>
            </div>

            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Aprende. Fala. Conecta. A melhor plataforma de marketplace para você alcançar a fluência em Inglês e Espanhol com professores nativos.
            </p>

            {/* BOTÕES DE REDES SOCIAIS E SITE OFICIAL */}
            <div className="flex items-center gap-3 pt-2">
              {/* Botão 1: WhatsApp */}
              <a 
                href="https://wa.me/5511999999999" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 flex items-center justify-center transition-all shadow" 
                title="WhatsApp Suporte 24/7"
              >
                <MessageCircle className="w-5 h-5" />
              </a>

              {/* Botão 2: Instagram */}
              <a 
                href="https://instagram.com/lexyidiomas" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 hover:border-pink-500/50 text-slate-400 hover:text-pink-400 flex items-center justify-center transition-all shadow" 
                title="Instagram Oficial"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Botão 3: Link conexionamerica.com.br */}
              <a 
                href="https://conexionamerica.com.br" 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-xs font-bold text-slate-300 hover:text-cyan-300 transition-all shadow" 
                title="Conexión América Idiomas"
              >
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>conexionamerica.com.br</span>
                <ExternalLink className="w-3 h-3 text-slate-500" />
              </a>
            </div>
          </div>

          {/* COLUNA 2: PARA ALUNOS */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm">{t.forStudents || "Para Alunos"}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/explore" className="hover:text-cyan-400 transition-colors">
                  {t.findTutor || "Encontrar Tutores"}
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleStudentPanelClick} 
                  className="hover:text-cyan-400 transition-colors text-left bg-transparent border-0 p-0 cursor-pointer text-slate-400"
                >
                  {t.myAccount || "Minha Conta"}
                </button>
              </li>
              <li>
                <button 
                  onClick={handleStudentPanelClick} 
                  className="hover:text-cyan-400 transition-colors text-left bg-transparent border-0 p-0 cursor-pointer text-slate-400 font-medium"
                >
                  {t.studentDashboard || "Painel do Aluno"}
                </button>
              </li>
            </ul>
          </div>

          {/* COLUNA 3: PARA PROFESSORES */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm">{t.forTeachers || "Para Professores"}</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/onboarding" className="hover:text-cyan-400 transition-colors">
                  {t.register || "Cadastre-se para Ensinar"}
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleTeacherPanelClick} 
                  className="hover:text-cyan-400 transition-colors text-left bg-transparent border-0 p-0 cursor-pointer text-slate-400 font-medium"
                >
                  {t.teacherDashboard || "Painel do Tutor"}
                </button>
              </li>
              <li>
                <a 
                  href="https://wa.me/5511999999999" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-cyan-400 transition-colors"
                >
                  {t.support || "Suporte a Professores"}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* RODAPÉ INFERIOR DIREITOS RESERVADOS E LINKS LEGAIS */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left space-y-1">
            <p className="text-xs font-bold text-slate-300">
              {t.rightsReserved || "© 2026 Lexy by CA Idiomas — Todos os direitos reservados"}
            </p>
            <p className="text-[11px] text-slate-500">
              {t.ownedBy || "Este site é de propriedade exclusiva do CA Group. Powered by Conexión América."}
            </p>
          </div>

          <div className="flex gap-4 text-xs text-slate-400 font-medium">
            <button 
              onClick={() => setActiveModal('terms')} 
              className="hover:text-cyan-400 transition-colors bg-transparent border-0 p-0 cursor-pointer text-slate-400 underline"
            >
              {t.termsOfUse || "Termos e Condições de Uso"}
            </button>
            <button 
              onClick={() => setActiveModal('privacy')} 
              className="hover:text-cyan-400 transition-colors bg-transparent border-0 p-0 cursor-pointer text-slate-400 underline"
            >
              {t.privacyPolicy || "Política de Privacidade"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE TERMOS & PRIVACIDADE UNIFICADO */}
      <TermsPrivacyModal 
        isOpen={!!activeModal} 
        onClose={() => setActiveModal(null)} 
        initialTab={activeModal || 'terms'} 
      />
    </footer>
  );
};

export default Footer;
