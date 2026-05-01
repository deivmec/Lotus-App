import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';

const DEFAULT_USER = 'admin';
const DEFAULT_PASS = '1234';

export const useAuth = () => {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    Promise.all([get('auth:session'), get('auth:user')]).then(([session, user]) => {
      if (session) {
        setAuthed(true);
        setUserName(user?.name || user?.username || '');
      }
      setLoading(false);
    });
  }, []);

  const login = async (username, password) => {
    const stored = await get('auth:user');
    const u = stored?.username || DEFAULT_USER;
    const p = stored?.password || DEFAULT_PASS;
    if (username === u && password === p) {
      await set('auth:session', true);
      setUserName(stored?.name || username);
      setAuthed(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await set('auth:session', false);
    setAuthed(false);
  };

  const updateUser = async (fields) => {
    const current = (await get('auth:user')) || {};
    const next = { ...current, ...fields };
    await set('auth:user', next);
    if (fields.name !== undefined || fields.username !== undefined) {
      setUserName(next.name || next.username || '');
    }
    return next;
  };

  return { authed, loading, userName, login, logout, updateUser };
};
