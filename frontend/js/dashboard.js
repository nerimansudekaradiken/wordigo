// dashboard.js - Dinamik İstatistik ve Veri Entegrasyonu

document.addEventListener("DOMContentLoaded", async () => {
    const userId = requireAuth();
    if (!userId) return;

    setupLogoutModal();
    initUI();

    await Promise.all([fetchAndRenderStats(userId), fetchAndRenderDashboard()]);
});

function initUI() {
    const activeUser = localStorage.getItem("currentUser") || "Misafir";
    const usernameEl = document.getElementById("displayUsername");
    if (usernameEl) usernameEl.innerText = activeUser;
}

async function fetchAndRenderStats(userId) {
    try {
        const response = await fetch(`${CONFIG.BASE_URL}/kullanici/istatistik/${userId}`);
        if (!response.ok) throw new Error("İstatistik verisi alınamadı");

        const stats = await response.json();
        const totalCount = stats.ToplamKelime || 0;
        const learnedCount = stats.OgrenilenKelime || 0;

        const totalEl = document.getElementById("totalWords");
        const learnedEl = document.getElementById("learnedWords");
        const wrongEl = document.getElementById("wrongAnswers");
        const rateEl = document.getElementById("successRate");

        if (totalEl) totalEl.innerText = totalCount;
        if (learnedEl) learnedEl.innerText = learnedCount;
        if (wrongEl) wrongEl.innerText = stats.WrongAnswerCount ?? 0;
        if (rateEl) {
            const percent = totalCount > 0
                ? ((learnedCount / totalCount) * 100).toFixed(1)
                : 0;
            rateEl.innerText = `%${percent}`;
        }
    } catch (error) {
        console.error("İstatistik Hatası:", error);
    }
}

async function fetchAndRenderDashboard() {
    const listContainer = document.getElementById("recentWordsList");
    if (!listContainer) return;

    try {
        const response = await fetch(`${CONFIG.BASE_URL}/kelimeler/detayli`);
        if (!response.ok) throw new Error("Kelimeler çekilemedi");

        const allWords = await response.json();
        const imageWordsOnly = allWords.filter(
            (word) => word.Picture && word.Picture.trim() !== ""
        );

        if (imageWordsOnly.length === 0) {
            renderEmptyState(listContainer);
            return;
        }

        const selectedWords = processWords(imageWordsOnly);
        localStorage.setItem("todayWords", JSON.stringify(selectedWords));
        renderWordList(listContainer, selectedWords);
        renderDailyWord(selectedWords);
        generateAIStory(selectedWords);
    } catch (error) {
        handleFetchError(error, listContainer);
    }
}

function processWords(words) {
    return [...words].sort(() => 0.5 - Math.random()).slice(0, CONFIG.DAILY_LIMIT);
}

function renderWordList(container, words) {
    container.innerHTML = words.map(createWordCard).join("");
}

function createWordCard(word) {
    const sentence =
        word.Cumleler && word.Cumleler.length > 0
            ? word.Cumleler[0]
            : "Örnek cümle henüz hazır değil.";

    const rawStage = word.Stage ?? word.stage ?? word.Aşama ?? 0;

    let stageText;
    if (rawStage === 0) {
        stageText = "0/6";
    } else if (rawStage >= 6) {
        stageText = "Öğrenildi 🏆";
    } else {
        stageText = `${rawStage}/6`;
    }

    return `
        <div class="flex items-center justify-between p-4 bg-white rounded-2xl border border-transparent hover:border-amber-200 transition-all duration-300 group mb-4 shadow-sm">
            <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center border border-slate-100">
                    <img src="${word.Picture || CONFIG.DEFAULT_IMG}"
                         onerror="this.src='https://via.placeholder.com/150?text=Resim+Yok'"
                         class="w-full h-full object-cover group-hover:scale-110 transition-transform">
                </div>
                <div>
                    <h4 class="font-bold text-slate-800">${word.EngWordName}</h4>
                    <p class="text-xs text-slate-500">${word.TurWordName}</p>
                    <p class="text-[10px] text-amber-600 italic mt-1 line-clamp-1">"${sentence}"</p>
                </div>
            </div>
            <div class="flex flex-col items-end gap-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">İlerleme</span>
                <span class="text-xs font-bold text-amber-600 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
                    ${stageText}
                </span>
            </div>
        </div>
    `;
}

function renderEmptyState(container) {
    container.innerHTML = `<div class="text-center py-10 text-slate-400 italic">Henüz kelime bulunamadı.</div>`;
}

function handleFetchError(error, container) {
    console.error("Kritik Hata:", error);
    container.innerHTML = `<div class="p-4 bg-red-50 text-red-600 rounded-2xl text-sm italic text-center">Bağlantı hatası: Sunucuya ulaşılamıyor.</div>`;
}

function renderDailyWord(words) {
    if (!words || words.length === 0) return;

    const dailyWord = words[Math.floor(Math.random() * words.length)];

    const engEl = document.getElementById("daily-word-eng");
    const turEl = document.getElementById("daily-word-tur");
    const sentenceEl = document.getElementById("daily-word-sentence");

    if (engEl) engEl.innerText = dailyWord.EngWordName;
    if (turEl) turEl.innerText = dailyWord.TurWordName;

    const sentence =
        dailyWord.Cumleler && dailyWord.Cumleler.length > 0
            ? `"${dailyWord.Cumleler[0]}"`
            : '"Örnek cümle henüz eklenmemiş."';

    if (sentenceEl) sentenceEl.innerText = sentence;
}

async function generateAIStory(words) {
    const storySection = document.getElementById("llm-story-section");
    if (!storySection || !words || words.length === 0) return;

    const selectedWords = words.slice(0, 5).map((w) => w.EngWordName);
    const wordsString = selectedWords.join(", ");

    storySection.innerHTML = `
        <div class="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-8 shadow-2xl border border-indigo-500/30 text-white relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <h2 class="text-2xl font-bold mb-2 flex items-center gap-3">
                <span class="text-3xl">✨</span> Wordigo AI Story
            </h2>
            <p class="text-indigo-200 text-sm mb-6">Öğrendiğin kelimelerle sana özel bir hikaye oluşturuluyor...</p>
            <div class="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 animate-pulse">
                <div class="text-2xl">🤖</div>
                <div class="text-sm font-medium text-indigo-100">
                    Sistem şu kelimeler üzerinde çalışıyor: <span class="text-amber-400">${wordsString}</span>...
                </div>
            </div>
        </div>
    `;

    try {
        const response = await fetch(CONFIG.STORY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kelimeler: selectedWords }),
        });

        if (!response.ok) throw new Error("Backend hikayeyi oluşturamadı.");

        const data = await response.json();
        const storyHtml = data.hikaye;

        storySection.innerHTML = `
            <div class="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-8 shadow-2xl border border-indigo-500/30 text-white relative overflow-hidden transition-all duration-500">
                <div class="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <h2 class="text-2xl font-bold mb-6 flex items-center gap-3">
                    <span class="text-3xl">✨</span> Günün Yapay Zeka Hikayesi
                </h2>
                <div class="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm text-indigo-50 leading-relaxed space-y-4 text-sm md:text-base">
                    ${storyHtml.replace(/\*\*(.*?)\*\*/g, '<strong class="text-amber-400 text-lg">$1</strong>')}
                </div>
                <div class="mt-4 text-right text-xs text-indigo-300 italic">
                    Powered by Google Gemini ⚡
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Yapay Zeka Hatası:", error);
        storySection.innerHTML = `
            <div class="bg-red-50 p-6 rounded-2xl border border-red-100 text-red-600 flex items-center gap-3">
                <span class="text-2xl">⚠️</span>
                <div>
                    <strong>Hikaye Modülü Beklemede</strong><br>
                    <span class="text-sm">Backend tarafındaki yapay zeka entegrasyonu tamamlandığında hikayeler burada görünecek.</span>
                </div>
            </div>
        `;
    }
}
