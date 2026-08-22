import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldCheck, FileText, Lock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function TermsPrivacyModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'terms' | 'privacy'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 glow-cyan max-h-[88vh] flex flex-col">
        
        {/* Header com Botão Fechar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Termos de Uso & Política de Privacidade</h3>
              <p className="text-xs text-cyan-400 font-bold">Lexy Idiomas • Powered by Conexión América</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center bg-slate-900 p-1 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Termos e Condições de Uso</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Política de Privacidade</span>
          </button>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
          {activeTab === 'terms' ? (
            <div className="space-y-5">
              <div className="space-y-2 border-b border-slate-800 pb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold uppercase">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Documento Oficial de Termos</span>
                </div>
                <h2 className="text-xl font-black text-white">Termos e Condições de Uso – Lexy Idiomas</h2>
                <p className="text-xs text-cyan-400 font-bold">Powered by Conexión América • Última atualização: Agosto de 2026</p>
              </div>

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
                <p><strong>3.1. Aquisição de Créditos:</strong> A Lexy Idiomas opera por meio de um sistema de Carteira Virtual de Créditos (LexyPay). Os Alunos adquirem créditos utilizando as gateways de pagamento integradas à Plataforma (incluindo PIX, Cartão de Crédito/Débito e Boleto Bancário processados via Mercado Pago ou outros processadores autorizados).</p>
                <p><strong>3.2. Tarifas e Dedução:</strong> Cada Tutor define de forma autônoma sua tarifa por hora de aula (hourlyRate). Ao confirmar o agendamento de uma aula, o valor correspondente em créditos será reservado ou descontado automaticamente do wallet_balance (saldo) do Aluno.</p>
                <p><strong>3.3. Comissões e Repasses aos Tutores:</strong> Pela intermediação tecnológica e uso da infraestrutura, a Lexy Idiomas reterá uma comissão percentual sobre cada aula concluída com sucesso. O saldo líquido a favor do Tutor será acumulado em seu painel e repassado periodicamente conforme o calendário de pagamentos da Administradora via PIX.</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-white">4. Política de Agendamento, Cancelamento e Faltas</h3>
                <p><strong>4.1. Cancelamentos pelo Aluno:</strong> Com mais de 24 horas de antecedência, o Aluno poderá cancelar ou reagendar a aula sem penalidade e os créditos serão restituídos integralmente à sua carteira virtual. Cancelamento tardio (menos de 24 horas) ou Ausência (No-Show): Caso o Aluno cancele com menos de 24 horas de antecedência ou não compareça à sala virtual após 15 minutos do horário agendado, a aula será considerada realizada, e o valor cobrado não será reembolsado.</p>
                <p><strong>4.2. Ausência do Tutor:</strong> Se o Tutor não comparecer à aula agendada ou cancelar o compromisso, 100% dos créditos referentes àquela sessão serão devolvidos imediatamente ao Aluno.</p>
              </div>

              <div className="space-y-2 bg-rose-950/40 p-4 rounded-2xl border border-rose-500/30">
                <h3 className="text-base font-extrabold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  5. Normas de Conduta, Proibições e Cláusula Penal de Aliciamento
                </h3>
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
          ) : (
            <div className="space-y-5">
              <div className="space-y-2 border-b border-slate-800 pb-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>LGPD Compliance</span>
                </div>
                <h2 className="text-xl font-black text-white">Política de Privacidade – Lexy Idiomas</h2>
                <p className="text-xs text-emerald-400 font-bold">Powered by Conexión América • Última atualização: Agosto de 2026</p>
              </div>

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
          )}
        </div>

        {/* Botão Entendido */}
        <div className="pt-2 shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-3.5 rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            Entendido e De Acordo
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
