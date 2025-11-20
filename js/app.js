// Dart Score Tracker - Main Application Logic

class DartScoreTracker {
  constructor() {
    this.currentThrow = {
      dart1: null,
      dart2: null,
      dart3: null,
    };
    this.currentArrow = 1; // Which dart we're currently on (1, 2, or 3)
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
    this.onTargetNumberChange(); // Initialize button states
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

    // Statistics page button
    document
      .getElementById("btn-stats-back")
      .addEventListener("click", () => this.hideStats());

    // Target number dropdown change
    document
      .getElementById("target-number")
      .addEventListener("change", () => this.onTargetNumberChange());
  }

  onTargetNumberChange() {
    const targetNumber = document.getElementById("target-number").value;
    const tripleButton = document.getElementById("btn-triple");

    if (targetNumber === "25") {
      // Disable triple button for 25 (no triple bullseye on dartboard)
      tripleButton.disabled = true;
      tripleButton.style.opacity = "0.5";
      tripleButton.style.cursor = "not-allowed";
    } else {
      // Enable triple button for all other numbers
      tripleButton.disabled = false;
      tripleButton.style.opacity = "1";
      tripleButton.style.cursor = "pointer";
    }
  }

  recordHit(type) {
    if (this.currentArrow > 3) {
      alert("Throw already completed. Please save or reset first.");
      return;
    }

    // Prevent triple hit when target is 25 (no triple bullseye)
    if (
      type === "triple" &&
      document.getElementById("target-number").value === "25"
    ) {
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
    this.currentThrow[`dart${this.currentArrow}`] = value;
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
      const element = document.getElementById(`dart${i}-value`);
      const value = this.currentThrow[`dart${i}`];
      element.textContent = value || "-";
    }
  }

  async saveThrow() {
    // Check if we have at least one arrow recorded
    if (!this.currentThrow.dart1) {
      alert("Please throw at least one dart before saving.");
      return;
    }

    // Create throw record with timestamp
    const throwRecord = {
      timestamp: new Date().toISOString(),
      dart1: this.currentThrow.dart1 || "0",
      dart2: this.currentThrow.dart2 || "0",
      dart3: this.currentThrow.dart3 || "0",
    };

    try {
      // Save to IndexedDB
      await this.storage.saveThrow(throwRecord);
      console.log("Throw saved to IndexedDB:", throwRecord);

      // Add to in-memory history for immediate display
      this.throwHistory.unshift(throwRecord);
      if (this.throwHistory.length > this.maxHistoryItems) {
        this.throwHistory = this.throwHistory.slice(0, this.maxHistoryItems);
      }
      this.updateHistoryDisplay();
    } catch (error) {
      console.error("Error saving throw:", error);
      // Fallback: still add to in-memory history
      this.throwHistory.unshift(throwRecord);
      if (this.throwHistory.length > this.maxHistoryItems) {
        this.throwHistory = this.throwHistory.slice(0, this.maxHistoryItems);
      }
      this.updateHistoryDisplay();
    }

    // Reset current throw
    this.currentThrow = {
      dart1: null,
      dart2: null,
      dart3: null,
    };
    this.currentArrow = 1;
    this.updateDisplay();
  }

  undoLastArrow() {
    if (this.currentArrow === 1) {
      // No arrows to undo
      return;
    }

    // Move back one arrow
    this.currentArrow--;
    this.currentThrow[`dart${this.currentArrow}`] = null;

    this.updateDisplay();
  }

  calculateThrowSum(throwRecord) {
    const values = [throwRecord.dart1, throwRecord.dart2, throwRecord.dart3];
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

  countArrowsInThrow(throwRecord) {
    const values = [throwRecord.dart1, throwRecord.dart2, throwRecord.dart3];
    let count = 0;

    for (const value of values) {
      if (value && value !== null && value !== undefined) {
        count++;
      }
    }

    return count;
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

  isTarget20Throw(throwRecord) {
    // Check if this throw was made while target was set to 20
    // For now, we'll assume most throws are target 20 unless specified otherwise
    // This could be enhanced by storing target info with each throw
    return true; // Simplified for now - all throws count as target 20
  }

  updateLast30Stats(darts) {
    if (darts.length === 0) {
      // Reset all stats to 0
      document.getElementById("misses-30").textContent = "0";
      document.getElementById("singles-30").textContent = "0";
      document.getElementById("doubles-30").textContent = "0";
      document.getElementById("triples-30").textContent = "0";
      document.getElementById("accuracy-overall-30").textContent = "0.0%";
      document.getElementById("accuracy-dart1-30").textContent = "0.0%";
      document.getElementById("accuracy-dart2-30").textContent = "0.0%";
      document.getElementById("accuracy-dart3-30").textContent = "0.0%";
      document.getElementById("count-80-30").textContent = "0";
      document.getElementById("count-100-30").textContent = "0";
      document.getElementById("count-100plus-30").textContent = "0";
      document.getElementById("count-140-30").textContent = "0";
      document.getElementById("count-180s-30").textContent = "0";
      return;
    }

    // Count dart types
    let misses = 0,
      singles = 0,
      doubles = 0,
      triples = 0;

    // Separate darts by position for accuracy calculation
    const dart1Array = [],
      dart2Array = [],
      dart3Array = [];

    darts.forEach((dart, index) => {
      const pos = index % 3; // 0=dart1, 1=dart2, 2=dart3
      if (pos === 0) dart1Array.push(dart);
      else if (pos === 1) dart2Array.push(dart);
      else dart3Array.push(dart);

      if (!dart || dart === "0" || dart === "MISS") {
        misses++;
      } else if (dart.startsWith("D")) {
        doubles++;
      } else if (dart.startsWith("T")) {
        triples++;
      } else {
        singles++;
      }
    });

    // Calculate accuracy (non-miss percentage)
    const totalDarts = darts.length;
    const hits = totalDarts - misses;
    const overallAccuracy = totalDarts > 0 ? (hits / totalDarts) * 100 : 0;

    const dart1Accuracy =
      dart1Array.length > 0
        ? (dart1Array.filter((d) => d && d !== "0" && d !== "MISS").length /
            dart1Array.length) *
          100
        : 0;
    const dart2Accuracy =
      dart2Array.length > 0
        ? (dart2Array.filter((d) => d && d !== "0" && d !== "MISS").length /
            dart2Array.length) *
          100
        : 0;
    const dart3Accuracy =
      dart3Array.length > 0
        ? (dart3Array.filter((d) => d && d !== "0" && d !== "MISS").length /
            dart3Array.length) *
          100
        : 0;

    // Group darts into throws of 3 for score-based statistics
    const throws = [];
    for (let i = 0; i < darts.length; i += 3) {
      const throwDarts = darts.slice(i, i + 3);
      if (throwDarts.length === 3) {
        const throwScore = throwDarts.reduce(
          (sum, dart) => sum + this.calculateDartValue(dart),
          0
        );
        throws.push(throwScore);
      }
    }

    // Count score-based achievements
    const count80 = throws.filter((score) => score === 80).length;
    const count100 = throws.filter((score) => score === 100).length;
    const count100plus = throws.filter((score) => score > 100).length;
    const count140 = throws.filter((score) => score === 140).length;
    const count180s = throws.filter((score) => score === 180).length;

    // Update UI
    document.getElementById("misses-30").textContent = misses;
    document.getElementById("singles-30").textContent = singles;
    document.getElementById("doubles-30").textContent = doubles;
    document.getElementById("triples-30").textContent = triples;
    document.getElementById("accuracy-overall-30").textContent =
      overallAccuracy.toFixed(1) + "%";
    document.getElementById("accuracy-dart1-30").textContent =
      dart1Accuracy.toFixed(1) + "%";
    document.getElementById("accuracy-dart2-30").textContent =
      dart2Accuracy.toFixed(1) + "%";
    document.getElementById("accuracy-dart3-30").textContent =
      dart3Accuracy.toFixed(1) + "%";
    document.getElementById("count-80-30").textContent = count80;
    document.getElementById("count-100-30").textContent = count100;
    document.getElementById("count-100plus-30").textContent = count100plus;
    document.getElementById("count-140-30").textContent = count140;
    document.getElementById("count-180s-30").textContent = count180s;
  }

  calculateDartValue(dart) {
    if (!dart || dart === "0" || dart === "MISS") {
      return 0;
    }

    if (dart.startsWith("D")) {
      return parseInt(dart.substring(1)) * 2;
    } else if (dart.startsWith("T")) {
      return parseInt(dart.substring(1)) * 3;
    } else {
      return parseInt(dart);
    }
  }

  showStats() {
    console.log("showStats() called");
    this.updateStatistics();
    document.getElementById("stats-page").classList.remove("hidden");
  }

  hideStats() {
    document.getElementById("stats-page").classList.add("hidden");
  }

  async updateStatistics() {
    console.log("updateStatistics() called");
    try {
      // Get all throws from storage (using getRecentThrows with large limit)
      const allThrows = await this.storage.getRecentThrows(1000);

      let totalThrows = allThrows.length;
      let totalArrows = 0;

      // Target 20 specific counters
      let count180s_20 = 0;
      let count140plus_20 = 0;
      let count100plus_20 = 0;
      let exactCount100_20 = 0;
      let exactCount140_20 = 0;
      let exactCount80_20 = 0;
      let exactCount60_20 = 0;
      let exactCount0_20 = 0;

      // Collect all darts for last 30 analysis
      const allDarts = [];

      allThrows.forEach((throwRecord) => {
        const score = this.calculateThrowSum(throwRecord);

        // Count total arrows in this throw
        const arrowsInThrow = this.countArrowsInThrow(throwRecord);
        totalArrows += arrowsInThrow;

        // Collect individual dart values
        [throwRecord.dart1, throwRecord.dart2, throwRecord.dart3].forEach(
          (dart) => {
            if (dart && dart !== null) {
              allDarts.push(dart);
            }
          }
        );

        // Check if this is a target 20 throw (for now, count all throws)
        const isTarget20 = this.isTarget20Throw(throwRecord);

        if (isTarget20) {
          if (score === 180) {
            count180s_20++;
          } else if (score === 140) {
            exactCount140_20++;
            count140plus_20++;
          } else if (score > 140) {
            count140plus_20++;
          } else if (score === 100) {
            exactCount100_20++;
            count100plus_20++;
          } else if (score > 100) {
            count100plus_20++;
          } else if (score === 80) {
            exactCount80_20++;
          } else if (score === 60) {
            exactCount60_20++;
          } else if (score === 0) {
            exactCount0_20++;
          }
        }
      });

      // Update General Statistics
      document.getElementById("total-throws").textContent = totalThrows;
      document.getElementById("total-arrows").textContent = totalArrows;

      // Update Target 20 Statistics
      document.getElementById("total-180s-20").textContent = count180s_20;
      document.getElementById("total-140plus-20").textContent = count140plus_20;
      document.getElementById("total-100plus-20").textContent = count100plus_20;
      document.getElementById("exact-100s-20").textContent = exactCount100_20;
      document.getElementById("exact-140s-20").textContent = exactCount140_20;
      document.getElementById("exact-80s-20").textContent = exactCount80_20;
      document.getElementById("exact-60s-20").textContent = exactCount60_20;
      document.getElementById("exact-0s-20").textContent = exactCount0_20;

      // Update Last 30 Darts Statistics
      const last30Darts = allDarts.slice(-30);
      this.updateLast30Stats(last30Darts);

      console.log("Stats updated:", {
        totalThrows,
        target20_180s: count180s_20,
        last30Count: last30Darts.length,
      });

      // Update history UI
      this.updateStatsHistory(allThrows.slice(0, 30));
    } catch (error) {
      console.error("Error updating statistics:", error);
    }
  }

  updateStatsHistory(throws) {
    const historyList = document.getElementById("stats-history-list");

    if (throws.length === 0) {
      historyList.innerHTML =
        '<div class="history-placeholder">No throws yet</div>';
      return;
    }

    const today = new Date();
    const todayDateString = today.toDateString();

    historyList.innerHTML = throws
      .map((throwRecord) => {
        const throwDate = new Date(throwRecord.timestamp);
        const isToday = throwDate.toDateString() === todayDateString;

        let timeString;
        if (isToday) {
          timeString = throwDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
        } else {
          timeString =
            throwDate.toLocaleDateString("en-US", {
              day: "2-digit",
              month: "2-digit",
            }) +
            " " +
            throwDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
        }

        // Calculate sum for deletion reference, no badge display
        const sum = this.calculateThrowSum(throwRecord);
        const deleteId = throwRecord.id || throwRecord.timestamp;

        return `
        <div class="history-item">
          <div class="history-left">
            <span class="history-throw">${throwRecord.dart1} / ${throwRecord.dart2} / ${throwRecord.dart3}</span>
            <div class="history-right">
              <span class="history-time">${timeString}</span>
            </div>
          </div>
          <button class="delete-btn" onclick="deleteThrowGlobal('${deleteId}')">×</button>
        </div>
      `;
      })
      .join("");
  }

  updateHistoryDisplay() {
    const historyList = document.getElementById("history-list");

    if (this.throwHistory.length === 0) {
      historyList.innerHTML =
        '<div class="history-placeholder">No throws yet</div>';
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
          timeString = throwDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });
        } else {
          timeString =
            throwDate.toLocaleDateString("en-US", {
              day: "2-digit",
              month: "2-digit",
            }) +
            " " +
            throwDate.toLocaleTimeString("en-US", {
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
          <span class="history-throw">${throwRecord.dart1} / ${throwRecord.dart2} / ${throwRecord.dart3}</span>
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
let dartApp;

window.deleteThrowGlobal = function (throwId) {
  if (!confirm("Delete throw?")) return;

  // Open IndexedDB directly - use same DB name as storage class
  const request = indexedDB.open("dartscore", 1);

  request.onsuccess = function (event) {
    const db = event.target.result;
    const transaction = db.transaction(["throws"], "readwrite");
    const store = transaction.objectStore("throws");

    const deleteRequest = store.delete(parseInt(throwId));

    deleteRequest.onsuccess = function () {
      console.log("Delete successful, updating displays...");

      // Update both main page history and stats page
      if (window.dartApp) {
        // Reload main page history (async)
        window.dartApp.loadThrowHistory().then(() => {
          console.log("Main page history reloaded");
        });

        // Update stats page if it's visible
        if (
          !document.getElementById("stats-page").classList.contains("hidden")
        ) {
          window.dartApp.updateStatistics().then(() => {
            console.log("Stats page updated");
          });
        }
      }

      console.log("Throw deleted and update started");
    };

    deleteRequest.onerror = function () {
      alert("Fehler beim Löschen");
    };
  };
};

document.addEventListener("DOMContentLoaded", () => {
  window.dartApp = new DartScoreTracker();
});
