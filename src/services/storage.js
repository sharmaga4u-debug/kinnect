/**
 * Kinnect IndexedDB Storage Service
 * Persists messages and family member profiles across app restarts.
 */
const DB_NAME   = "kinnect_v3";
const DB_VER    = 2;
const MSG_STORE = "messages";
const MBR_STORE = "members";

class StorageService {
  constructor() {
    this.db    = null;
    this.ready = this._open();
  }

  _open() {
    return new Promise((resolve) => {
      if (typeof indexedDB === "undefined") { resolve(); return; }
      const req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = ({ target: { result: db } }) => {
        if (!db.objectStoreNames.contains(MSG_STORE)) {
          const s = db.createObjectStore(MSG_STORE, { keyPath: ["scope", "id"] });
          s.createIndex("by_scope", "scope", { unique: false });
        }
        if (!db.objectStoreNames.contains(MBR_STORE)) {
          db.createObjectStore(MBR_STORE, { keyPath: "id" });
        }
      };
      req.onsuccess  = ({ target: { result: db } }) => { this.db = db; resolve(); };
      req.onerror    = () => resolve();
      req.onblocked  = () => resolve();
    });
  }

  async _getByScopeRange(range) {
    await this.ready;
    if (!this.db) return [];
    return new Promise((resolve) => {
      try {
        const tx  = this.db.transaction(MSG_STORE, "readonly");
        const req = tx.objectStore(MSG_STORE).index("by_scope").getAll(range);
        req.onsuccess = () => resolve(req.result || []);
        req.onerror   = () => resolve([]);
      } catch { resolve([]); }
    });
  }

  async getMessages(scope, limit = 200) {
    const all = await this._getByScopeRange(IDBKeyRange.only(scope));
    return all.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)).slice(-limit);
  }

  /** All messages whose scope starts with `prefix`, grouped by scope and sorted oldest → newest. */
  async getMessagesByPrefix(prefix, limitPerScope = 300) {
    const all = await this._getByScopeRange(IDBKeyRange.bound(prefix, prefix + "￿"));
    const grouped = {};
    for (const m of all) (grouped[m.scope] ||= []).push(m);
    for (const scope of Object.keys(grouped)) {
      grouped[scope] = grouped[scope]
        .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0))
        .slice(-limitPerScope);
    }
    return grouped;
  }

  async saveMessage(scope, msg) {
    await this.ready;
    if (!this.db || !msg?.id) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(MSG_STORE, "readwrite");
        tx.objectStore(MSG_STORE).put({ ...msg, scope, timestamp: msg.timestamp || Date.now() });
        tx.oncomplete = resolve;
        tx.onerror    = resolve;
      } catch { resolve(); }
    });
  }

  async saveMember(member) {
    await this.ready;
    if (!this.db || !member?.id) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(MBR_STORE, "readwrite");
        tx.objectStore(MBR_STORE).put({ ...member, savedAt: Date.now() });
        tx.oncomplete = resolve;
        tx.onerror    = resolve;
      } catch { resolve(); }
    });
  }

  async deleteMember(id) {
    await this.ready;
    if (!this.db || !id) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction(MBR_STORE, "readwrite");
        tx.objectStore(MBR_STORE).delete(id);
        tx.oncomplete = resolve;
        tx.onerror    = resolve;
      } catch { resolve(); }
    });
  }

  // Wipe everything stored on this phone (account deletion)
  async clearAll() {
    await this.ready;
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db.transaction([MSG_STORE, MBR_STORE], "readwrite");
        tx.objectStore(MSG_STORE).clear();
        tx.objectStore(MBR_STORE).clear();
        tx.oncomplete = resolve;
        tx.onerror    = resolve;
      } catch { resolve(); }
    });
  }

  async getMembers() {
    await this.ready;
    if (!this.db) return [];
    return new Promise((resolve) => {
      try {
        const req = this.db.transaction(MBR_STORE, "readonly").objectStore(MBR_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror   = () => resolve([]);
      } catch { resolve([]); }
    });
  }
}

export const storage = new StorageService();
export default storage;
