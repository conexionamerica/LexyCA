import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Base de datos de usuarios simulada (para modo local sin Supabase configurado)
  const [localUsers, setLocalUsers] = useState(() => {
    const saved = localStorage.getItem('local_demo_users');
    if (saved) return JSON.parse(saved);
    
    // Cuentas por defecto para pruebas rápidas
    return [
      {
        id: "s1-uuid-value",
        email: "tiago.barbosa@example.com",
        password: "password",
        name: "Tiago Barbosa",
        role: "student",
        wallet_balance: 100.00
      },
      {
        id: "t3-uuid-value",
        email: "alexandre.silva@example.com",
        password: "password",
        name: "Alexandre Silva",
        role: "teacher"
      },
      {
        id: "admin-uuid",
        email: "admin@conexionamerica.com",
        password: "password",
        name: "Director Admin",
        role: "admin"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('local_demo_users', JSON.stringify(localUsers));
  }, [localUsers]);

  // Cargar perfil real desde Supabase
  const fetchProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!error && data) {
        setProfile(data);
        return data;
      }
    } catch (e) {
      console.log("Supabase profile read offline.");
    }
    return null;
  }, []);

  const handleSession = useCallback(async (currentSession) => {
    setSession(currentSession);
    const currentUser = currentSession?.user ?? null;
    setUser(currentUser);
    if (currentUser) {
      setIsDemoMode(false);
      await fetchProfile(currentUser.id);
    } else {
      // Si no hay sesión de Supabase, ver si hay sesión simulada guardada
      const savedUser = sessionStorage.getItem('simulated_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        setUser({ id: u.id, email: u.email });
        setProfile({ id: u.id, name: u.name, email: u.email, role: u.role });
      } else {
        setProfile(null);
      }
    }
    setLoading(false);
  }, [fetchProfile]);

  useEffect(() => {
    // Detectar si Supabase está activo
    async function checkSupabase() {
      try {
        const { data, error } = await supabase.from('teachers').select('id').limit(1);
        if (!error) {
          setIsDemoMode(false);
          supabase.auth.getSession().then(({ data: { session } }) => {
            handleSession(session);
          });
          const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            handleSession(session);
          });
          return () => subscription.unsubscribe();
        } else {
          // Supabase no responde o es placeholder
          setIsDemoMode(true);
          handleSession(null);
        }
      } catch (e) {
        setIsDemoMode(true);
        handleSession(null);
      }
    }
    checkSupabase();
  }, [handleSession]);

  // Iniciar Sesión
  const signIn = async (email, password) => {
    if (isDemoMode) {
      const found = localUsers.find(u => u.email === email && u.password === password);
      if (found) {
        const simulatedUser = { id: found.id, email: found.email, name: found.name, role: found.role };
        sessionStorage.setItem('simulated_user', JSON.stringify(simulatedUser));
        setUser({ id: found.id, email: found.email });
        setProfile({ id: found.id, name: found.name, email: found.email, role: found.role });
        return { data: { user: { id: found.id, email: found.email } }, error: null };
      }
      return { data: null, error: { message: "Credenciales de demostración inválidas." } };
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      return { data, error };
    }
  };

  // Registrarse
  const signUp = async (email, password, name, role) => {
    if (isDemoMode) {
      const exists = localUsers.some(u => u.email === email);
      if (exists) {
        return { data: null, error: { message: "El correo electrónico ya está registrado." } };
      }

      const newId = `u-${Date.now()}`;
      const newUser = { id: newId, email, password, name, role };
      setLocalUsers(prev => [...prev, newUser]);

      // Iniciar sesión inmediatamente en modo simulación
      sessionStorage.setItem('simulated_user', JSON.stringify(newUser));
      setUser({ id: newId, email });
      setProfile({ id: newId, name, email, role });

      return { data: { user: { id: newId, email } }, error: null };
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { data: null, error };

      const newUser = data?.user;
      if (newUser) {
        // Registrar en profiles
        await supabase.from('profiles').insert([{ id: newUser.id, name, email, role }]);
        
        if (role === 'student') {
          await supabase.from('students').insert([{ id: newUser.id, name, email, wallet_balance: 100.00 }]);
        } else if (role === 'teacher') {
          await supabase.from('teachers').insert([{ id: newUser.id, name, email, hourly_rate: 60.00, bio: 'Tutor de idiomas.', status: 'pending_approval' }]);
        }
      }
      return { data, error: null };
    }
  };

  // Cerrar Sesión
  const signOut = async () => {
    if (isDemoMode) {
      sessionStorage.removeItem('simulated_user');
      setUser(null);
      setProfile(null);
    } else {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, isDemoMode, signIn, signUp, signOut, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
