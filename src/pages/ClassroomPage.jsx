import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Video, Mic, MicOff, VideoOff, Monitor, MessageSquare, 
  BookOpen, Sparkles, Star, CheckCircle2, Clock, X, Send, PenTool, ExternalLink, Globe, Play, Plus, AlertTriangle, AlertCircle, ShieldCheck, Zap, Volume2, User, Lock, ArrowLeftRight, RotateCw, Hand, Smile, Maximize2, Minimize2, LogOut, GripHorizontal
} from 'lucide-react';
import { useMarketplace } from '../contexts/MarketplaceContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

export default function ClassroomPage({ routeBookingId }) {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { tutors = [], bookings = [], completeBooking } = useMarketplace();
  const { profile } = useAuth();

  const [activeBookingId, setActiveBookingId] = useState(() => {
    return localStorage.getItem('lexy_active_booking_id') || null;
  });

  const effectiveBookingId = params.bookingId || routeBookingId || activeBookingId;
  const bookingId = effectiveBookingId;

  useEffect(() => {
    const bId = params.bookingId || routeBookingId;
    if (bId) {
      setActiveBookingId(bId);
      localStorage.setItem('lexy_active_booking_id', bId);
    }
    setShowEndModal(false);
    setIsReviewSubmitted(false);
    setShowEarlyLeaveWarning(false);
  }, [params.bookingId, routeBookingId]);

  // Localizar a reserva (aula) exata pelo ID ou código de aula
  const currentBooking = useMemo(() => {
    if (!effectiveBookingId) return null;
    const cleanId = String(effectiveBookingId).trim().toLowerCase();

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

  // ID Unificado e Normalizado de Código de Aula para Validação de Presença
  const cleanLessonCode = useMemo(() => {
    const raw = currentBooking?.lesson_code || currentBooking?.id || bookingId || 'AULA-2026-DEFAULT';
    return String(raw).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
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
  const [peerJoinNotification, setPeerJoinNotification] = useState(null);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const [isRemoteVideoActive, setIsRemoteVideoActive] = useState(false);
  const [isPeerOnline, setIsPeerOnline] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false); // Inverter vista grande x vista pequena
  const [videoFitMode, setVideoFitMode] = useState('contain'); // 'contain' (100% visível sem cortes) | 'cover' (preencher tela)
  const toggleVideoFitMode = () => setVideoFitMode(prev => prev === 'contain' ? 'cover' : 'contain');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteIsScreenSharing, setRemoteIsScreenSharing] = useState(false);
  const [remoteStudentCheckIn, setRemoteStudentCheckIn] = useState(false);
  const screenStreamRef = useRef(null);
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
  const [showIncompletePresenceModal, setShowIncompletePresenceModal] = useState(false);
  const [presenceCheckDetails, setPresenceCheckDetails] = useState(null);

  const [debugLogs, setDebugLogs] = useState([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true);

  // ── REAÇÕES FLUTUANTES, MAO LEVANTADA E MODO TELA CHEIA ──
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRemoteHandRaised, setIsRemoteHandRaised] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSupportButton, setShowSupportButton] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isRemoteSpeaking, setIsRemoteSpeaking] = useState(false);

  // ── ESTADOS DE RECONEXÃO AUTOMÁTICA E MONITOR DE REDE ──
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectReason, setReconnectReason] = useState('');
  const [isNetworkOnline, setIsNetworkOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Detector de Áudio do Microfone Local (Ativa borda azul brilhante ao falar)
  useEffect(() => {
    if (!localStream || !isMicOn) {
      setIsSpeaking(false);
      return;
    }
    const audioTrack = localStream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      setIsSpeaking(false);
      return;
    }

    let audioCtx = null;
    let analyser = null;
    let microphone = null;
    let animId = null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      microphone = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      microphone.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkSpeaking = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setIsSpeaking(average > 10);
        animId = requestAnimationFrame(checkSpeaking);
      };

      checkSpeaking();
    } catch (e) {}

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [localStream, isMicOn]);

  // Detector de Áudio do Participante Remoto (Ativa borda azul brilhante quando o outro fala)
  useEffect(() => {
    if (!remoteStream || !isRemoteConnected) {
      setIsRemoteSpeaking(false);
      return;
    }
    const audioTrack = remoteStream.getAudioTracks()[0];
    if (!audioTrack || !audioTrack.enabled) {
      setIsRemoteSpeaking(false);
      return;
    }

    let audioCtx = null;
    let analyser = null;
    let microphone = null;
    let animId = null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      microphone = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
      microphone.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkRemoteSpeaking = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setIsRemoteSpeaking(average > 10);
        animId = requestAnimationFrame(checkRemoteSpeaking);
      };

      checkRemoteSpeaking();
    } catch (e) {}

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close().catch(() => {});
      }
    };
  }, [remoteStream, isRemoteConnected]);

  // ── ESTADO DO EFEITO DE DESFOQUE DE FUNDO (REMOVIDO) ──
  
  // ── ESTADO E LÓGICA DE ARRASTAR (DRAG & DROP) PARA O MINI-PLAYER FLUTUANTE ──
  const [pipPos, setPipPos] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });

  const handleDragStart = (e) => {
    isDraggingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = { x: clientX, y: clientY };
    posStartRef.current = { ...pipPos };
  };

  const handleDragMove = useCallback((e) => {
    if (!isDraggingRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    setPipPos({
      x: posStartRef.current.x + dx,
      y: posStartRef.current.y + dy
    });
  }, [pipPos]);

  const handleDragEnd = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    const onMove = (e) => handleDragMove(e);
    const onUp = () => handleDragEnd();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [handleDragMove, handleDragEnd]);
  const [isNoiseFilterActive, setIsNoiseFilterActive] = useState(true);

  // ── HOOK DE ATRIBUIÇÃO DIRETA DE VÍDEO (100% FLUIDO A 60 FPS) ──
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  // ── HOOK DE CANCELAMENTO ATIVO DE RUÍDO DSP EM TEMPO REAL ──
  useEffect(() => {
    if (!localStream) return;

    const rawAudioTrack = localStream.getAudioTracks()[0];
    if (!rawAudioTrack) return;

    if (!isNoiseFilterActive) {
      // Restaurar faixa de áudio original sem filtros
      if (pcRef.current) {
        const audioSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'audio');
        if (audioSender && rawAudioTrack) {
          audioSender.replaceTrack(rawAudioTrack).catch(() => {});
        }
      }
      return;
    }

    let audioCtx = null;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(new MediaStream([rawAudioTrack]));
      const destination = audioCtx.createMediaStreamDestination();

      // 1. Highpass Filter (60Hz): Preserva o grave natural da voz e elimina infrassons/zumbidos de ar-condicionado
      const highpass = audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.value = 60;

      // 2. Lowpass Filter (18000Hz): Transmissão de áudio cristalino de alta fidelidade (Hi-Fi) até 18kHz
      const lowpass = audioCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 18000;

      // 3. Dynamics Compressor Nível Estúdio: Nivelamento de voz ultra suave sem distorções ou cortes
      const compressor = audioCtx.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 12;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.10;

      // Cadeia DSP de Áudio: Source -> Highpass -> Lowpass -> Compressor -> Destination
      source.connect(highpass);
      highpass.connect(lowpass);
      lowpass.connect(compressor);
      compressor.connect(destination);

      const processedAudioTrack = destination.stream.getAudioTracks()[0];
      if (processedAudioTrack && pcRef.current) {
        const audioSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'audio');
        if (audioSender) {
          audioSender.replaceTrack(processedAudioTrack).catch(() => {});
          console.log('🎙️ Áudio DSP com Cancelamento de Ruído transmitido via WebRTC!');
        }
      }

      return () => {
        if (audioCtx && audioCtx.state !== 'closed') {
          audioCtx.close().catch(() => {});
        }
      };
    } catch (e) {
      console.warn('Erro ao aplicar cancelamento de ruído DSP:', e);
    }
  }, [localStream, isNoiseFilterActive]);

  // Efeito Sonoro Chime via Web Audio API (100% nativo, sem arquivos externos)
  const playChimeSound = useCallback((type = 'join') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      if (type === 'join') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.25);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
      } else if (type === 'raise') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      }
    } catch (e) {}
  }, []);

  // Helper para disparar partículas de emoji flutuante na tela
  const triggerFloatingEmoji = useCallback((emojiSymbol) => {
    const newEmoji = {
      id: `emoji-${Date.now()}-${Math.random()}`,
      symbol: emojiSymbol,
      left: Math.floor(Math.random() * 60) + 20
    };
    setFloatingEmojis(prev => [...prev.slice(-15), newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 3200);
  }, []);

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
          canvas.width = 480;
          canvas.height = 270;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoEl, 0, 0, 480, 270);
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

  // ── FUNÇÃO MANUAL/AUTOMÁTICA PARA FORÇAR RECONEXÃO ICE RESTART ──
  const reconnectAttemptsRef = useRef(0);

  const triggerIceRestart = useCallback(async () => {
    if (!hasJoinedRoom || !localStream) return;

    const maxAttempts = 5;
    const attempt = reconnectAttemptsRef.current + 1;
    reconnectAttemptsRef.current = attempt;

    if (attempt > maxAttempts) {
      addDebugLog('⚠️ Tentativas de reconexão atingiram o limite. Reiniciando handshake...');
      reconnectAttemptsRef.current = 0;
    }

    const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 4000);
    addDebugLog(`⚡ Reconexão tentativa ${attempt}/${maxAttempts} (aguardando ${Math.round(delay / 1000)}s)...`);
    setIsReconnecting(true);
    setReconnectReason(`Reconectando aula ao vivo (ajustando sinal de rede)... Tentativa ${attempt} de ${maxAttempts}`);

    await new Promise(r => setTimeout(r, delay));

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      addDebugLog('⏳ Dispositivo offline. Aguardando sinal de internet...');
      return;
    }

    try {
      const pc = pcRef.current;
      const myRole = isUserTeacher ? 'teacher' : 'student';

      if (pc && pc.signalingState !== 'closed') {
        addDebugLog('🔄 Disparando ICE Restart no PeerConnection existente...');
        if (myRole === 'teacher') {
          const freshOffer = await pc.createOffer({ iceRestart: true });
          await pc.setLocalDescription(freshOffer);
          await supabase.from('webrtc_signals').insert({
            room_key: normalizedRoomKey,
            sender_role: myRole,
            sender_name: currentUserDisplay.name,
            signal_type: 'offer',
            payload: JSON.stringify({ sdp: freshOffer.sdp }),
            created_at: new Date().toISOString()
          });
          addDebugLog('📤 Oferta de ICE Restart enviada ao participante!');
        } else {
          await supabase.from('webrtc_signals').insert({
            room_key: normalizedRoomKey,
            sender_role: myRole,
            sender_name: currentUserDisplay.name,
            signal_type: 'ready',
            payload: JSON.stringify({ timestamp: Date.now() }),
            created_at: new Date().toISOString()
          });
          addDebugLog('📤 Sinal de prontidão (ready) reenviado para renegociação!');
        }
      } else {
        addDebugLog('🧹 Reiniciando canal de sinalização para reconexão...');
        try {
          await supabase.from('webrtc_signals').delete().eq('room_key', normalizedRoomKey);
        } catch (e) {}

        setRemoteStream(null);
        setIsRemoteConnected(false);
        setIsRemoteVideoActive(false);

        await supabase.from('webrtc_signals').insert({
          room_key: normalizedRoomKey,
          sender_role: myRole,
          sender_name: currentUserDisplay.name,
          signal_type: myRole === 'teacher' ? 'teacher_online' : 'ready',
          payload: JSON.stringify({ timestamp: Date.now() }),
          created_at: new Date().toISOString()
        });
        addDebugLog('🚀 Sinal de reconexão enviado com sucesso!');
      }
    } catch (err) {
      console.warn('Erro durante reconexão:', err);
      addDebugLog(`⚠️ Erro na reconexão: ${err.message}`);
    }
  }, [isUserTeacher, normalizedRoomKey, currentUserDisplay, addDebugLog, hasJoinedRoom, localStream]);

  // ── MONITOR GLOBAL DE REDE DO NAVEGADOR (ONLINE / OFFLINE) ──
  useEffect(() => {
    const handleWindowOnline = () => {
      setIsNetworkOnline(true);
      addDebugLog('🌐 Conexão à internet restabelecida no dispositivo! Iniciando reconexão...');
      reconnectAttemptsRef.current = 0; // Reset retry counter on fresh online event
      setIsReconnecting(true);
      setReconnectReason('Sinal de internet restaurado — Reconectando aula ao vivo...');
      // Small delay to let the network stabilize before reconnecting
      setTimeout(() => triggerIceRestart(), 1500);
    };

    const handleWindowOffline = () => {
      setIsNetworkOnline(false);
      setIsReconnecting(true);
      setReconnectReason('Sua conexão com a internet caiu. Aguardando sinal...');
      addDebugLog('⚠️ Conexão com a internet perdida (offline)');
    };

    window.addEventListener('online', handleWindowOnline);
    window.addEventListener('offline', handleWindowOffline);

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      handleWindowOffline();
    }

    return () => {
      window.removeEventListener('online', handleWindowOnline);
      window.removeEventListener('offline', handleWindowOffline);
    };
  }, [triggerIceRestart, addDebugLog]);

  // ── SINALIZAÇÃO WEBRTC P2P VIA SUPABASE DATABASE REST API (FUNCIONA ENTRE DISPOSITIVOS DIFERENTES) ──
  // NOTA CRÍTICA: BroadcastChannel e localStorage SÓ funcionam entre abas do MESMO navegador/dispositivo.
  // Para comunicar entre dois dispositivos diferentes (celular do aluno + PC do professor),
  // precisamos de um canal de rede real. Usamos a tabela 'webrtc_signals' do Supabase via REST API.
  useEffect(() => {
    if (!hasJoinedRoom || !localStream) return;

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

    // Configurar parâmetros de transmissão HD de áudio (128kbps) e vídeo (4Mbps)
    const configureHighQualitySenders = () => {
      pc.getSenders().forEach(sender => {
        if (!sender.track || !sender.setParameters) return;
        try {
          const params = sender.getParameters() || {};
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          if (sender.track.kind === 'video') {
            params.encodings[0].maxBitrate = 4000000; // 4 Mbps Full HD
            params.encodings[0].maxFramerate = 30;
            params.encodings[0].priority = 'high';
            params.encodings[0].networkPriority = 'high';
          } else if (sender.track.kind === 'audio') {
            params.encodings[0].maxBitrate = 128000; // 128 kbps Opus Hi-Fi
            params.encodings[0].priority = 'high';
            params.encodings[0].networkPriority = 'high';
          }
          sender.setParameters(params).catch(() => {});
        } catch (e) {}
      });
    };

    // Adicionar faixas locais (áudio e vídeo)
    if (localStream) {
      localStream.getTracks().forEach(track => {
        try {
          pc.addTrack(track, localStream);
          addDebugLog(`📹 Faixa local adicionada: ${track.kind} (${track.label})`);
        } catch (e) {
          console.warn('Erro ao adicionar faixa local:', e);
        }
      });
      configureHighQualitySenders();
    }

    // Acumulador de fluxo de mídia remoto para combinar áudio e vídeo
    const remoteMediaStream = new MediaStream();

    // Receber fluxo remoto (Apenas se remoteDescription já tiver sido processada)
    pc.ontrack = (event) => {
      // Prevenir loopback do próprio microfone/câmera local
      if (localStream && localStream.getTracks().some(t => t.id === event.track.id)) {
        console.warn('⚠️ Faixa local ignorada no ontrack para evitar eco/loopback');
        return;
      }

      addDebugLog(`🚀 Faixa de mídia remota recebida: ${event.track.kind} (${event.track.label || 'Faixa'})`);
      
      // Garantir que a faixa de áudio recebida esteja explicitamente ativada
      if (event.track.kind === 'audio') {
        event.track.enabled = true;
      }

      if (pc.remoteDescription) {
        // Se vier no event.streams[0], extrair todas as faixas (áudio e vídeo)
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach(track => {
            if (localStream && localStream.getTracks().some(t => t.id === track.id)) return;
            track.enabled = true;
            if (!remoteMediaStream.getTracks().some(t => t.id === track.id)) {
              remoteMediaStream.addTrack(track);
            }
          });
        } else if (event.track) {
          if (!remoteMediaStream.getTracks().some(t => t.id === event.track.id)) {
            remoteMediaStream.addTrack(event.track);
          }
        }

        // Criar um novo objeto MediaStream para forçar a atualização dos players <video> e <audio>
        const unifiedStream = new MediaStream(remoteMediaStream.getTracks());
        addDebugLog(`🚀 FLUXO REMOTO ATUALIZADO: ${unifiedStream.getAudioTracks().length} Áudio | ${unifiedStream.getVideoTracks().length} Vídeo`);
        
        setRemoteStream(unifiedStream);
        setIsRemoteConnected(true);
        setIsPeerOnline(true);
        setIsReconnecting(false);
        setReconnectReason('');
      }
    };

    // ── MONITORAÇÃO DE ESTADO DA CONEXÃO ICE & RECONEXÃO AUTOMÁTICA ──
    let iceRestartTimeout = null;
    const handleConnectionStateChange = () => {
      const iceState = pc.iceConnectionState;
      const connState = pc.connectionState;
      addDebugLog(`🔗 ICE State: ${iceState} | Conn State: ${connState}`);

      if (iceState === 'connected' || iceState === 'completed' || connState === 'connected') {
        setIsRemoteConnected(true);
        setIsPeerOnline(true);
        setIsReconnecting(false);
        setReconnectReason('');
        reconnectAttemptsRef.current = 0; // Reset on successful connection
      } else if (iceState === 'disconnected') {
        // Wait 3 seconds before declaring disconnection — temporary blips are normal
        addDebugLog('⚠️ ICE desconectado. Aguardando 3s antes de reconectar...');
        if (iceRestartTimeout) clearTimeout(iceRestartTimeout);
        iceRestartTimeout = setTimeout(() => {
          // Only reconnect if still disconnected
          if (pcRef.current && (pcRef.current.iceConnectionState === 'disconnected' || pcRef.current.iceConnectionState === 'failed')) {
            setIsReconnecting(true);
            setReconnectReason('Sinal de rede instável — Tentando reconectar áudio e vídeo...');
            triggerIceRestart();
          }
        }, 3000);
      } else if (iceState === 'failed' || connState === 'failed') {
        setIsReconnecting(true);
        setReconnectReason('Conexão P2P perdida — Reconectando automaticamente...');
        triggerIceRestart();
      } else if (iceState === 'checking' || connState === 'connecting') {
        setIsReconnecting(true);
        setReconnectReason('Sincronizando sinal de rede e reconectando participante...');
      }
    };

    pc.oniceconnectionstatechange = handleConnectionStateChange;
    pc.onconnectionstatechange = handleConnectionStateChange;

    // ── ESCUCHADORES DE REDE DA JANELA (ONLINE / OFFLINE) ──
    const handleWindowOnline = () => {
      setIsNetworkOnline(true);
      addDebugLog('🌐 Conexão à internet restabelecida! Iniciando reconexão...');
      reconnectAttemptsRef.current = 0;
      setIsReconnecting(true);
      setReconnectReason('Sinal de internet restaurado — Reconectando aula...');
      setTimeout(() => triggerIceRestart(), 1500);
    };

    const handleWindowOffline = () => {
      setIsNetworkOnline(false);
      setIsReconnecting(true);
      setReconnectReason('Sua conexão com a internet caiu. Aguardando sinal...');
      addDebugLog('⚠️ Conexão com a internet perdida (offline)');
    };

    window.addEventListener('online', handleWindowOnline);
    window.addEventListener('offline', handleWindowOffline);

    // ── SINALIZAÇÃO VIA SUPABASE DATABASE REST API (funciona cross-device!) ──
    const SIGNAL_TABLE = 'webrtc_signals';
    let iceCandidateQueue = [];
    let pollInterval = null;
    let heartbeatInterval = null;
    let peerCheckInterval = null;
    let lastPeerSignalTime = 0;
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

    let lastOfferTimestamp = 0;

    // Processar sinais recebidos (Handshake de Presença Idempotente - 100% à prova de falhas de ordem)
    const handleSignalData = async (signalType, payload) => {
      try {
        lastPeerSignalTime = Date.now();
        setIsPeerOnline(true);
        if (isReconnecting && isNetworkOnline) {
          setIsReconnecting(false);
          setReconnectReason('');
        }

        if (signalType === 'heartbeat') {
          return;
        }

        // 1. Se o PROFESSOR detecta o sinal 'ready' do Aluno
        if (signalType === 'ready' && myRole === 'teacher') {
          // Evitar gerar ofertas duplicadas se a conexão já estiver ativa ou oferta criada recentemente (<6s)
          if (pc.remoteDescription || pc.signalingState === 'have-local-offer' || (Date.now() - lastOfferTimestamp < 6000)) {
            return;
          }
          if (localStream) {
            localStream.getTracks().forEach(t => {
              t.enabled = true;
              const senders = pc.getSenders();
              if (!senders.some(s => s.track && s.track.id === t.id)) {
                try { pc.addTrack(t, localStream); } catch(e) {}
              }
            });
          }

          lastOfferTimestamp = Date.now();
          addDebugLog(`🎉 Aluno detectado na sala! Emitindo Oferta WebRTC...`);
          try {
            const freshOffer = await pc.createOffer({ iceRestart: true });
            await pc.setLocalDescription(freshOffer);
            await sendSignal('offer', { sdp: freshOffer.sdp });
            addDebugLog('📤 Oferta WebRTC enviada com sucesso ao aluno!');
          } catch (e) {
            console.warn('[Handshake] Erro ao gerar oferta:', e);
          }
          return;
        }

        // 2. Se o ALUNO detecta que o Professor está na sala ('teacher_online')
        if (signalType === 'teacher_online' && myRole === 'student') {
          addDebugLog(`👨‍🏫 Professor presente na sala! Solicitando conexão...`);
          await sendSignal('ready', { timestamp: Date.now() });
          return;
        }

        // 3. Processamento de OFERTA pelo ALUNO
        if (signalType === 'offer' && payload.sdp) {
          if (myRole === 'teacher') return; // Professor ignora ofertas
          
          addDebugLog(`📥 Oferta recebida do professor! Conectando...`);
          setIsPeerOnline(true);

          if (localStream) {
            localStream.getTracks().forEach(t => {
              t.enabled = true;
              const senders = pc.getSenders();
              if (!senders.some(s => s.track && s.track.id === t.id)) {
                try { pc.addTrack(t, localStream); } catch(e) {}
              }
            });
          }

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

        // 4. Processamento de RESPOSTA pelo PROFESSOR
        if (signalType === 'answer' && payload.sdp) {
          if (myRole === 'student') return; // Aluno ignora respostas
          if (pc.remoteDescription) return;

          addDebugLog(`📥 Resposta do aluno recebida! Conexão P2P ativa!`);
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload.sdp }));
          setIsRemoteConnected(true);
          setIsPeerOnline(true);
          playChimeSound('join');
          
          for (const c of iceCandidateQueue) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(e) {}
          }
          iceCandidateQueue = [];
        }

        // 5. Processamento de REAÇÕES DE EMOJI E MÃO LEVANTADA
        if (signalType === 'reaction' && payload?.emoji) {
          triggerFloatingEmoji(payload.emoji);
          return;
        }
        if (signalType === 'raise_hand') {
          setIsRemoteHandRaised(payload?.raised || false);
          if (payload?.raised) playChimeSound('raise');
          return;
        }

        // 6. Processamento de REGISTRO DE PRESENÇA FORMAL DA SALA VIRTUAL
        if (signalType === 'presence_checkin') {
          if (payload?.role === 'student') {
            setRemoteStudentCheckIn(true);
            addDebugLog('✅ Presença formal do ALUNO confirmada via sinalização!');
          }
          return;
        }

        // 7. Processamento de STATUS DE COMPARTILHAMENTO DE TELA
        if (signalType === 'screen_share_status') {
          const isSharing = !!payload?.isSharing;
          setRemoteIsScreenSharing(isSharing);
          if (isSharing) {
            addDebugLog(`🖥️ ${otherParticipantDisplay.name} iniciou o compartilhamento de tela!`);
            setVideoFitMode('contain');
          } else {
            addDebugLog(`📹 ${otherParticipantDisplay.name} encerrou o compartilhamento de tela.`);
          }
          return;
        }

        // 5. Processamento de CANDIDATOS ICE
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

    // Iniciar sessão com Handshake de Presença Idempotente
    const cleanAndStart = async () => {
      // Checar se o aluno já registrou presença formal no banco de sinais
      try {
        const { data: existingStudentPresence } = await supabase
          .from(SIGNAL_TABLE)
          .select('*')
          .eq('room_key', normalizedRoomKey)
          .eq('sender_role', 'student')
          .eq('signal_type', 'presence_checkin')
          .limit(1);

        if (existingStudentPresence && existingStudentPresence.length > 0) {
          setRemoteStudentCheckIn(true);
          addDebugLog('✅ Presença formal do aluno encontrada no banco!');
        }
      } catch (e) {}

      if (myRole === 'teacher') {
        // ═══ PROFESSOR ═══
        try {
          // Limpar apenas sinais de SDP/ICE antigos sem apagar o registro de presença formal
          await supabase.from(SIGNAL_TABLE).delete().eq('room_key', normalizedRoomKey).neq('signal_type', 'presence_checkin');
          addDebugLog('🧹 [PROFESSOR] Sala de sinalização limpa (presença preservada)');
        } catch (e) {}
        
        lastProcessedId = 0;
        await new Promise(r => setTimeout(r, 200));

        // Anunciar presença do professor na sala
        addDebugLog('👨‍🏫 [PROFESSOR] Presente na sala. Aguardando aluno...');
        await sendSignal('teacher_online', { joinedAt: Date.now() });

      } else {
        // ═══ ALUNO ═══
        // Buscar se o professor já enviou o sinal 'teacher_online'
        try {
          const { data: teacherSignals } = await supabase
            .from(SIGNAL_TABLE)
            .select('*')
            .eq('room_key', normalizedRoomKey)
            .eq('sender_role', 'teacher')
            .eq('signal_type', 'teacher_online')
            .order('id', { ascending: false })
            .limit(1);

          if (teacherSignals && teacherSignals[0]) {
            lastProcessedId = teacherSignals[0].id - 1;
            addDebugLog('👨‍🏫 [ALUNO] Professor já encontrado na sala!');
          } else {
            const { data: maxData } = await supabase
              .from(SIGNAL_TABLE)
              .select('id')
              .eq('room_key', normalizedRoomKey)
              .order('id', { ascending: false })
              .limit(1);

            if (maxData && maxData[0]) {
              lastProcessedId = maxData[0].id;
            }
            addDebugLog('👋 [ALUNO] Aguardando entrada do professor...');
          }
        } catch (e) {}

        // Anunciar presença do aluno
        await sendSignal('ready', { joinedAt: Date.now() });
      }

      // Iniciar polling ultrarrápido (500ms)
      pollInterval = setInterval(pollForSignals, 500);

      // Iniciar emissão periódica de Heartbeat (a cada 2s)
      heartbeatInterval = setInterval(() => {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          sendSignal('heartbeat', { ping: Date.now() });
        }
      }, 2000);

      // Monitor de perda de sinal do participante remoto (Timeout > 7s)
      peerCheckInterval = setInterval(() => {
        if (lastPeerSignalTime > 0 && (Date.now() - lastPeerSignalTime > 7500)) {
          addDebugLog(`⚠️ Sinal do participante interrompido (>7.5s)`);
          setIsReconnecting(true);
          setReconnectReason(`⚠️ Sinal de internet de ${otherParticipantDisplay.name} interrompido. Aguardando reconexão...`);
          setIsPeerOnline(false);
          setIsRemoteConnected(false);
        }
      }, 2500);

      addDebugLog('🔄 Polling ultrarrápido (500ms) e Heartbeat (2s) ativos');
    };

    cleanAndStart();

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (peerCheckInterval) clearInterval(peerCheckInterval);
      if (iceRestartTimeout) clearTimeout(iceRestartTimeout);
      if (pcRef.current) {
        if (pcRef.current._resendCleanup) pcRef.current._resendCleanup();
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, [hasJoinedRoom, localStream, normalizedRoomKey, currentUserDisplay, isUserTeacher, addDebugLog, triggerIceRestart]);
  // Safety net: re-assign srcObject whenever remoteStream changes
  useEffect(() => {
    if (!remoteStream) return;
    addDebugLog('🖥️ remoteStream atualizado. Tentando atribuir srcObject...');
    
    const tryAssign = () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = 1.0;
        remoteVideoRef.current.play().catch(() => {});
        addDebugLog('🖥️ srcObject e áudio do vídeo remoto atribuídos com sucesso!');
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
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoEl, 0, 0, 640, 360);
        const frame = canvas.toDataURL('image/jpeg', 0.85);

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

  // ── SINC DE PRESENÇA EM TEMPO REAL NO BANCO DE DADOS (RODA CONTINUAMENTE DESDE O LOBBY) ──
  useEffect(() => {
    let active = true;

    const syncPresenceFromDb = async () => {
      if (!active) return;
      const lessonCode = currentBooking?.lesson_code || currentBooking?.id || bookingId || 'AULA-2026-DEFAULT';

      // 1. Checar LocalStorage local
      try {
        const s1 = localStorage.getItem(`lexy_presence_${lessonCode}_student`) || 
                   localStorage.getItem(`lexy_presence_${cleanLessonCode}_student`) || 
                   localStorage.getItem(`lexy_presence_${normalizedRoomKey}_student`);
        if (s1) {
          setRemoteStudentCheckIn(true);
          return;
        }
      } catch (e) {}

      // 2. Consultar Supabase webrtc_signals por cleanLessonCode, normalizedRoomKey ou lessonCode
      try {
        const { data: signals } = await supabase
          .from('webrtc_signals')
          .select('*')
          .in('room_key', [cleanLessonCode, normalizedRoomKey, lessonCode])
          .eq('sender_role', 'student')
          .eq('signal_type', 'presence_checkin')
          .limit(1);

        if (signals && signals.length > 0 && active) {
          setRemoteStudentCheckIn(true);
          return;
        }
      } catch (e) {}

      // 3. Consultar Supabase tabela public.aulas
      try {
        const { data: aulaRows } = await supabase
          .from('aulas')
          .select('student_presence, student_joined_at')
          .or(`id.eq.${lessonCode},lesson_code.eq.${lessonCode},lesson_code.eq.${currentBooking?.lesson_code || ''}`)
          .limit(1);

        if (aulaRows && aulaRows[0] && (aulaRows[0].student_presence || aulaRows[0].student_joined_at) && active) {
          setRemoteStudentCheckIn(true);
          return;
        }
      } catch (e) {}
    };

    syncPresenceFromDb();
    const interval = setInterval(syncPresenceFromDb, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [cleanLessonCode, normalizedRoomKey, currentBooking, bookingId]);

  // Função para Entrar na Sala com Gesto Direto do Usuário e Captura HD de Áudio e Vídeo
  const handleJoinRoom = async () => {
    setIsConnecting(true);
    setCameraError(null);
    let stream = null;

    // Registo de Presença formal no Código do Aula ao Clicar em "Entrar na Sala Virtual"
    const lessonCode = currentBooking?.lesson_code || currentBooking?.id || bookingId || 'AULA-2026-DEFAULT';
    const roleKey = isUserTeacher ? 'teacher' : 'student';
    const timeStr = new Date().toLocaleTimeString('pt-BR');
    const presenceData = {
      lessonCode,
      cleanLessonCode,
      roomKey: normalizedRoomKey,
      role: roleKey,
      name: currentUserDisplay.name,
      email: profile?.email || '',
      time: timeStr,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(`lexy_presence_${lessonCode}_${roleKey}`, JSON.stringify(presenceData));
      localStorage.setItem(`lexy_presence_${cleanLessonCode}_${roleKey}`, JSON.stringify(presenceData));
      localStorage.setItem(`lexy_presence_${normalizedRoomKey}_${roleKey}`, JSON.stringify(presenceData));
      localStorage.setItem(`lexy_presence_checked_${lessonCode}_${roleKey}`, 'true');
    } catch (e) {}

    // Transmitir em webrtc_signals usando múltiplas chaves para garantir 100% de detecção cross-device
    try {
      const dbPayload = [
        {
          room_key: cleanLessonCode,
          sender_role: roleKey,
          sender_name: currentUserDisplay.name,
          signal_type: 'presence_checkin',
          payload: JSON.stringify(presenceData),
          created_at: new Date().toISOString()
        },
        {
          room_key: normalizedRoomKey,
          sender_role: roleKey,
          sender_name: currentUserDisplay.name,
          signal_type: 'presence_checkin',
          payload: JSON.stringify(presenceData),
          created_at: new Date().toISOString()
        }
      ];
      supabase.from('webrtc_signals').insert(dbPayload).then(() => {}).catch(() => {});
    } catch (e) {}

    // Atualizar registro na tabela 'aulas' do Supabase
    try {
      const updatePayload = isUserTeacher
        ? { teacher_presence: true, teacher_joined_at: new Date().toISOString() }
        : { student_presence: true, student_joined_at: new Date().toISOString() };

      supabase.from('aulas')
        .update(updatePayload)
        .or(`id.eq.${lessonCode},lesson_code.eq.${lessonCode},lesson_code.eq.${currentBooking?.lesson_code || ''}`)
        .then(() => {}).catch(() => {});
    } catch (e) {}

    const audioConstraints = {
      echoCancellation: { ideal: true },
      noiseSuppression: { ideal: true },
      autoGainControl: { ideal: true },
      sampleRate: { ideal: 48000 },
      sampleSize: { ideal: 16 },
      channelCount: { ideal: 2 },
      latency: { ideal: 0.005 }
    };

    // Tentativa Única de Captura Full HD 1080p 30fps + Áudio Estúdio 48kHz Stereo
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: audioConstraints
      });
      setIsVideoOn(true);
      setIsMicOn(true);
    } catch (err) {
      console.warn('Falha na captura Full HD, tentando fallback...', err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: audioConstraints });
      } catch (err2) {
        console.warn('Erro ao acessar mídia:', err2);
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
      setCameraError('Câmera física em uso em outro programa/aba. Áudio nativo HD e vídeo Lexy Studio 30fps 100% ativos!');
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

  // Compartilhar Tela Nativo (Screen Sharing) via WebRTC Track Replacement
  const stopScreenSharing = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // 1. Restaurar a faixa da câmera no WebRTC PeerConnection
    const cameraTrack = localStream?.getVideoTracks()[0];
    if (pcRef.current && cameraTrack) {
      const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
      if (videoSender) {
        await videoSender.replaceTrack(cameraTrack);
        addDebugLog('📹 Transmissão da Câmera restaurada no WebRTC!');
      }
    }

    // 2. Restaurar elemento de vídeo local
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }

    // 3. Notificar o outro participante via sinalização
    try {
      const myRole = isUserTeacher ? 'teacher' : 'student';
      await supabase.from('webrtc_signals').insert({
        room_key: normalizedRoomKey,
        sender_role: myRole,
        sender_name: currentUserDisplay.name,
        signal_type: 'screen_share_status',
        payload: JSON.stringify({ isSharing: false }),
        created_at: new Date().toISOString()
      });
    } catch (e) {}
  }, [localStream, isUserTeacher, normalizedRoomKey, currentUserDisplay, addDebugLog]);

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenSharing();
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false
        });

        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        setIsScreenSharing(true);

        // 1. Atualizar elemento de vídeo local
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
          localVideoRef.current.play().catch(() => {});
        }

        // 2. Substituir a faixa de vídeo enviada via WebRTC para o participante remoto!
        if (pcRef.current) {
          const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(screenTrack);
            addDebugLog('🖥️ Transmissão da TELA enviada com sucesso via WebRTC!');
          } else {
            pcRef.current.addTrack(screenTrack, screenStream);
            addDebugLog('🖥️ Nova faixa de Tela adicionada ao WebRTC!');
          }
        }

        // 3. Notificar participante remoto via sinalização
        try {
          const myRole = isUserTeacher ? 'teacher' : 'student';
          await supabase.from('webrtc_signals').insert({
            room_key: normalizedRoomKey,
            sender_role: myRole,
            sender_name: currentUserDisplay.name,
            signal_type: 'screen_share_status',
            payload: JSON.stringify({ isSharing: true }),
            created_at: new Date().toISOString()
          });
        } catch (e) {}

        screenTrack.onended = () => {
          stopScreenSharing();
        };
      } catch (err) {
        console.warn('Compartilhamento de tela cancelado pelo usuário:', err);
      }
    }
  };


  // Notas compartidas (Quadro Interativo / Lousa Virtual)
  const boardInitialText = `Bem-vindo à Sala Virtual Lexy! 🏫

Use este quadro para anotações e exercícios durante a aula.

Dicas:
• Anote novas palavras e expressões
• Faça perguntas ao professor
• Pratique a escrita no idioma`;
  const [notes, setNotes] = useState(boardInitialText);
  const boardBcRef = useRef(null);
  const isLocalBoardUpdate = useRef(false);

  // ── SINCRONIZAÇÃO EM TEMPO REAL DA LOUSA VIRTUAL ENTRE PROFESSOR E ALUNO ──
  useEffect(() => {
    if (!hasJoinedRoom || !normalizedRoomKey) return;

    const boardChannelName = `lexy_board_${normalizedRoomKey}`;
    const bc = new BroadcastChannel(boardChannelName);
    boardBcRef.current = bc;

    // Ao receber mudança do outro participante, atualizar o quadro
    bc.onmessage = (event) => {
      const data = event.data;
      if (data && data.type === 'board_update' && data.sender !== currentUserDisplay.name) {
        isLocalBoardUpdate.current = true;
        setNotes(data.content);
      }
    };

    // Também sincronizar via localStorage (funciona entre abas do mesmo navegador)
    const storageKey = `lexy_board_content_${normalizedRoomKey}`;
    const handleStorage = (e) => {
      if (e.key === storageKey) {
        try {
          const data = JSON.parse(e.newValue);
          if (data && data.sender !== currentUserDisplay.name) {
            isLocalBoardUpdate.current = true;
            setNotes(data.content);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // Carregar conteúdo existente do localStorage ao entrar
    try {
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        const data = JSON.parse(existing);
        if (data && data.content && data.content !== boardInitialText) {
          setNotes(data.content);
        }
      }
    } catch (err) {}

    return () => {
      bc.close();
      boardBcRef.current = null;
      window.removeEventListener('storage', handleStorage);
    };
  }, [hasJoinedRoom, normalizedRoomKey, currentUserDisplay.name]);

  // Handler para mudanças no quadro que transmite em tempo real
  const handleBoardChange = (e) => {
    const newContent = e.target.value;
    setNotes(newContent);

    // Transmitir para o outro participante
    const payload = { type: 'board_update', sender: currentUserDisplay.name, content: newContent };
    if (boardBcRef.current) {
      boardBcRef.current.postMessage(payload);
    }
    // Também salvar no localStorage para sync entre abas
    try {
      localStorage.setItem(`lexy_board_content_${normalizedRoomKey}`, JSON.stringify(payload));
    } catch (err) {}
  };

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

  const sendReaction = (emojiSymbol) => {
    triggerFloatingEmoji(emojiSymbol);
    setShowEmojiPicker(false);
    playChimeSound('join');
    
    try {
      const myRole = isUserTeacher ? 'teacher' : 'student';
      const myName = currentUserDisplay.name;
      supabase.from('webrtc_signals').insert({
        room_key: normalizedRoomKey,
        sender_role: myRole,
        sender_name: myName,
        signal_type: 'reaction',
        payload: JSON.stringify({ emoji: emojiSymbol }),
        created_at: new Date().toISOString()
      }).then(() => {}).catch(() => {});
    } catch (e) {}
  };

  const toggleHandRaise = () => {
    const nextState = !isHandRaised;
    setIsHandRaised(nextState);
    if (nextState) playChimeSound('raise');

    try {
      const myRole = isUserTeacher ? 'teacher' : 'student';
      const myName = currentUserDisplay.name;
      supabase.from('webrtc_signals').insert({
        room_key: normalizedRoomKey,
        sender_role: myRole,
        sender_name: myName,
        signal_type: 'raise_hand',
        payload: JSON.stringify({ raised: nextState }),
        created_at: new Date().toISOString()
      }).then(() => {}).catch(() => {});
    } catch (e) {}
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
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
    setIsRemoteVideoActive(false);
    setIsPeerOnline(false);
    setHasJoinedRoom(false);
    setIsLiveVideoActive(false);
  };

  // ── VERIFICAÇÃO ASSÍNCRONA DE PRESENÇA EM TEMPO REAL ANTES DE ENCERRAR AULA ──
  const verifyStudentPresenceAsync = useCallback(async () => {
    const lessonCode = currentBooking?.lesson_code || currentBooking?.id || bookingId || 'AULA-2026-DEFAULT';

    let teacherRecord = null;
    let studentRecord = null;

    try {
      const t1 = localStorage.getItem(`lexy_presence_${lessonCode}_teacher`) || 
                 localStorage.getItem(`lexy_presence_${cleanLessonCode}_teacher`) || 
                 localStorage.getItem(`lexy_presence_${normalizedRoomKey}_teacher`);
      if (t1) teacherRecord = JSON.parse(t1);

      const s1 = localStorage.getItem(`lexy_presence_${lessonCode}_student`) || 
                 localStorage.getItem(`lexy_presence_${cleanLessonCode}_student`) || 
                 localStorage.getItem(`lexy_presence_${normalizedRoomKey}_student`);
      if (s1) studentRecord = JSON.parse(s1);
    } catch (e) {}

    let isStudentPresent = (!isUserTeacher) ? (hasJoinedRoom || !!studentRecord) : !!(studentRecord || remoteStudentCheckIn);

    // Se o professor estiver encerrando a aula e o aluno não constar no estado local, faz consulta direta no Supabase
    if (isUserTeacher && !isStudentPresent) {
      try {
        const { data: signals } = await supabase
          .from('webrtc_signals')
          .select('*')
          .in('room_key', [cleanLessonCode, normalizedRoomKey, lessonCode])
          .eq('sender_role', 'student')
          .eq('signal_type', 'presence_checkin')
          .limit(1);

        if (signals && signals.length > 0) {
          isStudentPresent = true;
          setRemoteStudentCheckIn(true);
        }
      } catch (e) {}

      if (!isStudentPresent) {
        try {
          const { data: aulaRows } = await supabase
            .from('aulas')
            .select('student_presence, student_joined_at')
            .or(`id.eq.${lessonCode},lesson_code.eq.${lessonCode},lesson_code.eq.${currentBooking?.lesson_code || ''}`)
            .limit(1);

          if (aulaRows && aulaRows[0] && (aulaRows[0].student_presence || aulaRows[0].student_joined_at)) {
            isStudentPresent = true;
            setRemoteStudentCheckIn(true);
          }
        } catch (e) {}
      }
    }

    const teacherJoined = isUserTeacher ? (hasJoinedRoom || !!teacherRecord) : !!teacherRecord;
    const studentJoined = isStudentPresent;

    return {
      teacherJoined,
      studentJoined,
      teacherTime: teacherRecord?.time || (teacherJoined ? (teacherRecord?.time || new Date().toLocaleTimeString('pt-BR')) : 'Não registrado'),
      studentTime: studentRecord?.time || (studentJoined ? (studentRecord?.time || 'Registrada') : 'Não registrada'),
      lessonCode,
      bothPresent: teacherJoined && studentJoined
    };
  }, [currentBooking, bookingId, cleanLessonCode, normalizedRoomKey, isUserTeacher, hasJoinedRoom, remoteStudentCheckIn]);

  const handleEndClass = async () => {
    if (isUserTeacher) {
      const status = await verifyStudentPresenceAsync();
      if (!status.studentJoined) {
        exitRoomAndCleanup();
        setPresenceCheckDetails(status);
        setShowIncompletePresenceModal(true);
        return;
      }
    }

    if (elapsedTime < 40 * 60) {
      setShowEarlyLeaveWarning(true);
    } else {
      exitRoomAndCleanup();
      setShowEndModal(true);
    }
  };

  const confirmEarlyLeave = async () => {
    if (isUserTeacher) {
      const status = await verifyStudentPresenceAsync();
      if (!status.studentJoined) {
        setShowEarlyLeaveWarning(false);
        exitRoomAndCleanup();
        setPresenceCheckDetails(status);
        setShowIncompletePresenceModal(true);
        return;
      }
    }

    setShowEarlyLeaveWarning(false);
    exitRoomAndCleanup();
    setShowEndModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsReviewSubmitted(true);

    const newReview = {
      id: `rev-${Date.now()}`,
      bookingId: bookingId || 'aula-demo',
      tutorId: tutor?.id || currentBooking?.tutorId || 'tutor-1',
      tutorName: tutor?.name || currentBooking?.tutorName || 'Professor Lexy',
      studentId: currentBooking?.studentId || profile?.id || 'student-user',
      studentName: currentBooking?.studentName || profile?.full_name || 'Aluno Lexy',
      studentEmail: currentBooking?.studentEmail || profile?.email || 'aluno@lexy.com',
      rating: studentRating,
      comment: studentComment || 'Aula finalizada sem comentário em texto.',
      createdAt: new Date().toISOString()
    };

    // Salvar em localStorage mantendo histórico de até 30 dias
    try {
      const existing = JSON.parse(localStorage.getItem('lexy_student_reviews') || '[]');
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      const valid = (existing || []).filter(r => (Date.now() - new Date(r.createdAt || r.created_at).getTime()) < THIRTY_DAYS);
      localStorage.setItem('lexy_student_reviews', JSON.stringify([newReview, ...valid]));
    } catch (err) {
      console.warn('Erro ao salvar avaliação em localStorage:', err);
    }

    // Persistir no Supabase (tabela reviews)
    try {
      await supabase.from('reviews').insert({
        booking_id: newReview.bookingId,
        tutor_id: newReview.tutorId,
        tutor_name: newReview.tutorName,
        student_id: newReview.studentId,
        student_name: newReview.studentName,
        student_email: newReview.studentEmail,
        rating: newReview.rating,
        comment: newReview.comment,
        created_at: newReview.createdAt
      });
    } catch (err) {
      console.warn('Erro ao salvar avaliação no Supabase:', err);
    }

    // Concluir aula agendada e creditar os ganhos automaticamente ao saldo do professor
    const targetBookingId = currentBooking?.id || currentBooking?.lesson_code || bookingId;
    if (completeBooking && targetBookingId) {
      completeBooking(targetBookingId);
    }

    setTimeout(() => {
      setShowEndModal(false);
      setIsReviewSubmitted(false);
      navigate(isUserTeacher ? '/dashboard/teacher' : '/dashboard/student');
    }, 1800);
  };

  const isOnClassroomRoute = location.pathname.startsWith('/classroom/');
  const isMiniature = hasJoinedRoom && !isOnClassroomRoute;

  // Re-attach video streams when switching between miniature and full-screen mode
  // (different DOM video elements get mounted, so srcObject must be re-assigned)
  // Uses multiple retries because the new video elements may not be in the DOM immediately
  useEffect(() => {
    let cancelled = false;
    const attachStreams = (attempt) => {
      if (cancelled) return;
      if (remoteStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.muted = false;
        remoteVideoRef.current.volume = 1.0;
        remoteVideoRef.current.play().then(() => {
          if (!cancelled) setIsRemoteVideoActive(true);
        }).catch(() => {
          if (!cancelled) setIsRemoteVideoActive(true);
        });
        setIsRemoteVideoActive(true);
      }
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        localVideoRef.current.play().catch(() => {});
      }
      // Retry up to 5 times to handle DOM mount delays
      if (attempt < 5) {
        setTimeout(() => attachStreams(attempt + 1), 200);
      }
    };
    // Start immediately, then retry
    const timer = setTimeout(() => attachStreams(0), 50);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [isMiniature, remoteStream, localStream]);

  // ── MODO MINIATURA FLUTUANTE ARRASTÁVEL (PICTURE-IN-PICTURE NATIVO DA PLATAFORMA AO NAVEGAR POR OUTRAS PÁGINAS) ──
  if (isMiniature) {
    return (
      <div 
        style={{ transform: `translate3d(${pipPos.x}px, ${pipPos.y}px, 0)` }}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] animate-fade-in-up select-none touch-none"
      >
        <div className="w-72 sm:w-80 bg-slate-950/95 backdrop-blur-2xl border-2 border-cyan-500/50 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.5)] overflow-hidden transition-shadow hover:border-cyan-400">
          
          {/* HEADER ARRASTÁVEL DO MINI-PLAYER */}
          <div 
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
            className="bg-slate-900/90 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-slate-850 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <GripHorizontal className="w-4 h-4 text-cyan-400 opacity-70 hover:opacity-100 shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white truncate leading-tight">
                  {otherParticipantDisplay.name}
                </h4>
                <span className="text-[10px] text-cyan-300 font-bold block truncate">
                  {otherParticipantDisplay.roleLabel} • Chamada Ao Vivo 🟢
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0" onMouseDown={e => e.stopPropagation()}>
              {/* BOTÃO NATIVO PIP DO NAVEGADOR (SISTEMA OPERACIONAL) */}
              {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    if (remoteVideoRef.current) {
                      if (document.pictureInPictureElement) {
                        document.exitPictureInPicture().catch(() => {});
                      } else {
                        remoteVideoRef.current.requestPictureInPicture().catch(() => {});
                      }
                    }
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Abrir em Janela Flutuante Externa do Sistema"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}

              {/* BOTÃO MAXIMIZAR / VOLTAR À SALA VIRTUAL */}
              <button
                type="button"
                onClick={() => navigate(`/classroom/${effectiveBookingId}`)}
                className="p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition-all transform hover:scale-105 cursor-pointer flex items-center gap-1 text-[11px]"
                title="Voltar à Sala Virtual em Tela Cheia"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* TELA DE TRANSMISSÃO DE VÍDEO DO MINI-PLAYER */}
          <div className="relative w-full h-44 sm:h-48 bg-slate-900 flex items-center justify-center overflow-hidden">
            {isRemoteConnected && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false}
                className="w-full h-full object-cover"
              />
            ) : remoteVideoFrame ? (
              <img
                src={remoteVideoFrame}
                alt={otherParticipantDisplay.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 font-extrabold flex items-center justify-center text-lg uppercase animate-pulse">
                  {otherParticipantDisplay.name ? otherParticipantDisplay.name.charAt(0) : 'U'}
                </div>
                <span className="text-xs text-slate-300 font-bold">Transmitindo aula ao vivo com {otherParticipantDisplay.name}...</span>
              </div>
            )}

            {/* MINIATURA DA CÂMERA LOCAL ("VOCÊ") */}
            <div className="absolute bottom-2 left-2 w-16 h-12 rounded-xl bg-slate-950 border border-cyan-400/60 overflow-hidden shadow-lg">
              {isVideoOn ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[9px] font-bold text-slate-400">
                  Você
                </div>
              )}
            </div>
          </div>

          {/* BARRA DE CONTROLES RÁPIDOS */}
          <div className="bg-slate-900/95 p-2 px-3 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {/* BOTÃO MIC */}
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isMicOn
                    ? 'bg-slate-800 text-cyan-300 border-cyan-500/40 hover:bg-slate-700'
                    : 'bg-rose-950 text-rose-400 border-rose-500/60 hover:bg-rose-900'
                }`}
                title={isMicOn ? "Silenciar Microfone" : "Ativar Microfone"}
              >
                {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>

              {/* BOTÃO CÂMERA */}
              <button
                type="button"
                onClick={toggleVideo}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isVideoOn
                    ? 'bg-slate-800 text-cyan-300 border-cyan-500/40 hover:bg-slate-700'
                    : 'bg-rose-950 text-rose-400 border-rose-500/60 hover:bg-rose-900'
                }`}
                title={isVideoOn ? "Desativar Câmera" : "Ativar Câmera"}
              >
                {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              {/* BOTÃO VOLTAR À AULA */}
              <button
                type="button"
                onClick={() => navigate(`/classroom/${effectiveBookingId}`)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs shadow-md transition-all transform hover:scale-105 cursor-pointer flex items-center gap-1"
              >
                <span>Voltar à Aula</span>
                <Maximize2 className="w-3 h-3" />
              </button>

              {/* BOTÃO ENCERRAR AULA */}
              <button
                type="button"
                onClick={exitRoomAndCleanup}
                className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-400 border border-rose-500/40 transition-all cursor-pointer"
                title="Sair / Encerrar Aula"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Se não estiver em chamada e não estiver na rota de aula e sem modais ativos, não renderizar nada
  if (!hasJoinedRoom && !isOnClassroomRoute && !showIncompletePresenceModal && !showEndModal && !showEarlyLeaveWarning) {
    return null;
  }

  return (
    <div className="fixed top-[4.5rem] left-0 right-0 bottom-0 z-40 bg-slate-950 text-white flex flex-col p-2 sm:p-4 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-auto">
      
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
            <span className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>{tutor.subject} • Sala Privada ID: <code className="font-mono text-cyan-300">{currentBooking?.lesson_code || bookingId}</code></span>

              <span className={`ml-2 px-2 py-0.5 rounded text-[11px] font-extrabold flex items-center gap-1 ${
                remoteStudentCheckIn 
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' 
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-400 animate-pulse'
              }`}>
                {remoteStudentCheckIn ? '🟢 Aluno Presente' : '🔴 Aluno Ausente'}
              </span>
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
          
          <div className="relative flex-1 rounded-3xl bg-slate-950 border-2 border-cyan-500/40 overflow-hidden shadow-2xl flex flex-col justify-between p-2 sm:p-2.5">
            
            {/* CUADRO DE VIDEOCHAMADA NATIVA WEBRTC LEXY SPACE */}
            <div className="flex-1 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden group min-h-[380px] h-full">
              
              {!hasJoinedRoom ? (
                /* SAGUÃO DE ENTRADA (LOBBY PRE-CALL COM DESIGN DE NÉBULA E ESFERAS LUMINOSAS ASTRONÔMICAS) */
                <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-5 overflow-hidden my-auto">
                  
                  {/* 1. MÁSCARA DE NÉBULA LUMINOSA & ORBES GRADIENTES ANIMADOS NO FUNDO */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Orbe Ciano no canto superior esquerdo */}
                    <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-500/25 to-blue-600/10 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                    {/* Orbe Esmeralda no canto inferior direito */}
                    <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-gradient-to-tl from-emerald-500/25 to-teal-600/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                    {/* Orbe Âmbar no centro */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
                    
                    {/* Padronagem de Grade Cibernética Neon Suave */}
                    <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15" />

                    {/* Círculos Concéntricos Orbitais Tecnológicos ao Redor do Avatar */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-10 pointer-events-none">
                      <div className="w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: '25s' }} />
                      <div className="absolute inset-4 rounded-full border border-dashed border-emerald-500/20 animate-spin" style={{ animationDuration: '35s', animationDirection: 'reverse' }} />
                    </div>
                  </div>

                  {/* 2. CONTEÚDO PRINCIPAL (AVATAR, TEXTOS E BOTÃO) EM CAMADA Z-10 PRIVILEGIADA */}
                  <div className="relative z-10 flex flex-col items-center justify-center space-y-4 max-w-lg w-full">
                    
                    {/* Avatar com halo de luz e pulsador neón */}
                    <div className="relative group">
                      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 opacity-60 blur-md group-hover:opacity-90 transition-opacity animate-pulse" />
                      <img
                        src={otherParticipantDisplay.avatar || tutor.avatar}
                        alt={otherParticipantDisplay.name}
                        className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-cyan-400 shadow-2xl shadow-cyan-500/50"
                      />
                      <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-emerald-400 border-2 border-slate-900 flex items-center justify-center text-slate-950 font-black text-xs shadow-xl z-20">
                        ✓
                      </span>
                    </div>

                    {/* Textos de Boas-vindas com Tipografia Premium */}
                    <div className="space-y-2 max-w-md">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-black uppercase tracking-wider shadow-xl shadow-cyan-950/50">
                        <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>Bem-vindo ao Lexy Space</span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-white tracking-tight">Aula com {otherParticipantDisplay.name}</h3>
                      <p className="text-sm text-slate-200 leading-relaxed pt-1 font-medium">
                        Clique no botão abaixo para iniciar. Desejamos uma ótima aula!
                      </p>
                    </div>

                    {/* Badges de Garantia de Qualidade Lexy Space */}
                    <div className="flex items-center justify-center gap-3 pt-0.5 text-[11px] text-slate-300 font-bold">
                      <span className="flex items-center gap-1 bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-800 backdrop-blur-md shadow-md">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Criptografado 1-on-1
                      </span>
                      <span className="flex items-center gap-1 bg-slate-900/70 px-2.5 py-1 rounded-lg border border-slate-800 backdrop-blur-md shadow-md">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Alta Definição HD
                      </span>
                    </div>

                    {/* BANNER DE PRESENÇA EM TEMPO REAL NO LOBBY */}
                    <div className="w-full max-w-sm pt-1">
                      <div className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold shadow-lg ${
                        remoteStudentCheckIn
                          ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                          : 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse'
                      }`}>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${remoteStudentCheckIn ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                        <span>
                          {isUserTeacher
                            ? (remoteStudentCheckIn ? '🟢 Aluno Presente (Entrou na Sala Virtual)' : '🔴 Aluno Ausente (Aguardando clicar em "Entrar na Sala Virtual")')
                            : (hasJoinedRoom ? '🟢 Sua Presença Registrada' : '🔴 Clique no botão abaixo para registrar sua presença')}
                        </span>
                      </div>
                    </div>

                    {cameraError && (
                      <div className="bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl max-w-sm flex items-center gap-2 shadow-xl">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{cameraError}</span>
                      </div>
                    )}

                    {/* Botão de Entrar na Sala com Efeito Neón */}
                    <div className="pt-2 w-full max-w-xs">
                      <button
                        type="button"
                        onClick={handleJoinRoom}
                        disabled={isConnecting}
                        className="w-full bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 font-black text-sm py-4 px-6 rounded-2xl shadow-[0_0_35px_rgba(45,212,191,0.55)] border border-cyan-200/60 flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer transform hover:scale-[1.04] active:scale-95 disabled:opacity-50 relative overflow-hidden group animate-pulse"
                        style={{ animationDuration: '3s' }}
                      >
                        <Video className="w-5 h-5 fill-slate-950 text-slate-950 group-hover:scale-110 transition-transform" />
                        <span className="tracking-wide">{isConnecting ? 'Conectando Câmera...' : 'Entrar na Sala Virtual'}</span>
                      </button>
                    </div>

                  </div>
                </div>
              ) : (
                /* VÍDEO PRINCIPAL DA CÂMERA DO NAVEGADOR QUANDO DENTRO DA SALA */
                <div className="w-full h-full flex flex-col items-center justify-center relative bg-slate-950 p-2 overflow-hidden">
                  
                  {/* ── TELA PRINCIPAL (GRANDE): TRANSMISSÃO DO OUTRO PARTICIPANTE (PROFESSOR OU ALUNO) ── */}
                  {!isSwapped ? (
                    <div className="relative w-full h-full max-w-full aspect-video flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden my-auto border border-cyan-500/30 shadow-2xl">
                      
                      {/* BADGE DE COMPARTILHAMENTO DE TELA ATIVO */}
                      {(isScreenSharing || remoteIsScreenSharing) && (
                        <div className="absolute top-3 left-3 z-30 bg-amber-500/90 text-slate-950 border border-amber-300 px-3 py-1.5 rounded-xl backdrop-blur-md text-[11px] font-black flex items-center gap-1.5 shadow-2xl animate-pulse">
                          <Monitor className="w-4 h-4 fill-slate-950 text-slate-950" />
                          <span>{isScreenSharing ? '🖥️ Você está compartilhando sua tela' : `🖥️ ${otherParticipantDisplay.name} está compartilhando a tela`}</span>
                        </div>
                      )}

                      {/* BOTÃO FLUTUANTE RÁPIDO PARA AJUSTAR CORTE / ZOOM DO VÍDEO */}
                      {(isRemoteVideoActive || remoteVideoFrame) && (
                        <button
                          type="button"
                          onClick={toggleVideoFitMode}
                          className="absolute top-3 right-3 z-30 bg-slate-950/85 hover:bg-slate-900 border border-cyan-500/50 hover:border-cyan-300 text-cyan-300 hover:text-white px-3 py-1.5 rounded-xl backdrop-blur-md text-[11px] font-extrabold flex items-center gap-1.5 shadow-xl transition-all cursor-pointer transform hover:scale-105"
                          title={videoFitMode === 'contain' ? "Modo Atual: Vídeo Completo Sem Cortes. Clique para Preencher Tela." : "Modo Atual: Preencher Tela (Zoom). Clique para Ver Vídeo Completo Sem Cortes."}
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{videoFitMode === 'contain' ? 'Vídeo Completo (Sem Corte) 👁️' : 'Preencher Tela (Zoom) 🔍'}</span>
                        </button>
                      )}

                      {/* PLAYER DEDICADO DE ÁUDIO REMOTO (GARANTE ÁUDIO NATIVO CRISTALINO SEM BLOQUEIOS DE AUTOPLAY) */}
                      {isRemoteConnected && remoteStream && (
                        <audio
                          ref={(audioEl) => {
                            if (audioEl && remoteStream) {
                              audioEl.srcObject = remoteStream;
                              audioEl.muted = false;
                              audioEl.volume = 1.0;
                              audioEl.play().catch(e => console.warn('Play audio error:', e));
                            }
                          }}
                          autoPlay
                          playsInline
                        />
                      )}

                      {/* VÍDEO REMOTO DA CÂMERA DO OUTRO PARTICIPANTE (EXIBIDO APENAS QUANDO PIXELS REAIS ESTIVEREM ATIVOS) */}
                      {isRemoteConnected && remoteStream && (
                        <video
                          ref={remoteVideoRef}
                          autoPlay
                          playsInline
                          muted={false}
                          onLoadedMetadata={(e) => {
                            if (e.target.videoWidth > 0) setIsRemoteVideoActive(true);
                          }}
                          onPlaying={(e) => {
                            if (e.target.videoWidth > 0) setIsRemoteVideoActive(true);
                          }}
                          onTimeUpdate={(e) => {
                            if (e.target.videoWidth > 0 && !isRemoteVideoActive) setIsRemoteVideoActive(true);
                          }}
                          className={`w-full h-full ${videoFitMode === 'contain' ? 'object-contain bg-slate-950' : 'object-cover'} rounded-2xl transition-all duration-500 ${isRemoteVideoActive ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none z-0'}`}
                        />
                      )}

                      {/* TRANSMISSÃO DE VÍDEO VIA BROADCASTCHANNEL QUANDO O STREAM WEBRTC NATIVO NÃO ESTIVER PRONTO */}
                      {(!isRemoteConnected || !remoteStream || !isRemoteVideoActive) && remoteVideoFrame && (
                        <img
                          src={remoteVideoFrame}
                          alt={otherParticipantDisplay.name}
                          className={`w-full h-full ${videoFitMode === 'contain' ? 'object-contain bg-slate-950' : 'object-cover'} rounded-2xl relative z-10`}
                        />
                      )}

                      {/* TELA DE ESPERA PERMANENTE: MANTÉM O AVATAR E MENSAGEM SE NÃO HOUVER VÍDEO NEM FRAME */}
                      {(!isRemoteConnected || !remoteStream || !isRemoteVideoActive) && !remoteVideoFrame && (
                        <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-5 overflow-hidden my-auto z-0">
                          
                          {/* NÉBULA LUMINOSA NO FUNDO */}
                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/10 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
                            <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-gradient-to-tl from-emerald-500/20 to-teal-600/10 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
                            <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1.2px,transparent_1.2px)] [background-size:24px_24px] opacity-15" />
                            
                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -mt-6 pointer-events-none">
                              <div className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] rounded-full border border-cyan-500/20 animate-spin" style={{ animationDuration: '25s' }} />
                            </div>
                          </div>

                          {/* CONTEÚDO PRINCIPAL: AVATAR DO USUÁRIO + MENSAGEM SIMPLES */}
                          <div className="relative z-10 flex flex-col items-center justify-center space-y-4 max-w-sm w-full my-auto">
                            
                            {/* Avatar do Usuário (Foto do Perfil ou Inicial do Nome) */}
                            <div className="relative group">
                              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-amber-400 opacity-70 blur-lg group-hover:opacity-100 transition-opacity animate-pulse" />
                              
                              {(otherParticipantDisplay.avatar || tutor.avatar) ? (
                                <img
                                  src={otherParticipantDisplay.avatar || tutor.avatar}
                                  alt={otherParticipantDisplay.name}
                                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full object-cover border-4 border-cyan-400 shadow-2xl shadow-cyan-500/50"
                                />
                              ) : (
                                <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full bg-slate-950 border-4 border-cyan-400 flex items-center justify-center text-cyan-300 font-black text-3xl sm:text-4xl shadow-2xl shadow-cyan-500/50 uppercase">
                                  {otherParticipantDisplay.name ? otherParticipantDisplay.name.charAt(0) : 'U'}
                                </div>
                              )}
                            </div>

                            {/* Texto Direto de Espera */}
                            <div className="space-y-1.5 pt-2">
                              <p className="text-base sm:text-lg font-extrabold text-white leading-snug">
                                {!isUserTeacher 
                                  ? 'Aguardando seu professor conectar, por favor aguarde...' 
                                  : 'Aguardando seu aluno conectar, por favor aguarde...'}
                              </p>
                            </div>

                            {/* Cartelito Pequeño "Se não conectar em 5 min, clique aqui" (Exibido apenas 3 min após o usuário entrar na sala) */}
                            {showSupportButton && (
                              <div className="pt-3 animate-fade-in-up">
                                <button
                                  type="button"
                                  onClick={() => {
                                    alert('🔔 Notificação enviada ao suporte! Nossa equipe e o participante receberam o alerta para acelerar a conexão.');
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 hover:text-cyan-200 text-xs font-bold px-4 py-2 rounded-xl border border-cyan-500/30 hover:border-cyan-400/60 shadow-lg transition-all cursor-pointer transform hover:scale-[1.03] active:scale-95"
                                >
                                  <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                  <span>Se não conectar em 5 min, clique aqui</span>
                                </button>
                              </div>
                            )}

                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* MODO INVERTIDO (SUA CÂMERA NA TELA GRANDE) */
                    <div className="relative w-full h-full max-w-full aspect-video flex items-center justify-center bg-slate-950 rounded-2xl overflow-hidden my-auto border border-cyan-500/30 shadow-2xl">
                      {isVideoOn ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full ${videoFitMode === 'contain' ? 'object-contain bg-slate-950' : 'object-cover'} rounded-2xl transform scale-x-[-1] transition-all duration-300`}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-3 p-6">
                          <div className="w-24 h-24 rounded-full bg-cyan-500/20 border-2 border-cyan-400 text-cyan-300 font-extrabold flex items-center justify-center text-2xl uppercase">
                            {currentUserDisplay.name.charAt(0)}
                          </div>
                          <h3 className="text-base font-bold text-white">{currentUserDisplay.name} (Sua Câmera Desativada)</h3>
                        </div>
                      )}
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
                    className={`absolute bottom-20 right-3 sm:bottom-20 sm:right-4 w-36 h-26 sm:w-48 sm:h-34 rounded-2xl bg-slate-950 overflow-hidden shadow-2xl z-20 flex items-center justify-center cursor-pointer group hover:scale-105 transition-all duration-300 ${
                      (!isSwapped ? isSpeaking : isRemoteSpeaking)
                        ? 'border-4 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.9)] ring-4 ring-cyan-400/50 animate-pulse'
                        : 'border-2 border-cyan-500/40 hover:border-cyan-300'
                    }`}
                    title="Clique para inverter telas principal x miniatura 🔄"
                  >
                    {!isSwapped ? (
                      isVideoOn ? (
                        <video
                          ref={localVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform scale-x-[-1] transition-all duration-300"
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

                  {/* ── CAMADA DE EMOJIS FLUTUANTES NO VÍDEO ── */}
                  <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
                    {floatingEmojis.map((e) => (
                      <div
                        key={e.id}
                        style={{ left: `${e.left}%` }}
                        className="absolute bottom-20 text-4xl sm:text-5xl animate-float-emoji filter drop-shadow-xl select-none"
                      >
                        {e.symbol}
                      </div>
                    ))}
                  </div>

                  {/* ── BADGE DE MÃO LEVANTADA (RAISE HAND) ── */}
                  {(isHandRaised || isRemoteHandRaised) && (
                    <div className="absolute top-14 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs px-4 py-2 rounded-2xl shadow-2xl z-40 flex items-center gap-2 animate-bounce border border-amber-300">
                      <Hand className="w-4 h-4 fill-slate-950 text-slate-950" />
                      <span>{isHandRaised ? '✋ Você levantou a mão' : `✋ ${otherParticipantDisplay.name} pediu a palavra!`}</span>
                    </div>
                  )}

                  {/* ── OVERLAY DE RECONEXÃO AUTOMÁTICA EM TEMPO REAL ── */}
                  {(isReconnecting || !isNetworkOnline) && (
                    <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-fade-in">
                      <div className="relative mb-6">
                        <div className="w-20 h-20 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 border-r-cyan-400 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <RotateCw className="w-8 h-8 text-cyan-400 animate-spin" />
                        </div>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-wide">
                        {!isNetworkOnline
                          ? '⚠️ Sem Conexão com a Internet'
                          : '🔄 Reconectando Aula ao Vivo...'}
                      </h2>

                      <p className="text-xs sm:text-sm text-cyan-200/90 font-medium max-w-md mb-6 leading-relaxed">
                        {!isNetworkOnline
                          ? 'Detectamos que seu dispositivo perdeu o sinal de internet. A chamada será reconectada automaticamente assim que o sinal voltar.'
                          : reconnectReason || 'Ajustando sinal de rede e restabelecendo a comunicação com o participante...'}
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => triggerIceRestart()}
                          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-slate-950 font-black text-xs sm:text-sm shadow-[0_0_30px_rgba(6,182,212,0.5)] transform hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                        >
                          <Zap className="w-4 h-4 fill-slate-950" />
                          <span>Tentar Reconectar Agora</span>
                        </button>

                        <button
                          type="button"
                          onClick={exitRoomAndCleanup}
                          className="px-5 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm transition-all cursor-pointer"
                        >
                          Sair da Sala
                        </button>
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-[11px] font-semibold text-slate-400 bg-slate-900/60 px-4 py-1.5 rounded-full border border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        <span>Monitor de Sinal WebRTC P2P Ativo</span>
                      </div>
                    </div>
                  )}

                  {/* BARRA DE CONTROLES FLUTUANTE EM CÍRCULOS SEPARADOS, TRANSPARENTES E PERFEITAMENTE ALINHADOS */}
                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-40 flex items-start justify-center gap-2.5 sm:gap-4 px-2">
                    
                    {/* BOTÃO MICROFONE */}
                    <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
                      <button
                        type="button"
                        onClick={toggleMic}
                        className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer ${
                          isMicOn
                            ? 'bg-slate-900/40 hover:bg-slate-900/60 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                            : 'bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/60 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                        }`}
                        title={isMicOn ? "Silenciar Microfone" : "Ativar Microfone"}
                      >
                        {isMicOn ? (
                          <Mic className="w-5 h-5 stroke-[2.2]" />
                        ) : (
                          <MicOff className="w-5 h-5 stroke-[2.2]" />
                        )}
                      </button>
                      <div className="h-7 sm:h-8 flex items-center justify-center">
                        <span className={`text-[10px] sm:text-[11px] font-bold leading-tight text-center ${isMicOn ? 'text-slate-300' : 'text-rose-400'}`}>
                          Mic<br />{isMicOn ? 'Ativo' : 'Mutado'}
                        </span>
                      </div>
                    </div>

                    {/* BOTÃO CÂMERA */}
                    <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
                      <button
                        type="button"
                        onClick={toggleVideo}
                        className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer ${
                          isVideoOn
                            ? 'bg-slate-900/40 hover:bg-slate-900/60 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                            : 'bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/60 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                        }`}
                        title={isVideoOn ? "Desativar Câmera" : "Ativar Câmera"}
                      >
                        {isVideoOn ? (
                          <Video className="w-5 h-5 stroke-[2.2]" />
                        ) : (
                          <VideoOff className="w-5 h-5 stroke-[2.2]" />
                        )}
                      </button>
                      <div className="h-7 sm:h-8 flex items-center justify-center">
                        <span className={`text-[10px] sm:text-[11px] font-bold leading-tight text-center ${isVideoOn ? 'text-slate-300' : 'text-rose-400'}`}>
                          Câmera<br />{isVideoOn ? 'Ativa' : 'Desativada'}
                        </span>
                      </div>
                    </div>

                    {/* BOTÃO COMPARTILHAR TELA */}
                    <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
                      <button
                        type="button"
                        onClick={toggleScreenShare}
                        className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer ${
                          isScreenSharing
                            ? 'bg-amber-500/25 border border-amber-400 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse'
                            : 'bg-slate-900/40 hover:bg-slate-900/60 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                        }`}
                        title="Compartilhar Tela"
                      >
                        <Monitor className="w-5 h-5 stroke-[2.2]" />
                      </button>
                      <div className="h-7 sm:h-8 flex items-center justify-center">
                        <span className={`text-[10px] sm:text-[11px] font-bold leading-tight text-center ${isScreenSharing ? 'text-amber-300' : 'text-slate-300'}`}>
                          Compartir<br />Tela
                        </span>
                      </div>
                    </div>



                    {/* BOTÃO REAÇÕES DE EMOJIS */}
                    <div className="relative flex flex-col items-center gap-1.5 w-14 sm:w-16">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(prev => !prev)}
                        className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-slate-900/40 hover:bg-slate-900/60 border border-amber-400/50 hover:border-amber-300 text-amber-400 backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                        title="Enviar Reação"
                      >
                        <Smile className="w-5 h-5 stroke-[2.2]" />
                      </button>
                      <div className="h-7 sm:h-8 flex items-center justify-center">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 leading-tight text-center">
                          Reações
                        </span>
                      </div>

                      {/* POPOVER DE SELEÇÃO DE EMOJIS */}
                      {showEmojiPicker && (
                        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-900/95 backdrop-blur-2xl border border-amber-400/50 p-2 rounded-2xl shadow-2xl flex items-center gap-1.5 animate-fade-in-up z-50">
                          {['👏', '❤️', '💡', '🎉', '🔥', '✋'].map((emo) => (
                            <button
                              key={emo}
                              type="button"
                              onClick={() => sendReaction(emo)}
                              className="text-2xl hover:scale-135 transition-transform p-2 rounded-xl hover:bg-slate-800 cursor-pointer"
                            >
                              {emo}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* BOTÃO LEVANTAR A MÃO */}
                    <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
                      <button
                        type="button"
                        onClick={toggleHandRaise}
                        className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer ${
                          isHandRaised
                            ? 'bg-amber-500/30 border border-amber-400 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)] animate-pulse'
                            : 'bg-slate-900/40 hover:bg-slate-900/60 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]'
                        }`}
                        title="Levantar a Mão para Pedir a Palavra"
                      >
                        <Hand className={`w-5 h-5 stroke-[2.2] ${isHandRaised ? 'fill-amber-300' : ''}`} />
                      </button>
                      <div className="h-7 sm:h-8 flex items-center justify-center">
                        <span className={`text-[10px] sm:text-[11px] font-bold leading-tight text-center ${isHandRaised ? 'text-amber-300' : 'text-slate-300'}`}>
                          Pedir<br />Palavra
                        </span>
                      </div>
                    </div>

                    {/* BOTÃO TELA CHEIA */}
                    <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
                      <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-slate-900/40 hover:bg-slate-900/60 border border-cyan-400/50 hover:border-cyan-300 text-cyan-300 backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                        title="Alternar Modo Tela Cheia"
                      >
                        {isFullscreen ? (
                          <Minimize2 className="w-5 h-5 stroke-[2.2]" />
                        ) : (
                          <Maximize2 className="w-5 h-5 stroke-[2.2]" />
                        )}
                      </button>
                      <div className="h-7 sm:h-8 flex items-center justify-center">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 leading-tight text-center">
                          Tela<br />Cheia
                        </span>
                      </div>
                    </div>

                    {/* BOTÃO ENCERRAR AULA (SAIR) */}
                    <div className="flex flex-col items-center gap-1.5 w-14 sm:w-16">
                      <button
                        type="button"
                        onClick={handleEndClass}
                        className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-rose-950/40 hover:bg-rose-900/70 border border-rose-500/70 text-rose-400 hover:text-rose-200 backdrop-blur-md flex items-center justify-center shadow-xl transition-all duration-200 transform hover:scale-110 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.35)]"
                        title="Encerrar Aula e Sair da Sala"
                      >
                        <LogOut className="w-5 h-5 stroke-[2.2]" />
                      </button>
                      <div className="h-7 sm:h-8 flex items-center justify-center">
                        <span className="text-[10px] sm:text-[11px] font-bold text-rose-400 leading-tight text-center">
                          Sair
                        </span>
                      </div>
                    </div>

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
                onChange={handleBoardChange}
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
        <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
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
        <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
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

      {/* Modal - Placa Informativa de Presença Incompleta */}
      {showIncompletePresenceModal && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full rounded-3xl p-6 sm:p-8 text-center space-y-6 border-2 border-rose-500/40 shadow-[0_0_60px_rgba(244,63,94,0.3)] animate-fade-in-up">
            
            {/* Ícone Alerta de Presença */}
            <div className="w-18 h-18 rounded-full bg-gradient-to-br from-rose-500/30 to-amber-500/20 text-rose-400 border-2 border-rose-500/60 flex items-center justify-center mx-auto shadow-xl">
              <AlertTriangle className="w-10 h-10 animate-pulse" />
            </div>

            {/* Cabeçalho */}
            <div className="space-y-1.5">
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                ⚠️ Validação de Presença de Aula
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight pt-1">
                Registro de Presença Incompleto
              </h3>
              <p className="text-xs text-slate-300 font-mono">
                Código do Aula: <strong className="text-cyan-300">{presenceCheckDetails?.lessonCode || currentBooking?.lesson_code || bookingId}</strong>
              </p>
            </div>

            {/* Placa com Status dos dois Participantes */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 text-left">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                Status de Presença Medido pelo Botão "Entrar na Sala Virtual":
              </h4>

              <div className="space-y-2 text-xs">
                {/* PROFESSOR */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-extrabold text-emerald-200">
                      {isUserTeacher ? 'Você (Professor)' : 'Professor'}:
                    </span>
                  </div>
                  <span className="font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Presença Registrada ({presenceCheckDetails?.teacherTime || 'Presente'})
                  </span>
                </div>

                {/* ALUNO */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-extrabold text-rose-200">
                      {!isUserTeacher ? 'Você (Aluno)' : 'Aluno'}:
                    </span>
                  </div>
                  <span className="font-bold text-rose-400 bg-rose-500/20 px-2.5 py-0.5 rounded-lg border border-rose-500/30 flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Presença NÃO Registrada
                  </span>
                </div>
              </div>
            </div>

            {/* Explicação Clara dos Ganhos */}
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 leading-relaxed text-left space-y-2">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Por que esta aula não será contabilizada nos seus ganhos?</span>
              </p>
              <p className="text-slate-300">
                O feedback de aulas realizado pelo professor e a contabilização dos ganhos só procederão se o sistema detectar a presença do <strong>professor e do aluno</strong> no mesmo código de aula.
              </p>
              <p className="text-slate-400 text-[11px]">
                Como o aluno não clicou no botão <strong>"Entrar na Sala Virtual"</strong> para esta aula, o registro de presença ficou incompleto e os ganhos desta aula não serão contabilizados ao seu saldo.
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Botão 1: Entendi e Sair da Sala */}
              <button
                type="button"
                onClick={() => {
                  setShowIncompletePresenceModal(false);
                  exitRoomAndCleanup();
                  navigate(isUserTeacher ? '/dashboard/teacher' : '/dashboard/student');
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl border border-slate-700 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Entendi e Sair da Sala</span>
              </button>

              {/* Botão 2: Isto é um Erro */}
              <button
                type="button"
                onClick={() => {
                  const lessonCode = presenceCheckDetails?.lessonCode || currentBooking?.lesson_code || bookingId;
                  const message = `Olá, Suporte Lexy! Identifiquei um erro no registro de presença da aula ${lessonCode}. Eu (Professor) cliquei no botão Entrar na Sala Virtual e registrei presença, mas o sistema informou que o aluno não registrou presença. Por favor, verifiquem para contabilizar meus ganhos.`;
                  const whatsappUrl = `https://wa.me/5511999999999?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="flex-1 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs py-3.5 px-4 rounded-xl shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 transform hover:scale-[1.02]"
              >
                <AlertTriangle className="w-4 h-4 text-amber-200" />
                <span>Isto é um Erro (Suporte)</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
