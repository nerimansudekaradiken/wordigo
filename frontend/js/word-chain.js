// word-chain.js

document.addEventListener("DOMContentLoaded", () => {
    const wordInput = document.getElementById("wordInput");
    const addBtn = document.getElementById("addBtn");
    const chipsContainer = document.getElementById("chipsContainer");
    const emptyText = document.getElementById("emptyText");
    const wordCountSpan = document.getElementById("wordCount");
    const errorMsg = document.getElementById("errorMsg");
    const generateBtn = document.getElementById("generateBtn");

    const emptyState = document.getElementById("emptyState");
    const loadingState = document.getElementById("loadingState");
    const resultState = document.getElementById("resultState");
    const generatedImg = document.getElementById("generatedImg");
    const imgPlaceholder = document.getElementById("imgPlaceholder");
    const generatedStoryText = document.getElementById("generatedStoryText");

    let wordsArray = [];
    const REQUIRED_WORDS = 5;

    function addWord() {
        const word = wordInput.value.trim().toLowerCase();
        showError("");

        if (word === "") return;

        if (wordsArray.length >= REQUIRED_WORDS) {
            showError("Zaten 5 kelime ekledin! Şimdi hikayeyi oluşturabilirsin.");
            return;
        }

        if (wordsArray.includes(word)) {
            showError("Bu kelimeyi zaten zincire ekledin!");
            return;
        }

        if (wordsArray.length > 0) {
            const lastWord = wordsArray[wordsArray.length - 1];
            const lastLetter = lastWord.slice(-1);
            if (word.charAt(0) !== lastLetter) {
                showError(`Zincir kuralı ihlali! Yeni kelime '${lastLetter.toUpperCase()}' harfi ile başlamalı.`);
                return;
            }
        }

        wordsArray.push(word);
        wordInput.value = "";
        renderChips();
        wordInput.placeholder = `${word.slice(-1).toUpperCase()} harfi ile başlayan kelime...`;
    }

    window.removeWord = function (index) {
        wordsArray = wordsArray.slice(0, index);
        showError("");
        renderChips();

        if (wordsArray.length > 0) {
            const lastWord = wordsArray[wordsArray.length - 1];
            wordInput.placeholder = `${lastWord.slice(-1).toUpperCase()} harfi ile başlayan kelime...`;
        } else {
            wordInput.placeholder = "Bir İngilizce kelime yazın...";
        }
    };

    function renderChips() {
        chipsContainer.innerHTML = "";

        if (wordsArray.length === 0) {
            chipsContainer.appendChild(emptyText);
            emptyText.style.display = "block";
        } else {
            emptyText.style.display = "none";
            wordsArray.forEach((w, index) => {
                const chip = document.createElement("div");
                chip.className = "bg-white border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm fade-in";
                const capitalized = w.charAt(0).toUpperCase() + w.slice(1);
                chip.innerHTML = `
                    ${capitalized}
                    <button onclick="removeWord(${index})" class="text-indigo-300 hover:text-red-500 transition ml-1 outline-none">✕</button>
                `;
                chipsContainer.appendChild(chip);
            });
        }

        wordCountSpan.innerText = wordsArray.length;

        const full = wordsArray.length === REQUIRED_WORDS;
        generateBtn.disabled = !full;
        wordInput.disabled = full;
        addBtn.disabled = full;
        if (full) wordInput.placeholder = "Kelimeler tamamlandı! 🚀";
    }

    function showError(msg) {
        if (msg === "") {
            errorMsg.classList.add("hidden");
        } else {
            errorMsg.innerText = msg;
            errorMsg.classList.remove("hidden");
        }
    }

    addBtn.addEventListener("click", addWord);

    wordInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            addWord();
        }
    });

    generateBtn.addEventListener("click", async () => {
        emptyState.classList.add("hidden");
        resultState.classList.add("hidden");
        loadingState.classList.remove("hidden");

        const aktifUserId = localStorage.getItem("userId");
        if (!aktifUserId) {
            alert("Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.");
            window.location.href = "login.html";
            return;
        }

        try {
            const response = await fetch(CONFIG.STORY_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: parseInt(aktifUserId),
                    words: wordsArray.join(", "),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.hata || `Sunucu Hatası: ${response.status}`);
            }

            const data = await response.json();

            loadingState.classList.add("hidden");
            resultState.classList.remove("hidden");

            generatedStoryText.innerHTML = data.hikaye || "Hikaye oluşturuldu fakat metin alınamadı.";

            if (data.resim) {
                const cacheBustedUrl = data.resim + "&zaman=" + new Date().getTime();
                generatedImg.setAttribute("referrerpolicy", "no-referrer");
                generatedImg.src = cacheBustedUrl;

                generatedImg.onload = () => {
                    imgPlaceholder.style.display = "none";
                    generatedImg.classList.remove("hidden");
                    generatedImg.style.display = "block";
                };

                generatedImg.onerror = () => {
                    imgPlaceholder.style.display = "none";
                };
            }
        } catch (error) {
            console.error("Yapay Zeka API Hatası:", error);
            alert(`Sistem Hatası: ${error.message}`);
            loadingState.classList.add("hidden");
            emptyState.classList.remove("hidden");
        }
    });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "login.html";
        });
    }
});
