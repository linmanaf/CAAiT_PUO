-- CAAiT: jadual modul latihan dan kandungan permulaan.
-- Import sekali melalui phpMyAdmin pada database CAAiT.
-- Selamat diimport berulang kali: modul yang sudah wujud tidak ditulis ganti.

CREATE TABLE IF NOT EXISTS training (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 slug VARCHAR(40) NOT NULL UNIQUE,
 title VARCHAR(160) NOT NULL,
 tag VARCHAR(120) NOT NULL,
 description VARCHAR(400) NOT NULL,
 objectives TEXT NOT NULL,
 requirements TEXT NOT NULL,
 steps TEXT NOT NULL,
 prompt TEXT NOT NULL,
 practice TEXT NOT NULL,
 outcome TEXT NOT NULL,
 sources TEXT NOT NULL,
 position INT NOT NULL DEFAULT 0,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 INDEX (position, id)
) ENGINE=InnoDB;

INSERT INTO training(slug,title,tag,description,objectives,requirements,steps,prompt,practice,outcome,sources,position) VALUES ('canva','Canva + Canva AI','Reka bentuk & komunikasi','Susun bahan pembentangan dan hasilkan dashboard satu halaman yang mudah dibaca.','Menyusun pembentangan dengan hierarki tajuk, isi dan visual.
Menggunakan bantuan AI sambil mengekalkan ketepatan sumber.
Membina dashboard satu halaman dengan graf berlabel.','Akaun Canva, sambungan Internet, komputer dan salinan bahan pembentangan yang dibenarkan. Ketersediaan ciri AI bergantung pada akaun, pelan dan bahasa.','Asas pembentangan :: Cipta pembentangan. Tetapkan satu objektif setiap halaman, gunakan tajuk jelas, warna konsisten dan teks yang boleh dibaca.
Gunakan bahan sedia ada :: Buat salinan bahan asal. Dalam Canva AI, gunakan Add from Canva atau muat naik bahan yang disokong. Minta rangka pembentangan, kemudian semak sebelum menggunakan reka bentuk yang dicadangkan.
Fahami AI :: AI menghasilkan cadangan berdasarkan arahan dan corak yang dipelajari. Ia boleh tersilap, termasuk nombor, fakta dan ejaan. Jangan masukkan data peribadi atau sulit.
Bina graf :: Masukkan carta bar melalui elemen carta Canva. Isi data latihan dan label paksi serta unit. Semak nilai carta dengan jadual sumber.
Semak dan kongsi :: Pastikan tajuk, sumber, tempoh dan label “Data latihan” jelas. Semak kontras dan ejaan; eksport PDF/PNG atau kongsi pautan mengikut izin akses.','Gunakan bahan yang saya lampirkan untuk cadangkan susunan pembentangan. Kekalkan semua nombor dan nama. Tandakan maklumat yang tidak jelas. Kemudian cadangkan dashboard satu halaman dengan carta bar, tanpa mereka fakta.','Hasilkan dashboard satu halaman dengan tiga kategori latihan: Asas 12, Pertengahan 8, Lanjutan 5. Ini data latihan rekaan, bukan bilangan peserta CAAiT. Sertakan jumlah 25, carta bar, satu pemerhatian dan sumber “Data latihan”.','Satu dashboard dengan jadual sumber, carta yang sepadan, tajuk dan ringkasan analisis. Peserta boleh menerangkan dan menyemak setiap angka.','Canva: Create a presentation with Canva AI :: https://www.canva.com/help/using-magic-presentations/
Canva: Charts :: https://www.canva.com/graphs/',1) ON DUPLICATE KEY UPDATE slug=slug;
INSERT INTO training(slug,title,tag,description,objectives,requirements,steps,prompt,practice,outcome,sources,position) VALUES ('bob','IBM Bob','AI untuk pembangunan aplikasi','Gunakan bantuan AI untuk merancang, membina, menyemak dan menguji dashboard.','Membezakan Ask, Plan dan Agent mengikut dokumentasi Bob.
Memberi arahan jelas berdasarkan fail projek.
Mengesahkan kod serta tingkah laku aplikasi.','Akses IBM Bob yang sah, pemasangan mengikut dokumentasi rasmi, folder projek salinan dan runtime yang diperlukan projek. Jangan hantar rahsia atau data peribadi kepada alat AI.','Kenali projek :: Buka folder salinan projek. Gunakan Ask untuk menerangkan struktur, cara menjalankan aplikasi dan risiko tanpa membuat perubahan.
Rancang perubahan :: Gunakan Plan untuk nyatakan objektif dashboard, sumber data, skop dan kriteria penerimaan. Semak cadangan sebelum pelaksanaan.
Bina secara berperingkat :: Gunakan Agent selepas pelan dipersetujui. Minta satu fungsi pada satu masa dan semak permintaan akses atau arahan shell. Nama mod mungkin berubah mengikut versi.
Semak hasil kod :: Baca diff, semak sumber angka, validasi input, pengendalian ralat dan penggunaan textContent untuk input pengguna. Jangan terima output AI tanpa semakan.
Jalankan dan uji :: Mulakan server yang sesuai; buka dashboard, uji navigasi, graf, borang serta lebar 375px. Semak console dan rangkaian. Baiki isu dan uji semula.','Baca projek ini dahulu. Rancang dashboard satu halaman menggunakan data latihan Asas=12, Pertengahan=8, Lanjutan=5. Gunakan satu sumber data untuk jumlah dan graf. Jangan tambah dependency tanpa sebab. Selepas saya setuju, bina dan uji pada desktop serta 375px. Laporkan ujian yang benar-benar dijalankan.','Bina dashboard HTML/CSS/JavaScript menggunakan data latihan 12, 8 dan 5. Minta Bob semak jumlah 25, label carta, keadaan kosong dan paparan telefon. Semak sendiri kod serta hasil browser.','Dashboard yang boleh dijalankan, diff yang disemak dan catatan ujian sebenar. Bantuan AI tidak menggantikan tanggungjawab menyemak kod.','IBM Bob: Introduction :: https://bob.ibm.com/docs/ide
IBM Bob: Modes :: https://bob.ibm.com/docs/ide/features/modes
IBM Bob: Best practices :: https://bob.ibm.com/docs/ide/getting-started/best-practices',2) ON DUPLICATE KEY UPDATE slug=slug;
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
