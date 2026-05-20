// quiz.js - Backend Algoritması (Spaced Repetition) ile Tam Uyumlu Versiyon

let quizData = [];
let allWordsForOptions = [];
let currentIndex = 0;
let correctCount = 0;

const aktifUserId = localStorage.getItem("userId");

if (!aktifUserId) {
    alert("Oturum süreniz dolmuş veya kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.");
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadInitialData();
    setupEventListeners();
});

async function loadInitialData() {
    try {
        const quizResp = await fetch(`${CONFIG.GET_DAILY_QUIZ}/${aktifUserId}`);
        const fetchedData = await quizResp.json();

        const userLimit = parseInt(localStorage.getItem("wordigo_new_word_limit")) || 10;
        quizData = fetchedData.slice(0, userLimit);

        const allResp = await fetch(CONFIG.GET_ALL_WORDS);
        allWordsForOptions = await allResp.json();

        if (!quizData || quizData.length === 0) {
            alert("Bugün için tekrar edilecek kelimeniz kalmadı, harikasınız!");
            window.location.href = CONFIG.SUCCESS_REDIRECT;
            return;
        }

        renderQuestion();
    } catch (e) {
        console.error("Sınav havuzu oluşturulamadı:", e);
        alert("Bağlantı hatası: Sınav verileri çekilemedi.");
        window.location.href = CONFIG.SUCCESS_REDIRECT;
    }
}

function renderQuestion() {
    const currentWord = quizData[currentIndex];
    updateProgressUI();

    document.getElementById("questionWord").innerText = currentWord.EngWordName;

    const imgContainer = document.getElementById("wordImageContainer");
    const imgElement = document.getElementById("wordImage");

    if (currentWord.Picture) {
        imgElement.src = currentWord.Picture.startsWith("http")
            ? currentWord.Picture
            : `assets/${currentWord.Picture}`;
        imgContainer.classList.remove("hidden");
    } else {
        imgContainer.classList.add("hidden");
    }

    const hintContainer = document.getElementById("hintContainer");
    const sentence =
        currentWord.OrnekCumle ||
        (currentWord.Cumleler && currentWord.Cumleler.length > 0
            ? currentWord.Cumleler[0]
            : null);

    document.getElementById("sampleSentence").innerText = sentence || "İpucu bulunmuyor.";
    hintContainer.classList.add("hidden");

    generateDynamicOptions(currentWord);
}

function generateDynamicOptions(word) {
    const optionsGrid = document.getElementById("optionsGrid");
    optionsGrid.innerHTML = "";

    const distractors = allWordsForOptions
        .filter((w) => w.TurWordName !== word.TurWordName)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((w) => w.TurWordName);

    const finalOptions = [...distractors, word.TurWordName].sort(() => 0.5 - Math.random());

    finalOptions.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className =
            "option-btn w-full py-4 px-6 bg-white hover:bg-amber-50 border-2 border-slate-100 hover:border-amber-200 rounded-2xl font-bold text-slate-700 transition-all text-left shadow-sm";
        btn.innerText = opt;
        btn.onclick = () => handleAnswerSelection(btn, opt, word);
        optionsGrid.appendChild(btn);
    });
}

async function handleAnswerSelection(selectedBtn, selectedText, word) {
    document.querySelectorAll(".option-btn").forEach((b) => (b.disabled = true));

    const isCorrect = selectedText === word.TurWordName;

    if (isCorrect) {
        selectedBtn.classList.replace("border-slate-100", "border-green-500");
        selectedBtn.classList.add("bg-green-50", "text-green-700");
        correctCount++;
    } else {
        selectedBtn.classList.replace("border-slate-100", "border-red-500");
        selectedBtn.classList.add("bg-red-50", "text-red-700");
        highlightCorrectAnswer(word.TurWordName);
    }

    try {
        const safeWordId = word.WordID || word.WordId || word.id;

        const response = await fetch(CONFIG.UPDATE_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                userId: parseInt(aktifUserId),
                wordId: parseInt(safeWordId),
                isCorrect,
            }),
        });

        if (!response.ok) throw new Error(`Sunucu Hatası: ${response.status}`);
    } catch (err) {
        console.error("Backend'e ulaşılamadı:", err);
    }

    setTimeout(() => {
        currentIndex++;
        if (currentIndex < quizData.length) {
            renderQuestion();
        } else {
            showFinalResults();
        }
    }, CONFIG.ANIMATION_DELAY);
}

function updateProgressUI() {
    const progress = ((currentIndex + 1) / quizData.length) * 100;
    const progressText = document.getElementById("progressText");
    const progressBar = document.getElementById("progressBar");

    if (progressText) progressText.innerText = `Soru ${currentIndex + 1} / ${quizData.length}`;
    if (progressBar) progressBar.style.width = `${progress}%`;
}

function highlightCorrectAnswer(correctText) {
    document.querySelectorAll(".option-btn").forEach((btn) => {
        if (btn.innerText === correctText) {
            btn.classList.add("border-green-500", "bg-green-50");
        }
    });
}

function showFinalResults() {
    document.getElementById("quizCard").classList.add("hidden");
    const resultScreen = document.getElementById("resultScreen");
    if (resultScreen) {
        resultScreen.classList.remove("hidden");
        const basariOrani = Math.round((correctCount / quizData.length) * 100);
        document.getElementById("finalScore").innerText = `%${basariOrani}`;
        document.getElementById("correctSummary").innerText =
            `${correctCount} Doğru / ${quizData.length} Soru`;
    }
}

function setupEventListeners() {
    const hintBtn = document.getElementById("hintBtn");
    if (hintBtn) {
        hintBtn.onclick = () => {
            const container = document.getElementById("hintContainer");
            if (container) container.classList.toggle("hidden");
        };
    }
}
