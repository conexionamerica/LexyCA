import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(undefined);

const LOCAL_STORAGE_KEY_AUTH = 'lexy_auth_user_v3';

export function generateMatriculaCode(id, email) {
  if (!id && !email) return 'LXY-2026-880192';
  const str = String(id || '') + String(email || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = (Math.abs(hash) % 899999) + 100000;
  return `LXY-2026-${positiveHash}`;
}

export const AuthProvider = ({ children }) => {
  // Estado do Usuário Autenticado (Aluno, Tutor ou Admin)
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY_AUTH);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...parsed,
            matricula_code: parsed.matricula_code || generateMatriculaCode(parsed.id, parsed.email)
          };
        }
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
            phone: dbProfile.phone || userMeta.phone || '',
            documentNumber: dbProfile.document_number || userMeta.documentNumber || '',
            postalCode: dbProfile.postal_code || userMeta.postalCode || dbProfile.cep || userMeta.cep || '',
            address: dbProfile.address || userMeta.address || '',
            addressNumber: dbProfile.address_number || userMeta.addressNumber || '',
            complement: dbProfile.complement || userMeta.complement || '',
            province: dbProfile.province || userMeta.province || dbProfile.bairro || userMeta.bairro || '',
            city: dbProfile.city || userMeta.city || '',
            state: dbProfile.state || userMeta.state || '',
            residenceCountry: dbProfile.residence_country || userMeta.residenceCountry || 'Brasil 🇧🇷',
            study_language: dbProfile.study_language || userMeta.study_language || '',
            language_level: dbProfile.language_level || userMeta.language_level || '',
            study_motivation: dbProfile.study_motivation || userMeta.study_motivation || '',
            avatar_url: localAvatar || dbProfile.avatar_url || userMeta.avatar_url || '',
            hourly_rate: dbProfile.hourly_rate || userMeta.hourlyRate || 20,
            matricula_code: dbProfile.matricula_code || generateMatriculaCode(session.user.id, session.user.email),
            wallet_history: dbProfile.wallet_history || userMeta.wallet_history || []
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
            phone: dbProfile.phone || userMeta.phone || '',
            documentNumber: dbProfile.document_number || userMeta.documentNumber || '',
            postalCode: dbProfile.postal_code || userMeta.postalCode || dbProfile.cep || userMeta.cep || '',
            address: dbProfile.address || userMeta.address || '',
            addressNumber: dbProfile.address_number || userMeta.addressNumber || '',
            complement: dbProfile.complement || userMeta.complement || '',
            province: dbProfile.province || userMeta.province || dbProfile.bairro || userMeta.bairro || '',
            city: dbProfile.city || userMeta.city || '',
            state: dbProfile.state || userMeta.state || '',
            residenceCountry: dbProfile.residence_country || userMeta.residenceCountry || 'Brasil 🇧🇷',
            study_language: dbProfile.study_language || userMeta.study_language || '',
            language_level: dbProfile.language_level || userMeta.language_level || '',
            study_motivation: dbProfile.study_motivation || userMeta.study_motivation || '',
            avatar_url: localAvatar || dbProfile.avatar_url || userMeta.avatar_url || '',
            hourly_rate: dbProfile.hourly_rate || userMeta.hourlyRate || 20,
            matricula_code: dbProfile.matricula_code || generateMatriculaCode(session.user.id, session.user.email),
            wallet_history: dbProfile.wallet_history || userMeta.wallet_history || []
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
        avatar_url: ''
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
      let dbProfile = {};
      try {
        const { data: profileDb } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
        if (profileDb) dbProfile = profileDb;
      } catch (dbErr) {
        console.warn('Profiles fetch warning on login:', dbErr);
      }

      const localAvatar = localStorage.getItem('lexy_avatar_' + data.user.id) || localStorage.getItem('lexy_avatar_' + data.user.email);
      const userProfile = {
        id: data.user.id,
        full_name: dbProfile.full_name || userMeta.name || userMeta.full_name || cleanEmail.split('@')[0],
        email: data.user.email,
        role: dbProfile.role || userMeta.role || 'student',
        phone: dbProfile.phone || userMeta.phone || '',
        documentNumber: dbProfile.document_number || userMeta.documentNumber || '',
        postalCode: dbProfile.postal_code || userMeta.postalCode || dbProfile.cep || userMeta.cep || '',
        address: dbProfile.address || userMeta.address || '',
        addressNumber: dbProfile.address_number || userMeta.addressNumber || '',
        complement: dbProfile.complement || userMeta.complement || '',
        province: dbProfile.province || userMeta.province || dbProfile.bairro || userMeta.bairro || '',
        city: dbProfile.city || userMeta.city || '',
        state: dbProfile.state || userMeta.state || '',
        residenceCountry: dbProfile.residence_country || userMeta.residenceCountry || 'Brasil 🇧🇷',
        study_language: dbProfile.study_language || userMeta.study_language || '',
        language_level: dbProfile.language_level || userMeta.language_level || '',
        study_motivation: dbProfile.study_motivation || userMeta.study_motivation || '',
        avatar_url: localAvatar || dbProfile.avatar_url || userMeta.avatar_url || '',
        hourly_rate: dbProfile.hourly_rate || userMeta.hourlyRate || 20,
        matricula_code: dbProfile.matricula_code || generateMatriculaCode(data.user.id, data.user.email)
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
  const signUpWithSupabase = async ({ name, email, password, role, phone, documentNumber, residenceCountry, postalCode, address, addressNumber, complement, province, city, state, hourlyRate, study_language, language_level, study_motivation, subject_taught, headline, bio }) => {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const normalizedRole = role === 'professor' || role === 'tutor' ? 'teacher' : (role || 'student');
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            name: name,
            full_name: name,
            role: normalizedRole,
            phone: phone || '',
            documentNumber: documentNumber || '',
            residenceCountry: residenceCountry || 'Brasil 🇧🇷',
            postalCode: postalCode || '',
            address: address || '',
            addressNumber: addressNumber || '',
            complement: complement || '',
            province: province || '',
            city: city || '',
            state: state || '',
            hourlyRate: hourlyRate || 20,
            study_language: study_language || '',
            language_level: language_level || '',
            study_motivation: study_motivation || '',
            subject_taught: subject_taught || '',
            headline: headline || '',
            bio: bio || ''
          }
        }
      });

      if (error) {
        const msg = error.message?.toLowerCase() || '';
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

      try {
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: name,
          email: cleanEmail,
          role: normalizedRole,
          phone: phone || '',
          document_number: documentNumber || '',
          cpf: documentNumber || '',
          residence_country: residenceCountry || 'Brasil 🇧🇷',
          postal_code: postalCode || '',
          address: address || '',
          address_number: addressNumber || '',
          complement: complement || '',
          province: province || '',
          city: city || '',
          state: state || '',
          study_language: study_language || '',
          language_level: language_level || '',
          study_motivation: study_motivation || '',
          hourly_rate: hourlyRate || 20,
          subject_taught: subject_taught || '',
          headline: headline || '',
          bio: bio || '',
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
        phone: phone || '',
        documentNumber: documentNumber || '',
        cpf: documentNumber || '',
        residenceCountry: residenceCountry || 'Brasil 🇧🇷',
        postalCode: postalCode || '',
        address: address || '',
        addressNumber: addressNumber || '',
        complement: complement || '',
        province: province || '',
        city: city || '',
        state: state || '',
        study_language: study_language || '',
        language_level: language_level || '',
        study_motivation: study_motivation || '',
        avatar_url: role === 'teacher' 
          ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        hourly_rate: hourlyRate || 20,
        matricula_code: generateMatriculaCode(userId, cleanEmail)
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
    // 🔒 AISLAMIENTO TOTAL: Purgar TODOS los datos del usuario del localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('lexy_') || key.startsWith('lexy_market_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
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
        const currentMeta = session.user.user_metadata || {};
        if (updatedData.avatar_url) {
          localStorage.setItem('lexy_avatar_' + session.user.id, updatedData.avatar_url);
          if (session.user.email) {
            localStorage.setItem('lexy_avatar_' + session.user.email, updatedData.avatar_url);
          }
        }

        const newMetaData = { ...currentMeta };
        if (updatedData.avatar_url !== undefined) newMetaData.avatar_url = updatedData.avatar_url;
        if (updatedData.study_language !== undefined) newMetaData.study_language = updatedData.study_language;
        if (updatedData.language_level !== undefined) newMetaData.language_level = updatedData.language_level;
        if (updatedData.study_motivation !== undefined) newMetaData.study_motivation = updatedData.study_motivation;
        if (updatedData.phone !== undefined) newMetaData.phone = updatedData.phone;
        if (updatedData.documentNumber !== undefined) newMetaData.documentNumber = updatedData.documentNumber;
        if (updatedData.postalCode !== undefined) newMetaData.postalCode = updatedData.postalCode;
        if (updatedData.address !== undefined) newMetaData.address = updatedData.address;
        if (updatedData.addressNumber !== undefined) newMetaData.addressNumber = updatedData.addressNumber;
        if (updatedData.complement !== undefined) newMetaData.complement = updatedData.complement;
        if (updatedData.province !== undefined) newMetaData.province = updatedData.province;
        if (updatedData.city !== undefined) newMetaData.city = updatedData.city;
        if (updatedData.state !== undefined) newMetaData.state = updatedData.state;

        await supabase.auth.updateUser({ data: newMetaData });

        const upsertData = {
          id: session.user.id,
          full_name: updatedData.full_name || profile?.full_name,
          email: session.user.email,
          updated_at: new Date().toISOString()
        };
        if (updatedData.avatar_url !== undefined) upsertData.avatar_url = updatedData.avatar_url;
        if (updatedData.study_language !== undefined) upsertData.study_language = updatedData.study_language;
        if (updatedData.language_level !== undefined) upsertData.language_level = updatedData.language_level;
        if (updatedData.study_motivation !== undefined) upsertData.study_motivation = updatedData.study_motivation;
        if (updatedData.phone !== undefined) upsertData.phone = updatedData.phone;
        if (updatedData.documentNumber !== undefined) upsertData.document_number = updatedData.documentNumber;
        if (updatedData.postalCode !== undefined) upsertData.postal_code = updatedData.postalCode;
        if (updatedData.address !== undefined) upsertData.address = updatedData.address;
        if (updatedData.addressNumber !== undefined) upsertData.address_number = updatedData.addressNumber;
        if (updatedData.complement !== undefined) upsertData.complement = updatedData.complement;
        if (updatedData.province !== undefined) upsertData.province = updatedData.province;
        if (updatedData.city !== undefined) upsertData.city = updatedData.city;
        if (updatedData.state !== undefined) upsertData.state = updatedData.state;

        await supabase.from('profiles').upsert(upsertData);
      }
    } catch (e) {
      console.warn('Error syncing profile update to Supabase:', e);
    }
  };

  const updateWalletBalance = async (amountToAdd) => {
    const numAmount = parseFloat(amountToAdd) || 0;
    setProfile(prev => {
      if (!prev) return prev;
      const rawBal = parseFloat(prev.wallet_balance);
      const current = isNaN(rawBal) ? 0 : rawBal;
      const newBalance = current + numAmount;
      const updated = { ...prev, wallet_balance: newBalance };
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(updated));
      if (prev.id) {
        localStorage.setItem('lexy_wallet_balance_' + prev.id, newBalance.toString());
      }
      return updated;
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const currentMeta = session.user.user_metadata || {};
        const rawBal = parseFloat(profile?.wallet_balance);
        const currentBal = isNaN(rawBal) ? 0 : rawBal;
        const newBal = currentBal + numAmount;
        await supabase.auth.updateUser({
          data: { ...currentMeta, wallet_balance: newBal }
        });
        await supabase.from('profiles').upsert({
          id: session.user.id,
          wallet_balance: newBal,
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Error syncing wallet balance update to Supabase:', e);
    }
  };

  const saveWalletTransaction = async (newTx) => {
    if (!newTx) return;
    setProfile(prev => {
      if (!prev) return prev;
      const currentHistory = Array.isArray(prev.wallet_history) ? prev.wallet_history : [];
      if (currentHistory.some(item => item.id === newTx.id)) return prev;
      const updatedHistory = [newTx, ...currentHistory];
      const updated = { ...prev, wallet_history: updatedHistory };
      localStorage.setItem(LOCAL_STORAGE_KEY_AUTH, JSON.stringify(updated));
      // 🔒 AISLAMIENTO: Guardar historial con key del usuario
      if (prev.id) {
        localStorage.setItem(`lexy_wallet_history_${prev.id}`, JSON.stringify(updatedHistory));
      }
      return updated;
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const currentMeta = session.user.user_metadata || {};
        const currentHist = Array.isArray(currentMeta.wallet_history) ? currentMeta.wallet_history : [];
        const updatedHist = [newTx, ...currentHist.filter(h => h.id !== newTx.id)];
        await supabase.auth.updateUser({
          data: { ...currentMeta, wallet_history: updatedHist }
        });
        await supabase.from('profiles').upsert({
          id: session.user.id,
          wallet_history: updatedHist,
          updated_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn('Error saving wallet transaction to Supabase:', e);
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
      updateProfile,
      updateWalletBalance,
      saveWalletTransaction
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
