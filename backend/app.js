const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sql, poolPromise } = require('./dbConfig');

// ─── Sabitler ────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
const AI_MODEL_NAME = 'gemini-2.5-flash';
const AI_API_KEY = process.env.GEMINI_API_KEY || 'BURAYA_API_GELECEK';
const DEFAULT_QUIZ_LIMIT = 10;

const NEXT_REVIEW_INTERVALS = {
    0: 'DATEADD(day, 1, GETDATE())',
    1: 'DATEADD(week, 1, GETDATE())',
    2: 'DATEADD(month, 1, GETDATE())',
    3: 'DATEADD(month, 3, GETDATE())',
    4: 'DATEADD(month, 6, GETDATE())',
    5: 'DATEADD(year, 1, GETDATE())',
};
const MAX_CORRECT_COUNT = 6;

// ─── Uygulama Kurulumu ────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

const aiClient = new GoogleGenerativeAI(AI_API_KEY);

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────

/**
 * Hata durumunda standart 500 yanıtı döner.
 */
function handleServerError(res, err, message = 'Sunucu hatası.') {
    console.error(message, err);
    res.status(500).json({ hata: message });
}

/**
 * Boolean veya string olarak gelen isCorrect değerini normalize eder.
 */
function parseIsCorrect(value) {
    return value === true || value === 'true';
}

/**
 * Veritabanı havuzunu döner.
 */
async function getPool() {
    return poolPromise;
}

// ─── Sözlük & Kelime Endpoint'leri ───────────────────────────────────────────

app.get('/api/kelimeler/rastgele', async (_req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT TOP 1 * FROM Words ORDER BY NEWID()');
        res.json(result.recordset);
    } catch (err) {
        handleServerError(res, err, 'Veritabanı hatası!');
    }
});

app.get('/api/kelimeler/detayli', async (_req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query(`
            SELECT
                w.WordID,
                w.EngWordName,
                w.TurWordName,
                w.Picture,
                ws.Samples
            FROM Words w
            LEFT JOIN WordSamples ws ON w.WordID = ws.WordID
        `);

        const wordMap = {};
        for (const row of result.recordset) {
            if (!wordMap[row.WordID]) {
                wordMap[row.WordID] = {
                    WordID: row.WordID,
                    EngWordName: row.EngWordName,
                    TurWordName: row.TurWordName,
                    Picture: row.Picture,
                    Cumleler: [],
                };
            }
            if (row.Samples) {
                wordMap[row.WordID].Cumleler.push(row.Samples);
            }
        }

        res.json(Object.values(wordMap));
    } catch (err) {
        handleServerError(res, err, 'Detaylı kelime getirme hatası.');
    }
});

app.post('/api/kelimeler/ekle', async (req, res) => {
    const { EngWordName, TurWordName, Picture, Sentence } = req.body;
    try {
        const pool = await getPool();
        const insertResult = await pool.request()
            .input('eng', sql.NVarChar, EngWordName)
            .input('tur', sql.NVarChar, TurWordName)
            .input('pic', sql.NVarChar, Picture)
            .query('INSERT INTO Words (EngWordName, TurWordName, Picture) OUTPUT INSERTED.WordID VALUES (@eng, @tur, @pic)');

        const newWordID = insertResult.recordset[0].WordID;

        await pool.request()
            .input('wordId', sql.Int, newWordID)
            .input('samples', sql.NVarChar, Sentence)
            .query('INSERT INTO WordSamples (WordID, Samples) VALUES (@wordId, @samples)');

        res.status(201).json({ mesaj: 'Kelime ve cümlesi eklendi!' });
    } catch (err) {
        handleServerError(res, err, 'Kelime ekleme hatası!');
    }
});

// ─── Kullanıcı Endpoint'leri ─────────────────────────────────────────────────

app.post('/api/kullanici/kayit', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await getPool();
        await pool.request()
            .input('UserName', sql.NVarChar, username)
            .input('Password', sql.NVarChar, password)
            .query('INSERT INTO Users (UserName, Password) VALUES (@UserName, @Password)');
        res.status(201).json({ mesaj: 'Kullanıcı başarıyla kaydedildi!' });
    } catch (err) {
        handleServerError(res, err, 'Kayıt sırasında bir hata oluştu.');
    }
});

app.post('/api/kullanici/giris', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('UserName', sql.NVarChar, username)
            .input('Password', sql.NVarChar, password)
            .query('SELECT * FROM Users WHERE UserName = @UserName AND Password = @Password');

        if (result.recordset.length > 0) {
            res.json({
                loginSuccess: true,
                message: 'Giriş başarılı!',
                userId: result.recordset[0].UserID,
            });
        } else {
            res.status(401).json({ loginSuccess: false, message: 'Hatalı kullanıcı adı veya şifre!' });
        }
    } catch (err) {
        handleServerError(res, err, 'Giriş sırasında sunucu hatası.');
    }
});

app.get('/api/kullanici/istatistik/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query(`
                SELECT
                    (SELECT COUNT(*) FROM Words) AS ToplamKelime,
                    (SELECT COUNT(*) FROM UserProgress WHERE UserID = @uid AND IsLearned = 1) AS OgrenilenKelime,
                    (SELECT SUM(WrongAnswerCount) FROM UserProgress WHERE UserID = @uid) AS WrongAnswerCount
            `);

        const stats = result.recordset[0] || {};
        res.json({
            ToplamKelime: stats.ToplamKelime || 0,
            OgrenilenKelime: stats.OgrenilenKelime || 0,
            WrongAnswerCount: stats.WrongAnswerCount || 0,
        });
    } catch (err) {
        handleServerError(res, err, 'İstatistikler çekilemedi.');
    }
});

// ─── İlerleme (UserProgress) Endpoint'leri ───────────────────────────────────

app.post('/api/kelimeler/cevap', async (req, res) => {
    const userId = parseInt(req.body.userId, 10);
    const wordId = parseInt(req.body.wordId, 10);
    const isCorrect = parseIsCorrect(req.body.isCorrect);

    try {
        const pool = await getPool();
        const checkResult = await pool.request()
            .input('uid', sql.Int, userId)
            .input('wid', sql.Int, wordId)
            .query('SELECT CorrectCount FROM UserProgress WHERE UserID = @uid AND WordID = @wid');

        const progressExists = checkResult.recordset.length > 0;

        if (progressExists) {
            await updateUserProgress(pool, userId, wordId, isCorrect, checkResult.recordset[0].CorrectCount);
        } else {
            await insertUserProgress(pool, userId, wordId, isCorrect);
        }

        res.json({ success: true, message: 'Algoritma başarıyla çalıştı.' });
    } catch (err) {
        handleServerError(res, err, 'Algoritma Hatası.');
    }
});

/**
 * Mevcut UserProgress kaydını günceller.
 */
async function updateUserProgress(pool, userId, wordId, isCorrect, currentCorrectCount) {
    if (isCorrect) {
        const nextReviewDate = NEXT_REVIEW_INTERVALS[currentCorrectCount] || NEXT_REVIEW_INTERVALS[5];
        const isLearned = (currentCorrectCount + 1) >= MAX_CORRECT_COUNT ? 1 : 0;

        await pool.request()
            .input('uid', sql.Int, userId)
            .input('wid', sql.Int, wordId)
            .input('newCorrectCount', sql.Int, currentCorrectCount + 1)
            .input('isLearned', sql.Int, isLearned)
            .query(`
                UPDATE UserProgress
                SET
                    CorrectCount = @newCorrectCount,
                    LastShownDate = GETDATE(),
                    NextReviewDate = ${nextReviewDate},
                    IsLearned = @isLearned
                WHERE UserID = @uid AND WordID = @wid
            `);
    } else {
        await pool.request()
            .input('uid', sql.Int, userId)
            .input('wid', sql.Int, wordId)
            .query(`
                UPDATE UserProgress
                SET
                    CorrectCount = 0,
                    WrongAnswerCount = ISNULL(WrongAnswerCount, 0) + 1,
                    LastShownDate = GETDATE(),
                    NextReviewDate = GETDATE(),
                    IsLearned = 0
                WHERE UserID = @uid AND WordID = @wid
            `);
    }
}

/**
 * Yeni UserProgress kaydı ekler.
 */
async function insertUserProgress(pool, userId, wordId, isCorrect) {
    const correctCount = isCorrect ? 1 : 0;
    const wrongCount = isCorrect ? 0 : 1;
    const nextReviewDate = isCorrect ? 'DATEADD(day, 1, GETDATE())' : 'GETDATE()';

    await pool.request()
        .input('uid', sql.Int, userId)
        .input('wid', sql.Int, wordId)
        .input('correctCount', sql.Int, correctCount)
        .input('wrongCount', sql.Int, wrongCount)
        .query(`
            INSERT INTO UserProgress (UserID, WordID, CorrectCount, WrongAnswerCount, LastShownDate, NextReviewDate, IsLearned)
            VALUES (@uid, @wid, @correctCount, @wrongCount, GETDATE(), ${nextReviewDate}, 0)
        `);
}

// ─── Tekrar & Sınav Endpoint'leri ────────────────────────────────────────────

const DUE_WORDS_QUERY = `
    SELECT
        w.WordID,
        w.EngWordName,
        w.TurWordName,
        w.Picture,
        up.CorrectCount,
        up.NextReviewDate,
        ws.Samples AS OrnekCumle
    FROM Words w
    INNER JOIN UserProgress up ON w.WordID = up.WordID
    LEFT JOIN WordSamples ws ON w.WordID = ws.WordID
    WHERE up.UserID = @uid
      AND up.NextReviewDate <= GETDATE()
      AND up.IsLearned = 0
`;

app.get('/api/kelimeler/tekrar/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query(DUE_WORDS_QUERY);
        res.json(result.recordset);
    } catch (err) {
        handleServerError(res, err, 'Çalışılacak kelimeler getirilemedi.');
    }
});

app.get('/api/kelimeler/gunluk-sinav/:userId', async (req, res) => {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit, 10) || DEFAULT_QUIZ_LIMIT;

    try {
        const pool = await getPool();

        const dueResult = await pool.request()
            .input('uid', sql.Int, userId)
            .query(`
                SELECT TOP ${limit}
                    w.WordID, w.EngWordName, w.TurWordName, w.Picture,
                    up.CorrectCount, up.NextReviewDate, ws.Samples AS OrnekCumle
                FROM Words w
                INNER JOIN UserProgress up ON w.WordID = up.WordID
                LEFT JOIN WordSamples ws ON w.WordID = ws.WordID
                WHERE up.UserID = @uid AND up.NextReviewDate <= GETDATE() AND up.IsLearned = 0
            `);

        let quizWords = dueResult.recordset;
        const remaining = limit - quizWords.length;

        if (remaining > 0) {
            const newWordsResult = await pool.request()
                .input('uid', sql.Int, userId)
                .query(`
                    SELECT TOP ${remaining}
                        w.WordID, w.EngWordName, w.TurWordName, w.Picture,
                        0 AS CorrectCount, NULL AS NextReviewDate, ws.Samples AS OrnekCumle
                    FROM Words w
                    LEFT JOIN WordSamples ws ON w.WordID = ws.WordID
                    WHERE w.WordID NOT IN (SELECT WordID FROM UserProgress WHERE UserID = @uid)
                    ORDER BY NEWID()
                `);
            quizWords = quizWords.concat(newWordsResult.recordset);
        }

        res.json(quizWords);
    } catch (err) {
        handleServerError(res, err, 'Sınav kelimeleri hazırlanamadı.');
    }
});

// ─── Sözlük Listeleme Endpoint'leri ──────────────────────────────────────────

app.get('/api/kelimeler/sozluk/tum/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query(`
                SELECT
                    w.WordID,
                    w.EngWordName,
                    w.TurWordName,
                    w.Picture,
                    ws.Samples AS OrnekCumle,
                    ISNULL(up.CorrectCount, 0) AS Stage,
                    ISNULL(up.IsLearned, 0) AS IsLearned
                FROM Words w
                LEFT JOIN UserProgress up ON w.WordID = up.WordID AND up.UserID = @uid
                LEFT JOIN WordSamples ws ON w.WordID = ws.WordID
                ORDER BY w.EngWordName ASC
            `);
        res.json(result.recordset);
    } catch (err) {
        handleServerError(res, err, 'Sözlük verileri getirilemedi.');
    }
});

app.get('/api/kelimeler/sozluk/ogrenilen/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query(`
                SELECT
                    w.WordID,
                    w.EngWordName,
                    w.TurWordName,
                    w.Picture,
                    ws.Samples AS OrnekCumle,
                    up.LastShownDate AS OgrenilmeTarihi
                FROM Words w
                INNER JOIN UserProgress up ON w.WordID = up.WordID
                LEFT JOIN WordSamples ws ON w.WordID = ws.WordID
                WHERE up.UserID = @uid AND up.IsLearned = 1
                ORDER BY up.LastShownDate DESC
            `);
        res.json(result.recordset);
    } catch (err) {
        handleServerError(res, err, 'Öğrenilen kelimeler getirilemedi.');
    }
});

// ─── Word Chain (AI Hikaye Üretimi) ──────────────────────────────────────────

app.post('/api/word-chain/olustur', async (req, res) => {
    const { userId, words } = req.body;

    if (!userId || !words) {
        return res.status(400).json({ hata: 'Kullanıcı ID ve kelimeler zorunludur.' });
    }

    try {
        const { hikaye, resim } = await generateStoryAndImage(words);
        await saveWordChainStory(parseInt(userId, 10), words, hikaye, resim);
        res.status(201).json({ basari: true, hikaye, resim });
    } catch (err) {
        console.error('Word Chain Üretim Hatası:', err);
        res.status(500).json({ hata: 'Yapay zeka hikaye ve görsel üretemedi: ' + err.message });
    }
});

/**
 * Verilen kelimeler için AI hikayesi ve görsel URL'si üretir.
 */
async function generateStoryAndImage(words) {
    const model = aiClient.getGenerativeModel({ model: AI_MODEL_NAME });

    const prompt = `Sana verilen şu 5 İngilizce kelimeyi (${words}) kullanarak anlamlı ve sürükleyici masalsı bir Türkçe hikaye yaz. Hikaye 150-200 kelime olsun. Kelimeleri hikayenin içinde özel isim veya bir nesne/hayvan olarak kullanabilirsin. Kelimeleri kullandıktan sonra Türkçesini belirtme.

ÇOK ÖNEMLİ KURAL: Yanıtının en sonuna "|||" (üç adet dik çizgi) ekle ve hemen ardına, yazdığın bu hikayenin sahnesini tam olarak anlatan, içinde bu kelimelerin de geçtiği İNGİLİZCE bir resim çizdirme komutu (prompt) yaz.

Örnek Yanıt Formatı:
Bir varmış bir yokmuş, Brain adında zeki bir çocuk varmış...
|||
A magical fantasy digital art illustration of a smart boy named Brain, walking in a dark night forest...`;

    const aiResponse = await model.generateContent(prompt);
    const fullText = aiResponse.response.text();
    const parts = fullText.split('|||');

    const hikaye = parts[0].trim();
    const imagePrompt = parts.length > 1 && parts[1].trim()
        ? parts[1].trim()
        : `A magical fantasy digital art illustration featuring: ${words.split(',').join(' ').trim()}`;

    const seed = Math.floor(Math.random() * 1000000);
    const resim = `https://image.pollinations.ai/prompt/${encodeURIComponent(imagePrompt)}?width=1024&height=576&nologo=true&seed=${seed}`;

    return { hikaye, resim };
}

/**
 * Üretilen hikaye ve görseli veritabanına kaydeder.
 */
async function saveWordChainStory(userId, words, story, imageUrl) {
    const pool = await getPool();
    await pool.request()
        .input('uid', sql.Int, userId)
        .input('words', sql.NVarChar, words)
        .input('story', sql.NVarChar, story)
        .input('img', sql.NVarChar, imageUrl)
        .query(`
            INSERT INTO WordChainStories (UserID, WordsUsed, StoryText, ImageUrl)
            VALUES (@uid, @words, @story, @img)
        `);
}

// ─── Sunucu Başlatma ──────────────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`Garson uyandı! Siparişler ${PORT} portunda bekleniyor...`);
});