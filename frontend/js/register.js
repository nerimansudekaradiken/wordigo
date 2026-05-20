// register.js

document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value;
    const passwordConfirm = document.getElementById("regPasswordConfirm").value;

    if (password !== passwordConfirm) {
        alert("Hata: Şifreler birbiriyle uyuşmuyor!");
        return;
    }

    try {
        const response = await fetch(CONFIG.REGISTER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
            alert("Kayıt başarılı! Şimdi giriş yapabilirsin.");
            window.location.href = "login.html";
        } else {
            alert("Hata: " + (data.hata || "Kayıt tamamlanamadı."));
        }
    } catch (error) {
        console.error("Bağlantı Hatası:", error);
        alert("Sunucuya bağlanılamadı. Lütfen sunucunun çalıştığından emin ol.");
    }
});
