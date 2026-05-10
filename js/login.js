document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(
      "http://172.20.10.12:3000/api/kullanici/giris",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      },
    );

    const data = await response.json();

    // 1. ADIM: Girişin başarılı olup olmadığını kontrol et
    if (response.ok && data.loginSuccess) {
      // 2. ADIM: Dinamik UserID Yakalama
      const dbUserId = data.userId || data.id;

      if (dbUserId) {
        // Veritabanındaki Username ve UserID uyumunu burada mühürlüyoruz
        localStorage.setItem("userId", dbUserId);
        localStorage.setItem("currentUser", username);
        localStorage.setItem("isLoggedIn", "true");

        // --- YENİ EKLENEN ŞIK GEÇİŞ KISMI ---
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.innerText = `Yönlendiriliyor... 🚀`;
          submitBtn.classList.remove("bg-amber-400", "hover:bg-amber-500"); // Eski renkleri sil
          submitBtn.style.backgroundColor = "#10b981"; // Başarı yeşili yap
          submitBtn.disabled = true; // Çift tıklamayı engelle
        }
        // ------------------------------------

        // 3. ADIM: Yönlendirme (800 milisaniye bekleyip geçiş yapar)
        setTimeout(() => {
          window.location.href = "dashboard.html";
        }, 800);
      } else {
        // Eğer şifre doğru ama ID gelmiyorsa veritabanı uyumu bozulmasın diye durduruyoruz
        console.error(
          "Kritik Hata: Backend login onayladı ama UserID dönmedi!",
        );
        alert(
          "Sistem hatası: Kullanıcı kimliği doğrulanamadı. Lütfen yöneticiye bildirin.",
        );
      }
    } else {
      // Şifre veya kullanıcı adı yanlışsa
      alert("Hata: " + (data.message || "Gullanıcı adı veya şifre hatalı!"));
    }
  } catch (error) {
    console.error("Bağlantı Hatası:", error);
    alert(
      "Sunucuya ulaşılamıyor! Lütfen arkadaşının IP adresini ve sunucunun açık olduğunu kontrol et.",
    );
  }
});

// --- ŞİFREMİ UNUTTUM MODALI (Modern UI) ---
const forgotBtn = document.getElementById('forgotPasswordBtn');

if (forgotBtn) {
    forgotBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Sayfanın yenilenmesini veya yukarı kaymasını engeller

        // Eğer pencere zaten açıksa tekrar açma
        if (document.getElementById('forgotPasswordModal')) return;

        // 1. Modal HTML Tasarımı
        const modalHtml = `
            <div id="forgotPasswordModal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center opacity-0 transition-opacity duration-300">
                <div class="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 shadow-2xl transform scale-95 transition-transform duration-300">
                    <div class="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-100">
                        <span class="text-3xl">🔑</span>
                    </div>
                    <h3 class="text-xl font-bold text-slate-800 text-center mb-2">Şifreni mi Unuttun?</h3>
                    <p class="text-slate-500 text-center text-sm mb-6">Kayıtlı kullanıcı adını veya e-posta adresini gir, sana sıfırlama bağlantısı gönderelim.</p>
                    
                    <input type="text" id="resetInput" placeholder="Kullanıcı Adı veya E-posta" 
                        class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none transition mb-6">
                    
                    <div class="flex gap-3">
                        <button id="cancelResetBtn" class="flex-1 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition border border-slate-200">İptal</button>
                        <button id="sendResetBtn" class="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition">Bağlantı Gönder</button>
                    </div>
                </div>
            </div>
        `;

        // 2. Sayfaya Ekle
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = document.getElementById('forgotPasswordModal');
        const modalBox = modal.querySelector('div');

        // 3. Görünür Yap (Animasyonlu)
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            modalBox.classList.remove('scale-95');
        });

        // Kapatma Fonksiyonu
        const closeModal = () => {
            modal.classList.add('opacity-0');
            modalBox.classList.add('scale-95');
            setTimeout(() => modal.remove(), 300);
        };

        // İptal Butonu
        document.getElementById('cancelResetBtn').addEventListener('click', closeModal);

        // Gönder Butonu (Şimdilik Simülasyon)
        document.getElementById('sendResetBtn').addEventListener('click', () => {
            const inputVal = document.getElementById('resetInput').value.trim();
            const btn = document.getElementById('sendResetBtn');
            
            if(!inputVal) {
                // Tailwind ile input çerçevesini kırmızı yaparak hata göster
                document.getElementById('resetInput').classList.add('border-red-400', 'ring-red-100');
                return;
            }

            btn.innerText = "Gönderiliyor... ⏳";
            btn.disabled = true;

            // 1 saniye sonra başarılı animasyonu göster ve kapat
            setTimeout(() => {
                btn.innerText = "Gönderildi! ✅";
                btn.classList.replace('bg-amber-400', 'bg-green-500');
                btn.classList.replace('hover:bg-amber-500', 'hover:bg-green-600');
                btn.classList.replace('shadow-amber-200', 'shadow-green-200');
                
                // Başarılı olduktan 1.5 saniye sonra pencereyi kapat
                setTimeout(closeModal, 1500);
            }, 1000);
        });
    });
}