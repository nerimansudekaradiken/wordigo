// wordle.js - Dinamik Bulmaca Modülü

const WordleGame = {
    targetWord: "",
    currentAttempt: 0,
    currentGuess: "",
    isGameOver: false,

    async init() {
        this.createGrid();
        await this.selectTargetWord();
        this.setupEventListeners();
    },

    createGrid() {
        const grid = document.getElementById("game-grid");
        if (!grid) return;
        grid.innerHTML = "";
        for (let i = 0; i < 30; i++) {
            const tile = document.createElement("div");
            tile.className =
                "wordle-tile w-12 h-12 border-2 border-slate-200 flex items-center justify-center text-xl font-bold uppercase rounded-xl transition-all duration-200";
            tile.id = `tile-${i}`;
            grid.appendChild(tile);
        }
    },

    async selectTargetWord() {
        try {
            const userId = localStorage.getItem("userId");
            if (!userId) throw new Error("Kullanıcı ID bulunamadı.");

            const response = await fetch(`${CONFIG.ALL_WORDS_URL}/${userId}`);
            if (!response.ok) throw new Error("Kelimeler alınamadı");

            const allWords = await response.json();

            const learnedFiveLetterWords = allWords.filter((w) => {
                const cleanWord = (w.EngWordName || "").trim();
                const wordStage = parseInt(w.Stage ?? w.stage ?? w.Aşama ?? w.Level ?? 0, 10) || 0;
                return cleanWord.length === 5 && wordStage >= 6;
            });

            if (learnedFiveLetterWords.length > 0) {
                this.targetWord = learnedFiveLetterWords[
                    Math.floor(Math.random() * learnedFiveLetterWords.length)
                ].EngWordName.trim().toUpperCase();
            } else {
                this.targetWord = "APPLE";
                alert("⚠️ Henüz seviye 6'ya ulaşmış 5 harfli kelimeniz yok! Antrenman için varsayılan bir kelime atandı.");
            }
        } catch (error) {
            console.error("Kelime çekilirken hata:", error);
            this.targetWord = "BRAIN";
        }
    },

    setupEventListeners() {
        document.addEventListener("keydown", (e) => {
            if (this.isGameOver) return;

            if (e.key === "Enter") {
                this.submitGuess();
            } else if (e.key === "Backspace") {
                this.removeLetter();
            } else if (/^[a-zA-ZçÇğĞıİöÖşŞüÜ]$/.test(e.key) && this.currentGuess.length < 5) {
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

    async submitGuess() {
        if (this.currentGuess.length !== 5) return;

        const guess = this.currentGuess;
        const target = this.targetWord;
        const startIdx = this.currentAttempt * 5;

        for (let i = 0; i < 5; i++) {
            const tile = document.getElementById(`tile-${startIdx + i}`);
            const letter = guess[i];

            if (letter === target[i]) {
                tile.classList.add("bg-green-500", "text-white", "border-green-500");
            } else if (target.includes(letter)) {
                tile.classList.add("bg-amber-400", "text-white", "border-amber-400");
            } else {
                tile.classList.add("bg-slate-400", "text-white", "border-slate-400");
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

document.addEventListener("DOMContentLoaded", () => {
    WordleGame.init();
});
