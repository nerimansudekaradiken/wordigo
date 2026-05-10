const express = require('express');
const { sql, poolPromise } = require('./dbConfig');
const cors = require('cors'); // Eğer arkadaşın C# ile bağlanırken hata alırsa diye bu kalkanı da ekledik

const app = express();

app.use(cors());
app.use(express.json()); // Gelen JSON verilerini okuyabilmek için

const PORT = process.env.PORT || 3000;

// --- 1. RASTGELE KELİME GETİRME API'Sİ (ESKİ KODUN) ---
app.get('/api/kelimeler/rastgele', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT TOP 1 * FROM Words WHERE Picture != 'assets/img/default.png' AND Picture IS NOT NULL ORDER BY NEWID()");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send("Veritabanı hatası!");
    }
});

// --- 2. KULLANICI KAYIT API'Sİ (ESKİ KODUN) ---
app.post('/api/kullanici/kayit', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('UserName', sql.NVarChar, username)
            .input('Password', sql.NVarChar, password)
            .query('INSERT INTO Users (UserName, Password) VALUES (@UserName, @Password)');
        res.status(201).json({ mesaj: "Kullanıcı başarıyla kaydedildi!" });
    } catch (err) {
        res.status(500).json({ hata: "Kayıt sırasında bir hata oluştu." });
    }
});
app.post('/api/kullanici/giris', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('UserName', sql.NVarChar, username)
            .input('Password', sql.NVarChar, password)
            .query('SELECT * FROM Users WHERE UserName = @UserName AND Password = @Password');

        if (result.recordset.length > 0) {
            res.json({ loginSuccess: true, message: "Giriş başarılı!",userId: result.recordset[0].UserID});
        } else {
            res.status(401).json({ loginSuccess: false, message: "Hatalı kullanıcı adı veya şifre!" });
        }
    } catch (err) {
        res.status(500).json({ hata: "Sunucu hatası." });
    }
});
app.post('/api/kelimeler/ekle', async (req, res) => {
    const {EngWordName, TurWordName, Picture, Sentence} = req.body;
    try {
        const pool = await poolPromise;
        // Önce Words tablosuna ekle
        const result = await pool.request()
            .input('eng', sql.NVarChar, EngWordName)
            .input('tur', sql.NVarChar, TurWordName)
            .input('pic', sql.NVarChar, Picture)
            .query('INSERT INTO Words (EngWordName, TurWordName, Picture) OUTPUT INSERTED.WordID VALUES (@eng, @tur, @pic)');
        
        const newWordID = result.recordset[0].WordID;

        // Sonra WordSamples tablosuna cümleyi ekle
        await pool.request()
            .input('wordId', sql.Int, newWordID)
            .input('samples', sql.NVarChar, Sentence)
            .query('INSERT INTO WordSamples (WordID, Samples) VALUES (@wordId, @samples)');

        res.status(201).json({ mesaj: "Kelime ve cümlesi eklendi!" });
    } catch (err) {
        console.error("Kelime Ekleme Hatası:", err);
        res.status(500).json({ hata: "Ekleme hatası!" });
    }
});
// --- 3. DETAYLI KELİME GETİRME API'Sİ (YENİ EKLENEN RESİMLİ/CÜMLELİ KOD) ---
app.get('/api/kelimeler/detayli', async (req, res) => {
    try {
        const pool = await poolPromise;
        
        const result = await pool.request().query(`
            SELECT 
                w.WordID, 
                w.EngWordName, 
                w.TurWordName, 
                w.Picture, 
                ws.Samples
            FROM Words w
            LEFT JOIN WordSamples ws ON w.WordID = ws.WordID
            WHERE w.Picture != 'assets/img/default.png' AND w.Picture IS NOT NULL
        `);

        const gruplanmisKelimeler = {};

        result.recordset.forEach(row => {
            if (!gruplanmisKelimeler[row.WordID]) {
                gruplanmisKelimeler[row.WordID] = {
                    WordID: row.WordID,
                    EngWordName: row.EngWordName,
                    TurWordName: row.TurWordName,
                    Picture: row.Picture,
                    Cumleler: [] 
                };
            }
            if (row.Samples) {
                gruplanmisKelimeler[row.WordID].Cumleler.push(row.Samples);
            }
        });

        const kelimeListesi = Object.values(gruplanmisKelimeler);
        res.json(kelimeListesi);

    } catch (err) {
        console.error("Detaylı kelime getirme hatası:", err);
        res.status(500).json({ hata: "Kelimeler getirilirken sorun oluştu." });
    }
});

app.post('/api/kelimeler/cevap', async (req, res) => {
    
    const userId = parseInt(req.body.userId);
    const wordId = parseInt(req.body.wordId);
    const isCorrect = req.body.isCorrect;

    // Konsol logu ekledik: Terminalden verinin gelip gelmediğini gör
    console.log(`Cevap Geldi - User: ${userId}, Word: ${wordId}, Doğru mu: ${isCorrect}`);

    try {
        const pool = await poolPromise;

        const checkResult = await pool.request()
            .input('uid', sql.Int, userId)
            .input('wid', sql.Int, wordId)
            .query('SELECT * FROM UserProgress WHERE UserID = @uid AND WordID = @wid');

        if (checkResult.recordset.length > 0) {
            // DURUM 1: Kullanıcı bu kelimeyi daha önce görmüş
            if (isCorrect === true || isCorrect === 'true') {
                // DOĞRU BİLDİYSE
                await pool.request()
                    .input('uid', sql.Int, userId)
                    .input('wid', sql.Int, wordId)
                    .query(`
                        DECLARE @currentCount INT;
                        SELECT @currentCount = ISNULL(CorrectCount, 0) FROM UserProgress WHERE UserID = @uid AND WordID = @wid;
                        
                        UPDATE UserProgress 
                        SET 
                            CorrectCount = @currentCount + 1,
                            LastShownDate = GETDATE(),
                            NextReviewDate = CASE 
                                WHEN @currentCount = 0 THEN DATEADD(day, 1, GETDATE())    
                                WHEN @currentCount = 1 THEN DATEADD(week, 1, GETDATE())   
                                WHEN @currentCount = 2 THEN DATEADD(month, 1, GETDATE())  
                                WHEN @currentCount = 3 THEN DATEADD(month, 3, GETDATE())  
                                WHEN @currentCount = 4 THEN DATEADD(month, 6, GETDATE())  
                                ELSE DATEADD(year, 1, GETDATE())                         
                            END,
                            IsLearned = CASE WHEN @currentCount + 1 >= 5 THEN 1 ELSE 0 END
                        WHERE UserID = @uid AND WordID = @wid
                    `);
            } else {
                // YANLIŞ BİLDİYSE
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
        } else {
            // DURUM 2: Kullanıcı bu kelimeyle İLK DEFA karşılaşıyor
            if (isCorrect === true || isCorrect === 'true') {
                await pool.request()
                    .input('uid', sql.Int, userId)
                    .input('wid', sql.Int, wordId)
                    .query(`
                        INSERT INTO UserProgress (UserID, WordID, CorrectCount, WrongAnswerCount, LastShownDate, NextReviewDate, IsLearned)
                        VALUES (@uid, @wid, 1, 0, GETDATE(), DATEADD(day, 1, GETDATE()), 0)
                    `);
            } else {
                await pool.request()
                    .input('uid', sql.Int, userId)
                    .input('wid', sql.Int, wordId)
                    .query(`
                        INSERT INTO UserProgress (UserID, WordID, CorrectCount, WrongAnswerCount, LastShownDate, NextReviewDate, IsLearned)
                        VALUES (@uid, @wid, 0, 1, GETDATE(), GETDATE(), 0)
                    `);
            }
        }

        res.json({ success: true, message: "Algoritma başarıyla çalıştı." });

    } catch (err) {
        console.error("Algoritma Hatası:", err);
        res.status(500).json({ success: false, message: "Sunucu hatası: " + err.message });
    }
});

// 2. VAKTİ GELMİŞ (TEKRAR EDİLECEK) KELİMELERİ ÇEKME
app.get('/api/kelimeler/tekrar/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const pool = await poolPromise;
        
        // Asıl sihir burada: Words ve UserProgress tablolarını birleştiriyoruz.
        // Sadece NextReviewDate <= BUGÜN olanları ve henüz öğrenilmemiş (IsLearned = 0) olanları çekiyoruz.
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query(`
                SELECT 
                    w.WordID, 
                    w.EngWordName, 
                    w.TurWordName, 
                    w.Picture, 
                    up.CorrectCount, 
                    up.NextReviewDate,
                    ws.Samples as OrnekCumle
                FROM Words w
                INNER JOIN UserProgress up ON w.WordID = up.WordID    -- up.WordID olarak düzeltildi
                LEFT JOIN WordSamples ws ON w.WordID = ws.WordID      -- ws tablosu eklendi
                WHERE up.UserID = @uid 
                     AND up.NextReviewDate <= GETDATE()
                     AND up.IsLearned = 0
                     AND w.Picture != 'assets/img/default.png' 
                     AND w.Picture IS NOT NULL
            `);
        
        res.json(result.recordset);
    } catch (err) {
        console.error("Kelime Çekme Hatası:", err);
        res.status(500).json({ hata: "Çalışılacak kelimeler getirilemedi." });
    }
});

app.get('/api/kullanici/istatistik/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('uid', sql.Int, userId)
            .query(`
                SELECT 
                    (SELECT COUNT(*) FROM Words) as ToplamKelime,
                    (SELECT COUNT(*) FROM UserProgress WHERE UserID = @uid AND IsLearned = 1) as OgrenilenKelime,
                    (SELECT SUM(WrongAnswerCount) FROM UserProgress WHERE UserID = @uid) as WrongAnswerCount
            `);
            
        const stats = result.recordset[0] || {}; 
        
        res.json({
            ToplamKelime: stats.ToplamKelime || 0,
            OgrenilenKelime: stats.OgrenilenKelime || 0,
            WrongAnswerCount: stats.WrongAnswerCount || 0
        });

    } catch (err) {
        console.error("İstatistik Çekme Hatası:", err);
        res.status(500).json({ hata: "İstatistikler çekilemedi." });
    }
});

// --- SUNUCUYU AYAĞA KALDIRAN KOD ---
app.listen(PORT, () => {
    console.log(`Garson uyandı! Siparişler ${PORT} portunda bekleniyor...`);
});