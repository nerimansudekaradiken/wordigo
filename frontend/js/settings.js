// settings.js

document.addEventListener("DOMContentLoaded", () => {
    const wordLimitInput = document.getElementById("wordLimitInput");
    const decreaseBtn = document.getElementById("decreaseWordLimitBtn");
    const increaseBtn = document.getElementById("increaseWordLimitBtn");
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    const saveNotification = document.getElementById("saveNotification");

    const savedLimit = localStorage.getItem("wordigo_new_word_limit");
    if (savedLimit) wordLimitInput.value = savedLimit;

    decreaseBtn.addEventListener("click", () => {
        const current = parseInt(wordLimitInput.value);
        if (current > 5) wordLimitInput.value = current - 1;
    });

    increaseBtn.addEventListener("click", () => {
        const current = parseInt(wordLimitInput.value);
        if (current < 50) wordLimitInput.value = current + 1;
    });

    saveSettingsBtn.addEventListener("click", async () => {
        const newLimit = parseInt(wordLimitInput.value);
        const userId = localStorage.getItem("userId");

        localStorage.setItem("wordigo_new_word_limit", newLimit);

        try {
            await fetch(`${CONFIG.SETTINGS_URL}/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newWordCount: newLimit }),
            });
        } catch (error) {
            console.error("Ayarlar kaydedilemedi:", error);
        }

        saveNotification.classList.remove("opacity-0");
        setTimeout(() => saveNotification.classList.add("opacity-0"), 3000);
    });

    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.clear();
            window.location.href = "login.html";
        });
    }
});
