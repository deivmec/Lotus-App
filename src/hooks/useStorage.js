import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';
import { supabase } from '../lib/supabase';

const syncToCloud = async (key, value) => {
  const userId = await get('auth:supabase_uid');
  if (!userId) return;
  const { error } = await supabase.from('user_data').upsert(
    { user_id: userId, key, value, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,key' }
  );
  if (error) console.warn('Cloud sync failed:', key, error.message);
};

export const useStorage = (key, defaultValue) => {
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    get(key).then(stored => {
      if (stored !== undefined) setValue(stored);
      setReady(true);
    });
  }, [key]);

  const save = useCallback(async (newVal) => {
    const resolved = typeof newVal === 'function' ? newVal(value) : newVal;
    setValue(resolved);
    await set(key, resolved);
    syncToCloud(key, resolved);
    return resolved;
  }, [key, value]);

  return [value, save, ready];
};
