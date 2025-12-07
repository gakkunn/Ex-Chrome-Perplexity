type StorageAreaName = 'sync' | 'local' | 'session';

const DEFAULT_AREA: StorageAreaName = 'sync';

export async function readStorage<T>(
  key: string,
  area: StorageAreaName = DEFAULT_AREA,
): Promise<T | undefined> {
  const storage = chrome?.storage?.[area];
  if (!storage) {
    return undefined;
  }
  return new Promise<T | undefined>((resolve, reject) => {
    try {
      storage.get(key, (result) => {
        if (chrome.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(result?.[key] as T | undefined);
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export async function writeStorage<T>(
  key: string,
  value: T,
  area: StorageAreaName = DEFAULT_AREA,
): Promise<void> {
  const storage = chrome?.storage?.[area];
  if (!storage) {
    return;
  }
  return new Promise<void>((resolve, reject) => {
    try {
      storage.set({ [key]: value }, () => {
        if (chrome.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}
