export function parsePersistentValue<T>(stored: string | null, fallback: T) {
  if (!stored) {
    return fallback;
  }

  try {
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}
