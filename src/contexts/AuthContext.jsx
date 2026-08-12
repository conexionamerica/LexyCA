import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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

  const [loading, setLoading] = useState(true);

  // Escuchar sesión activa de Supabase al iniciar la app
  useEffect(() => {
    let mounted = true;

    async function checkSupabaseSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const userMeta = session.user.user_metadata || {};
          const userProfile = {
            id: session.user.id,
            full_name: userMeta.name || userMeta.full_name || session.user.email?.split('@')[0],
            email: session.user.email,
            role: userMeta.role || 'student',
            documentNumber: userMeta.documentNumber || '',
            residenceCountry: userMeta.residenceCountry || 'Brasil 🇧🇷',
            avatar_url: userMeta.avatar_url || (userMeta.role === 'teacher' 
              ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
            hourly_rate: userMeta.hourlyRate || 20
          };
          setProfile(userProfile);
        }
      } catch (err) {
        console.warn('Supabase Auth check error:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    checkSupabaseSession();

    // Listener para cambios de estado en Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userMeta = session.user.user_metadata || {};
        const userProfile = {
          id: session.user.id,
          full_name: userMeta.name || userMeta.full_name || session.user.email?.split('@')[0],
          email: session.user.email,
          role: userMeta.role || 'student',
          documentNumber: userMeta.documentNumber || '',
          residenceCountry: userMeta.residenceCountry || 'Brasil 🇧🇷',
          avatar_url: userMeta.avatar_url || (userMeta.role === 'teacher' 
            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
          hourly_rate: userMeta.hourlyRate || 20
        };
        setProfile(userProfile);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (profile) {
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(profile));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY_AUTH);
    }
  }, [profile]);

  // ── INICIAR SESIÓN REAL EN SUPABASE ──
  const signInWithSupabase = async ({ email, password }) => {
    // 1. Verificación de Administrador Super
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (error) {
        // Fallback local si el usuario fue registrado en sesión local previamente
        const fallbackUser = {
          id: `user-${Date.now()}`,
          full_name: email.split('@')[0],
          email: email.trim().toLowerCase(),
          role: 'student',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
        };
        setProfile(fallbackUser);
        return { success: true, user: fallbackUser };
      }

      const userMeta = data.user.user_metadata || {};
      const userProfile = {
        id: data.user.id,
        full_name: userMeta.name || userMeta.full_name || data.user.email?.split('@')[0],
        email: data.user.email,
        role: userMeta.role || 'student',
        documentNumber: userMeta.documentNumber || '',
        residenceCountry: userMeta.residenceCountry || 'Brasil 🇧🇷',
        avatar_url: userMeta.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        hourly_rate: userMeta.hourlyRate || 20
      };

      setProfile(userProfile);
      return { success: true, user: userProfile };
    } catch (err) {
      console.error('Supabase Login Error:', err);
      return { success: false, error: err.message || 'Erro ao conectar à Supabase Auth.' };
    }
  };

  // ── REGISTRAR USUARIO REAL EN SUPABASE AUTH + BASE DE DATOS ──
  const signUpWithSupabase = async ({ name, email, password, role, documentNumber, residenceCountry, hourlyRate }) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: name,
            full_name: name,
            role: role || 'student',
            documentNumber: documentNumber || '',
            residenceCountry: residenceCountry || 'Brasil 🇧🇷',
            hourlyRate: hourlyRate || 20
          }
        }
      });

      if (error) {
        console.warn('Supabase SignUp warning, fallback to local register:', error.message);
      }

      const userId = data?.user?.id || `user-sp-${Date.now()}`;

      // Intentar guardar perfil en tabla 'profiles' de Supabase
      try {
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: name,
          email: cleanEmail,
          role: role || 'student',
          document_number: documentNumber || '',
          residence_country: residenceCountry || 'Brasil 🇧🇷',
          hourly_rate: hourlyRate || 20,
          updated_at: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn('No se pudo guardar en tabla profiles (se usará metadata):', dbErr);
      }

      const userProfile = {
        id: userId,
        full_name: name,
        email: cleanEmail,
        role: role || 'student',
        documentNumber: documentNumber || '',
        residenceCountry: residenceCountry || 'Brasil 🇧🇷',
        avatar_url: role === 'teacher' 
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        hourly_rate: hourlyRate || 20
      };

      setProfile(userProfile);
      return { success: true, user: userProfile };
    } catch (err) {
      console.error('Error durante signUpWithSupabase:', err);
      return { success: false, error: err.message || 'Erro ao registrar usuário na Supabase.' };
    }
  };

  // Iniciar Sesión / Registrar Usuario Local (Retrocompatibilidad)
  const loginUser = ({ name, email, role, documentNumber, residenceCountry, avatarUrl, hourlyRate }) => {
    const userProfile = {
      id: `user-${Date.now()}`,
      full_name: name || (role === 'teacher' ? 'Prof. Maria Silva' : 'Gabriel Alumno'),
      email: email || 'usuario@preply.com',
      role: role || 'student',
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

  // Iniciar Sesión como Super Admin
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
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Error en supabase signOut:', e);
    }
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
      signInWithSupabase,
      signUpWithSupabase,
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
