📖 Proje Hakkında
Wordigo, klasik kelime ezberleme yöntemlerini terk ederek modern Spaced Repetition (Aralıklı Tekrar) algoritmasını kullanan akıllı bir İngilizce kelime öğrenme sistemidir. Kullanıcıların İngilizce kelimeleri kısa süreli bellekten kalıcı hafızaya geçirebilmesi için kelimeler belirli periyotlarla (1 gün, 1 hafta, 1 ay vb.) 6 kez karşılarına çıkarılır.
Sistem aynı zamanda kelimeleri bağlam içinde öğretmek için Generative AI (Üretken Yapay Zeka) teknolojilerinden faydalanarak kelimelere özel masalsı hikaye ve görsel oluşturur.

✨ Temel Özellikler
🧠 Aralıklı Tekrar Algoritması (SuperMemo tabanlı): Kelimeleri ezberleme durumuna göre 6 farklı aşamada kullanıcıya sunar.

🤖 AI Word Chain (Kelime Zinciri): Kullanıcının girdiği kelimelerden Gemini 2.5-Flash ile anlamlı hikayeler üretir ve Pollinations AI ile 16:9 formatında sahne görselleştirmesi yapar.

🧩 Wordle Entegrasyonu: Öğrenilen kelimelerin hafızada pekiştirilmesi için özel geliştirilmiş bulmaca modülü.

📊 Gelişmiş Analiz ve İstatistik: Kullanıcının doğru/yanlış oranları ve kelime öğrenme serüveninin grafiksel/matematiksel analizi.

🔐 Güvenli Kimlik Doğrulama: Oturum yönetimi ile kullanıcı bazlı kişiselleştirilmiş kelime havuzları.

🔄 Dinamik Sınav Modülü: Her oturumda algoritmanın hesapladığı "bugün tekrar edilmesi gereken" kelimelerden oluşan quizler.


🛠️ Kullanılan Teknolojiler
Backend: Node.js, Express.js

Database: Microsoft SQL Server (MSSQL)

Frontend: HTML5 & DOM Elementleri, Tailwind CSS, Vanilla JavaScript

AI & API Entegrasyonları: Google Gemini API (LLM Text Generation), Pollinations AI (Image Generation)


⚙️ Kurulum ve Çalıştırma
Projeyi kendi bilgisayarınızda (localhost) çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

Ön Koşullar:
Node.js yüklü olmalıdır.
SQL Server ve SSMS yüklü olmalıdır.

Adımlar
Projeyi Klonlayın:

git clone https://github.com/nerimansudekaradiken/wordigo.git
cd wordigo

Gerekli Paketleri Yükleyin:

npm install

Çevresel Değişkenleri (.env) Ayarlayın
Projenin ana dizininde bir .env dosyası oluşturun ve aşağıdaki bilgileri kendi sisteminize göre doldurun:

DB_USER=sa
DB_PASSWORD=sizin_sql_sifreniz
DB_SERVER=localhost
DB_NAME=Kelime_Ezberleme
GEMINI_API_KEY=sizin_gemini_api_anahtariniz
PORT=3000

Veritabanını Hazırlayın:
SSMS (SQL Server Management Studio) üzerinden Kelime_Ezberleme adında bir veritabanı oluşturun ve projedeki Kelime_Ezberleme.sql dosyasını çalıştırarak tabloları (Users, Words, UserProgress, WordChainStories vb.) içeri aktarın.

Sunucuyu Başlatın:

node app.js

Terminalde Garson uyandı! Siparişler 3000 portunda bekleniyor... mesajını gördüğünüzde proje başarıyla ayağa kalkmış demektir.

Tarayıcıda Açın:
Tarayıcınızdan http://localhost:3000 veya Live Server adresinize giderek uygulamayı kullanmaya başlayabilirsiniz.

🗂️ Veritabanı Mimarisi
Users: Kullanıcı kayıt bilgileri ve kimlik doğrulama.

Words / WordSamples: Sisteme kayıtlı İngilizce/Türkçe kelimeler ve örnek cümleleri.

UserProgress: Aralıklı tekrar algoritmasının kalbi. Kullanıcının hangi kelimede kaçıncı seferde olduğunu (CorrectCount), bir sonraki gösterim tarihini (NextReviewDate) ve öğrenilme durumunu (IsLearned) tutar.

WordChainStories: Yapay zeka tarafından üretilen hikaye metinlerini ve resim URL'lerini depolar.

👨‍💻 Geliştiriciler
**Neriman Sude KARADİKEN** * GitHub: [@nerimansudekaradiken](https://github.com/nerimansudekaradiken)
**Selen Tayyibe ÜLKE** * Github: [@selenlk](https://github.com/selenlk)
