import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950/80 backdrop-blur-sm border-t border-slate-800/80 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img src="/lexy_logo.png" alt="Lexy Idiomas" className="w-8 h-8 rounded-xl object-cover border border-cyan-400/40" />
              <span className="text-lg font-extrabold text-white">Lexy Idiomas</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              Aprende. Fala. Conecta. A melhor plataforma para você alcançar a fluência no menor tempo possível.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-slate-400 hover:text-cyan-400 transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Para Alunos</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/explore" className="hover:text-cyan-400 transition-colors">Encontrar Tutores</Link></li>
              <li><Link to="/login" className="hover:text-cyan-400 transition-colors">Minha Conta</Link></li>
              <li><Link to="/dashboard/student" className="hover:text-cyan-400 transition-colors">Painel do Aluno</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Para Professores</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/onboarding" className="hover:text-cyan-400 transition-colors">Cadastre-se</Link></li>
              <li><Link to="/dashboard/teacher" className="hover:text-cyan-400 transition-colors">Painel do Tutor</Link></li>
              <li><a href="https://wa.me/5511999999999" className="hover:text-cyan-400 transition-colors">Suporte</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            © 2026 Lexy by CA Idiomas — Todos os direitos reservados
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <Link to="#" className="hover:text-slate-300">Termos de Uso</Link>
            <Link to="#" className="hover:text-slate-300">Política de Privacidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
