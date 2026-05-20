// utils.js - Tüm sayfalarda ortak kullanılan yardımcı fonksiyonlar

/**
 * Kullanıcının oturum açıp açmadığını kontrol eder.
 * Açmamışsa login sayfasına yönlendirir.
 * @returns {string|null} userId veya null
 */
function requireAuth() {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        window.location.href = "login.html";
        return null;
    }
    return userId;
}

/**
 * Oturumu kapatma modalını açar. Birden fazla sayfada tekrar eder,
 * bu yüzden merkezi hale getirildi.
 */
function setupLogoutModal() {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

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
            setTimeout(() => modal.remove(), 300);
        });

        document.getElementById("confirmLogoutBtn").addEventListener("click", () => {
            const btn = document.getElementById("confirmLogoutBtn");
            btn.innerText = "Kapatılıyor...";
            btn.disabled = true;
            setTimeout(() => {
                localStorage.clear();
                window.location.href = "login.html";
            }, 600);
        });
    });
}

/**
 * Sidebar istatistiklerini backend'den çekip doldurur.
 * add-word.js ve dictionary.js'de aynı kod kopyalanmıştı.
 */
async function fetchAndRenderSidebarStats() {
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    try {
        const response = await fetch(`${CONFIG.STATS_URL}/${userId}`);
        if (!response.ok) throw new Error("İstatistik alınamadı");

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
        console.error("Sidebar istatistikleri yüklenirken hata:", error);
    }
}
