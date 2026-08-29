import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, Mic, MicOff, VideoOff, Monitor, MessageSquare, 
  BookOpen, Sparkles, Star, CheckCircle2, Clock, X, Send, PenTool, ExternalLink, Globe, Play, Plus, AlertTriangle 
} from 'lucide-react';
import { useMarketplace } from '../contexts/MarketplaceContext';

export default function ClassroomPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { tutors = [], bookings = [] } = useMarketplace();

  const currentBooking = bookings.find(b => b.id === bookingId) || bookings[0];
  const tutor = tutors.find(t => t.id === currentBooking?.tutorId) || tutors[0] || {
    id: 'tutor-1',
    name: currentBooking?.tutorName || 'María Fernández',
    subject: currentBooking?.tutorSubject || 'Espanhol',
    avatar: currentBooking?.tutorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    meetUrl: 'https://meet.google.com/abc-defg-hij'
  };

  const rawMeetUrl = tutor?.meetUrl || 'https://meet.google.com/abc-defg-hij';

  // Estado para controlar se o vídeo Jitsi está ativo (Incorporado nativamente no Lexy Space)
  const [isLiveVideoActive, setIsLiveVideoActive] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [activeTab, setActiveTab] = useState('whiteboard'); // 'whiteboard' | 'notes' | 'chat'
  
  // Timer de clase (50 minutos regresivo)
  const [timeLeft, setTimeLeft] = useState(50 * 60);
  const [showEndModal, setShowEndModal] = useState(false);
  const [studentRating, setStudentRating] = useState(5);
  const [studentComment, setStudentComment] = useState('');
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);

  // URL del iframe de video aula incorporado dentro de la plataforma
  const embedRoomUrl = `https://meet.jit.si/LexyAula_${bookingId || 'live'}_${tutor?.id || 'tutor1'}#userInfo.displayName="Aluno"`;

  // Notas compartidas
  const [notes, setNotes] = useState(`Bem-vindo à Sala Virtual Lexy! 🏫

Use este quadro para anotações e exercícios durante a aula.

Dicas:
• Anote novas palavras e expressões
• Faça perguntas ao professor
• Pratique a escrita no idioma`);

  // Mensajes de chat
  const [chatMessages, setChatMessages] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  
  // Vocabulário do Dia
  const [vocabulary, setVocabulary] = useState([]);
  const [newVocab, setNewVocab] = useState('');

  // Contador de tiempo regresivo y alerta de saída
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showEarlyLeaveWarning, setShowEarlyLeaveWarning] = useState(false);

  // Contador de tiempo regresivo
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // System Message on Mount
  useEffect(() => {
    const date = new Date().toLocaleDateString('pt-BR');
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    setChatMessages(prev => [
      ...prev,
      { 
        sender: 'Sistema Lexy', 
        text: `🔔 [Sistema Lexy] A aula foi iniciada em ${date} às ${time}. Esta mensagem foi gerada automaticamente pelo sistema e não deve ser respondida.`, 
        time,
        isSystem: true 
      }
    ]);
  }, []);

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (elapsedTime < 40 * 60) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [elapsedTime]);

  const handleAddVocab = (e) => {
    e.preventDefault();
    if (!newVocab.trim()) return;
    setVocabulary([...vocabulary, newVocab.trim()]);
    setNewVocab('');
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [...prev, { sender: 'Você', text: newMsg, time }]);
    setNewMsg('');

    setTimeout(() => {
      setChatMessages(prev => [
        ...prev, 
        { sender: tutor.name, text: '¡Excelente pronunciación! Continuemos con el siguiente ejercicio.', time }
      ]);
    }, 2000);
  };

  const handleEndClass = () => {
    if (elapsedTime < 40 * 60) {
      setShowEarlyLeaveWarning(true);
    } else {
      setShowEndModal(true);
    }
  };

  const confirmEarlyLeave = () => {
    setShowEarlyLeaveWarning(false);
    setShowEndModal(true);
  };

  const handleSubmitReview = (e) => {
    e.preventDefault();
    setIsReviewSubmitted(true);
    setTimeout(() => {
      navigate('/dashboard/student');
    }, 1800);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4 animate-fade-in-up">
      
      {/* Header da Sala de Aula Virtual Estilo Lexy Space */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-cyan-500/30">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <span>Aula Ao Vivo com {tutor.name}</span>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                <Video className="w-3 h-3 text-cyan-400" /> Space Live Embed
              </span>
            </h2>
            <span className="text-xs text-slate-400">{tutor.subject} • Nível Intermediário</span>
          </div>
        </div>

        {/* Temporizador de Clase */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-amber-300 font-mono font-black text-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Tempo Restante: {formatTime(timeLeft)}</span>
          </div>

          <button
            onClick={handleEndClass}
            className="bg-rose-500/20 hover:bg-rose-500 border border-rose-500 text-rose-300 hover:text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all"
          >
            Encerrar Aula
          </button>
        </div>
      </div>

      {/* Cuerpo Principal de la Sala (2 Columnas) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        
        {/* ── COLUMNA IZQUIERDA: VÍDEO TRANSMISSÃO DENTRO DO PRÓPRIO CUADRO DO SITE (7 columnas) ── */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          <div className="relative flex-1 rounded-3xl bg-slate-950 border-2 border-cyan-500/40 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
            
            {/* Header del Cuadro de Transmisión Incorporada */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-2xl mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isLiveVideoActive ? 'bg-emerald-400 animate-ping' : 'bg-rose-500 animate-pulse'}`} />
                <span className="text-xs font-black text-white">
                  {isLiveVideoActive ? '🔴 Videochamada ao Vivo no Quadro do Site' : '🎥 Transmissão Pronta para Iniciar'}
                </span>
              </div>

              {!isLiveVideoActive ? (
                <button
                  type="button"
                  onClick={() => setIsLiveVideoActive(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs px-4 py-1.5 rounded-xl shadow flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Carregar Vídeo Aqui no Quadro</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsLiveVideoActive(false)}
                  className="bg-slate-800 text-slate-300 font-bold text-xs px-3 py-1.5 rounded-xl hover:bg-slate-700"
                >
                  Pausar Vídeo
                </button>
              )}
            </div>

            {/* CUADRO DE VIDEOCHAMADA INCORPORADA NO SITE (SIN SALIR DEL SITE) */}
            <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group">
              {isLiveVideoActive ? (
                /* IFRAME DE VIDEOCHAMADA AO VIVO DENTRO DO CUADRO */
                <iframe
                  src={embedRoomUrl}
                  title="Videochamada ao Vivo Incorporada"
                  allow="camera; microphone; display-capture; autoplay; clipboard-write; encrypted-media"
                  className="w-full h-full rounded-2xl border-0"
                />
              ) : (
                /* PANTALLA DE BIENVENIDA ANTES DE CARGAR EN EL CUADRO */
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 relative z-10">
                  <div className="relative">
                    <img
                      src={tutor.avatar}
                      alt={tutor.name}
                      className="w-28 h-28 rounded-full object-cover border-4 border-cyan-400 shadow-2xl"
                    />
                    <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950 font-black text-[10px]">
                      ✓
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-extrabold text-white">{tutor.name}</h3>
                    <span className="text-xs text-cyan-300 font-semibold block">{tutor.subject} • Sala de Aula Incorporada</span>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      Clique no botão abaixo para abrir a transmissão de vídeo <strong>diretamente dentro deste quadro</strong> sem sair da página!
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsLiveVideoActive(true)}
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 text-slate-950 font-black text-xs px-8 py-4 rounded-2xl shadow-xl flex items-center gap-2 transition-all hover:scale-105"
                    >
                      <Video className="w-5 h-5" />
                      <span>Abrir Videochamada Aqui no Quadro 🎥</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bar de Controles Inferior */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMicOn(!isMicOn)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isMicOn ? 'bg-slate-950 border-slate-800 text-white' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                  }`}
                  title="Microfone"
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setIsVideoOn(!isVideoOn)}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isVideoOn ? 'bg-slate-950 border-slate-800 text-white' : 'bg-rose-500/20 border-rose-500 text-rose-400'
                  }`}
                  title="Câmera"
                >
                  {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                Vídeo Incorporado • Sem Redirecionamento
              </span>
            </div>

          </div>

        </div>

        {/* ── COLUMNA DERECHA: LOUSA VIRTUAL, NOTAS E CHAT (5 columnas) ── */}
        <div className="lg:col-span-5 glass-panel rounded-3xl p-4 flex flex-col border border-slate-800 overflow-hidden">
          
          {/* Tabs de Espacio de Trabajo */}
          <div className="flex items-center gap-1 border-b border-slate-800 pb-3 mb-4">
            <button
              onClick={() => setActiveTab('whiteboard')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'whiteboard'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Lousa Virtual
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'notes'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Notas
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'chat'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>

          {/* Contenido Pestaña 1: Lousa Virtual */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 flex flex-col bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-hidden space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-bold">Quadro Interativo Compartilhado</span>
                <span className="text-emerald-400 font-bold">● Sincronizado</span>
              </div>
              
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 w-full bg-transparent text-slate-200 text-xs font-mono resize-none focus:outline-none leading-relaxed"
                placeholder="Escreva anotações ou vocabulário aqui..."
              />
            </div>
          )}

          {/* Contenido Pestaña 2: Notas */}
          {activeTab === 'notes' && (
            <div className="flex-1 flex flex-col overflow-hidden space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-full">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>📝</span> Vocabulário do Dia
                </h4>
                
                <form onSubmit={handleAddVocab} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newVocab}
                    onChange={(e) => setNewVocab(e.target.value)}
                    placeholder="Adicionar nova palavra..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 p-2 rounded-xl border border-amber-500/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="flex flex-wrap gap-2">
                    {vocabulary.map((word, idx) => (
                      <span key={idx} className="bg-amber-500/20 border border-amber-400/40 text-amber-300 rounded-full px-3 py-1 text-xs">
                        {word}
                      </span>
                    ))}
                    {vocabulary.length === 0 && (
                      <span className="text-xs text-slate-500 italic">Nenhum vocabulário adicionado ainda.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contenido Pestaña 3: Chat */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col space-y-3 overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.sender === 'Você' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.isSystem
                        ? 'bg-slate-800/50 border-l-4 border-amber-400 italic text-slate-400'
                        : msg.sender === 'Você'
                        ? 'bg-cyan-600 text-slate-950 font-medium'
                        : 'bg-slate-900 border border-slate-800 text-slate-200'
                    }`}>
                      {!msg.isSystem && <span className="font-bold block text-[10px] opacity-75 mb-0.5">{msg.sender}</span>}
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1">{msg.time}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Digitar mensagem..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 p-2 rounded-xl"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* Modal ao Encerrar Aula */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-3xl p-6 text-center space-y-5 border border-cyan-500/40 animate-fade-in-up">
            
            {isReviewSubmitted ? (
              <div className="space-y-4 py-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Avaliação Enviada!</h3>
                <p className="text-xs text-slate-300">Obrigado por avaliar seu professor na Lexy.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/40 flex items-center justify-center mx-auto">
                  <Star className="w-6 h-6 fill-amber-400" />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-white">Como foi sua aula com {tutor.name}?</h3>
                  <p className="text-xs text-slate-400 mt-1">Sua avaliação ajuda outros alunos a encontrarem o professor ideal.</p>
                </div>

                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setStudentRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star className={`w-7 h-7 ${star <= studentRating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} />
                    </button>
                  ))}
                </div>

                <textarea
                  value={studentComment}
                  onChange={(e) => setStudentComment(e.target.value)}
                  placeholder="Escreva um comentário sobre o método e didática do professor..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-cyan-400 h-24 resize-none"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/student')}
                    className="flex-1 bg-slate-900 border border-slate-800 text-slate-400 font-bold text-xs py-2.5 rounded-xl"
                  >
                    Pular
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow"
                  >
                    Enviar Avaliação
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Early Leave Warning Modal */}
      {showEarlyLeaveWarning && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-5 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">⚠️ Sair da Sala Virtual?</h3>
              <p className="text-sm text-slate-300 mt-2">A aula ainda não completou 40 minutos. Tem certeza que deseja sair?</p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEarlyLeaveWarning(false)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-2.5 rounded-xl transition-colors text-xs"
              >
                Cancelar e ficar na sala
              </button>
              <button
                onClick={confirmEarlyLeave}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl shadow-lg transition-colors text-xs"
              >
                Sair da sala
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
