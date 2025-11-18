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

  // Get all throws from IndexedDB
  async getAllThrows() {
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
        resolve(throws);
      };

      request.onerror = () => {
        console.error("Error retrieving throws:", request.error);
        reject(request.error);
      };
    });
  }

  // Get recent throws (limited number)
  async getRecentThrows(limit = 10) {
    try {
      const allThrows = await this.getAllThrows();
      return allThrows.slice(0, limit);
    } catch (error) {
      console.error("Error getting recent throws:", error);
      return [];
    }
  }

  // Clear all throws from storage
  async clearAllThrows() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([this.storeName], "readwrite");
      const objectStore = transaction.objectStore(this.storeName);

      const request = objectStore.clear();

      request.onsuccess = () => {
        console.log("All throws cleared");
        resolve();
      };

      request.onerror = () => {
        console.error("Error clearing throws:", request.error);
        reject(request.error);
      };
    });
  }

  // Get throws by date range
  async getThrowsByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([this.storeName], "readonly");
      const objectStore = transaction.objectStore(this.storeName);
      const index = objectStore.index("timestamp");

      const range = IDBKeyRange.bound(
        startDate.toISOString(),
        endDate.toISOString()
      );
      const request = index.getAll(range);

      request.onsuccess = () => {
        const throws = request.result;
        throws.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(throws);
      };

      request.onerror = () => {
        console.error("Error retrieving throws by date range:", request.error);
        reject(request.error);
      };
    });
  }

  // Check if database is available
  static isAvailable() {
    return "indexedDB" in window;
  }
}
