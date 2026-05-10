// dashboard.js - Dinamik İstatistik ve Veri Entegrasyonu

const CONFIG = {
  BASE_URL: "http://172.20.10.12:3000/api",
  DAILY_LIMIT: 10,
  TIMEOUT_MS: 5000,
  DEFAULT_IMG: "assets/default-icon.png",
};

document.addEventListener("DOMContentLoaded", async () => {
  const userId = localStorage.getItem("userId");
  if (!userId) {
    console.warn("Kullanıcı ID bulunamadı, giriş sayfasına yönlendiriliyor...");
    globalThis.location.href = "login.html";
    return;
  }

  initUI();

  await Promise.all([fetchAndRenderStats(userId), fetchAndRenderDashboard()]);
});

function initUI() {
  const activeUser = localStorage.getItem("currentUser") || "Misafir";
  const usernameElement = document.getElementById("displayUsername");
  if (usernameElement) usernameElement.innerText = activeUser;
}

async function fetchAndRenderStats(userId) {
  try {
    const response = await fetch(
      `${CONFIG.BASE_URL}/kullanici/istatistik/${userId}`,
    );
    if (!response.ok) throw new Error("İstatistik verisi alınamadı");

    const stats = await response.json();

    const els = {
      total: document.getElementById("totalWords"),
      learned: document.getElementById("learnedWords"),
      wrong: document.getElementById("wrongAnswers"),
      successRate: document.getElementById("successRate"),
    };

    const totalCount = stats.ToplamKelime || 0;
    const learnedCount = stats.OgrenilenKelime || 0;

    if (els.total) els.total.innerText = totalCount;
    if (els.learned) els.learned.innerText = learnedCount;

    if (els.wrong) {
      els.wrong.innerText = stats.WrongAnswerCount ?? 0;
    }

    if (els.successRate) {
      const percent =
        totalCount > 0 ? ((learnedCount / totalCount) * 100).toFixed(1) : 0;
      els.successRate.innerText = `%${percent}`;
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

    // --- YENİ EKLENEN KISIM: Sadece görseli olan kelimeleri filtrele ---
    // Eğer kelimenin Picture özelliği varsa ve boşluktan ibaret değilse listeye al.
    const imageWordsOnly = allWords.filter(word => word.Picture && word.Picture.trim() !== "");

    // Artık "allWords" yerine resimli havuzumuzun boş olup olmadığını kontrol ediyoruz
    if (!imageWordsOnly || imageWordsOnly.length === 0) {
      renderEmptyState(listContainer);
      return;
    }

    // Listeyi, günün kelimesini ve hikayeyi SADECE bu resimli kelimelerden oluşturuyoruz
    const selectedWords = processWords(imageWordsOnly);
    localStorage.setItem("todayWords", JSON.stringify(selectedWords));
    renderWordList(listContainer, selectedWords);

    // GÜNÜN KELİMESİ BURADA ÇAĞRILIYOR
    renderDailyWord(selectedWords);
    
    // YAPAY ZEKA HİKAYESİNİ TETİKLE
    generateAIStory(selectedWords); 

  } catch (error) {
    handleFetchError(error, listContainer);
    console.error("Dashboard verisi çekilemedi:", error);
  }
}

function processWords(words) {
  return [...words]
    .sort(() => 0.5 - Math.random())
    .slice(0, CONFIG.DAILY_LIMIT);
}

function renderWordList(container, words) {
  container.innerHTML = words.map((word) => createWordCard(word)).join("");
}

function createWordCard(word) {
  const sentence =
    word.Cumleler && word.Cumleler.length > 0
      ? word.Cumleler[0]
      : "Örnek cümle henüz hazır değil.";

  const displayStage = word.Stage || 1;

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
                    ${displayStage}/6
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

function goToDetailedReport() {
  globalThis.location.href = "rapor.html";
}

function renderDailyWord(words) {
  if (!words || words.length === 0) return;

  const randomIndex = Math.floor(Math.random() * words.length);
  const dailyWord = words[randomIndex];

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

// --- OTURUMU KAPATMA İŞLEMİ (MODERN UI PENCERESİ) ---
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    if (document.getElementById("customLogoutModal")) return;

    const modalHtml = `
            <div id="customLogoutModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 transition-opacity duration-300">
                <div class="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl transform scale-95 transition-transform duration-300">
                    <div class="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
                        <span class="text-3xl">🚪</span>
                    </div>
                    <h3 class="text-xl font-bold text-slate-800 text-center mb-2">Çıkış Yapıyorsun</h3>
                    <p class="text-slate-500 text-center text-sm mb-8">Oturumu kapatmak istediğine emin misin? İlerlemeni kaydettik, istediğin zaman dönebilirsin.</p>
                    <div class="flex gap-3">
                        <button id="cancelLogoutBtn" class="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition border border-slate-200">İptal</button>
                        <button id="confirmLogoutBtn" class="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition">Evet, Çıkış Yap</button>
                    </div>
                </div>
            </div>
        `;

    document.body.insertAdjacentHTML("beforeend", modalHtml);
    const modal = document.getElementById("customLogoutModal");
    const modalBox = modal.querySelector("div");

    requestAnimationFrame(() => {
      modal.classList.remove("opacity-0");
      modalBox.classList.remove("scale-95");
    });

    document.getElementById("cancelLogoutBtn").addEventListener("click", () => {
      modal.classList.add("opacity-0");
      modalBox.classList.add("scale-95");
      setTimeout(() => modal.remove(), 300); // Animasyon bitince temizle
    });

    document
      .getElementById("confirmLogoutBtn")
      .addEventListener("click", () => {
        const btn = document.getElementById("confirmLogoutBtn");
        btn.innerText = "Kapatılıyor... 🚀";
        btn.disabled = true;

        // Kısa bir bekleme sonrası çıkış yap
        setTimeout(() => {
          localStorage.clear();
          window.location.href = "login.html";
        }, 600);
      });
  });
}
// ==========================================
// STORY-7: YAPAY ZEKA HİKAYE MODÜLÜ (Güvenli Versiyon)
// ==========================================

async function generateAIStory(words) {
    const storySection = document.getElementById('llm-story-section');
    if (!storySection || !words || words.length === 0) return;

    // Sadece İngilizce kelimeleri alalım (En fazla 5 kelime)
    const selectedWords = words.slice(0, 5).map(w => w.EngWordName);
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
        const response = await fetch('http://172.20.10.12:3000/api/hikaye-uret', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kelimeler: selectedWords }) 
        });

        if (!response.ok) throw new Error("Backend hikayeyi oluşturamadı.");

        const data = await response.json();
        const storyHtml = data.hikaye; // Arkadaşının JSON'dan döneceği anahtar (örn: hikaye)

        // 3. GELEN HİKAYEYİ EKRANA BASMA
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
        // 4. HATA DURUMU
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