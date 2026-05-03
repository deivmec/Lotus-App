import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { supabase } from '../lib/supabase';

const syncFromSupabase = async (userId) => {
  const { data, error } = await supabase
    .from('user_data')
    .select('key, value')
    .eq('user_id', userId);
  if (error || !data) return;
  await Promise.all(data.map(row => set(row.key, row.value)));
};

export const useAuth = () => {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        await set('auth:supabase_uid', u.id);
        await syncFromSupabase(u.id);
        const name = u.user_metadata?.name || u.email?.split('@')[0] || '';
        await set('auth:user', { name, email: u.email, ...((await get('auth:user')) || {}) });
        setUserName(name);
        setAuthed(true);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        await set('auth:supabase_uid', null);
        setAuthed(false);
        setUserName('');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    const u = data.user;
    await set('auth:supabase_uid', u.id);
    await syncFromSupabase(u.id);
    const name = u.user_metadata?.name || email.split('@')[0];
    const current = (await get('auth:user')) || {};
    await set('auth:user', { ...current, name, email });
    setUserName(name);
    setAuthed(true);
    return { ok: true };
  };

  const signup = async (email, password, name) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { ok: false, error: error.message };
    if (data.session) {
      const u = data.user;
      await set('auth:supabase_uid', u.id);
      await set('auth:user', { name: name || email.split('@')[0], email });
      setUserName(name || email.split('@')[0]);
      setAuthed(true);
      return { ok: true };
    }
    return { ok: true, needsConfirm: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    await set('auth:supabase_uid', null);
    setAuthed(false);
    setUserName('');
  };

  const updateUser = async (fields) => {
    const authUpdates = {};
    if (fields.email) authUpdates.email = fields.email;
    if (fields.password) authUpdates.password = fields.password;
    const metaUpdates = {};
    if (fields.name) metaUpdates.name = fields.name;

    if (Object.keys(authUpdates).length || Object.keys(metaUpdates).length) {
      supabase.auth.updateUser({
        ...authUpdates,
        ...(Object.keys(metaUpdates).length ? { data: metaUpdates } : {}),
      }).catch(e => console.warn('Supabase updateUser:', e.message));
    }

    const current = (await get('auth:user')) || {};
    const next = { ...current, ...fields };
    await set('auth:user', next);
    if (fields.name) setUserName(fields.name);
    return next;
  };

  return { authed, loading, userName, login, signup, logout, updateUser };
};
