/**
 * Minimal promise wrapper around IndexedDB.
 * All application data lives on the device in this database.
 */

export const DB_NAME = 'stash';
export const DB_VERSION = 1;
/**
 * Database name used before 1.2.2 (when the app was called Reels Organizer).
 * On first open its data is copied into DB_NAME and the old database is
 * deleted only after the copy has committed, so a failed or interrupted
 * migration simply runs again on the next launch.
 */
export const LEGACY_DB_NAMES = ['reels-organizer'];
const STORES = ['reels', 'categories', 'settings'];

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
      const legacy = name === DB_NAME ? LEGACY_DB_NAMES : [];
      migrateLegacy(factory, db, legacy)
        .catch((e) => console.warn('Legacy database migration failed; will retry on next launch', e))
        .then(() => resolve(db));
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error('Database upgrade blocked by another open tab'));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

/**
 * Opens an existing database by name, or resolves null when it does not exist
 * (the implicit creation is aborted so no empty database is left behind).
 */
function openExisting(factory, name) {
  return new Promise((resolve) => {
    let missing = false;
    let r;
    try {
      r = factory.open(name);
    } catch {
      resolve(null);
      return;
    }
    r.onupgradeneeded = (ev) => {
      if (ev.oldVersion === 0) {
        missing = true;
        r.transaction.abort();
      }
    };
    r.onsuccess = () => {
      if (missing) {
        r.result.close();
        resolve(null);
      } else resolve(r.result);
    };
    r.onerror = (ev) => {
      ev.preventDefault?.();
      resolve(null);
    };
    r.onblocked = () => resolve(null);
  });
}

function readAll(db, store) {
  return new Promise((resolve, reject) => {
    if (!db.objectStoreNames.contains(store)) {
      resolve([]);
      return;
    }
    const q = db.transaction([store], 'readonly').objectStore(store).getAll();
    q.onsuccess = () => resolve(q.result || []);
    q.onerror = () => reject(q.error);
  });
}

/** Copy every legacy database into `db`, then delete the legacy one. */
async function migrateLegacy(factory, db, names) {
  for (const legacyName of names) {
    const old = await openExisting(factory, legacyName);
    if (!old) continue;
    let data;
    try {
      data = Object.fromEntries(await Promise.all(STORES.map(async (s) => [s, await readAll(old, s)])));
    } finally {
      old.close();
    }
    await new Promise((resolve, reject) => {
      const t = db.transaction(STORES, 'readwrite');
      const reels = t.objectStore('reels');
      for (const r of data.reels) {
        // Never overwrite something already in the new database; skip a reel
        // whose link was saved again after an earlier, interrupted migration.
        const byId = reels.get(r.id);
        byId.onsuccess = () => {
          if (byId.result) return;
          const byKey = reels.index('key').get(r.key);
          byKey.onsuccess = () => {
            if (!byKey.result) reels.add(r);
          };
        };
      }
      for (const c of data.categories) {
        const cats = t.objectStore('categories');
        const g = cats.get(c.id);
        g.onsuccess = () => {
          if (!g.result) cats.add(c);
        };
      }
      for (const st of data.settings) {
        const settings = t.objectStore('settings');
        const g = settings.get(st.key);
        g.onsuccess = () => {
          if (!g.result) settings.add(st);
        };
      }
      t.oncomplete = resolve;
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error || new Error('Migration aborted'));
    });
    // Only now that the copy is committed is the old database removed.
    await new Promise((resolve) => {
      const d = factory.deleteDatabase(legacyName);
      d.onsuccess = d.onerror = d.onblocked = () => resolve();
    });
  }
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
