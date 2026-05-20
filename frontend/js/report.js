// report.js - Analiz Raporu

document.addEventListener("DOMContentLoaded", async () => {
    const userId = requireAuth();
    if (!userId) return;

    initUI();
    await fetchAndRenderReport(userId);
    setupPrintButton();
});

function initUI() {
    const activeUser = localStorage.getItem("currentUser") || "Misafir Kullanıcı";
    const usernameEl = document.getElementById("report-user");
    if (usernameEl) usernameEl.innerText = activeUser;

    const dateEl = document.getElementById("report-date");
    if (dateEl) {
        dateEl.innerText = new Date().toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    }
}

async function fetchAndRenderReport(userId) {
    try {
        const response = await fetch(`${CONFIG.BASE_URL}/kullanici/istatistik/${userId}`);
        if (!response.ok) throw new Error("Rapor verileri alınamadı");

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
        console.error("Rapor oluşturulurken hata:", error);
    }
}

function setupPrintButton() {
    const printBtn = document.getElementById("printReportBtn");
    if (printBtn) {
        printBtn.addEventListener("click", () => window.print());
    }
}
