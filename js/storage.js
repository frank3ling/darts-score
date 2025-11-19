// IndexedDB Storage Module for Dart Score Tracker

class DartStorage {
  constructor() {
    this.dbName = "dartscore";
    this.dbVersion = 1;
    this.storeName = "throws";
    this.db = null;
  }

  // Initialize database connection
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error("Error opening database:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("Database connected successfully");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: "id",
            autoIncrement: true,
          });

          // Create index for timestamp queries
          objectStore.createIndex("timestamp", "timestamp", { unique: false });

          console.log("Object store created");
        }
      };
    });
  }

  // Save a throw to IndexedDB
  async saveThrow(throwData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.add(throwData);

      request.onsuccess = () => {
        console.log("Throw saved successfully:", throwData);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error("Error saving throw:", request.error);
        reject(request.error);
      };
    });
  }

  // Delete a throw from IndexedDB
  async deleteThrow(throwId) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.delete(throwId);

      request.onsuccess = () => {
        console.log("Throw deleted successfully:", throwId);
        resolve();
      };

      request.onerror = () => {
        console.error("Error deleting throw:", request.error);
        reject(request.error);
      };
    });
  }

  // Get recent throws (limited number)
  async getRecentThrows(limit = 10) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.getAll();

      request.onsuccess = () => {
        const throws = request.result;
        // Sort by timestamp, newest first
        throws.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        // Return only the requested limit
        resolve(throws.slice(0, limit));
      };

      request.onerror = () => {
        console.error("Error retrieving throws:", request.error);
        reject(request.error);
      };
    });
  }

  // Check if database is available
  static isAvailable() {
    return "indexedDB" in window;
  }
}
