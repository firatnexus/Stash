/**
 * Minimal promise wrapper around IndexedDB.
 * All application data lives on the device in this database.
 */

export const DB_NAME = 'reels-organizer';
export const DB_VERSION = 1;

let dbPromise = null;

function idb() {
  // globalThis.indexedDB in browsers / WebView; fake-indexeddb in unit tests
  return globalThis.indexedDB;
}

export function openDb(name = DB_NAME) {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const factory = idb();
    if (!factory) {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    const req = factory.open(name, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('reels')) {
        const s = db.createObjectStore('reels', { keyPath: 'id' });
        s.createIndex('key', 'key', { unique: true });
        s.createIndex('addedAt', 'addedAt');
        s.createIndex('categoryId', 'categoryId');
      }
      if (!db.objectStoreNames.contains('categories')) {
        db.createObjectStore('categories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Database upgrade blocked by another open tab'));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

/** Close and forget the connection (used by tests and full reset). */
export async function closeDb() {
  if (!dbPromise) return;
  try {
    (await dbPromise).close();
  } catch {
    /* ignore */
  }
  dbPromise = null;
}

function wrap(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Run fn inside a transaction; resolves after the transaction commits.
 * @param {string[]} stores
 * @param {'readonly'|'readwrite'} mode
 * @param {(stores: Record<string, IDBObjectStore>) => any} fn
 */
export async function tx(stores, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(stores, mode);
    const map = Object.fromEntries(stores.map((n) => [n, t.objectStore(n)]));
    let result;
    Promise.resolve()
      .then(() => fn(map))
      .then((r) => {
        result = r;
      })
      .catch((e) => {
        try {
          t.abort();
        } catch {
          /* already finished */
        }
        reject(e);
      });
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error('Transaction aborted'));
  });
}

export const req = wrap;

export async function getAll(store) {
  return tx([store], 'readonly', (s) => wrap(s[store].getAll()));
}

export async function get(store, key) {
  return tx([store], 'readonly', (s) => wrap(s[store].get(key)));
}

export async function put(store, value) {
  return tx([store], 'readwrite', (s) => wrap(s[store].put(value)));
}

export async function del(store, key) {
  return tx([store], 'readwrite', (s) => wrap(s[store].delete(key)));
}
