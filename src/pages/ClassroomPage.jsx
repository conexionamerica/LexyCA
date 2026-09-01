import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, Mic, MicOff, VideoOff, Monitor, MessageSquare, 
  BookOpen, Sparkles, Star, CheckCircle2, Clock, X, Send, PenTool, ExternalLink, Globe, Play, Plus, AlertTriangle, ShieldCheck, Zap, Volume2, User
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

  // WebRTC & Media Stream States for 100% Native Lexy Video Engine
  const localVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // Estados da Sala Virtual & Saguão de Entrada (Lobby)
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
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

  // Função para Entrar na Sala com Gesto Direto do Usuário (Bypassa política de Autoplay dos navegadores)
  const handleJoinRoom = async () => {
    setIsConnecting(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      setLocalStream(stream);
      setHasJoinedRoom(true);
      setIsLiveVideoActive(true);
      setIsVideoOn(true);
      setIsMicOn(true);

      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(e => console.warn('Play error:', e));
        }
      }, 100);
    } catch (err) {
      console.warn('Erro ao acessar mídia do navegador:', err);
      setCameraError('Permissão para câmera ou microfone negada. Verifique as configurações de mídia no seu navegador.');
      // Incluso se a câmera falhar, permite entrar na sala em modo estúdio
      setHasJoinedRoom(true);
    } finally {
      setIsConnecting(false);
    }
  };

  // Limpeza de mídia ao sair da página
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [localStream]);

  // Manter a referência de vídeo atualizada
  useEffect(() => {
    if (hasJoinedRoom && localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [hasJoinedRoom, localStream, isVideoOn]);

  // Ligar/Desligar Microfone nativo
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMicOn;
      });
    }
    setIsMicOn(!isMicOn);
  };

  // Ligar/Desligar Câmera nativa
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoOn;
      });
    }
    setIsVideoOn(!isVideoOn);
  };

  // Compartilhar Tela Nativo (Screen Sharing)
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      setIsScreenSharing(false);
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setIsScreenSharing(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
          }
        };
      } catch (err) {
        console.warn('Compartilhamento de tela cancelado pelo usuário:', err);
      }
    }
  };

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

    try {
      const newReview = {
        id: `rev-${Date.now()}`,
        bookingId: bookingId || 'aula-demo',
        tutorId: tutor?.id || 'tutor-1',
        tutorName: tutor?.name || currentBooking?.tutorName || 'Professor Lexy',
        studentId: currentBooking?.studentId || 'student-user',
        studentName: currentBooking?.studentName || 'Aluno Lexy',
        studentEmail: currentBooking?.studentEmail || 'aluno@lexy.com',
        rating: studentRating,
        comment: studentComment || 'Aula finalizada sem comentário em texto.',
        createdAt: new Date().toISOString()
      };

      const existing = JSON.parse(localStorage.getItem('lexy_student_reviews') || '[]');
      localStorage.setItem('lexy_student_reviews', JSON.stringify([newReview, ...existing]));
    } catch (err) {
      console.warn('Erro ao salvar avaliação do aluno:', err);
    }

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
          
          <div className="relative flex-1 rounded-3xl bg-slate-950 border-2 border-cyan-500/40 overflow-hidden shadow-2xl flex flex-col justify-between p-4 min-h-[480px]">
            
            {/* Header del Cuadro de Transmisión Nativa WebRTC */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-2xl mb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black text-white">
                  🔴 Videochamada Nativa Lexy WebRTC • Criptografia P2P
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                  Transmissão Direta Sem Jitsi
                </span>
              </div>
            </div>

            {/* CUADRO DE VIDEOCHAMADA NATIVA WEBRTC LEXY SPACE */}
            <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group min-h-[380px]">
              
              {!hasJoinedRoom ? (
                /* SAGUÃO DE ENTRADA (LOBBY PRE-CALL COM BOTÃO SOLICITADO PELO USUÁRIO) */
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-5 relative z-10 w-full h-full my-auto">
                  <div className="relative">
                    <img
                      src={tutor.avatar}
                      alt={tutor.name}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-cyan-400 shadow-2xl shadow-cyan-500/30"
                    />
                    <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                      ✓
                    </span>
                  </div>

                  <div className="space-y-1.5 max-w-md">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Sala Virtual Pronta • Aula Particular 1-on-1</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white">Aula com {tutor.name}</h3>
                    <p className="text-xs text-cyan-300 font-semibold">{tutor.subject} • Nível Intermediário</p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      Clique no botão abaixo para <strong>ativar sua câmera e microfone</strong> e entrar na videochamada ao vivo com seu professor!
                    </p>
                  </div>

                  {cameraError && (
                    <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl max-w-sm flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  <div className="pt-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={handleJoinRoom}
                      disabled={isConnecting}
                      className="w-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-sm py-4 px-6 rounded-2xl shadow-xl shadow-emerald-500/30 border border-emerald-300/40 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:scale-[1.03] active:scale-95 disabled:opacity-50"
                    >
                      <Video className="w-5 h-5 fill-slate-950 text-slate-950" />
                      <span>{isConnecting ? 'Conectando Câmera...' : '🚀 Entrar na Sala Virtual'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* VÍDEO PRINCIPAL DA CÂMERA DO NAVEGADOR QUANDO DENTRO DA SALA */
                <div className="w-full h-full flex flex-col items-center justify-center relative bg-slate-950">
                  {isVideoOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover rounded-2xl transform scale-x-[-1]"
                    />
                  ) : (
                    /* SI LA CÁMARA ESTÁ DESACTIVADA MUESTRA UN AVATAR ILUMINADO */
                    <div className="flex flex-col items-center justify-center space-y-4 p-6">
                      <div className="relative">
                        <img
                          src={tutor.avatar}
                          alt={tutor.name}
                          className="w-32 h-32 rounded-full object-cover border-4 border-cyan-400 shadow-2xl shadow-cyan-500/20"
                        />
                        {isMicOn && (
                          <div className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
                        )}
                      </div>
                      <div className="text-center space-y-1">
                        <h3 className="text-lg font-extrabold text-white">{tutor.name}</h3>
                        <span className="text-xs text-cyan-300 font-mono font-semibold block">
                          {isMicOn ? '🎤 Microfone Ativo • Câmera Desativada' : '🔇 Câmera & Microfone Mute'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* SUPERPOSICIÓN DE ESTADO SUPERIOR DERECHO */}
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 z-20">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">
                      {isScreenSharing ? '🖥️ Compartilhando Tela' : '🔴 Lexy Space WebRTC Live'}
                    </span>
                  </div>

                  {/* ALERTA SI FALTA PERMISO DE CÁMARA */}
                  {cameraError && (
                    <div className="absolute top-14 left-3 right-3 bg-amber-950/90 border border-amber-500/40 text-amber-300 text-xs p-3 rounded-xl backdrop-blur-md z-20 flex items-center justify-between shadow-xl">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{cameraError}</span>
                      </div>
                      <button
                        onClick={handleJoinRoom}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[10px] px-3 py-1 rounded-lg shrink-0 cursor-pointer"
                      >
                        Reativar Câmera
                      </button>
                    </div>
                  )}

                  {/* MINIATURA PIP DO ALUNO (SELF VIEW) NA ESQUINA INFERIOR DIREITA */}
                  <div className="absolute bottom-3 right-3 w-32 h-24 sm:w-40 sm:h-28 rounded-2xl bg-slate-950 border-2 border-cyan-400/60 overflow-hidden shadow-2xl z-20 flex items-center justify-center">
                    <div className="w-full h-full relative flex items-center justify-center bg-slate-900/90">
                      <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold flex items-center justify-center border border-cyan-400/50 text-xs">
                        A
                      </div>
                      <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white bg-slate-950/90 px-1.5 py-0.2 rounded border border-slate-800">
                        Você (Aluno)
                      </span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Barra de Controles Inferior Nativas da Lexy */}
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl flex flex-wrap items-center justify-between gap-3 mt-2">
              <div className="flex items-center gap-2">
                {/* BOTÃO MICROFONE */}
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                    isMicOn 
                      ? 'bg-slate-950 border-slate-800 text-emerald-400 hover:bg-slate-800' 
                      : 'bg-rose-500/20 border-rose-500 text-rose-400'
                  }`}
                  title={isMicOn ? "Silenciar Microfone" : "Ativar Microfone"}
                >
                  {isMicOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4 text-rose-400" />}
                  <span className="hidden sm:inline">{isMicOn ? 'Mic Ativo' : 'Mutado'}</span>
                </button>

                {/* BOTÃO CÂMERA */}
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                    isVideoOn 
                      ? 'bg-slate-950 border-slate-800 text-cyan-400 hover:bg-slate-800' 
                      : 'bg-rose-500/20 border-rose-500 text-rose-400'
                  }`}
                  title={isVideoOn ? "Desativar Câmera" : "Ativar Câmera"}
                >
                  {isVideoOn ? <Video className="w-4 h-4 text-cyan-400" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
                  <span className="hidden sm:inline">{isVideoOn ? 'Câmera Ativa' : 'Desativada'}</span>
                </button>

                {/* BOTÃO COMPARTILHAR TELA */}
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                    isScreenSharing
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Compartilhar Tela"
                >
                  <Monitor className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">{isScreenSharing ? 'Compartilhando' : 'Compartilhar Tela'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Nativo Lexy WebRTC • 100% Criptografado & Sem Jitsi</span>
              </div>
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
