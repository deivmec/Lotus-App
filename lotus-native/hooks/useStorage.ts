import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Equivalente ao useStorage web (idb-keyval → AsyncStorage)
// API idêntica: const [value, save, ready] = useStorage(key, defaultValue)

const syncToCloud = async (key: string, value: any) => {
  try {
    const userId = await AsyncStorage.getItem('auth:supabase_uid');
    if (!userId) return;
    await supabase.from('user_data').upsert(
      { user_id: userId, key, value, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,key' }
    );
  } catch (e) {
    console.warn('Cloud sync failed:', key, e);
  }
};

export function useStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then(stored => {
      if (stored !== null) {
        try { setValue(JSON.parse(stored)); } catch { setValue(stored as any); }
      }
      setReady(true);
    });
  }, [key]);

  const save = useCallback(async (newVal: T | ((prev: T) => T)) => {
    const resolved = typeof newVal === 'function'
      ? (newVal as (prev: T) => T)(value)
      : newVal;
    setValue(resolved);
    await AsyncStorage.setItem(key, JSON.stringify(resolved));
    syncToCloud(key, resolved);
    return resolved;
  }, [key, value]);

  return [value, save, ready] as const;
}
