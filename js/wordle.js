// wordle.js - Dinamik Bulmaca Modülü

const WordleGame = {
  targetWord: "",
  currentAttempt: 0,
  currentGuess: "",
  isGameOver: false,

  init() {
    // Grid'i HTML içinde oluştur (Eksik olan kısım buydu)
    this.createGrid();
    this.selectTargetWord();
    this.setupEventListeners();
  },

  // Grid'i dinamik olarak oluşturur
  createGrid() {
    const grid = document.getElementById("game-grid");
    if (!grid) return;
    grid.innerHTML = ""; // Temizle
    for (let i = 0; i < 30; i++) {
      const tile = document.createElement("div");
      tile.className =
        "wordle-tile w-12 h-12 border-2 border-slate-200 flex items-center justify-center text-xl font-bold uppercase rounded-xl transition-all duration-200";
      tile.id = `tile-${i}`;
      grid.appendChild(tile);
    }
  },

  // 1. Dinamik Kelime Seçimi (Öğrenilen Kelimelerden)
  selectTargetWord() {
    const allWords = JSON.parse(localStorage.getItem("todayWords")) || [];
    // Sadece 5 harfli olanları filtrele
    const fiveLetterWords = allWords.filter(
      (w) => w.EngWordName && w.EngWordName.length === 5,
    );

    if (fiveLetterWords.length > 0) {
      this.targetWord =
        fiveLetterWords[
          Math.floor(Math.random() * fiveLetterWords.length)
        ].EngWordName.toUpperCase();
    } else {
      // Eğer havuzda 5 harfli kelime yoksa (Hata önleyici) [cite: 55]
      this.targetWord = "BRAIN";
      console.warn(
        "Havuzda 5 harfli kelime bulunamadı, varsayılan kelime seçildi.",
      );
    }
    console.log("Hedef Kelime:", this.targetWord); // Test için konsola yazar
  },

  setupEventListeners() {
    // Tuş basımlarını dinle
    document.addEventListener("keydown", (e) => {
      if (this.isGameOver) return;

      if (e.key === "Enter") {
        this.submitGuess();
      } else if (e.key === "Backspace") {
        this.removeLetter();
      } else if (
        /^[a-zA-ZçÇğĞıİöÖşŞüÜ]$/.test(e.key) &&
        this.currentGuess.length < 5
      ) {
        this.addLetter(e.key.toUpperCase());
      }
    });
  },

  addLetter(letter) {
    if (this.currentGuess.length < 5) {
      this.currentGuess += letter;
      this.updateGrid();
    }
  },

  removeLetter() {
    this.currentGuess = this.currentGuess.slice(0, -1);
    this.updateGrid();
  },

  updateGrid() {
    const startIdx = this.currentAttempt * 5;
    for (let i = 0; i < 5; i++) {
      const tile = document.getElementById(`tile-${startIdx + i}`);
      if (!tile) continue;

      tile.innerText = this.currentGuess[i] || "";

      if (this.currentGuess[i]) {
        tile.classList.add("border-amber-400", "scale-105");
        tile.classList.remove("border-slate-200");
      } else {
        tile.classList.remove("border-amber-400", "scale-105");
        tile.classList.add("border-slate-200");
      }
    }
  },

  // 2. Renk Mantığı ve Kontrol (Story-6 Puanlama Kriteri) [cite: 55]
  async submitGuess() {
    if (this.currentGuess.length !== 5) return;

    const guess = this.currentGuess;
    const target = this.targetWord;
    const startIdx = this.currentAttempt * 5;

    for (let i = 0; i < 5; i++) {
      const tile = document.getElementById(`tile-${startIdx + i}`);
      const letter = guess[i];

      // Renk sınıflarını uygula (Tailwind sınıfları)
      if (letter === target[i]) {
        tile.classList.add("bg-green-500", "text-white", "border-green-500"); // Yeşil [cite: 55]
      } else if (target.includes(letter)) {
        tile.classList.add("bg-amber-400", "text-white", "border-amber-400"); // Sarı/Amber [cite: 55]
      } else {
        tile.classList.add("bg-slate-400", "text-white", "border-slate-400"); // Gri [cite: 55]
      }
    }

    if (guess === target) {
      this.endGame(true);
    } else if (this.currentAttempt === 5) {
      this.endGame(false);
    } else {
      this.currentAttempt++;
      this.currentGuess = "";
    }
  },

  endGame(isWin) {
    this.isGameOver = true;
    const status = document.getElementById("game-status");
    if (status) {
      status.classList.remove("hidden");
      status.innerText = isWin
        ? "Tebrikler! Kelimeyi bildin. 🎉"
        : `Üzgünüm, kelime: ${this.targetWord} idi.`;
      status.className = isWin
        ? "mt-6 font-bold text-green-600 text-center"
        : "mt-6 font-bold text-red-500 text-center";
    }
  },
};

// Sayfa yüklendiğinde başlat
document.addEventListener("DOMContentLoaded", () => {
  WordleGame.init();
});
