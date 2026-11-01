const DB_NAME = 'soundlab';
const DB_VERSION = 1;
const SETTINGS_PREFIX = 'soundlab.settings.';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('sources')) db.createObjectStore('sources', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('bakes')) db.createObjectStore('bakes', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });
  return dbPromise;
}

function isQuota(err) {
  return err && (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
}

async function txDone(tx) {
  await new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('storage aborted'));
  });
}

export async function idbPut(store, value) {
  try {
    const db = await openDb();
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).put(value);
    await txDone(tx);
  } catch (err) {
    if (isQuota(err)) {
      const quota = new Error('Storage is full.');
      quota.code = 'storage_full';
      throw quota;
    }
    throw err;
  }
}

export async function idbGet(store, id) {
  const db = await openDb();
  const tx = db.transaction(store, 'readonly');
  const req = tx.objectStore(store).get(id);
  const value = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  return value;
}

export async function idbAll(store) {
  const db = await openDb();
  const tx = db.transaction(store, 'readonly');
  const req = tx.objectStore(store).getAll();
  const value = await new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
  await txDone(tx);
  return value;
}

export async function idbDelete(store, id) {
  const db = await openDb();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(id);
  await txDone(tx);
}

export const settings = {
  get(key) {
    try {
      const raw = localStorage.getItem(SETTINGS_PREFIX + key);
      if (raw == null) return key === 'lite' ? false : null;
      return JSON.parse(raw);
    } catch {
      return key === 'lite' ? false : null;
    }
  },
  set(key, value) {
    localStorage.setItem(SETTINGS_PREFIX + key, JSON.stringify(value));
  },
};
