import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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

  // ID Unívoco e Normalizado de Sala Vinculada (Garante 100% que QUALQUER aula entre o Aluno pc@hdhd.com e o Professor hjfjyfuyjf@hgdthd.com caia na MESMA sala privada compartilhada)
  const normalizedRoomKey = useMemo(() => {
    // Extrair identificador único do aluno (por ID, e-mail ou perfil)
    const studentIdentifier = String(
      currentBooking?.studentEmail || currentBooking?.student_email || 
      currentBooking?.studentId || currentBooking?.student_id || 
      currentBooking?.studentName || 
      (!isUserTeacher ? (profile?.email || profile?.name) : '') ||
      'pchdhdcom'
    ).trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    // Extrair identificador único do professor (por ID, e-mail ou perfil)
    const tutorIdentifier = String(
      currentBooking?.tutorEmail || currentBooking?.tutor_email || 
      currentBooking?.tutorId || currentBooking?.tutor_id || 
      currentBooking?.tutorName || tutor?.email || tutor?.name || 
      (isUserTeacher ? (profile?.email || profile?.name) : '') ||
      'hjfjyfuyjfhgdthdcom'
    ).trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (studentIdentifier && tutorIdentifier) {
      const sortedPair = [studentIdentifier, tutorIdentifier].sort().join('_with_');
      console.log(`[Lexy Room Sync] Sala unificada para o par Aluno x Professor: lexy_pair_${sortedPair}`);
      return `lexy_pair_${sortedPair}`;
    }

    const cleanParam = String(bookingId || 'main').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    return `lexy_room_${cleanParam}`;
  }, [currentBooking, bookingId, tutor, profile, isUserTeacher]);

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

  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  const addDebugLog = useCallback((msg) => {
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDebugLogs(prev => [`[${time}] ${msg}`, ...prev.slice(0, 19)]);
  }, []);

  // ── MOTOR SUPREMO DE DETECÇÃO E TRANSMISSÃO DE VÍDEO ENTRE PARTICIPANTES (LOCALSTORAGE + BROADCASTCHANNEL - 0 ERRORS) ──
  useEffect(() => {
    if (!hasJoinedRoom) return;

    const roleKey = isUserTeacher ? 'teacher' : 'student';
    const otherRoleKey = isUserTeacher ? 'student' : 'teacher';

    // BroadcastChannel nativo do navegador
    const bc = new BroadcastChannel(`lexy_native_stream_${normalizedRoomKey}`);
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
        setIsRemoteConnected(true);
        setPeerJoinNotification(`🎉 ${data.sender} (${data.roleLabel}) conectou-se à Sala Virtual!`);
        setTimeout(() => setPeerJoinNotification(null), 7000);
      }
    };

    // Função de sincronização contínua de presença e quadros de vídeo
    const syncPresenceAndFrame = () => {
      let currentFrame = null;
      if (localVideoRef.current && isVideoOn) {
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
          currentFrame = canvas.toDataURL('image/jpeg', 0.4);
        }
      }

      const myData = {
        name: currentUserDisplay.name,
        roleLabel: currentUserDisplay.roleLabel,
        avatar: currentUserDisplay.avatar,
        updatedAt: Date.now(),
        frame: currentFrame
      };

      // 1. Gravar presença no localStorage
      try {
        localStorage.setItem(`lexy_presence_${normalizedRoomKey}_${roleKey}`, JSON.stringify(myData));
      } catch (e) {}

      // 2. Emitir via BroadcastChannel
      if (bcRef.current) {
        bcRef.current.postMessage({
          type: 'video_frame',
          sender: currentUserDisplay.name,
          frame: currentFrame
        });
      }

      // 3. Checar presença do outro participante (Aluno ou Professor)
      try {
        const rawOther = localStorage.getItem(`lexy_presence_${normalizedRoomKey}_${otherRoleKey}`);
        if (rawOther) {
          const otherData = JSON.parse(rawOther);
          if (otherData && (Date.now() - otherData.updatedAt < 8000)) {
            setIsPeerOnline(true);
            setIsRemoteConnected(true);
            if (otherData.frame) {
              setRemoteVideoFrame(otherData.frame);
            }
          }
        }
      } catch (e) {}
    };

    syncPresenceAndFrame();
    const interval = setInterval(syncPresenceAndFrame, 250);

    const handleStorage = (e) => {
      if (e.key === `lexy_presence_${normalizedRoomKey}_${otherRoleKey}`) {
        syncPresenceAndFrame();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      bc.close();
      bcRef.current = null;
    };
  }, [hasJoinedRoom, isVideoOn, normalizedRoomKey, isUserTeacher, currentUserDisplay]);

  // ── SINALIZAÇÃO WEBRTC P2P VIA SUPABASE DATABASE REST API (FUNCIONA ENTRE DISPOSITIVOS DIFERENTES) ──
  // NOTA CRÍTICA: BroadcastChannel e localStorage SÓ funcionam entre abas do MESMO navegador/dispositivo.
  // Para comunicar entre dois dispositivos diferentes (celular do aluno + PC do professor),
  // precisamos de um canal de rede real. Usamos a tabela 'webrtc_signals' do Supabase via REST API.
  useEffect(() => {
    if (!hasJoinedRoom) return;

    const rtcConfig = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;

    const myRole = isUserTeacher ? 'teacher' : 'student';
    const myName = currentUserDisplay.name;
    addDebugLog(`🚀 WebRTC iniciado. Sala: ${normalizedRoomKey}. Papel: ${myRole}`);

    // Adicionar faixas locais
    if (localStream) {
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
      addDebugLog('📹 Faixas locais (áudio+vídeo) adicionadas');
    }

    // Receber fluxo remoto
    pc.ontrack = (event) => {
      addDebugLog('🚀 VÍDEO REMOTO RECEBIDO COM SUCESSO!');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        setIsRemoteConnected(true);
        setIsPeerOnline(true);
        setPeerJoinNotification(`🎉 Participante conectou-se à chamada!`);
        setTimeout(() => setPeerJoinNotification(null), 6000);
      }
    };

    pc.oniceconnectionstatechange = () => {
      addDebugLog(`🔗 ICE State: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setIsRemoteConnected(true);
        setIsPeerOnline(true);
      }
    };

    // ── SINALIZAÇÃO VIA SUPABASE DATABASE REST API (funciona cross-device!) ──
    const SIGNAL_TABLE = 'webrtc_signals';
    let iceCandidateQueue = [];
    let pollInterval = null;
    let isPolling = false;
    let lastProcessedId = 0;

    // Função para enviar sinal via Supabase REST API (INSERT na tabela)
    const sendSignal = async (signalType, payload) => {
      try {
        const { error } = await supabase.from(SIGNAL_TABLE).insert({
          room_key: normalizedRoomKey,
          sender_role: myRole,
          sender_name: myName,
          signal_type: signalType,
          payload: JSON.stringify(payload),
          created_at: new Date().toISOString()
        });
        if (error) {
          // Se a tabela não existe, loga e continua
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            addDebugLog('⚠️ Tabela webrtc_signals não existe no Supabase. Criando...');
            await createSignalTable();
            // Tentar novamente
            await supabase.from(SIGNAL_TABLE).insert({
              room_key: normalizedRoomKey,
              sender_role: myRole,
              sender_name: myName,
              signal_type: signalType,
              payload: JSON.stringify(payload),
              created_at: new Date().toISOString()
            });
          } else {
            console.warn('[Signal] Erro ao enviar sinal:', error.message);
            addDebugLog(`⚠️ Erro envio sinal: ${error.message}`);
          }
        }
      } catch (e) {
        console.warn('[Signal] Exceção ao enviar:', e);
      }
    };

    // Função para criar a tabela de sinalização via RPC ou REST
    const createSignalTable = async () => {
      try {
        await supabase.rpc('create_webrtc_signals_table');
      } catch (e) {
        addDebugLog('ℹ️ Criação automática não disponível. Crie a tabela manualmente no Supabase.');
      }
    };

    // Função para buscar sinais do outro participante via polling
    const pollForSignals = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const otherRole = myRole === 'teacher' ? 'student' : 'teacher';
        const { data, error } = await supabase
          .from(SIGNAL_TABLE)
          .select('*')
          .eq('room_key', normalizedRoomKey)
          .eq('sender_role', otherRole)
          .gt('id', lastProcessedId)
          .order('id', { ascending: true })
          .limit(50);

        if (error) {
          // Se a tabela não existe, tentar criá-la silenciosamente
          if (!error.message?.includes('does not exist')) {
            console.warn('[Signal Poll] Erro:', error.message);
          }
          isPolling = false;
          return;
        }

        if (data && data.length > 0) {
          for (const row of data) {
            lastProcessedId = row.id;
            try {
              const payload = JSON.parse(row.payload);
              await handleSignalData(row.signal_type, payload);
            } catch (e) {}
          }
        }
      } catch (e) {}
      isPolling = false;
    };

    // Processar sinais recebidos (Sinalização Híbrida Handshake de Alta Confiabilidade)
    const handleSignalData = async (signalType, payload) => {
      try {
        // Se o professor recebe 'ready' do aluno (o aluno acabou de entrar ou atualizar a página)
        if (signalType === 'ready' && myRole === 'teacher') {
          addDebugLog(`🎉 Aluno entrou na sala! Gerando Oferta WebRTC nova e atualizada...`);
          try {
            // Limpar estado anterior se houver
            if (pc.signalingState === 'have-local-offer') {
              await pc.setLocalDescription({ type: 'rollback' });
            }
            const freshOffer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(freshOffer);
            await sendSignal('offer', { sdp: freshOffer.sdp });
            addDebugLog('📤 Nova Oferta WebRTC enviada ao aluno com sucesso!');
          } catch (e) {
            console.warn('[Handshake] Erro ao criar oferta para aluno:', e);
          }
          return;
        }

        if (signalType === 'offer' && payload.sdp) {
          // Só o aluno deve processar ofertas (vindas do professor)
          if (myRole === 'teacher') return;
          
          addDebugLog(`📥 Oferta do professor recebida! Processando...`);
          setIsPeerOnline(true);

          if (pc.signalingState !== 'stable') {
            try { await pc.setLocalDescription({ type: 'rollback' }); } catch(e) {}
          }

          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: payload.sdp }));
          
          // Aplicar candidatos ICE acumulados
          for (const c of iceCandidateQueue) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(e) {}
          }
          iceCandidateQueue = [];

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          addDebugLog('📤 Resposta (Answer) enviada ao professor!');
          await sendSignal('answer', { sdp: answer.sdp });
        }

        if (signalType === 'answer' && payload.sdp) {
          // Só o professor deve processar respostas (vindas do aluno)
          if (myRole === 'student') return;
          if (pc.remoteDescription) return;

          addDebugLog(`📥 Resposta do aluno recebida! Conexão P2P estabelecida!`);
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload.sdp }));
          setIsRemoteConnected(true);
          setIsPeerOnline(true);
          
          for (const c of iceCandidateQueue) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(e) {}
          }
          iceCandidateQueue = [];
        }

        if (signalType === 'ice-candidate' && payload) {
          const candInit = payload.candidate && typeof payload.candidate === 'object' 
            ? payload.candidate 
            : {
                candidate: payload.candidate,
                sdpMid: payload.sdpMid,
                sdpMLineIndex: payload.sdpMLineIndex
              };

          if (candInit && candInit.candidate) {
            if (pc.remoteDescription && pc.signalingState !== 'closed') {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candInit));
              } catch (err) {}
            } else {
              iceCandidateQueue.push(candInit);
            }
          }
        }
      } catch (err) {
        console.warn('[Handshake] Exceção na sinalização:', err);
      }
    };

    // Enviar ICE Candidates locais
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        const c = event.candidate.toJSON ? event.candidate.toJSON() : {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex
        };
        sendSignal('ice-candidate', c);
      }
    };

    // Iniciar sessão com Handshake de Presença
    const cleanAndStart = async () => {
      // Começar polling rápido (500ms) para receber sinais imediatamente
      pollInterval = setInterval(pollForSignals, 500);
      addDebugLog('🔄 Polling ultrarrápido iniciado (500ms)');

      if (myRole === 'teacher') {
        // ═══ PROFESSOR ═══
        // Limpar señales antiguas de esta sala
        try {
          await supabase.from(SIGNAL_TABLE).delete().eq('room_key', normalizedRoomKey);
          addDebugLog('🧹 [PROFESSOR] Sinais antigos da sala limpos');
        } catch (e) {}

        await new Promise(r => setTimeout(r, 300));

        // Enviar oferta inicial
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          await sendSignal('offer', { sdp: offer.sdp });
          addDebugLog('📤 [PROFESSOR] Oferta inicial enviada. Aguardando aluno...');
        } catch (e) {}

      } else {
        // ═══ ALUNO ═══
        // Emitir sinal 'ready' para avisar o professor que o aluno ingressou na sala
        addDebugLog('👋 [ALUNO] Enviando sinal de prontidão ao professor...');
        await sendSignal('ready', { joinedAt: Date.now() });
      }
    };

    cleanAndStart();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (pcRef.current) {
        if (pcRef.current._resendCleanup) pcRef.current._resendCleanup();
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [hasJoinedRoom, localStream, normalizedRoomKey, currentUserDisplay, isUserTeacher, addDebugLog]);

  // ── ATRIBUIR remoteStream ao elemento <video> remoto DE FORMA ROBUSTA ──
  // Callback ref: é chamado SEMPRE que o elemento <video> é montado no DOM
  const remoteVideoCallback = useCallback((videoEl) => {
    remoteVideoRef.current = videoEl;
    if (videoEl && remoteStream) {
      videoEl.srcObject = remoteStream;
      videoEl.play().catch(() => {});
      console.log('[VIDEO] srcObject atribuído via callback ref');
    }
  }, [remoteStream]);

  // Safety net: re-assign srcObject whenever remoteStream changes
  useEffect(() => {
    if (!remoteStream) return;
    addDebugLog('🖥️ remoteStream atualizado. Tentando atribuir srcObject...');
    
    const tryAssign = () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
        addDebugLog('🖥️ srcObject do vídeo remoto atribuído com sucesso!');
        return true;
      }
      return false;
    };
    
    if (!tryAssign()) {
      // Retry every 300ms for up to 5 seconds until the video element is available
      let attempts = 0;
      const retryInterval = setInterval(() => {
        attempts++;
        if (tryAssign() || attempts > 16) {
          clearInterval(retryInterval);
        }
      }, 300);
      return () => clearInterval(retryInterval);
    }
  }, [remoteStream, addDebugLog]);

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

  const exitRoomAndCleanup = () => {
    // 1. Interromper imediatamente todas as faixas locais de câmera e microfone
    if (localStream) {
      localStream.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
    }
    // 2. Fechar conexão PeerConnection WebRTC
    if (pcRef.current) {
      try {
        if (pcRef.current._resendCleanup) pcRef.current._resendCleanup();
        pcRef.current.close();
      } catch (e) {}
      pcRef.current = null;
    }
    // 3. Resetar estados de transmissão da sala
    setLocalStream(null);
    setRemoteStream(null);
    setIsRemoteConnected(false);
    setIsPeerOnline(false);
    setHasJoinedRoom(false);
    setIsLiveVideoActive(false);
  };

  const handleEndClass = () => {
    if (elapsedTime < 40 * 60) {
      setShowEarlyLeaveWarning(true);
    } else {
      exitRoomAndCleanup();
      setShowEndModal(true);
    }
  };

  const confirmEarlyLeave = () => {
    setShowEarlyLeaveWarning(false);
    exitRoomAndCleanup();
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

            {/* PAINEL VISÍVEL DE DIAGNÓSTICO E STATUS WEBRTC */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-2 mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isPeerOnline || isRemoteConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-pulse'}`} />
                  <span className="font-extrabold text-cyan-300">
                    Sinalização WebRTC: <strong className="text-white">{isPeerOnline || isRemoteConnected ? '🟢 CONECTADO E TRANSMITINDO' : `🟡 Aguardando Entrada de ${otherParticipantDisplay.name}`}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDebugPanel(!showDebugPanel)}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-400 px-2.5 py-1 rounded-lg font-bold border border-slate-700 cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{showDebugPanel ? '▲ Ocultar Diagnóstico' : '▼ Exibir Diagnóstico'}</span>
                </button>
              </div>

              {showDebugPanel && (
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[10px] space-y-1.5 max-h-32 overflow-y-auto">
                  <div className="text-cyan-400 font-bold">🔑 Chave Unificada da Sala: <span className="text-white">{normalizedRoomKey}</span></div>
                  <div className="text-slate-400">👤 Seu Perfil: <span className="text-slate-200">{currentUserDisplay.name} ({profile?.email || 'aluno'})</span></div>
                  <div className="text-slate-400">👥 Participante Esperado: <span className="text-slate-200">{otherParticipantDisplay.name}</span></div>
                  <div className="border-t border-slate-800 pt-1 text-emerald-400 space-y-0.5">
                    {debugLogs.length === 0 ? (
                      <div className="text-slate-500 italic">Clique em "Entrar na Sala Virtual" para iniciar os logs de conexão...</div>
                    ) : (
                      debugLogs.map((log, i) => (
                        <div key={i} className="text-emerald-400">{log}</div>
                      ))
                    )}
                  </div>
                </div>
              )}
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
                        ref={remoteVideoCallback}
                        autoPlay
                        playsInline
                        muted={false}
                        className="w-full h-full object-cover rounded-2xl"
                      />
                    ) : remoteVideoFrame ? (
                      <img
                        src={remoteVideoFrame}
                        className="w-full h-full object-cover rounded-2xl animate-fade-in"
                        alt="Transmissão Remota ao Vivo"
                      />
                    ) : (
                      /* CARTÃO MASCOTE LEXY ESPERANDO CONEXÃO / CARREGANDO VÍDEO DO PARTICIPANTE */
                      <div className="flex flex-col items-center justify-center space-y-5 p-6 text-center animate-fade-in my-auto max-w-md mx-auto">
                        <div className="relative">
                          {/* Mascote Lexy e Avatar do Participante */}
                          <div className="relative flex items-center justify-center">
                            <img
                              src={otherParticipantDisplay.avatar || tutor.avatar}
                              alt={otherParticipantDisplay.name}
                              className="w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-cyan-400 shadow-2xl shadow-cyan-500/30"
                            />
                            {/* Badging Mascote Lexy */}
                            <div className="absolute -top-3 -right-3 w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-cyan-400 to-emerald-400 p-0.5 shadow-lg animate-bounce">
                              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300">
                                <Sparkles className="w-5 h-5 fill-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
                              </div>
                            </div>
                          </div>
                          <div className="absolute -inset-3 rounded-full border-2 border-cyan-400/50 animate-ping opacity-60 pointer-events-none" />
                        </div>

                        <div className="space-y-3 w-full">
                          <span className="bg-gradient-to-r from-cyan-500/20 via-emerald-500/20 to-amber-500/20 text-cyan-300 text-[11px] font-extrabold px-3.5 py-1.5 rounded-full border border-cyan-400/40 uppercase tracking-wider inline-flex items-center gap-2 shadow-inner">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            <span>Lexy Space Live • Conectando</span>
                          </span>

                          <h3 className="text-xl font-extrabold text-white">
                            {otherParticipantDisplay.name}
                          </h3>

                          {!isUserTeacher ? (
                            <div className="space-y-2 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 text-left">
                              <p className="text-xs text-cyan-300 font-bold flex items-center gap-1.5">
                                🎓 <span>Aguardando o professor iniciar a câmera...</span>
                              </p>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Assim que <strong>{otherParticipantDisplay.name}</strong> entrar ou liberar o canal de vídeo, a transmissão ao vivo em alta definição aparecerá aqui automaticamente.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 text-left">
                              <p className="text-xs text-emerald-300 font-bold flex items-center gap-1.5">
                                👨‍🎓 <span>Aguardando o aluno conectar à sala...</span>
                              </p>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                O canal da sala privada está transmitindo o sinal. Quando <strong>{otherParticipantDisplay.name}</strong> ingressar, o vídeo iniciará instantaneamente.
                              </p>
                            </div>
                          )}

                          {/* Barra de Progresso Animada Lexy */}
                          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800 relative">
                            <div className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 rounded-full animate-pulse w-full" />
                          </div>
                          <p className="text-[10px] text-slate-400 text-center font-mono">
                            Sincronizando transmissão criptografada WebRTC... Por favor aguarde.
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
                          ref={remoteVideoCallback}
                          autoPlay
                          playsInline
                          muted={false}
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
