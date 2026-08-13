import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  pt: {
    findTutor: "Encontrar um professor",
    beTeacher: "Seja um professor",
    login: "Login",
    support: "Suporte 24/7",
    myDashboard: "Meu Painel",
    myWallet: "Minha Carteira",
    adminPanel: "Painel Admin",
    logout: "Sair da Conta",
    englishLanguage: "Língua inglesa",
    spanishLanguage: "Língua espanhola",
    tutorsCountEn: "25.017 professores qualificados",
    tutorsCountEs: "18.420 professores qualificados",
    featuredTutors: "Tutores em Destaque",
    featuredTutorsSub: "Conheça os professores nativos de menor tarifa recomendados pela comunidade.",
    seeAllTutors: "Ver Todos os Tutores",
    howItWorks: "Como Funciona a Plataforma",
    guaranteeTitle: "Aulas com qualidade que você vai amar. Nós garantimos!",
    guaranteeDesc: "Sua experiência é nossa prioridade total: se a sua primeira aula não for perfeita para você, sem complicação — basta experimentar outro professor totalmente grátis.",
    guaranteeCta: "Experimentar sem risco",
    teacherSectionTitle: "Seja um professor na Lexy Idiomas",
    teacherSectionSub: "Monetize seu conhecimento especializado e alcance novos alunos diariamente.",
    teacherCta: "Cadastrar-se para dar aulas na Lexy",
    faqTitle: "Perguntas Frequentes",
    supportBannerTitle: "Precisa de ajuda? Fale com nosso suporte 24/7",
    whatsappBtn: "Falar no WhatsApp",
    rightsReserved: "© 2026 Lexy by CA Idiomas — Todos os direitos reservados",
    ownedBy: "Este site é de propriedade exclusiva do CA Group.",
    poweredBy: "Powered by Conexión América",
    termsOfUse: "Termos e Condições de Uso",
    privacyPolicy: "Política de Privacidade",
    forStudents: "Para Alunos",
    forTeachers: "Para Professores",
    myAccount: "Minha Conta",
    studentDashboard: "Painel do Aluno",
    teacherDashboard: "Painel do Tutor",
    register: "Cadastre-se",
    exploreHeaderTitle: "Encontre o tutor ideal e fale com fluência natural",
    exploreHeaderSub: "Mais de 10.000 alunos aprendem idiomas todos os dias. Agende sua primeira aula de teste com 100% de garantia de satisfação.",
    findNativeTutorCta: "🎯 Encontre seu tutor nativo ideal e agende sua primeira aula de teste sem risco! Comece a falar com fluência hoje mesmo.",
    exploreTutorBtn: "🚀 Ver Tutores Disponíveis",
    studentGreeting: "Olá, Aluno! 👋",
    studentGreetingSub: "Pronto para dominar um novo idioma hoje?",
    confirmedBadge: "● Confirmada",
    nextClassLabel: "Próxima Aula",
    enterVirtualRoom: "🎥 Entrar na Sala Virtual",
    currentBalance: "Saldo Atual",
    rechargeCredits: "+ Recarregar Créditos"
  },
  es: {
    findTutor: "Encontrar un profesor",
    beTeacher: "Sé un profesor",
    login: "Iniciar Sesión",
    support: "Soporte 24/7",
    myDashboard: "Mi Panel",
    myWallet: "Mi Billetera",
    adminPanel: "Panel Admin",
    logout: "Cerrar Sesión",
    englishLanguage: "Idioma inglés",
    spanishLanguage: "Idioma español",
    tutorsCountEn: "25.017 profesores cualificados",
    tutorsCountEs: "18.420 profesores cualificados",
    featuredTutors: "Tutores Destacados",
    featuredTutorsSub: "Conoce a los profesores nativos más económicos recomendados por la comunidad.",
    seeAllTutors: "Ver Todos los Tutores",
    howItWorks: "Cómo Funciona la Plataforma",
    guaranteeTitle: "Clases con calidad que te encantarán. ¡Lo garantizamos!",
    guaranteeDesc: "Tu experiencia es nuestra máxima prioridad: si tu primera clase no es perfecta, prueba con otro profesor totalmente gratis.",
    guaranteeCta: "Probar sin riesgo",
    teacherSectionTitle: "Sé un profesor en Lexy Idiomas",
    teacherSectionSub: "Monetiza tu conocimiento especializado y llega a nuevos alumnos a diario.",
    teacherCta: "Registrarme para enseñar en Lexy",
    faqTitle: "Preguntas Frecuentes",
    supportBannerTitle: "¿Necesitas ayuda? Habla con nuestro soporte 24/7",
    whatsappBtn: "Hablar por WhatsApp",
    rightsReserved: "© 2026 Lexy by CA Idiomas — Todos los derechos reservados",
    ownedBy: "Este sitio es propiedad exclusiva de CA Group.",
    poweredBy: "Powered by Conexión América",
    termsOfUse: "Términos y Condiciones de Uso",
    privacyPolicy: "Política de Privacidad",
    forStudents: "Para Alumnos",
    forTeachers: "Para Profesores",
    myAccount: "Mi Cuenta",
    studentDashboard: "Panel del Alumno",
    teacherDashboard: "Panel del Tutor",
    register: "Registrarse",
    exploreHeaderTitle: "Encuentra al tutor ideal y habla con fluidez natural",
    exploreHeaderSub: "Más de 10.000 alumnos aprenden idiomas todos los días. Reserva tu primera clase de prueba con 100% de satisfacción garantizada.",
    findNativeTutorCta: "🎯 ¡Encuentra a tu tutor nativo ideal y reserva tu primera clase de prueba sin riesgo! Empieza a hablar con fluidez hoy.",
    exploreTutorBtn: "🚀 Ver Tutores Disponibles",
    studentGreeting: "¡Hola, Alumno! 👋",
    studentGreetingSub: "¿Listo para dominar un nuevo idioma hoy?",
    confirmedBadge: "● Confirmada",
    nextClassLabel: "Próxima Clase",
    enterVirtualRoom: "🎥 Entrar a la Sala Virtual",
    currentBalance: "Saldo Actual",
    rechargeCredits: "+ Recargar Créditos"
  },
  en: {
    findTutor: "Find a tutor",
    beTeacher: "Become a tutor",
    login: "Log in",
    support: "24/7 Support",
    myDashboard: "My Dashboard",
    myWallet: "My Wallet",
    adminPanel: "Admin Panel",
    logout: "Log out",
    englishLanguage: "English language",
    spanishLanguage: "Spanish language",
    tutorsCountEn: "25,017 qualified tutors",
    tutorsCountEs: "18,420 qualified tutors",
    featuredTutors: "Featured Tutors",
    featuredTutorsSub: "Discover top native tutors with the lowest hourly rates recommended by students.",
    seeAllTutors: "See All Tutors",
    howItWorks: "How It Works",
    guaranteeTitle: "Quality lessons you'll love. Guaranteed!",
    guaranteeDesc: "Your satisfaction is our top priority: if your first lesson isn't perfect, try another tutor 100% free.",
    guaranteeCta: "Try Risk-Free",
    teacherSectionTitle: "Become a tutor at Lexy Idiomas",
    teacherSectionSub: "Monetize your expertise and connect with new students every day.",
    teacherCta: "Sign up to teach on Lexy",
    faqTitle: "Frequently Asked Questions",
    supportBannerTitle: "Need help? Contact our 24/7 support team",
    whatsappBtn: "Chat on WhatsApp",
    rightsReserved: "© 2026 Lexy by CA Idiomas — All rights reserved",
    ownedBy: "This site is exclusively owned by CA Group.",
    poweredBy: "Powered by Conexión América",
    termsOfUse: "Terms & Conditions of Use",
    privacyPolicy: "Privacy Policy",
    forStudents: "For Students",
    forTeachers: "For Tutors",
    myAccount: "My Account",
    studentDashboard: "Student Dashboard",
    teacherDashboard: "Tutor Dashboard",
    register: "Sign Up",
    exploreHeaderTitle: "Find your ideal tutor and speak with natural fluency",
    exploreHeaderSub: "Over 10,000 students learn languages every day. Book your trial lesson with 100% satisfaction guarantee.",
    findNativeTutorCta: "🎯 Find your ideal native tutor and book your risk-free trial lesson! Start speaking fluently today.",
    exploreTutorBtn: "🚀 View Available Tutors",
    studentGreeting: "Hello, Student! 👋",
    studentGreetingSub: "Ready to master a new language today?",
    confirmedBadge: "● Confirmed",
    nextClassLabel: "Next Lesson",
    enterVirtualRoom: "🎥 Enter Virtual Classroom",
    currentBalance: "Current Balance",
    rechargeCredits: "+ Recharge Credits"
  }
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lexy_lang') || 'pt');

  const changeLanguage = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lexy_lang', newLang);
  };

  const t = translations[lang] || translations.pt;

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
