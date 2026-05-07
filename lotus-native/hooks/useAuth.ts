import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      if (session?.user) loadUserName(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
      if (session?.user) loadUserName(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserName = async (userId: string) => {
    await AsyncStorage.setItem('auth:supabase_uid', userId);
    const stored = await AsyncStorage.getItem('auth:user');
    if (stored) {
      try { setUserName(JSON.parse(stored)?.name || ''); } catch {}
    }
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  };

  const signup = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { ok: false, error: error.message };
    if (data.user && !data.session) return { ok: true, needsConfirm: true };
    if (name) await AsyncStorage.setItem('auth:user', JSON.stringify({ name }));
    return { ok: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await AsyncStorage.clear();
    setUserName('');
  };

  const updateUser = async (fields: Record<string, any>) => {
    const stored = await AsyncStorage.getItem('auth:user');
    const current = stored ? JSON.parse(stored) : {};
    const next = { ...current, ...fields };
    await AsyncStorage.setItem('auth:user', JSON.stringify(next));
    if (fields.name) setUserName(fields.name);
    return next;
  };

  return { authed, loading, userName, login, signup, logout, updateUser };
}
