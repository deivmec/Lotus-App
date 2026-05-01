import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';

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
    return resolved;
  }, [key, value]);

  return [value, save, ready];
};
