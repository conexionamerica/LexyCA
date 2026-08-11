// Dataset completo de tutores para a plataforma (Apenas Inglês e Espanhol)

export const mockTutors = [
  {
    id: 'tutor-1',
    name: 'María Fernández',
    title: 'Profesora Nativa de Español | Especialista en DELE y Conversación',
    country: 'Espanha',
    countryCode: 'ES',
    flag: '🇪🇸',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
    nativeSpeaker: true,
    isSuperTutor: true,
    isVerified: true,
    subject: 'Espanhol',
    hourlyRate: 18,
    trialRate: 9,
    rating: 4.98,
    reviewCount: 142,
    totalLessons: 1250,
    activeStudents: 34,
    responseTime: 'Responde em <15 min',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoThumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
    headline: '¡Hola! Aprende español de forma natural, dinámica y divertida desde la primera clase.',
    bio: `¡Hola a todos! Mi nombre es María y soy profesora graduada en Filología Hispánica por la Universidad de Madrid. Tengo más de 6 años de experiencia enseñando español a estudiantes de todos los niveles, desde principiantes absolutos hasta avanzados.

Mis clases son 100% personalizadas según tus objetivos: conversación fluida, español para negocios, preparación de exámenes oficiales DELE/SIELE o gramática práctica. Utilizo artículos de actualidad, podcasts y ejercicios interactivos para que hables desde el primer día. ¡Nos vemos en clase!`,
    languagesSpoken: [
      { language: 'Espanhol', level: 'Nativo' },
      { language: 'Inglês', level: 'Avançado (C1)' },
      { language: 'Português', level: 'Intermediário (B2)' }
    ],
    specialties: ['Conversação', 'Espanhol para Negócios', 'Preparação DELE/SIELE', 'Iniciantes'],
    weeklySchedule: {
      'Segunda': ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '18:00', '19:00'],
      'Terça': ['09:00', '10:00', '14:00', '15:00', '16:00', '17:00', '20:00'],
      'Quarta': ['09:00', '11:00', '14:00', '15:00', '18:00', '19:00', '20:00'],
      'Quinta': ['10:00', '11:00', '14:00', '16:00', '17:00', '18:00'],
      'Sexta': ['09:00', '10:00', '11:00', '14:00', '15:00'],
      'Sábado': ['10:00', '11:00', '12:00']
    },
    reviews: [
      {
        id: 'rev-1',
        studentName: 'Lucas Andrade',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: 'Há 3 dias',
        comment: 'Las clases con María son excelentes. En sólo 2 meses logré superar mi miedo a hablar en público en español. 100% recomendada.'
      },
      {
        id: 'rev-2',
        studentName: 'Camila Rossi',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: 'Há 1 semana',
        comment: 'Muy paciente y didáctica. Preparó un material exclusivo para mi entrevista de trabajo en México y me fue increíble.'
      }
    ]
  },
  {
    id: 'tutor-2',
    name: 'David Miller',
    title: 'Certified Native English Teacher | Business English & TOEFL Specialist',
    country: 'Estados Unidos',
    countryCode: 'US',
    flag: '🇺🇸',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    nativeSpeaker: true,
    isSuperTutor: true,
    isVerified: true,
    subject: 'Inglês',
    hourlyRate: 24,
    trialRate: 12,
    rating: 4.95,
    reviewCount: 98,
    totalLessons: 890,
    activeStudents: 28,
    responseTime: 'Responde em <1 hora',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoThumbnail: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    headline: 'Unlock your professional potential with authentic American English & Business Coaching.',
    bio: `Hi there! I'm David, a TEFL-certified native English teacher from Chicago, USA. With over 7 years of online and classroom teaching experience, I specialize in helping professionals excel in global corporate environments.

Whether you need to master job interviews, deliver high-impact presentations, prepare for TOEFL/IELTS, or simply speak with natural confidence, my lessons are tailored specifically for you.`,
    languagesSpoken: [
      { language: 'Inglês', level: 'Nativo' },
      { language: 'Espanhol', level: 'Avançado (C1)' }
    ],
    specialties: ['Business English', 'Conversação', 'TOEFL / IELTS', 'Entrevistas de Emprego'],
    weeklySchedule: {
      'Segunda': ['10:00', '11:00', '13:00', '14:00', '15:00', '16:00'],
      'Terça': ['09:00', '10:00', '11:00', '15:00', '16:00', '17:00'],
      'Quarta': ['10:00', '11:00', '13:00', '14:00', '17:00', '18:00'],
      'Quinta': ['09:00', '10:00', '14:00', '15:00', '16:00'],
      'Sexta': ['10:00', '11:00', '13:00', '14:00']
    },
    reviews: [
      {
        id: 'rev-3',
        studentName: 'Roberto Silva',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: 'Há 2 dias',
        comment: 'David helped me pass my AWS senior role interview in English! Fantastic teacher who focuses on real conversational flow.'
      }
    ]
  },
  {
    id: 'tutor-3',
    name: 'Sofia Ramírez',
    title: 'Profesora de Español Neutro | Conversación y Preparación DELE',
    country: 'Colômbia',
    countryCode: 'CO',
    flag: '🇨🇴',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    nativeSpeaker: true,
    isSuperTutor: true,
    isVerified: true,
    subject: 'Espanhol',
    hourlyRate: 16,
    trialRate: 8,
    rating: 4.97,
    reviewCount: 84,
    totalLessons: 710,
    activeStudents: 23,
    responseTime: 'Responde em <30 min',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoThumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    headline: 'Aprende el español más claro y comprensible de Latinoamérica con clases 100% interactivas.',
    bio: `¡Hola! Soy Sofia de Bogotá, Colombia. Como comunicadora social y profesora de español, te enseñaré a hablar con una pronunciación clara, pausada y profesional.

Mis clases son ideales para estudiantes de cualquier nivel que quieran perfeccionar su acento, vocabulario y soltura al hablar.`,
    languagesSpoken: [
      { language: 'Espanhol', level: 'Nativo' },
      { language: 'Inglês', level: 'Avançado (C1)' }
    ],
    specialties: ['Conversação', 'Espanhol Neutro', 'Viagens', 'Preparação DELE/SIELE'],
    weeklySchedule: {
      'Segunda': ['08:00', '09:00', '14:00', '15:00', '16:00'],
      'Quarta': ['08:00', '09:00', '10:00', '14:00', '15:00'],
      'Sexta': ['09:00', '10:00', '11:00', '14:00', '15:00']
    },
    reviews: [
      {
        id: 'rev-4',
        studentName: 'Beatriz Lima',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: 'Há 5 dias',
        comment: 'O sotaque da Sofia é extremamente claro! Consegui entender 100% da aula e perdi a vergonha de falar.'
      }
    ]
  },
  {
    id: 'tutor-4',
    name: 'Carlos Mendoza',
    title: 'Tutor de Español Latinoamericano | Conversación Fluida y Pronunciación',
    country: 'México',
    countryCode: 'MX',
    flag: '🇲🇽',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    nativeSpeaker: true,
    isSuperTutor: true,
    isVerified: true,
    subject: 'Espanhol',
    hourlyRate: 15,
    trialRate: 7.5,
    rating: 4.96,
    reviewCount: 112,
    totalLessons: 940,
    activeStudents: 31,
    responseTime: 'Responde em <10 min',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoThumbnail: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&auto=format&fit=crop&q=80',
    headline: 'Aprende español neutro y modismos reales de Latinoamérica con un enfoque 100% práctico.',
    bio: `¡Qué tal! Soy Carlos de la Ciudad de México. Me especializo en ayudar a estudiantes brasileños e internacionales a dominar el español latinoamericano sin complicaciones.

Si quieres viajar, trabajar con equipos en LatAm o simplemente hablar con confianza sin traducir mentalmente, mis clases dinámicas son ideales para ti.`,
    languagesSpoken: [
      { language: 'Espanhol', level: 'Nativo' },
      { language: 'Português', level: 'Avançado (C1)' },
      { language: 'Inglês', level: 'Intermediário (B2)' }
    ],
    specialties: ['Conversação', 'Espanhol Latino', 'Crianças', 'Viagens'],
    weeklySchedule: {
      'Segunda': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
      'Terça': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
      'Quarta': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
      'Quinta': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'],
      'Sexta': ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00']
    },
    reviews: [
      {
        id: 'rev-5',
        studentName: 'Gabriel Souza',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: 'Há 1 dia',
        comment: 'Carlos é super divertido e fala português fluente, o que facilita muito tirar dúvidas difíceis no começo!'
      }
    ]
  },
  {
    id: 'tutor-5',
    name: 'Emma Watson',
    title: 'British English Accent & Phonics Specialist | General & Academic English',
    country: 'Reino Unido',
    countryCode: 'GB',
    flag: '🇬🇧',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
    nativeSpeaker: true,
    isSuperTutor: true,
    isVerified: true,
    subject: 'Inglês',
    hourlyRate: 28,
    trialRate: 14,
    rating: 5.0,
    reviewCount: 78,
    totalLessons: 620,
    activeStudents: 22,
    responseTime: 'Responde em <1 hora',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoThumbnail: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
    headline: 'Master authentic Received Pronunciation (RP) British English & Academic writing.',
    bio: `Hello! I'm Emma from Oxford, UK. I hold a Master's degree in Applied Linguistics and have taught English at top language institutes across London.

My lessons focus on British pronunciation, natural idiom usage, IELTS Academic preparation, and sophisticated vocabulary building.`,
    languagesSpoken: [
      { language: 'Inglês', level: 'Nativo' },
      { language: 'Espanhol', level: 'Intermediário (B2)' }
    ],
    specialties: ['Pronúncia Britânica', 'IELTS Academic', 'Inglês Geral', 'Crianças'],
    weeklySchedule: {
      'Terça': ['10:00', '11:00', '14:00', '15:00', '16:00'],
      'Quinta': ['10:00', '11:00', '14:00', '15:00', '16:00'],
      'Sábado': ['09:00', '10:00', '11:00']
    },
    reviews: [
      {
        id: 'rev-6',
        studentName: 'Mariana Costa',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        rating: 5,
        date: 'Há 4 dias',
        comment: 'Emma is amazing! Her accent training exercises completely transformed my speaking clarity.'
      }
    ]
  },
  {
    id: 'tutor-6',
    name: 'James Wilson',
    title: 'North American English Specialist | Business & Academic English',
    country: 'Canadá',
    countryCode: 'CA',
    flag: '🇨🇦',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
    nativeSpeaker: true,
    isSuperTutor: false,
    isVerified: true,
    subject: 'Inglês',
    hourlyRate: 22,
    trialRate: 11,
    rating: 4.94,
    reviewCount: 65,
    totalLessons: 520,
    activeStudents: 18,
    responseTime: 'Responde em <1 hora',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoThumbnail: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    headline: 'Learn clear North American English for career advancement & study abroad.',
    bio: `Hello! I'm James from Toronto, Canada. I help students build strong conversational fluency and professional writing skills for tech and business careers.

My structured lessons include real-world case studies, interview roleplay, and accent reduction exercises.`,
    languagesSpoken: [
      { language: 'Inglês', level: 'Nativo' },
      { language: 'Espanhol', level: 'Avançado (C1)' }
    ],
    specialties: ['Business English', 'Iniciantes', 'Conversação', 'Entrevistas'],
    weeklySchedule: {
      'Segunda': ['09:00', '10:00', '14:00', '15:00'],
      'Quarta': ['09:00', '10:00', '14:00', '15:00'],
      'Sexta': ['09:00', '10:00', '14:00', '15:00']
    },
    reviews: []
  }
];

// Opciones de paquetes de suscripción mensual estilo Preply
export const subscriptionPackages = [
  {
    id: 'pkg-4',
    hours: 4,
    label: '4 Horas / Mês',
    subtitle: '1 aula por semana',
    discountPercent: 0,
    badge: 'Popular para Iniciantes'
  },
  {
    id: 'pkg-8',
    hours: 8,
    label: '8 Horas / Mês',
    subtitle: '2 aulas por semana',
    discountPercent: 10,
    badge: 'Mais Recomendado 🎉'
  },
  {
    id: 'pkg-12',
    hours: 12,
    label: '12 Horas / Mês',
    subtitle: '3 aulas por semana',
    discountPercent: 15,
    badge: 'Progresso Rápido'
  },
  {
    id: 'pkg-16',
    hours: 16,
    label: '16 Horas / Mês',
    subtitle: '4 aulas por semana',
    discountPercent: 20,
    badge: 'Imersão Total'
  }
];
