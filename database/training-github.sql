-- CAAiT: satu modul latihan sahaja.
-- Selamat dijalankan berulang kali: modul yang sudah wujud tidak ditulis ganti.
SET NAMES utf8mb4;

INSERT INTO training(slug,title,tag,description,objectives,requirements,steps,prompt,practice,outcome,sources,position) VALUES ('github','GitHub','Versi kod & penerbitan','Simpan sejarah perubahan projek dan terbitkan hasil latihan statik.','Memahami repository, commit dan push.
Mengemas kini projek dengan perubahan yang boleh dijejak.
Menerbitkan website statik melalui GitHub Pages.','Akaun GitHub, Git atau GitHub Desktop, Internet dan projek latihan tanpa rahsia. Repository menyimpan fail dan sejarah; commit ialah rekod perubahan lokal; push menghantar commit ke remote.','Cipta repository :: Cipta repository latihan dengan nama jelas. Pilih public/private mengikut keperluan dan semak pelan untuk GitHub Pages. Jangan muat naik .env, kata laluan atau data sebenar.
Simpan perubahan :: Clone repository, tambah fail latihan dan semak git status serta git diff. Stage fail yang dimaksudkan, kemudian commit dengan mesej bermakna.
Push ke GitHub :: Push commit ke branch remote dan semak fail di GitHub. Gunakan kaedah pengesahan rasmi; jangan letakkan token dalam kod atau URL yang dikongsi.
Kemas kini projek :: Pull perubahan terkini sebelum bekerja bersama. Edit, uji, semak diff, commit dan push semula. Untuk kerja berkumpulan, gunakan branch dan pull request.
Terbitkan hasil latihan :: Untuk HTML/CSS/JavaScript statik: Settings → Pages → Build and deployment, pilih sumber branch dan folder yang mengandungi index.html. Tunggu deployment berjaya dan uji URL yang diberikan. GitHub Pages tidak menjalankan PHP/MySQL; dashboard penuh CAAiT memerlukan hosting PHP/MySQL.','git status
git diff
git add index.html styles.css app.js
git commit -m "Improve training dashboard"
git push','Terbitkan dashboard data latihan ke repository latihan. Tukar satu label, commit dan push, kemudian sahkan perubahan pada URL Pages. Jangan terbitkan konfigurasi backend atau data feedback.','Repository dengan sejarah commit, README cara menjalankan projek dan pautan website statik yang telah diuji.','GitHub: Hello World :: https://docs.github.com/en/get-started/start-your-journey/hello-world
GitHub: Pushing commits :: https://docs.github.com/en/get-started/using-git/pushing-commits-to-a-remote-repository
GitHub: Creating a Pages site :: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site',3) ON DUPLICATE KEY UPDATE slug=slug;
