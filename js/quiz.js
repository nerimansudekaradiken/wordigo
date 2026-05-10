// quiz.js - Backend Algoritması ile Tam Uyumlu ve Hata Kontrollü Versiyon

const CONFIG = {
    UPDATE_URL: "http://172.20.10.12:3000/api/kelimeler/cevap",
    GET_ALL_WORDS: "http://172.20.10.12:3000/api/kelimeler/detayli",
    SUCCESS_REDIRECT: "dashboard.html",
    ANIMATION_DELAY: 1500,
};

const TOTAL_QUESTIONS = 10;
let quizData = []; // Sorulacak resimli kelimeler
let allWordsForOptions = []; // Yanlış şık havuzu (Tüm 1680 kelime)
let currentIndex = 0;
let correctCount = 0;

// 1. ADIM: Dinamik userId Kontrolü
const aktifUserId = localStorage.getItem("userId");

if (!aktifUserId) {
    alert("Oturum süreniz dolmuş veya kimlik kartınız (UserID) bulunamadı. Lütfen tekrar giriş yapın.");
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadInitialData();
    setupEventListeners();
});

// YENİLENEN KISIM: Verileri doğrudan API'den çekip resimli olanları süzüyoruz
async function loadInitialData() {
    try {
        // Tüm havuzu (1680 kelimeyi) API'den çekiyoruz
        const resp = await fetch(CONFIG.GET_ALL_WORDS);
        allWordsForOptions = await resp.json();

        let tempPool = allWordsForOptions.filter(w => w.Picture && w.Picture.trim() !== "");
        tempPool = tempPool.sort(() => 0.5 - Math.random());

        quizData = tempPool.slice(0, TOTAL_QUESTIONS);

       // Eğer havuzda hiç resimli kelime yoksa uyar
        if (!quizData || quizData.length === 0) {
            alert("Sınav için yeterli görsel kelime bulunamadı!");
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

    // Kelimeyi ekrana bas
    document.getElementById("questionWord").innerText = currentWord.EngWordName;

    // Resim kontrolü (Artık kesinlikle resmi olan kelimeler gelecek)
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

    // İpucu (Cümle) kontrolü
    const hintContainer = document.getElementById("hintContainer");
    document.getElementById("sampleSentence").innerText =
        currentWord.Cumleler && currentWord.Cumleler.length > 0
            ? currentWord.Cumleler[0]
            : "İpucu bulunmuyor.";
    hintContainer.classList.add("hidden");

    generateDynamicOptions(currentWord);
}

// YENİLENEN KISIM: Güvenli şık dağıtımı
function generateDynamicOptions(word) {
    const optionsGrid = document.getElementById("optionsGrid");
    optionsGrid.innerHTML = "";

    // Yanlış şıkları "anlamı (TurWordName)" doğru cevapla aynı OLMAYANLARDAN seç
    let distractors = allWordsForOptions
        .filter((w) => w.TurWordName !== word.TurWordName) 
        .sort(() => 0.5 - Math.random())
        .slice(0, 3)
        .map((w) => w.TurWordName);

    // 3 yanlış + 1 doğru şıkkı birleştir ve karıştır
    const finalOptions = [...distractors, word.TurWordName].sort(
        () => 0.5 - Math.random(),
    );

    finalOptions.forEach((opt) => {
        const btn = document.createElement("button");
        btn.className =
            "option-btn w-full py-4 px-6 bg-white hover:bg-amber-50 border-2 border-slate-100 hover:border-amber-200 rounded-2xl font-bold text-slate-700 transition-all text-left shadow-sm";
        btn.innerText = opt;
        btn.onclick = () => handleAnswerSelection(btn, opt, word);
        optionsGrid.appendChild(btn);
    });
}

// 2. ADIM: CEVAP KONTROL VE BACKEND GÜNCELLEME (Senin çalışan altyapın)
async function handleAnswerSelection(selectedBtn, selectedText, word) {
    const allBtns = document.querySelectorAll(".option-btn");
    allBtns.forEach((b) => (b.disabled = true));

    const dogruMu = selectedText === word.TurWordName;

    // UI Geri Bildirimi
    if (dogruMu) {
        selectedBtn.classList.replace("border-slate-100", "border-green-500");
        selectedBtn.classList.add("bg-green-50", "text-green-700");
        correctCount++;
    } else {
        selectedBtn.classList.replace("border-slate-100", "border-red-500");
        selectedBtn.classList.add("bg-red-50", "text-red-700");
        highlightCorrectAnswer(word.TurWordName);
    }

    // BACKEND'E VERİ GÖNDERİMİ
    try {
        // Güvenlik: ID değeri WordId veya id olarak geliyorsa yakala
        const safeWordId = word.WordID || word.WordId || word.id; 

        console.log(`İstek gönderiliyor: User:${aktifUserId}, Word:${safeWordId}, Doğru:${dogruMu}`);

        const response = await fetch(CONFIG.UPDATE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userId: parseInt(aktifUserId),
                wordId: parseInt(safeWordId),
                isCorrect: dogruMu,
            }),
        });

        if (!response.ok) {
            throw new Error(`Sunucu Hatası: ${response.status}`);
        } else {
            console.log("Backend güncelleme başarılı.");
        }
    } catch (err) {
        console.error("Backend'e ulaşılamadı! Hata:", err);
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

    if (progressText)
        progressText.innerText = `Soru ${currentIndex + 1} / ${quizData.length}`;
    if (progressBar) progressBar.style.width = `${progress}%`;
}

function highlightCorrectAnswer(correctText) {
    const btns = document.querySelectorAll(".option-btn");
    btns.forEach((btn) => {
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