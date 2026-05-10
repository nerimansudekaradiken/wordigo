document
  .getElementById("registerForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("regUsername").value;
    const password = document.getElementById("regPassword").value;
    const passwordConfirm = document.getElementById("regPasswordConfirm").value;

    // 1. Şifre Eşleşme Kontrolü
    if (password !== passwordConfirm) {
      alert("Hata: Şifreler birbiriyle uyuşmuyor!");
      return;
    }

    try {
      // 2. ADIM: Doğru URL ve Doğru Veri Yapısı
      // Arkadaşının backend adresine (IP:PORT) ve doğru endpoint'e gidiyoruz
      const response = await fetch(
        "http://172.20.10.12:3000/api/kullanici/kayit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // ÖNEMLİ: Arkadaşının kodu 'email' beklemiyor, sadece bunları gönderiyoruz
          body: JSON.stringify({ username, password }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("Kayıt başarılı! Şimdi giriş yapabilirsin.");
        window.location.href = "login.html";
      } else {
        // Backend'den gelen hata mesajını göster (Örn: Kullanıcı zaten var)
        alert("Hata: " + (data.hata || "Kayıt tamamlanamadı."));
      }
    } catch (error) {
      console.error("Bağlantı Hatası:", error);
      alert(
        "Sunucuya bağlanılamadı. Lütfen arkadaşının bilgisayarında 'node server.js' komutunun çalıştığından emin ol.",
      );
    }
  });
