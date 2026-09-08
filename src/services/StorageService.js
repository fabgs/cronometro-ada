/**
 * StorageService — thin abstraction over localStorage with
 * automatic JSON serialise / deserialise.
 *
 * Values that are not valid JSON (written by earlier versions as plain
 * strings) are returned as-is, so callers never need to touch localStorage
 * directly.
 */
export class StorageService {
  /**
   * Read and parse a value.
   * @param {string} key
   * @returns {*} parsed value, the raw string if not JSON, or null
   */
  get(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    } catch {
      return null;
    }
  }

  /**
   * Serialise and write a value.
   * @param {string} key
   * @param {*} value
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error('[StorageService] Error writing:', err);
    }
  }

  /**
   * Remove a key.
   * @param {string} key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error('[StorageService] Error removing:', err);
    }
  }
}

/** Singleton */
const storageService = new StorageService();
export default storageService;
