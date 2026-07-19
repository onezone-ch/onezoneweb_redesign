/**
 * Port di storage.service.ts — wrapper localStorage SSR-safe.
 * `clearOldVersions` svuota tutto lo storage quando cambia la versione dell'app.
 */

const CURRENT_VERSION = "3.0.0"; // bump: nuova app Next.js

function hasStorage(): boolean {
  return typeof window !== "undefined";
}

export const storage = {
  setItem(field: string, value: string): void {
    if (!hasStorage()) return;
    try {
      localStorage.setItem(field, value);
    } catch (error) {
      console.error("Error setting localStorage item:", error);
    }
  },

  getItem(field: string): string {
    if (!hasStorage()) return "";
    try {
      return localStorage.getItem(field) || "";
    } catch (error) {
      console.error("Error getting localStorage item:", error);
      return "";
    }
  },

  removeItem(field: string): void {
    if (!hasStorage()) return;
    try {
      localStorage.removeItem(field);
    } catch (error) {
      console.error("Error removing localStorage item:", error);
    }
  },

  clear(): void {
    if (!hasStorage()) return;
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  },

  clearOldVersions(): void {
    if (!hasStorage()) return;
    const storedVersion = this.getItem("version");
    if (storedVersion !== CURRENT_VERSION) {
      this.clear();
    }
    this.setItem("version", CURRENT_VERSION);
  },
};
