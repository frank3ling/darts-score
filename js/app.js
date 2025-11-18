// Dart Score Tracker - Main Application Logic

class DartScoreTracker {
  constructor() {
    this.currentThrow = {
      pfeil1: null,
      pfeil2: null,
      pfeil3: null,
    };
    this.currentArrow = 1; // Which arrow we're currently on (1, 2, or 3)
    this.throwHistory = []; // Store last throws
    this.maxHistoryItems = 3; // Keep only last 3 throws
    this.storage = new DartStorage(); // IndexedDB storage

    this.init();
  }

  async init() {
    try {
      // Initialize IndexedDB
      await this.storage.init();
      console.log("Storage initialized successfully");

      // Load existing throws
      await this.loadThrowHistory();
    } catch (error) {
      console.error("Failed to initialize storage:", error);
      // Continue with in-memory storage as fallback
    }

    this.bindEvents();
    this.updateDisplay();
  }

  bindEvents() {
    // Action buttons
    document
      .getElementById("btn-single")
      .addEventListener("click", () => this.recordHit("single"));
    document
      .getElementById("btn-double")
      .addEventListener("click", () => this.recordHit("double"));
    document
      .getElementById("btn-triple")
      .addEventListener("click", () => this.recordHit("triple"));
    document
      .getElementById("btn-miss")
      .addEventListener("click", () => this.recordHit("miss"));

    // Top action buttons
    document
      .getElementById("btn-undo")
      .addEventListener("click", () => this.undoLastArrow());
    document
      .getElementById("btn-stats")
      .addEventListener("click", () => this.showStats());
    document
      .getElementById("btn-settings")
      .addEventListener("click", () => this.showSettings());

    // Settings page buttons
    document
      .getElementById("btn-close-modal")
      .addEventListener("click", () => this.hideSettings());
    document
      .getElementById("btn-clear-data")
      .addEventListener("click", () => this.clearAllData());

    // Close modal when clicking backdrop
    document
      .querySelector(".modal-backdrop")
      .addEventListener("click", () => this.hideSettings());
  }

  recordHit(type) {
    if (this.currentArrow > 3) {
      alert(
        "Wurf bereits abgeschlossen. Bitte zuerst speichern oder zurücksetzen."
      );
      return;
    }

    const targetNumber = document.getElementById("target-number").value;
    let value;

    switch (type) {
      case "single":
        value = targetNumber;
        break;
      case "double":
        value = `D${targetNumber}`;
        break;
      case "triple":
        value = `T${targetNumber}`;
        break;
      case "miss":
        value = "0";
        break;
      default:
        return;
    }

    // Record the hit
    this.currentThrow[`pfeil${this.currentArrow}`] = value;
    this.currentArrow++;

    this.updateDisplay();

    // Auto-save when all 3 arrows are recorded
    if (this.currentArrow > 3) {
      setTimeout(() => {
        this.saveThrow();
      }, 500); // Brief delay to show the final result
    }
  }

  updateDisplay() {
    // Update the display for each arrow
    for (let i = 1; i <= 3; i++) {
      const element = document.getElementById(`pfeil${i}-value`);
      const value = this.currentThrow[`pfeil${i}`];
      element.textContent = value || "-";
    }
  }

  resetThrow() {
    this.currentThrow = {
      pfeil1: null,
      pfeil2: null,
      pfeil3: null,
    };
    this.currentArrow = 1;
    this.updateDisplay();
  }

  async saveThrow() {
    // Check if we have at least one arrow recorded
    if (!this.currentThrow.pfeil1) {
      alert("Bitte mindestens einen Pfeil werfen bevor gespeichert wird.");
      return;
    }

    // Create throw record with timestamp
    const throwRecord = {
      timestamp: new Date().toISOString(),
      pfeil1: this.currentThrow.pfeil1 || "0",
      pfeil2: this.currentThrow.pfeil2 || "0",
      pfeil3: this.currentThrow.pfeil3 || "0",
    };

    try {
      // Save to IndexedDB
      await this.storage.saveThrow(throwRecord);
      console.log("Throw saved to IndexedDB:", throwRecord);

      // Add to in-memory history for immediate display
      this.addToHistory(throwRecord);
    } catch (error) {
      console.error("Error saving throw:", error);
      // Fallback to in-memory only
      this.addToHistory(throwRecord);
    }

    // Reset for next throw
    this.resetThrow();
  }

  undoLastArrow() {
    if (this.currentArrow === 1) {
      // No arrows to undo
      return;
    }

    // Move back one arrow
    this.currentArrow--;
    this.currentThrow[`pfeil${this.currentArrow}`] = null;

    this.updateDisplay();
  }

  calculateThrowSum(throwRecord) {
    const values = [throwRecord.pfeil1, throwRecord.pfeil2, throwRecord.pfeil3];
    let sum = 0;

    for (const value of values) {
      if (!value || value === "0" || value === "MISS") {
        continue;
      }

      let points = 0;
      if (value.startsWith("D")) {
        // Double
        points = parseInt(value.substring(1)) * 2;
      } else if (value.startsWith("T")) {
        // Triple
        points = parseInt(value.substring(1)) * 3;
      } else {
        // Single
        points = parseInt(value);
      }

      if (!isNaN(points)) {
        sum += points;
      }
    }

    return sum;
  }

  getBadgeForSum(sum) {
    if (sum === 0) {
      return { text: "0", class: "badge-zero" };
    } else if (sum === 180) {
      return { text: "180", class: "badge-max" };
    } else if (sum === 140) {
      return { text: "140", class: "badge-good" };
    } else if (sum > 140) {
      return { text: "140+", class: "badge-excellent" };
    } else if (sum === 100) {
      return { text: "100", class: "badge-ok" };
    } else if (sum > 100) {
      return { text: "100+", class: "badge-decent" };
    }

    return null; // No badge for sums below 100 (except 0)
  }

  showStats() {
    // Placeholder for statistics functionality
    alert("Statistiken werden hier angezeigt.\n(Noch nicht implementiert)");
  }

  showSettings() {
    document.getElementById("settings-modal").classList.remove("hidden");
  }

  hideSettings() {
    document.getElementById("settings-modal").classList.add("hidden");
  }

  async clearAllData() {
    const confirmed = confirm(
      "Sind Sie sicher, dass Sie alle Daten löschen möchten?\n\nDiese Aktion kann nicht rückgängig gemacht werden."
    );

    if (!confirmed) {
      return;
    }

    try {
      // Clear IndexedDB
      await this.storage.clearAllThrows();

      // Clear in-memory history
      this.throwHistory = [];
      this.updateHistoryDisplay();

      // Show success message
      alert("Alle Daten wurden erfolgreich gelöscht.");

      // Go back to main page
      this.hideSettings();
    } catch (error) {
      console.error("Error clearing data:", error);
      alert("Fehler beim Löschen der Daten. Bitte versuchen Sie es erneut.");
    }
  }

  addToHistory(throwRecord) {
    // Add new throw to beginning of history
    this.throwHistory.unshift(throwRecord);

    // Keep only the last maxHistoryItems
    if (this.throwHistory.length > this.maxHistoryItems) {
      this.throwHistory = this.throwHistory.slice(0, this.maxHistoryItems);
    }

    this.updateHistoryDisplay();
  }

  updateHistoryDisplay() {
    const historyList = document.getElementById("history-list");

    if (this.throwHistory.length === 0) {
      historyList.innerHTML =
        '<div class="history-placeholder">Noch keine Würfe</div>';
      return;
    }

    const today = new Date();
    const todayDateString = today.toDateString();

    historyList.innerHTML = this.throwHistory
      .map((throwRecord) => {
        const throwDate = new Date(throwRecord.timestamp);
        const isToday = throwDate.toDateString() === todayDateString;

        let timeString;
        if (isToday) {
          timeString = throwDate.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          });
        } else {
          timeString =
            throwDate.toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
            }) +
            " " +
            throwDate.toLocaleTimeString("de-DE", {
              hour: "2-digit",
              minute: "2-digit",
            });
        }

        // Calculate sum and badge
        const sum = this.calculateThrowSum(throwRecord);
        const badge = this.getBadgeForSum(sum);
        const badgeHtml = badge
          ? `<span class="badge ${badge.class}">${badge.text}</span>`
          : "";

        return `
        <div class="history-item">
          <span class="history-throw">${throwRecord.pfeil1} / ${throwRecord.pfeil2} / ${throwRecord.pfeil3}</span>
          <div class="history-right">
            ${badgeHtml}
            <span class="history-time">${timeString}</span>
          </div>
        </div>
      `;
      })
      .join("");
  }

  async loadThrowHistory() {
    try {
      const recentThrows = await this.storage.getRecentThrows(
        this.maxHistoryItems
      );
      this.throwHistory = recentThrows;
      this.updateHistoryDisplay();
      console.log(`Loaded ${recentThrows.length} throws from storage`);
    } catch (error) {
      console.error("Error loading throw history:", error);
      this.throwHistory = [];
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new DartScoreTracker();
});
