import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MarketplaceProvider } from './contexts/MarketplaceContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
// EmailVerificationNotice removido (verificação de e-mail desativada)

// Pages
import ExplorePage from './pages/ExplorePage';
import TutorProfilePage from './pages/TutorProfilePage';
import BookingPage from './pages/BookingPage';
import ClassroomPage from './pages/ClassroomPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentWallet from './pages/StudentWallet';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OnboardingFlow from './pages/OnboardingFlow';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';

import { LanguageProvider } from './contexts/LanguageContext';

function ProtectedAdminRoute({ children }) {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function Layout() {
  return (
    <div className="min-h-screen flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 bg-slate-950">
      <Navbar />
      <main className="flex-1 w-full">
        <Routes>
          {/* Rutas Públicas de Exploración y Perfil de Tutores */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/student" element={<LoginPage forceRole="student" />} />
          <Route path="/login/teacher" element={<LoginPage forceRole="teacher" />} />
          <Route path="/tutor/:id" element={<TutorProfilePage />} />
          <Route path="/onboarding" element={<OnboardingFlow />} />
          {/* Ruta de verificación de email removida */}

          {/* Reserva y Pago */}
          <Route path="/book/:id" element={<BookingPage />} />

          {/* Aula Virtual Preply Space */}
          <Route path="/classroom/:bookingId" element={<ClassroomPage />} />

          {/* Paneles de Usuario */}
          <Route path="/dashboard/student" element={<StudentDashboard />} />
          <Route path="/dashboard/student/wallet" element={<StudentWallet />} />
          <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
          <Route path="/tutor/calendar" element={<TeacherDashboard />} />
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          } />

          {/* Redirección 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MarketplaceProvider>
          <Router>
            <Layout />
          </Router>
        </MarketplaceProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
