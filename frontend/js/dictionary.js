// dictionary.js

let displayedWords = [];
let currentFilterMode = "all";

document.addEventListener("DOMContentLoaded", async () => {
    setupLogoutModal();
    setupEventListeners();
    fetchAndRenderSidebarStats();
    await loadDictionary("all");
});

async function loadDictionary(mode) {
    currentFilterMode = mode;
    const grid = document.getElementById("dictionaryGrid");
    grid.innerHTML = `<div class="col-span-full py-16 text-center text-slate-400 italic bg-white rounded-3xl border border-slate-100 shadow-sm">Kelimeler yükleniyor... ⏳</div>`;

    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Kullanıcı kimliği bulunamadı, lütfen tekrar giriş yapın.");
        return;
    }

    try {
        const url = mode === "learned"
            ? `${CONFIG.LEARNED_WORDS_URL}/${userId}`
            : `${CONFIG.ALL_WORDS_URL}/${userId}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error("Veri çekilemedi.");

        displayedWords = await response.json();
        renderDictionary();
    } catch (error) {
        console.error("Sözlük yükleme hatası:", error);
        grid.innerHTML = `
            <div class="col-span-full py-12 text-center text-red-400 font-medium bg-white rounded-3xl border border-slate-200 shadow-sm">
                ❌ Kelimeler getirilemedi. Sunucu hatası.
            </div>`;
    }
}

function renderDictionary() {
    const grid = document.getElementById("dictionaryGrid");
    const searchWord = document.getElementById("vocabSearch").value.toLowerCase().trim();

    grid.innerHTML = "";

    const filtered = displayedWords.filter(
        (word) =>
            word.EngWordName.toLowerCase().includes(searchWord) ||
            word.TurWordName.toLowerCase().includes(searchWord)
    );

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-sm italic text-sm">
                Aradığın kriterlere uygun kelime bulamadık. 🔍
            </div>`;
        return;
    }

    filtered.forEach((word) => {
        const card = document.createElement("div");
        card.className = "bg-white border border-slate-200 rounded-[24px] p-4 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300 flex flex-col h-fit";

        const uniqueId = "img-box-" + Math.random().toString(36).substr(2, 9);

        let imageHtml = "";
        if (word.Picture && word.Picture.trim() !== "" && word.Picture !== "null") {
            imageHtml = `
            <div id="${uniqueId}" class="w-full aspect-square rounded-[18px] overflow-hidden bg-slate-50/50 border border-slate-100 shrink-0 mb-3 flex items-center justify-center p-2">
                <img src="${word.Picture}" class="w-full h-full object-contain" onerror="document.getElementById('${uniqueId}').style.display='none'">
            </div>`;
        }

        const sentenceHtml = word.OrnekCumle
            ? `<div class="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center mt-3">
                <p class="text-amber-600 text-[11px] leading-snug italic">"${word.OrnekCumle}"</p>
               </div>`
            : `<div class="bg-slate-50 rounded-xl p-2.5 border border-slate-100 text-center text-slate-400 italic text-[10px] mt-3">
                Örnek cümle eklenmemiş.
               </div>`;

        let statusHtml = "";
        if (currentFilterMode === "learned") {
            let dateStr = "";
            if (word.OgrenilmeTarihi) {
                dateStr = new Date(word.OgrenilmeTarihi).toLocaleDateString("tr-TR");
            }
            statusHtml = `
                <div class="flex items-center justify-between pt-3 border-t border-slate-100 font-medium mt-3">
                    <span class="text-slate-400 text-[10px]">Durum</span>
                    <div class="flex items-center gap-1.5">
                        ${dateStr ? `<span class="text-slate-400 text-[9px]">${dateStr}</span>` : ""}
                        <span class="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600 font-bold text-[10px]">🎉 Öğrenildi</span>
                    </div>
                </div>`;
        } else {
            const stage = word.Stage || 0;
            const stageText = stage >= 6 ? "🎉 Öğrenildi" : stage === 0 ? "0/6" : `Adım ${stage}/6`;
            const stageColor = stage >= 6
                ? "bg-emerald-50 text-emerald-600"
                : stage === 0
                ? "bg-slate-50 text-slate-500"
                : "bg-amber-50 text-amber-600";

            statusHtml = `
                <div class="flex items-center justify-between pt-3 border-t border-slate-100 font-medium mt-3">
                    <span class="text-slate-400 text-[10px]">İlerleme</span>
                    <span class="px-2 py-1 rounded-lg ${stageColor} font-bold text-[10px]">
                        ${stageText}
                    </span>
                </div>`;
        }

        card.innerHTML = `
            <div class="flex flex-col">
                ${imageHtml}
                <div class="text-center">
                    <h3 class="text-base font-bold text-slate-800 uppercase tracking-wide">${word.EngWordName}</h3>
                    <p class="text-slate-500 text-[11px] font-medium mt-0.5">${word.TurWordName}</p>
                </div>
                ${sentenceHtml}
            </div>
            ${statusHtml}
        `;
        grid.appendChild(card);
    });
}

function setupEventListeners() {
    const searchInput = document.getElementById("vocabSearch");
    const btnAll = document.getElementById("filterAll");
    const btnLearned = document.getElementById("filterLearned");

    searchInput.addEventListener("input", renderDictionary);

    btnAll.addEventListener("click", () => {
        btnAll.className = "flex-1 h-full text-xs font-bold bg-amber-400 text-white rounded-xl shadow-md shadow-amber-100 transition duration-200";
        btnLearned.className = "flex-1 h-full text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl transition duration-200";
        loadDictionary("all");
    });

    btnLearned.addEventListener("click", () => {
        btnLearned.className = "flex-1 h-full text-xs font-bold bg-amber-400 text-white rounded-xl shadow-md shadow-amber-100 transition duration-200";
        btnAll.className = "flex-1 h-full text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl transition duration-200";
        loadDictionary("learned");
    });
}
