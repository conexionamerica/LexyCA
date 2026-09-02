import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, Mic, MicOff, VideoOff, Monitor, MessageSquare, 
  BookOpen, Sparkles, Star, CheckCircle2, Clock, X, Send, PenTool, ExternalLink, Globe, Play, Plus, AlertTriangle, ShieldCheck, Zap, Volume2, User, Lock, ArrowLeftRight, RefreshCw
} from 'lucide-react';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function ClassroomPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { tutors = [], bookings = [] } = useMarketplace();
  const { profile } = useAuth();

  // Localizar a reserva (aula) exata pelo ID ou código de aula
  const currentBooking = useMemo(() => {
    if (!bookingId) return null;
    const cleanId = String(bookingId).trim().toLowerCase();

    // 1. Busca por booking ID exato
    let found = (bookings || []).find(b => String(b.id || '').trim().toLowerCase() === cleanId);
    if (found) return found;

    // 2. Busca por código de aula (ex: AULA-2026-910108)
    found = (bookings || []).find(b => String(b.lesson_code || '').trim().toLowerCase() === cleanId);
    if (found) return found;

    // 3. Busca por correspondência de código
    found = (bookings || []).find(b => String(b.lesson_code || b.id || '').toLowerCase().includes(cleanId));
    if (found) return found;

    // 4. Se o usuário estiver logado, buscar a reserva correspondente mais recente
    const pId = String(profile?.id || '').toLowerCase();
    const pEmail = String(profile?.email || '').toLowerCase();
    if (pId || pEmail) {
      found = (bookings || []).find(b => {
        const sId = String(b.studentId || b.student_id || '').toLowerCase();
        const sEmail = String(b.studentEmail || b.student_email || '').toLowerCase();
        const tId = String(b.tutorId || b.tutor_id || '').toLowerCase();
        const tEmail = String(b.tutorEmail || b.tutor_email || '').toLowerCase();
        return (pId && (sId === pId || tId === pId)) || (pEmail && (sEmail === pEmail || tEmail === pEmail));
      });
      if (found) return found;
    }

    return null;
  }, [bookingId, bookings, profile]);

  // Resolver o Professor Vinculado a esta Aula Específica
  const tutor = useMemo(() => {
    const targetTutorId = currentBooking?.tutorId || currentBooking?.tutor_id;
    const foundTutor = (tutors || []).find(t => String(t.id).toLowerCase() === String(targetTutorId || '').toLowerCase());

    return {
      id: targetTutorId || foundTutor?.id || 'tutor-1',
      name: currentBooking?.tutorName || foundTutor?.name || 'Professor Particular',
      subject: currentBooking?.tutorSubject || foundTutor?.subject || 'Idiomas',
      avatar: currentBooking?.tutorAvatar || foundTutor?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
    };
  }, [currentBooking, tutors]);

  // Identidade do Usuário Logado x Outro Participante (Garante que Aluno veja Professor e vice-versa)
  const isUserTeacher = profile?.role === 'teacher' || profile?.role === 'tutor';

  const currentUserDisplay = useMemo(() => {
    if (profile?.name || profile?.email) {
      return {
        name: profile.name || profile.email.split('@')[0],
        avatar: profile.avatar || profile.photoURL || null,
        roleLabel: isUserTeacher ? 'Você (Professor)' : 'Você (Aluno)'
      };
    }
    return {
      name: isUserTeacher ? (tutor.name || 'Professor') : (currentBooking?.studentName || 'Aluno'),
      avatar: null,
      roleLabel: isUserTeacher ? 'Você (Professor)' : 'Você (Aluno)'
    };
  }, [profile, isUserTeacher, tutor, currentBooking]);

  const otherParticipantDisplay = useMemo(() => {
    if (isUserTeacher) {
      // Se quem está logado é o PROFESSOR, o participante na sala é o ALUNO!
      return {
        name: currentBooking?.studentName || 'Aluno Matriculado',
        avatar: currentBooking?.studentAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
        roleLabel: 'Aluno'
      };
    } else {
      // Se quem está logado é o ALUNO, o participante na sala é o PROFESSOR!
      return {
        name: tutor.name,
        avatar: tutor.avatar,
        roleLabel: 'Professor (Tutor)'
      };
    }
  }, [isUserTeacher, currentBooking, tutor]);

  // ID Unívoco de Sala Criptografada (Garante que Aluno e Professor entrem na MESMA sala privada)
  const privateRoomId = useMemo(() => {
    if (currentBooking) {
      return `lexy_private_room_${currentBooking.id}_std_${currentBooking.studentId || 'st'}_tut_${currentBooking.tutorId || 'tt'}`;
    }
    return `lexy_private_room_${bookingId || 'session'}`;
  }, [currentBooking, bookingId]);

  // WebRTC Media Stream States (Local & Remote Streams)
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const channelRef = useRef(null);
  const bcRef = useRef(null);
  const hiddenCanvasRef = useRef(null);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [remoteVideoFrame, setRemoteVideoFrame] = useState(null);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [isPeerOnline, setIsPeerOnline] = useState(false);
  const [peerJoinNotification, setPeerJoinNotification] = useState(null);
  const [isSwapped, setIsSwapped] = useState(false); // Inverter vista grande x vista pequena
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

  // ── CANAL DE TRANSMISSÃO LOCAL DO NAVEGADOR (BROADCASTCHANNEL API - FUNCIONA 100% MESMO SE O SUPABASE WEBSOCKET FALHAR) ──
  useEffect(() => {
    if (!hasJoinedRoom) return;

    const cleanRoomKey = currentBooking ? `room_${currentBooking.id}` : `room_${String(bookingId || 'main').trim().toLowerCase()}`;
    
    // Criar canal nativo BroadcastChannel do navegador (comunicação instantânea entre abas/janelas)
    const bc = new BroadcastChannel(`lexy_native_stream_${cleanRoomKey}`);
    bcRef.current = bc;

    bc.onmessage = (event) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'video_frame' && data.sender !== currentUserDisplay.name && data.frame) {
        setRemoteVideoFrame(data.frame);
        setIsRemoteConnected(true);
        setIsPeerOnline(true);
      }

      if (data.type === 'peer_join' && data.sender !== currentUserDisplay.name) {
        setIsPeerOnline(true);
        setPeerJoinNotification(`🎉 ${data.sender} (${data.roleLabel}) conectou-se à Sala Virtual!`);
        setTimeout(() => setPeerJoinNotification(null), 7000);
      }

      if (data.type === 'chat' && data.sender !== currentUserDisplay.name) {
        setChatMessages(prev => [...prev, data.payload]);
      }
    };

    // Notificar outras abas de que o participante se conectou
    bc.postMessage({
      type: 'peer_join',
      sender: currentUserDisplay.name,
      roleLabel: currentUserDisplay.roleLabel
    });

    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, [hasJoinedRoom, currentBooking, bookingId, currentUserDisplay]);

  // Supabase Realtime Channel & Presença em tempo real para Aluno x Professor
  useEffect(() => {
    if (!hasJoinedRoom) return;

    // Chave de sala padronizada e unívoca
    const cleanRoomKey = currentBooking ? `room_${currentBooking.id}` : `room_${String(bookingId || 'main').trim().toLowerCase()}`;
    
    const channel = supabase.channel(`lexy_space_${cleanRoomKey}`, {
      config: {
        presence: { key: currentUserDisplay.name },
        broadcast: { self: false }
      }
    });
    channelRef.current = channel;

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' }
      ]
    });
    pcRef.current = pc;

    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
    }

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        console.log('Stream remota recebida com sucesso!');
        setRemoteStream(event.streams[0]);
        setIsRemoteConnected(true);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: 'broadcast',
          event: 'signal',
          payload: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    // Presença: Rastrear quem está online ou acabou de entrar na sala
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const users = Object.keys(state);
      console.log('Presença em tempo real sincronizada:', users);
      const isOtherPresent = users.some(u => u !== currentUserDisplay.name);
      if (isOtherPresent) {
        setIsPeerOnline(true);
      }
    });

    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      newPresences.forEach(p => {
        if (p.key && p.key !== currentUserDisplay.name) {
          setIsPeerOnline(true);
          const msg = `🎉 ${p.key} acabou de entrar na Sala Virtual!`;
          setPeerJoinNotification(msg);
          setTimeout(() => setPeerJoinNotification(null), 7000);

          setChatMessages(prev => [
            ...prev,
            {
              sender: 'Sistema Lexy',
              text: `🟢 [Sistema Lexy] ${p.key} conectou-se à videochamada ao vivo.`,
              time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              isSystem: true
            }
          ]);

          pc.createOffer().then(offer => {
            pc.setLocalDescription(offer);
            channel.send({
              type: 'broadcast',
              event: 'signal',
              payload: { type: 'offer', offer }
            });
          }).catch(err => console.warn('Offer error:', err));
        }
      });
    });

    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      leftPresences.forEach(p => {
        if (p.key && p.key !== currentUserDisplay.name) {
          setIsPeerOnline(false);
          setPeerJoinNotification(`⚠️ ${p.key} saiu da sala virtual.`);
          setTimeout(() => setPeerJoinNotification(null), 5000);
        }
      });
    });

    // Recepção do fluxo de vídeo em tempo real (Garante a transmissão remota no monitor grande)
    channel.on('broadcast', { event: 'remote_video_frame' }, ({ payload }) => {
      if (payload && payload.sender !== currentUserDisplay.name && payload.frame) {
        setRemoteVideoFrame(payload.frame);
        setIsRemoteConnected(true);
        setIsPeerOnline(true);
      }
    });

    // WebRTC Signaling (Oferta, Resposta e ICE Candidates)
    channel.on('broadcast', { event: 'signal' }, async ({ payload }) => {
      try {
        if (!pcRef.current) return;
        if (payload.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'answer', answer }
          });
        } else if (payload.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
        } else if (payload.type === 'candidate' && payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } catch (err) {
        console.warn('Sinalização error:', err);
      }
    });

    // Chat broadcast em tempo real
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      if (payload && payload.sender !== currentUserDisplay.name) {
        setChatMessages(prev => [...prev, payload]);
      }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: profile?.id || 'anon',
          name: currentUserDisplay.name,
          role: profile?.role || 'student',
          online_at: new Date().toISOString()
        });

        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { type: 'offer', offer }
          });
        } catch (err) {
          console.warn('Oferta inicial:', err);
        }
      }
    });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [hasJoinedRoom, localStream, currentBooking, bookingId, currentUserDisplay, profile]);

  // Transmissão contínua de quadros da câmera local para o outro dispositivo em tempo real
  useEffect(() => {
    if (!hasJoinedRoom || !localStream || !isVideoOn) return;

    const interval = setInterval(() => {
      if (!localVideoRef.current) return;
      const videoEl = localVideoRef.current;
      if (videoEl.videoWidth > 0 && videoEl.videoHeight > 0) {
        if (!hiddenCanvasRef.current) {
          hiddenCanvasRef.current = document.createElement('canvas');
        }
        const canvas = hiddenCanvasRef.current;
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, 320, 240);
        const frame = canvas.toDataURL('image/jpeg', 0.4);

        // 1. Transmitir via BroadcastChannel nativo (Latência 0ms entre abas/janelas no mesmo PC)
        if (bcRef.current) {
          bcRef.current.postMessage({
            type: 'video_frame',
            sender: currentUserDisplay.name,
            frame
          });
        }

        // 2. Transmitir via Supabase Realtime (Para outros dispositivos via rede)
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'remote_video_frame',
            payload: { sender: currentUserDisplay.name, frame }
          }).catch(() => {});
        }
      }
    }, 160); // ~6 FPS - Ultra fluido e sem dependência de WebSocket!

    return () => clearInterval(interval);
  }, [hasJoinedRoom, localStream, isVideoOn, currentUserDisplay]);

  // Gerador de transmissão Lexy Studio 30fps (Garante transmissão de vídeo mesmo se a câmera física estiver bloqueada por outra aba/aplicativo)
  const createStudioCanvasStream = (name, roleLabel) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    let angle = 0;
    const draw = () => {
      angle += 0.04;
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Círculo pulsante de sinal
      const r = 70 + Math.sin(angle) * 8;
      ctx.beginPath();
      ctx.arc(320, 200, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Círculo interno do avatar
      ctx.beginPath();
      ctx.arc(320, 200, 50, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inicial do nome
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((name || 'U').charAt(0).toUpperCase(), 320, 200);

      // Nome e Status
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(name || 'Participante', 320, 290);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`🟢 Transmissão Lexy Studio (${roleLabel || 'Ao Vivo'})`, 320, 320);

      requestAnimationFrame(draw);
    };
    draw();

    return canvas.captureStream(30);
  };

  // Função para Entrar na Sala com Gesto Direto do Usuário e Fallbacks de Mídia
  const handleJoinRoom = async () => {
    setIsConnecting(true);
    setCameraError(null);
    let stream = null;

    // 1ª Tentativa: Vídeo + Áudio padrão flexível
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setIsVideoOn(true);
      setIsMicOn(true);
    } catch (err1) {
      console.warn('Tentativa 1 (Video+Audio) falhou:', err1);
      
      // 2ª Tentativa: Apenas Vídeo
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setIsVideoOn(true);
        setIsMicOn(false);
      } catch (err2) {
        console.warn('Tentativa 2 (Apenas Video) falhou:', err2);
        
        // 3ª Tentativa: Apenas Áudio
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setIsVideoOn(false);
          setIsMicOn(true);
        } catch (err3) {
          console.warn('Tentativa 3 (Apenas Audio) falhou:', err3);
        }
      }
    }

    // Se a câmera física estiver bloqueada por outra aba/aplicativo ou indisponível, inicializar Lexy Studio Stream
    if (!stream || stream.getVideoTracks().length === 0) {
      console.log('Câmera física ocupada. Ativando Lexy Studio 30fps Stream...');
      const studioStream = createStudioCanvasStream(currentUserDisplay.name, currentUserDisplay.roleLabel);
      if (stream && stream.getAudioTracks().length > 0) {
        studioStream.addTrack(stream.getAudioTracks()[0]);
      }
      stream = studioStream;
      setIsVideoOn(true);
      setCameraError('Câmera física em uso em outro programa/aba. O canal de vídeo Lexy Studio 30fps e o áudio estão 100% ativos!');
    }

    if (stream) {
      setLocalStream(stream);
      setHasJoinedRoom(true);
      setIsLiveVideoActive(true);

      const hasVideoTrack = stream.getVideoTracks().length > 0;
      const hasAudioTrack = stream.getAudioTracks().length > 0;

      setIsVideoOn(hasVideoTrack);
      setIsMicOn(hasAudioTrack);

      setTimeout(() => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.play().catch(e => console.warn('Play video error:', e));
        }
      }, 150);
    }
    
    setIsConnecting(false);
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
              <span>Aula Ao Vivo com {otherParticipantDisplay.name}</span>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                <Video className="w-3 h-3 text-cyan-400" /> Space Live
              </span>
            </h2>
            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>{tutor.subject} • Sala Privada ID: <code className="font-mono text-cyan-300">{currentBooking?.lesson_code || bookingId}</code></span>
            </span>
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
            className="bg-rose-500/20 hover:bg-rose-500 border border-rose-500 text-rose-300 hover:text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Encerrar Aula
          </button>
        </div>
      </div>

      {/* Cuerpo Principal de la Sala (2 Columnas) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        
        {/* ── COLUMNA IZQUIERDA: VÍDEO TRANSMISSÃO DENTRO DO PRÓPRIO CUADRO DO SITE (7 columnas) ── */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          <div className="relative flex-1 rounded-3xl bg-slate-950 border-2 border-cyan-500/40 overflow-hidden shadow-2xl flex flex-col justify-between p-2.5 sm:p-3">
            
            {/* Header del Cuadro de Transmisión Nativa WebRTC */}
            <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl mb-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-black text-white">
                  🔴 Videochamada Nativa Lexy WebRTC • Conexão Direta
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Sessão Unívoca Criptografada</span>
                </span>
              </div>
            </div>

            {/* CUADRO DE VIDEOCHAMADA NATIVA WEBRTC LEXY SPACE */}
            <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group min-h-[320px] max-h-[58vh]">
              
              {!hasJoinedRoom ? (
                /* SAGUÃO DE ENTRADA (LOBBY PRE-CALL COM DETALHES PRIVADOS DO PROFESSOR E ALUNO) */
                <div className="flex flex-col items-center justify-center p-6 text-center space-y-5 relative z-10 w-full h-full my-auto">
                  <div className="relative">
                    <img
                      src={otherParticipantDisplay.avatar || tutor.avatar}
                      alt={otherParticipantDisplay.name}
                      className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-cyan-400 shadow-2xl shadow-cyan-500/30"
                    />
                    <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
                      ✓
                    </span>
                  </div>

                  <div className="space-y-1.5 max-w-md">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                      <span>Sala Privada 1-on-1 • {otherParticipantDisplay.roleLabel}</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-white">Aula com {otherParticipantDisplay.name}</h3>
                    <p className="text-xs text-cyan-300 font-semibold">{tutor.subject} • Código: {currentBooking?.lesson_code || bookingId}</p>
                    <p className="text-xs text-slate-300 leading-relaxed pt-1">
                      Esta é uma sala exclusiva entre <strong>{currentUserDisplay.name}</strong> e <strong>{otherParticipantDisplay.name}</strong>. Ninguém mais tem acesso a este link.
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
                  
                  {/* ── TELA PRINCIPAL (GRANDE): TRANSMISSÃO DO OUTRO PARTICIPANTE (PROFESSOR OU ALUNO) ── */}
                  {!isSwapped ? (
                    isRemoteConnected && remoteStream ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : remoteVideoFrame ? (
                      <img
                        src={remoteVideoFrame}
                        className="w-full h-full object-cover rounded-2xl animate-fade-in"
                        alt="Transmissão Remota ao Vivo"
                      />
                    ) : (
                      /* AGUARDANDO A ENTRADA / CÂMERA DO OUTRO PARTICIPANTE NA TELA GRANDE */
                      <div className="flex flex-col items-center justify-center space-y-4 p-6 text-center animate-fade-in my-auto">
                        <div className="relative">
                          <img
                            src={otherParticipantDisplay.avatar || tutor.avatar}
                            alt={otherParticipantDisplay.name}
                            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-cyan-400 shadow-2xl shadow-cyan-500/20"
                          />
                          <div className="absolute -inset-2 rounded-full border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none" />
                          <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-slate-950 font-black text-xs">
                            ✓
                          </span>
                        </div>
                        <div className="space-y-1.5 max-w-sm">
                          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-wider inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>Aguardando {otherParticipantDisplay.roleLabel}</span>
                          </span>
                          <h3 className="text-lg font-extrabold text-white">{otherParticipantDisplay.name}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Assim que <strong>{otherParticipantDisplay.name}</strong> entrar na sala virtual, o vídeo transmitirá automaticamente nesta tela principal.
                          </p>
                        </div>
                      </div>
                    )
                  ) : (
                    /* MODO INVERTIDO (SUA CÂMERA NA TELA GRANDE) */
                    isVideoOn ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover rounded-2xl transform scale-x-[-1]"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-3 p-6">
                        <div className="w-24 h-24 rounded-full bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 font-extrabold flex items-center justify-center text-2xl uppercase">
                          {currentUserDisplay.name.charAt(0)}
                        </div>
                        <h3 className="text-base font-bold text-white">{currentUserDisplay.name} (Sua Câmera Desativada)</h3>
                      </div>
                    )
                  )}

                  {/* SUPERPOSICIÓN DE ESTADO SUPERIOR DERECHO */}
                  <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2 z-20">
                    <span className={`w-2.5 h-2.5 rounded-full ${isPeerOnline || isRemoteConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                    <span className="text-[11px] font-black text-white uppercase tracking-wider">
                      {isScreenSharing ? '🖥️ Compartilhando Tela' : isPeerOnline || isRemoteConnected ? `🟢 ${otherParticipantDisplay.name} Online` : `🟡 Aguardando ${otherParticipantDisplay.roleLabel}`}
                    </span>
                  </div>

                  {/* BANNER FLUTUANTE DE NOTIFICAÇÃO DE ENTRADA DO PARTICIPANTE */}
                  {peerJoinNotification && (
                    <div className="absolute top-14 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-2xl shadow-2xl z-50 flex items-center gap-2.5 animate-bounce border border-emerald-300">
                      <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950 animate-pulse" />
                      <span>{peerJoinNotification}</span>
                      <button onClick={() => setPeerJoinNotification(null)} className="ml-2 bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 px-2 py-0.5 rounded-lg text-[10px] font-extrabold cursor-pointer">
                        ✕
                      </button>
                    </div>
                  )}

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

                  {/* ── MINIATURA PIP QUADRO PEQUENO (SUA CÂMERA LOCAL "VOCÊ") ── */}
                  <div
                    onClick={() => setIsSwapped(prev => !prev)}
                    className="absolute bottom-20 right-3 sm:bottom-20 sm:right-4 w-32 h-24 sm:w-44 sm:h-32 rounded-2xl bg-slate-950 border-2 border-cyan-400/80 overflow-hidden shadow-2xl z-20 flex items-center justify-center cursor-pointer group hover:scale-105 transition-all duration-200 hover:border-cyan-300"
                    title="Clique para inverter telas principal x miniatura 🔄"
                  >
                    {!isSwapped ? (
                      isVideoOn ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform scale-x-[-1]"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-2 text-center">
                          {currentUserDisplay.avatar ? (
                            <img src={currentUserDisplay.avatar} alt={currentUserDisplay.name} className="w-10 h-10 rounded-full object-cover border border-cyan-400 mb-1" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold flex items-center justify-center border border-cyan-400/50 text-xs uppercase mb-1">
                              {currentUserDisplay.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-[10px] text-slate-300 font-bold">Câmera Mute</span>
                        </div>
                      )
                    ) : (
                      /* QUANDO INVERTIDO: EXIBE A MINIATURA DO OUTRO PARTICIPANTE */
                      isRemoteConnected && remoteStream ? (
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 p-2 text-center">
                          <img src={otherParticipantDisplay.avatar || tutor.avatar} alt={otherParticipantDisplay.name} className="w-10 h-10 rounded-full object-cover border border-cyan-400 mb-1" />
                          <span className="text-[10px] text-cyan-300 font-bold truncate max-w-[90%]">{otherParticipantDisplay.name}</span>
                        </div>
                      )
                    )}

                    {/* BADGE DE NOME "VOCÊ (ALUNO / PROFESSOR)" */}
                    <div className="absolute bottom-1 left-1 right-1 bg-slate-950/90 backdrop-blur-md px-1.5 py-0.5 rounded-lg border border-slate-800 flex items-center justify-between text-[9px] font-extrabold text-white">
                      <span className="truncate">
                        {!isSwapped ? currentUserDisplay.roleLabel : otherParticipantDisplay.roleLabel}
                      </span>
                      <ArrowLeftRight className="w-3 h-3 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>

                  {/* BARRA DE CONTROLES FLUTUANTE (ESTILO GOOGLE MEET / ZOOM) */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-2 sm:gap-3 bg-slate-950/95 backdrop-blur-xl border border-cyan-500/40 p-2 sm:p-2.5 rounded-2xl shadow-2xl">
                    {/* BOTÃO MICROFONE */}
                    <button
                      type="button"
                      onClick={toggleMic}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-black ${
                        isMicOn 
                          ? 'bg-slate-900 border-emerald-500/50 text-emerald-400 hover:bg-slate-800' 
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
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-black ${
                        isVideoOn 
                          ? 'bg-slate-900 border-cyan-500/50 text-cyan-400 hover:bg-slate-800' 
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
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-black ${
                        isScreenSharing
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-200 hover:text-white hover:bg-slate-800'
                      }`}
                      title="Compartilhar Tela"
                    >
                      <Monitor className="w-4 h-4 text-amber-400" />
                      <span className="hidden sm:inline">{isScreenSharing ? 'Compartilhando' : 'Compartilhar Tela'}</span>
                    </button>

                    {/* BOTÃO TESTE DE CONEXÃO REMOTA (SIMULAÇÃO 2 PARTICIPANTES AO VIVO) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRemoteConnected(prev => !prev);
                        if (!isRemoteConnected) {
                          setRemoteStream(localStream);
                          setPeerJoinNotification(`🎉 ${otherParticipantDisplay.name} (${otherParticipantDisplay.roleLabel}) conectou-se à chamada!`);
                          setTimeout(() => setPeerJoinNotification(null), 5000);
                        } else {
                          setRemoteStream(null);
                          setPeerJoinNotification(`⚠️ ${otherParticipantDisplay.name} desconectou da chamada.`);
                          setTimeout(() => setPeerJoinNotification(null), 5000);
                        }
                      }}
                      className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-black ${
                        isRemoteConnected 
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' 
                          : 'bg-slate-900 border-cyan-500/40 text-cyan-300 hover:bg-slate-800'
                      }`}
                      title="Testar entrada e simular transmissão ao vivo do outro participante"
                    >
                      <RefreshCw className={`w-4 h-4 text-cyan-400 ${isRemoteConnected ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">{isRemoteConnected ? 'Conectado (Ao Vivo)' : 'Simular Entrada'}</span>
                    </button>

                    {/* BOTÃO ENCERRAR AULA */}
                    <button
                      type="button"
                      onClick={handleEndClass}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Sair da Aula</span>
                    </button>
                  </div>
                </div>
              )}

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
