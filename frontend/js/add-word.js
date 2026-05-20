// add-word.js - Kelime Ekleme, Önizleme ve Sidebar Modülü

document.addEventListener("DOMContentLoaded", () => {
    fetchAndRenderSidebarStats();
    setupLogoutModal();
    setupPreview();
    setupForm();
});

function setupPreview() {
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

    inputs.eng.addEventListener("input", (e) => {
        previews.eng.innerText = e.target.value || "Kelime Adı";
    });
    inputs.tur.addEventListener("input", (e) => {
        previews.tur.innerText = e.target.value || "Anlamı";
    });
    inputs.sentence.addEventListener("input", (e) => {
        previews.sentence.innerText = e.target.value
            ? `"${e.target.value}"`
            : '"Örnek cümle burada görünecek."';
    });

    const previewPicBox = document.getElementById("previewPicBox");
    const placeholderSpan = previewPicBox ? previewPicBox.querySelector("span") : null;

    inputs.picUrl.addEventListener("input", (e) => {
        const url = e.target.value.trim();
        if (url !== "") {
            previews.pic.src = url;
            previews.pic.classList.remove("hidden");
            if (placeholderSpan) placeholderSpan.style.display = "none";
        } else {
            previews.pic.src = "";
            previews.pic.classList.add("hidden");
            if (placeholderSpan) placeholderSpan.style.display = "block";
        }
    });

    previews.pic.addEventListener("error", () => {
        const fallbackImg = CONFIG.DEFAULT_IMG;
        if (previews.pic.src !== fallbackImg) {
            previews.pic.src = fallbackImg;
        }
    });
}

function setupForm() {
    const form = document.getElementById("addWordForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;

        submitBtn.innerText = "⏳ Havuza Ekleniyor...";
        submitBtn.disabled = true;

        const wordData = {
            UserId: Number.parseInt(localStorage.getItem("userId")),
            EngWordName: document.getElementById("engWord").value.trim(),
            TurWordName: document.getElementById("turWord").value.trim(),
            Sentence: document.getElementById("sentence").value.trim(),
            Picture: document.getElementById("picUrl").value.trim() || "",
        };

        try {
            const response = await fetch(CONFIG.POST_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(wordData),
            });

            if (response.ok) {
                alert("🎉 Kelime başarıyla eklendi!");
                window.location.href = "dashboard.html";
            } else {
                const errorDetail = await response.json().catch(() => ({}));
                throw new Error(errorDetail.message || "Sunucu kaydı reddetti.");
            }
        } catch (error) {
            console.error("Kayıt sırasında hata:", error);
            alert(`❌ Teknik Hata: ${error.message}`);
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}
