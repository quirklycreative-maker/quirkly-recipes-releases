import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { parsePersistentValue } from '@/lib/storage-utils';

export function usePersistentState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(key)
      .then((stored) => {
        if (!stored || !mounted) {
          return;
        }

        const parsed = parsePersistentValue(stored, initialValue);
        if (parsed === initialValue && stored !== JSON.stringify(initialValue)) {
          // Fall back to the shipped default if local data was corrupted.
          AsyncStorage.removeItem(key);
        }
        if (mounted) {
          setValue(parsed);
        }
      })
      .finally(() => {
        if (mounted) {
          setReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, [initialValue, key]);

  const update = useCallback(
    (nextValue: T | ((current: T) => T)) => {
      setValue((current) => {
        const resolved =
          typeof nextValue === 'function' ? (nextValue as (current: T) => T)(current) : nextValue;
        AsyncStorage.setItem(key, JSON.stringify(resolved));
        return resolved;
      });
    },
    [key]
  );

  return [value, update, ready] as const;
}
