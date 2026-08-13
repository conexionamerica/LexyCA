import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import LexyAnimatedLogo from './LexyAnimatedLogo';
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

      {/* MODAL DE TERMOS E CONDIÇÕES */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6 relative border-cyan-500/30 text-slate-300">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-2 border-b border-slate-800 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold uppercase">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Documento Oficial</span>
              </div>
              <h2 className="text-2xl font-black text-white">Termos e Condições de Uso – Lexy Idiomas</h2>
              <p className="text-xs text-cyan-400 font-bold">Powered by Conexión América • Última atualização: Agosto de 2026</p>
            </div>

            <div className="space-y-5 text-xs sm:text-sm leading-relaxed text-slate-300">
              <p>
                Bem-vindo à Lexy Idiomas (doravante denominada "Plataforma"), uma solução tecnológica operada sob a infraestrutura e respaldo corporativo da Conexión América Idiomas (doravante denominada "Administradora").
              </p>
              <p>
                Ao se cadastrar, acessar ou utilizar nossos serviços, o usuário (seja "Aluno" ou "Tutor/Professor") declara ter lido, compreendido e aceito integralmente os presentes Termos e Condições de Uso. Caso não concorde com qualquer uma das disposições aqui estabelecidas, deverá abster-se de utilizar a Plataforma.
              </p>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">1. Natureza do Serviço</h3>
                <p>
                  A Lexy Idiomas é uma plataforma tecnológica de Marketplace que conecta, de forma independente, estudantes interessados no aprendizado de idiomas ("Alunos") a professores e tutores autônomos ("Tutores").
                </p>
                <p className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs">
                  <strong className="text-amber-400">Nota Legal:</strong> A Lexy Idiomas e a Conexión América atuam exclusivamente como intermediadoras tecnológicas. A Plataforma não é uma instituição de ensino tradicional e não mantém vínculo empregatício ou de subordinação com os Tutores. Os Tutores atuam como prestadores de serviços independentes, definindo livremente suas tarifas e horários.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">2. Cadastro e Contas de Usuário</h3>
                <p><strong>2.1. Requisitos de Cadastro:</strong> Para utilizar a Plataforma, o usuário deve criar uma conta fornecendo informações verdadeiras, exatas e atualizadas. É necessário possuir capacidade civil plena (maioridade legal). Menores de idade poderão utilizar a Plataforma exclusivamente sob supervisão e responsabilidade direta de um pai ou responsável legal.</p>
                <p><strong>2.2. Segurança da Conta:</strong> O usuário é o único responsável por manter a confidencialidade de suas credenciais de acesso (login e senha). Qualquer atividade realizada a partir da conta cadastrada será considerada de responsabilidade exclusiva do titular.</p>
                <p><strong>2.3. Contas de Tutores:</strong> A ativação do perfil de Tutor no diretório público está sujeita à revisão e aprovação prévia da administração da Lexy Idiomas / Conexión América. A Plataforma reserva-se o direito de recusar ou desativar perfis que não atendam aos padrões de qualidade ou conduta exigidos.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">3. Sistema de Créditos, Carteira Virtual e Pagamentos</h3>
                <p><strong>3.1. Aquisição de Créditos:</strong> A Lexy Idiomas opera por meio de um sistema de Carteira Virtual de Créditos. Os Alunos adquirem créditos utilizando as gateways de pagamento integradas à Plataforma (incluindo PIX, Cartão de Crédito/Débito e Boleto Bancário processados via Mercado Pago ou outros processadores autorizados).</p>
                <p><strong>3.2. Tarifas e Dedução:</strong> Cada Tutor define de forma autônoma sua tarifa por hora de aula (hourly_rate). Ao confirmar o agendamento de uma aula, o valor correspondente em créditos será reservado ou descontado automaticamente do wallet_balance (saldo) do Aluno.</p>
                <p><strong>3.3. Comissões e Repasses aos Tutores:</strong> Pela intermediação tecnológica e uso da infraestrutura, a Lexy Idiomas reterá uma comissão percentual sobre cada aula concluída com sucesso. O saldo líquido a favor do Tutor será acumulado em seu painel e repassado periodicamente conforme o calendário de pagamentos da Administradora.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">4. Política de Agendamento, Cancelamento e Faltas</h3>
                <p><strong>4.1. Cancelamentos pelo Aluno:</strong> Com mais de 24 horas de antecedência, o Aluno poderá cancelar ou reagendar a aula sem penalidade e os créditos serão restituídos integralmente à sua carteira virtual. Cancelamento tardio (menos de 24 horas) ou Ausência (No-Show): Caso o Aluno cancele com menos de 24 horas de antecedência ou não compareça à sala virtual após 15 minutos do horário agendado, a aula será considerada realizada, e o valor cobrado não será reembolsado.</p>
                <p><strong>4.2. Ausência do Tutor:</strong> Se o Tutor não comparecer à aula agendada ou cancelar o compromisso, 100% dos créditos referentes àquela sessão serão devolvidos imediatamente ao Aluno.</p>
              </div>

              <div className="space-y-2 bg-rose-950/40 p-4 rounded-2xl border border-rose-500/30">
                <h3 className="text-base font-extrabold text-rose-300">5. Normas de Conduta, Proibições e Cláusula Penal de Aliciamento</h3>
                <p><strong>5.1. Conduta Geral:</strong> É proibido utilizar linguagem ofensiva, discriminatória, difamatória ou praticar qualquer tipo de assédio nas comunicações ou durante as aulas.</p>
                <p><strong>5.2. Cláusula Anti-Aliciamento e Multa por Desintermediação:</strong> A relação entre Alunos e Tutores apresentados por meio da Plataforma deve ocorrer exclusivamente dentro do ecossistema da Lexy Idiomas.</p>
                <p className="font-bold text-rose-200">
                  CLÁUSULA PENAL E MULTA CONTRATUAL: É expressamente proibido ao Tutor/Professor solicitar, sugerir, incentivar, aceitar ou realizar a prestação de serviços de ensino a Alunos originados ou captados pela Plataforma fora do ambiente da Lexy Idiomas.
                </p>
                <p className="text-xs text-rose-300">
                  Em caso de descumprimento desta regra (aliciamento ou desintermediação de alunos), o Tutor infrator incorrerá automaticamente em: <br />
                  1. Banimento e bloqueio imediato e definitivo da conta na Plataforma. <br />
                  2. Perda e retenção dos saldos pendentes de repasse. <br />
                  3. Aplicação de MULTA CONTRATUAL NO VALOR DE R$ 6.000,00 (seis mil reais) por cada Aluno aliciado ou transferido para fora do ecossistema da Plataforma, cobrável judicial e extrajudicialmente, sem prejuízo da apuração de perdas e danos adicionais.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">6. Propriedade Intelectual</h3>
                <p>
                  Todos os direitos de propriedade intelectual relativos à marca Lexy Idiomas, ao termo Powered by Conexión América, ao código-fonte, design de interface (UI/UX), logotipos e materiais gráficos pertencem exclusivamente à Administradora. É proibida a reprodução ou exploração comercial não autorizada do sistema.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">7. Limitação de Responsabilidade</h3>
                <p><strong>Falhas Técnicas Externas:</strong> A Plataforma não se responsabiliza por interrupções no serviço decorrentes de falhas de conexão de internet, problemas de hardware do usuário ou instabilidades em ferramentas de terceiros (como o Google Meet).</p>
                <p><strong>Garantia de Aprendizado:</strong> A Plataforma fornece o meio tecnológico de conexão, mas não garante resultados de fluência rápida, que dependem do esforço individual do Aluno e do método aplicado pelo Tutor.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">8. Alterações nos Termos</h3>
                <p>
                  A Administradora reserva-se o direito de modificar os presentes Termos e Condições a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação na Plataforma.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">9. Lei Aplicável e Foro</h3>
                <p>
                  Estes Termos são regidos e interpretados de acordo com as leis da República Federativa do Brasil. Para dirimir quaisquer controvérsias oriundas deste contrato, as partes elegem o Foro da Comarca de Porto Alegre, Estado do Rio Grande do Sul, Brasil, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition-all"
              >
                Ciente e De Acordo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE POLÍTICA DE PRIVACIDADE */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6 relative border-cyan-500/30 text-slate-300">
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-900 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-2 border-b border-slate-800 pb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>LGPD Compliance</span>
              </div>
              <h2 className="text-2xl font-black text-white">Política de Privacidade – Lexy Idiomas</h2>
              <p className="text-xs text-emerald-400 font-bold">Powered by Conexión América • Última atualização: Agosto de 2026</p>
            </div>

            <div className="space-y-5 text-xs sm:text-sm leading-relaxed text-slate-300">
              <p>
                A Lexy Idiomas (doravante denominada "Plataforma"), operada sob a infraestrutura e responsabilidade da Conexión América Idiomas (doravante denominada "Administradora"), tem o compromisso de proteger a privacidade e os dados pessoais de seus usuários ("Alunos" e "Tutores/Professores").
              </p>
              <p>
                Esta Política de Privacidade foi elaborada em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018) da República Federativa do Brasil e explica como coletamos, usamos, armazenamos, compartilhamos e protegemos suas informações pessoais.
              </p>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">1. Informações que Coletamos</h3>
                <p><strong>1.1. Dados Fornecidos Diretamente pelo Usuário:</strong><br />
                - Cadastro de Alunos: Nome completo, endereço de e-mail, número de telefone/WhatsApp, CPF (necessário para emissão de cobranças e boletos) e foto de perfil.<br />
                - Cadastro de Tutores/Professores: Nome completo, e-mail, telefone/WhatsApp, CPF/CNPJ, dados bancários/Chave PIX (para repasse de valores), foto de perfil, vídeo de apresentação, idioma nativo, biografia e comprovantes de qualificação profissional.
                </p>
                <p><strong>1.2. Dados Financeiros e de Pagamento:</strong> As transações financeiras (compra de créditos via PIX, Cartão de Crédito/Débito ou Boleto) são processadas por intermediadores de pagamento parceiros (como o Mercado Pago). A Plataforma armazena apenas o histórico de compras, saldo da carteira virtual (wallet_balance) e status das transações. Não armazenamos dados completos de cartões de crédito em nossos servidores.</p>
                <p><strong>1.3. Dados Coletados Automaticamente:</strong> Dados de navegação (IP, navegador, sistema operacional, horários) e registros de uso e agendamento de videochamadas (Google Meet).</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">2. Finalidade do Tratamento dos Dados</h3>
                <p>Tratamos seus dados para prestação do serviço de marketplace, processamento financeiro das recargas e aulas, envio de notificações operacionais de lembrete por WhatsApp (Evolution API), segurança cibernética e cumprimento de obrigações legais (Marco Civil da Internet).</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">3. Compartilhamento de Dados com Terceiros</h3>
                <p>
                  A Lexy Idiomas não vende ou aluga dados pessoais. O compartilhamento ocorre exclusivamente com parceiros tecnológicos essenciais: Mercado Pago (processamento de pagamentos), Supabase / Vercel (hospedagem e autenticação criptografada), Google Workspace (salas virtuais), Evolution API (mensagens de WhatsApp) e autoridades judiciais quando houver requisição legal.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">4. Segurança e Armazenamento dos Dados</h3>
                <p>
                  Adotamos medidas técnicas como conexões criptografadas (HTTPS/SSL), algoritmos de hash seguro via Supabase Auth, controle estrito de acesso e armazenamento em infraestrutura de nuvem certificada internacionalmente.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">5. Retenção de Dados</h3>
                <p>
                  Os dados pessoais serão mantidos enquanto a conta do usuário permanecer ativa na Plataforma ou conforme exigido por obrigações legais e fiscais vigentes no Brasil.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">6. Direitos do Titular dos Dados (Art. 18 da LGPD)</h3>
                <p>
                  Em conformidade com a LGPD, os usuários têm direito a: Confirmação e Acesso, Correção de dados inexatos, Anonimização ou Eliminação, Revogação do consentimento e Portabilidade dos dados mediante solicitação expressa ao DPO.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">7. Cookies e Tecnologias de Rastreamento</h3>
                <p>
                  Utilizamos cookies essenciais para manter a sessão do usuário ativa e armazenar preferências de interface.
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">8. Alterações nesta Política de Privacidade</h3>
                <p>
                  Reservamo-nos o direito de atualizar esta política periodicamente. Notificaremos os usuários sobre alterações significativas na aplicação ou por WhatsApp/e-mail.
                </p>
              </div>

              <div className="space-y-2 border-t border-slate-800 pt-3">
                <h3 className="text-base font-extrabold text-white">9. Contato e Encarregado de Dados (DPO)</h3>
                <p><strong>Operadora:</strong> Conexión América Idiomas / Lexy Idiomas</p>
                <p><strong>Localização:</strong> Porto Alegre, Estado do Rio Grande do Sul, Brasil</p>
                <p><strong>Canal de Atendimento:</strong> Suporte Integrado na Plataforma / WhatsApp Oficial</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">10. Foro Aplicável</h3>
                <p>
                  Fica eleito o Foro da Comarca de Porto Alegre/RS para dirimir quaisquer dúvidas relativas à proteção de dados.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 text-right">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl transition-all"
              >
                Compreendido
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
