// js/add-word.js - Kelime Ekleme, Önizleme ve Sidebar Modülü

const CONFIG = {
  BASE_URL: "http://172.20.10.12:3000/api", // Base URL ekleyerek yönetimi kolaylaştırdık
  POST_URL: "http://172.20.10.12:3000/api/kelimeler/ekle",
  STATS_URL: "http://172.20.10.12:3000/api/kullanici/istatistik",
  DEFAULT_IMG: "https://via.placeholder.com/300x200?text=Resim+Yok",
};

document.addEventListener("DOMContentLoaded", () => {
  // SİDEBAR İSTATİSTİKLERİNİ ÇEKME 
  fetchAndRenderSidebarStats();

  // OTURUMU KAPATMA İŞLEMİ
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
        setTimeout(() => modal.remove(), 300);
      });

      document.getElementById("confirmLogoutBtn").addEventListener("click", () => {
        const btn = document.getElementById("confirmLogoutBtn");
        btn.innerText = "Kapatılıyor... 🚀";
        btn.disabled = true;

        setTimeout(() => {
          localStorage.clear();
          globalThis.location.href = "login.html";
        }, 600);
      });
    });
  }

  // --- KELİME EKLEME VE ÖNİZLEME İŞLEMLERİ ---
  const form = document.getElementById("addWordForm");
  const inputs = {
    eng: document.getElementById("engWord"),
    tur: document.getElementById("turWord"),
    sentence: document.getElementById("sentence"),
    picUrl: document.getElementById("picUrl"),
  };
  const previews = {
    eng: document.getElementById("previewEng"),
    tur: document.getElementById("previewTur"),
    sentence: document.getElementById("previewSentence"),
    pic: document.getElementById("previewPic"),
  };

  inputs.eng.addEventListener("input", (e) => (previews.eng.innerText = e.target.value || "Kelime Adı"));
  inputs.tur.addEventListener("input", (e) => (previews.tur.innerText = e.target.value || "Anlamı"));
  inputs.sentence.addEventListener("input", (e) => (previews.sentence.innerText = e.target.value ? `"${e.target.value}"` : '"Örnek cümle burada görünecek."'));

  inputs.picUrl.addEventListener("input", (e) => {
    const url = e.target.value;
    if (url) {
      previews.pic.innerHTML = `<img src="${url}" class="w-full h-full object-cover rounded-2xl" onerror="this.src='${CONFIG.DEFAULT_IMG}'">`;
    } else {
      previews.pic.innerHTML = `<span>Resim Önizlemesi</span>`;
    }
  });

  // --- VERİTABANINA KAYIT (GÜNCELLENDİ) ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;
    
    submitBtn.innerText = "⏳ Havuza Ekleniyor...";
    submitBtn.disabled = true;

    // ÖNEMLİ: Backend'in beklediği yapı (Key isimleri Backend ile eşleşmeli)
    // wordData kısmını sadece bu 5 alan kalacak şekilde sadeleştir:
    const wordData = {
      UserId: Number.parseInt(localStorage.getItem("userId")),
      EngWordName: inputs.eng.value.trim(),
      TurWordName: inputs.tur.value.trim(),
      Sentence: inputs.sentence.value.trim(),
      Picture: inputs.picUrl.value.trim() || "" // null yerine boş string deneyelim
    };

    try {
      console.log("Ekleme isteği atılıyor:", wordData); // Debug için

      const response = await fetch(CONFIG.POST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(wordData),
      });

      if (response.ok) {
        alert("🎉 Kelime başarıyla eklendi!");
        globalThis.location.href = "dashboard.html";
      } else {
        const errorDetail = await response.json().catch(() => ({}));
        console.error("Sunucu Reddi:", errorDetail);
        throw new Error(errorDetail.message || "Sunucu kaydı reddetti.");
      }
    }  catch (error) {
      console.error("Kayıt sırasında teknik bir hata oluştu:", error);
      // Bu alert sayesinde hatanın detayını pop-up olarak göreceksin:
      alert(`❌ Teknik Hata: ${error.message}`); 
      submitBtn.innerText = originalBtnText;
      submitBtn.disabled = false;
    }
  });
});

// Sidebar'daki Analiz Raporunu Dolduran Fonksiyon
async function fetchAndRenderSidebarStats() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const response = await fetch(`${CONFIG.STATS_URL}/${userId}`);
    if (!response.ok) throw new Error("İstatistik alınamadı");

    const stats = await response.json();

    // Veritabanı sütun isimlerine göre güncellendi
    const totalCount = stats.ToplamKelime || 0;
    const learnedCount = stats.OgrenilenKelime || 0;
    const wrongCount = stats.WrongAnswerCount || 0;

    document.getElementById("totalWords").innerText = totalCount;
    document.getElementById("learnedWords").innerText = learnedCount;
    document.getElementById("wrongAnswers").innerText = wrongCount;

    const successRateEl = document.getElementById("successRate");
    if (successRateEl) {
      const percent = totalCount > 0 ? ((learnedCount / totalCount) * 100).toFixed(1) : 0;
      successRateEl.innerText = `%${percent}`;
    }
  } catch (error) {
    console.error("Sidebar istatistikleri yüklenirken hata:", error);
  }
}