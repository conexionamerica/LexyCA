import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

const LOCAL_STORAGE_KEY_AUTH = 'preply_market_auth_user_v3';

export const AuthProvider = ({ children }) => {
  // Estado do Usuário Autenticado (Aluno, Tutor ou Admin)
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_AUTH);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando usuario de localStorage', e);
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
    }
  }, [profile]);

  // Iniciar Sesión / Registrar Usuario Real
  const loginUser = ({ name, email, role, documentNumber, residenceCountry, avatarUrl, hourlyRate }) => {
    const userProfile = {
      id: `user-${Date.now()}`,
      full_name: name || (role === 'teacher' ? 'Prof. Maria Silva' : 'Gabriel Alumno'),
      email: email || 'usuario@preply.com',
      role: role || 'student', // 'student' | 'teacher' | 'admin'
      documentNumber: documentNumber || '',
      residenceCountry: residenceCountry || 'Brasil 🇧🇷',
      avatar_url: avatarUrl || (role === 'teacher' 
        ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
      hourly_rate: hourlyRate || 20
    };

    setProfile(userProfile);
    return userProfile;
  };

  // Iniciar Sesión como Super Admin Invisível
  const loginAdmin = (email, password) => {
    if (email === 'emaildeconexionamerica@gmail.com' && password === 'AlyRoberto2026*') {
      const adminUser = {
        id: 'admin-super-1',
        full_name: 'Super Administrador (Conexión América)',
        email: 'emaildeconexionamerica@gmail.com',
        role: 'admin',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };
      setProfile(adminUser);
      return { success: true, user: adminUser };
    }
    return { success: false, error: '❌ Credenciais inválidas de Administrador. Acesso restrito.' };
  };

  // Función para cambiar de rol rápidamente en modo demostración
  const setDemoRole = (role) => {
    if (role === 'teacher') {
      loginUser({
        name: 'María Fernández',
        email: 'maria.tutor@preply.com',
        role: 'teacher',
        hourlyRate: 28
      });
    } else if (role === 'admin') {
      loginAdmin('emaildeconexionamerica@gmail.com', 'AlyRoberto2026*');
    } else {
      loginUser({
        name: 'Gabriel Alumno Silva',
        email: 'aluno@preply.com',
        role: 'student',
        documentNumber: '123.456.789-00'
      });
    }
  };

  // Cerrar Sesión (Logout)
  const signOut = () => {
    setProfile(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
  };

  return (
    <AuthContext.Provider value={{
      user: profile,
      profile,
      loading,
      loginUser,
      loginAdmin,
      setDemoRole,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
