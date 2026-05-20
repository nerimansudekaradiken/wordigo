const HOST_IP = "http://172.20.10.8:3000";

const CONFIG = {
    // --- TEMEL URL ---
    BASE_URL: `${HOST_IP}/api`,

    // --- KULLANICI & AYAR İŞLEMLERİ ---
    REGISTER_URL: `${HOST_IP}/api/kullanici/kayit`,
    LOGIN_URL: `${HOST_IP}/api/kullanici/giris`,
    STATS_URL: `${HOST_IP}/api/kullanici/istatistik`,
    SETTINGS_URL: `${HOST_IP}/api/ayarlar`,

    // --- KELİME & SÖZLÜK İŞLEMLERİ ---
    POST_URL: `${HOST_IP}/api/kelimeler/ekle`,
    ALL_WORDS_URL: `${HOST_IP}/api/kelimeler/sozluk/tum`,
    LEARNED_WORDS_URL: `${HOST_IP}/api/kelimeler/sozluk/ogrenilen`,
    GET_ALL_WORDS: `${HOST_IP}/api/kelimeler/detayli`,

    // --- SINAV (QUIZ) İŞLEMLERİ ---
    GET_DAILY_QUIZ: `${HOST_IP}/api/kelimeler/gunluk-sinav`,
    UPDATE_URL: `${HOST_IP}/api/kelimeler/cevap`,

    // --- YAPAY ZEKA (AI STORY) İŞLEMLERİ ---
    STORY_URL: `${HOST_IP}/api/word-chain/olustur`,

    // --- GENEL OYUN/UYGULAMA SABİTLERİ ---
    DAILY_LIMIT: 10,
    TIMEOUT_MS: 5000,
    ANIMATION_DELAY: 1500,
    SUCCESS_REDIRECT: "dashboard.html",
    DEFAULT_IMG: "https://via.placeholder.com/300x200?text=Görsel+Bulunamadı",
};
