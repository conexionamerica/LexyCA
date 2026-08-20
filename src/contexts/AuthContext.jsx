import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(undefined);

const LOCAL_STORAGE_KEY_AUTH = 'lexy_auth_user_v3';

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
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && mounted) {
          const userMeta = session.user.user_metadata || {};
          let dbProfile = {};
          try {
            const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
            if (data) dbProfile = data;
          } catch (dbErr) {
            console.warn('Profiles fetch warning:', dbErr);
          }

          const localAvatar = localStorage.getItem('lexy_avatar_' + session.user.id) || localStorage.getItem('lexy_avatar_' + session.user.email);

          const userProfile = {
            id: session.user.id,
            full_name: dbProfile.full_name || userMeta.name || userMeta.full_name || session.user.email?.split('@')[0],
            email: session.user.email,
            role: dbProfile.role || userMeta.role || 'student',
            documentNumber: dbProfile.document_number || userMeta.documentNumber || '',
            residenceCountry: dbProfile.residence_country || userMeta.residenceCountry || 'Brasil 🇧🇷',
            study_language: dbProfile.study_language || userMeta.study_language || '',
            language_level: dbProfile.language_level || userMeta.language_level || '',
            study_motivation: dbProfile.study_motivation || userMeta.study_motivation || '',
            avatar_url: localAvatar || dbProfile.avatar_url || userMeta.avatar_url || (userMeta.role === 'teacher' 
              ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
              : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
            hourly_rate: dbProfile.hourly_rate || userMeta.hourlyRate || 20
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

    // Listener para cambios de estado de autenticación en Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userMeta = session.user.user_metadata || {};
        let dbProfile = {};
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
          if (data) dbProfile = data;
        } catch (dbErr) {
          console.warn('Profiles fetch warning:', dbErr);
        }

        const localAvatar = localStorage.getItem('lexy_avatar_' + session.user.id) || localStorage.getItem('lexy_avatar_' + session.user.email);

        const userProfile = {
          id: session.user.id,
          full_name: dbProfile.full_name || userMeta.name || userMeta.full_name || session.user.email?.split('@')[0],
          email: session.user.email,
          role: dbProfile.role || userMeta.role || 'student',
          documentNumber: dbProfile.document_number || userMeta.documentNumber || '',
          residenceCountry: dbProfile.residence_country || userMeta.residenceCountry || 'Brasil 🇧🇷',
          study_language: dbProfile.study_language || userMeta.study_language || '',
          language_level: dbProfile.language_level || userMeta.language_level || '',
          study_motivation: dbProfile.study_motivation || userMeta.study_motivation || '',
          avatar_url: localAvatar || dbProfile.avatar_url || userMeta.avatar_url || (userMeta.role === 'teacher' 
            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
            : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
          hourly_rate: dbProfile.hourly_rate || userMeta.hourlyRate || 20
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

  // ── INICIAR SESIÓN SEGURA Y ESTRICTA EN SUPABASE AUTH ──
  const signInWithSupabase = async ({ email, password }) => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Verificación de Credenciales de Super Administrador (Conexión América)
    if (cleanEmail === 'emaildeconexionamerica@gmail.com' && password === 'AlyRoberto2026*') {
      const adminUser = {
        id: 'admin-super-1',
        full_name: 'Administrador Lexy Idiomas',
        email: 'emaildeconexionamerica@gmail.com',
        role: 'admin',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };
      setProfile(adminUser);
      return { success: true, user: adminUser };
    }

    // 2. Autenticación Real Estricta contra Supabase Auth (Sin Falsos Positivos ni Usuarios Ficticios)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });

      // Verificar errores de autenticación y existencia del usuario
      if (error || !data.user) {
        // Manejar error de rate limit de Supabase
        const msg = error?.message?.toLowerCase() || '';
        if (msg.includes('rate limit') || msg.includes('too many requests') || error?.status === 429) {
          return {
            success: false,
            error: '⏳ Muitas tentativas de login. Por favor, aguarde alguns minutos e tente novamente.'
          };
        }
        return { 
          success: false, 
          error: '❌ E-mail ou senha incorretos. Verifique suas credenciais na Lexy.' 
        };
      }

      const userMeta = data.user.user_metadata || {};
      const userProfile = {
        id: data.user.id,
        full_name: userMeta.name || userMeta.full_name || cleanEmail.split('@')[0],
        email: data.user.email,
        role: userMeta.role || 'student',
        documentNumber: userMeta.documentNumber || '',
        residenceCountry: userMeta.residenceCountry || 'Brasil 🇧🇷',
        avatar_url: userMeta.avatar_url || (userMeta.role === 'teacher' 
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'),
        hourly_rate: userMeta.hourlyRate || 20
      };
      setProfile(userProfile);
      return { success: true, user: userProfile };
    } catch (err) {
      console.error('Supabase Login Exception:', err);
      return { 
        success: false, 
        error: '❌ E-mail ou senha incorretos. Verifique suas credenciais.' 
      };
    }
  };

  // ── REGISTRAR NUEVO USUARIO REAL EN SUPABASE AUTH ──
  const signUpWithSupabase = async ({ name, email, password, role, documentNumber, residenceCountry, hourlyRate, study_language, language_level, study_motivation }) => {
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
            hourlyRate: hourlyRate || 20,
            study_language: study_language || '',
            language_level: language_level || '',
            study_motivation: study_motivation || ''
          }
        }
      });

      if (error) {
        const msg = error.message?.toLowerCase() || '';
        // Manejar rate limit de Supabase (error 429)
        if (msg.includes('rate limit') || msg.includes('too many requests') || msg.includes('email rate limit') || error.status === 429) {
          return { success: false, error: '⏳ Limite de cadastros atingido. A Supabase permite poucos cadastros por hora no plano gratuito. Por favor, aguarde alguns minutos e tente novamente.' };
        }
        if (msg.includes('already registered')) {
          return { success: false, error: '❌ Este e-mail já está cadastrado. Faça login para acessar.' };
        }
        if (msg.includes('password') && (msg.includes('short') || msg.includes('weak'))) {
          return { success: false, error: '❌ A senha deve ter pelo menos 6 caracteres.' };
        }
        return { success: false, error: `❌ Erro ao criar conta: ${error.message}` };
      }

      if (!data.user) {
        return { success: false, error: '❌ Não foi possível criar o usuário na Supabase.' };
      }

      const userId = data.user.id;

      // Intentar persistir en tabla profiles de Supabase
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
        console.warn('Profiles upsert warning:', dbErr);
      }

      const userProfile = {
        id: userId,
        full_name: name,
        email: cleanEmail,
        role: role || 'student',
        documentNumber: documentNumber || '',
        residenceCountry: residenceCountry || 'Brasil 🇧🇷',
        study_language: study_language || '',
        language_level: language_level || '',
        study_motivation: study_motivation || '',
        avatar_url: role === 'teacher' 
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        hourly_rate: hourlyRate || 20
      };

      setProfile(userProfile);
      return { success: true, user: userProfile };
    } catch (err) {
      console.error('Error en signUpWithSupabase:', err);
      return { success: false, error: err.message || 'Erro ao registrar usuário na Supabase.' };
    }
  };

  // Iniciar Sesión como Super Admin
  const loginAdmin = (email, password) => {
    if (email === 'emaildeconexionamerica@gmail.com' && password === 'AlyRoberto2026*') {
      const adminUser = {
        id: 'admin-super-1',
        full_name: 'Administrador Lexy Idiomas',
        email: 'emaildeconexionamerica@gmail.com',
        role: 'admin',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      };
      setProfile(adminUser);
      return { success: true, user: adminUser };
    }
    return { success: false, error: '❌ Credenciais inválidas de Administrador. Acesso restrito.' };
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

  const updateProfile = async (updatedData) => {
    setProfile(prev => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(merged));
      if (merged.id && updatedData.avatar_url) {
        localStorage.setItem('lexy_avatar_' + merged.id, updatedData.avatar_url);
      }
      if (merged.email && updatedData.avatar_url) {
        localStorage.setItem('lexy_avatar_' + merged.email, updatedData.avatar_url);
      }
      return merged;
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (updatedData.avatar_url) {
          localStorage.setItem('lexy_avatar_' + session.user.id, updatedData.avatar_url);
          if (session.user.email) {
            localStorage.setItem('lexy_avatar_' + session.user.email, updatedData.avatar_url);
          }
        }

        await supabase.auth.updateUser({
          data: {
            avatar_url: updatedData.avatar_url,
            study_language: updatedData.study_language,
            language_level: updatedData.language_level,
            study_motivation: updatedData.study_motivation
          }
        });

        await supabase.from('profiles').upsert({
          id: session.user.id,
          full_name: updatedData.full_name || profile?.full_name,
          email: session.user.email,
          avatar_url: updatedData.avatar_url,
          study_language: updatedData.study_language,
          language_level: updatedData.language_level,
          study_motivation: updatedData.study_motivation,
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Error syncing profile update to Supabase:', e);
    }
  };

  return (
    <AuthContext.Provider value={{
      user: profile,
      profile,
      loading,
      loginAdmin,
      signInWithSupabase,
      signUpWithSupabase,
      signOut,
      logout: signOut,
      updateProfile
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
