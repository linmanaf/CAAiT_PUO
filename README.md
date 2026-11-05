# Dashboard CAAiT

Dashboard berasaskan HTML/CSS/JavaScript sedia ada, dengan PHP 8.1+ dan MySQL/MariaDB. Tiada dependency npm atau proses build diperlukan.

Kemas kini 5 November (petang): dashboard direka semula dengan enjin carta sendiri — carta lajur aktiviti mengikut tahun, donat status, tangga roadmap, sparkline, count-up dan perbandingan tempoh dalam panel admin. Semua warna kini diambil terus daripada logo CAAiT dan disahkan untuk keterlihatan; lihat [Palet dan peraturan carta](#palet-dan-peraturan-carta). Ralat log masuk admin yang berulang telah dibaiki: sesi yang luput kini dipulihkan secara automatik tanpa perlu refresh — punca dan pengesahan dalam [nota reka semula](docs/REKA-SEMULA-DASHBOARD.md). Untuk hosting JimatHosting, ikut [panduan cPanel](docs/CPANEL.md). Bina pakej upload dengan `powershell -ExecutionPolicy Bypass -File scripts/package-cpanel.ps1`; ZIP yang disemak akan berada dalam `dist/`. Pakej tidak mengandungi config sebenar atau data lokal. Kaedah admin melalui phpMyAdmin tanpa Terminal disediakan dalam panduan tersebut.

## Pratonton XAMPP

Mulakan Apache dan MySQL, kemudian buka:

http://localhost/CAAIT%20Project/

Admin: http://localhost/CAAIT%20Project/#admin

**Jangan klik dua kali `index.html`.** Membukanya terus daripada fail (`file:///…`) memaparkan dashboard dengan sempurna, tetapi browser menyekat semua panggilan ke `api/index.php`, jadi log masuk, maklum balas dan statistik akan gagal dengan "Tidak dapat menghubungi pelayan". Aplikasi kini memaparkan sepanduk amaran apabila ini berlaku. Sentiasa layari melalui `http://localhost/` selepas Apache dan MySQL dihidupkan.

Username lokal: `Marlina`. Gunakan kata laluan terkini yang ditetapkan pengguna; kata laluan hanya disimpan sebagai hash dalam database. Tiada pertukaran kata laluan wajib dan tiada borang tukar kata laluan pada panel akaun ini.

Konfigurasi lokal sebenar: `C:\xampp\caait-config.php`, di luar `htdocs` dan Git. Database: `caait_dashboard`. Database aplikasi menggunakan InnoDB.

**Had persekitaran lokal:** pemberian hak kepada pengguna MySQL terhad gagal kerana ralat checksum Aria pada jadual sistem MariaDB sedia ada. Konfigurasi lokal menggunakan akses root XAMPP yang sedia ada. Jangan gunakan konfigurasi ini pada hosting. Jadual sistem yang dikongsi projek lain tidak dibaiki. Akaun MySQL `caait_app` mungkin telah tercipta semasa percubaan tetapi tidak digunakan aplikasi.

Untuk mengakses dari peranti lain dalam LAN, gunakan alamat IP komputer XAMPP menggantikan `localhost`, pada rangkaian yang dipercayai. Apache dan Windows Firewall perlu membenarkannya. Akses fizikal dari telefon lain belum diuji; penyimpanan dan pengesahan merentas sesi pelayar berasingan telah diuji. Hosting sebenar mesti menggunakan HTTPS.

## Kandungan dan struktur

- `index.html`, `styles.css`, `app.js`: shell, sidebar, routing dan interaksi.
- `visuals.js`, `analytics.css`: visual analytics, tooltip, jadual dan animasi dengan reduced motion.
- `content.js`: satu sumber fakta, program, angka streaming dan kandungan tiga latihan.
- `assets/`: logo rasmi, bahan imej daripada slide dan salinan render semua 8 slide.
- `api/`: sesi, login/logout, kata laluan, feedback, status dan analytics.
- `database/schema.sql`: skema tanpa data atau kata laluan.
- `config.example.php`: contoh konfigurasi tanpa rahsia.
- `scripts/create-admin.php`: penciptaan admin melalui CLI, kata laluan daripada stdin.
- `scripts/test-api.mjs`: ujian API XAMPP menggunakan akaun sementara.
- `scripts/test-content.mjs`: ujian kesetiaan data slide dan output carta. Tidak memerlukan Apache atau database — jalankan `node scripts/test-content.mjs`.
- `docs/SERAHAN.md`: keputusan ujian, audit kandungan dan perkara untuk pengesahan.
- Halaman HTML lama menghala ke modul berkaitan, supaya pautan lama tidak memaparkan data contoh.

Fail sumber PowerPoint dan logo asal tidak diubah. `my-tvet-dashboard-plan.md` tidak digunakan sebagai data institusi.

## Palet dan peraturan carta

Setiap warna diambil terus daripada `logo CAAIT.jpeg` dan ditetapkan sebagai token dalam `analytics.css`:

| Peranan | Nilai | Asal dalam logo |
|---|---|---|
| Teks / ink | `#140b3c` | huruf "CAAiT" |
| Utama (primary) | `#5b21c7` | ungu kepala rangkaian |
| Aksen | `#e020a8` | magenta dalam wajah |
| Tangga ordinal | `#b795f2 → #5b21c7` | satu rona ungu, cerah ke gelap |
| Lavender | `#cdbdf2` | tanda air "AI" |

Peraturan yang dipatuhi carta dalam projek ini:

- **Satu siri = satu warna.** Ungu utama untuk semua bar; magenta hanya menandakan satu nilai melampau (puncak atau tahun tersibuk), tidak pernah lebih daripada satu dalam satu carta.
- **Turutan menggunakan tangga, bukan warna berlainan.** Status rekod dan rating memakai satu rona ungu yang semakin pekat, kerana urutannya bermakna.
- **Tiada paksi berganda, tiada warna pelangi, grid garisan halus pejal.** Bar nipis dengan hujung bulat 4px dan tapak persegi; segmen donat dipisahkan jurang 2px.
- **Warna tidak pernah menjadi satu-satunya isyarat.** Setiap carta mempunyai label terus, legenda dan jadual nilai yang boleh dibuka. Arah perubahan dalam panel admin dibaca melalui anak panah dan perkataan (naik/turun), bukan warna.
- **Semua angka datang daripada data.** Tiada carta menerima nilai yang tidak boleh dijejak ke slide atau ke database.

Palet disahkan terhadap had keterlihatan (jalur kecerahan, lantai kroma, pemisahan buta warna protan/deutan, kontras terhadap latar). Pasangan terburuk: ΔE 9.4 bagi buta warna dan 20.4 bagi penglihatan biasa; semuanya melepasi ambang. `#140b3c`, `#5b21c7` dan `#b8137f` lulus kontras teks WCAG AA pada latar putih.

## Pemasangan pada cPanel

1. Gunakan PHP yang masih disokong oleh penyedia hosting (kod memerlukan minimum PHP 8.1), sambungan `pdo_mysql`, MySQL/MariaDB dan HTTPS. Aktifkan `display_errors=Off`, `log_errors=On`, dan `AllowOverride` bagi `.htaccess`.
2. Cipta database dan pengguna database khusus melalui cPanel. Import `database/schema.sql` menggunakan phpMyAdmin. Gunakan pengguna terhad kepada database aplikasi; runtime memerlukan SELECT, INSERT, UPDATE dan DELETE.
3. Salin kandungan `config.example.php` ke **luar** `public_html`, contohnya `/home/ACCOUNT/caait-config.php`. Isi DSN/nama database, username dan password sebenar. Tetapkan `secure_cookie => true`, `environment => 'production'`.
4. Muat naik `index.html`, `styles.css`, `analytics.css`, `app.js`, `visuals.js`, `content.js`, `.htaccess`, `api/`, `assets/` dan lima HTML redirect. Pakej cPanel mengumpulkan semuanya dalam `public_html/`. Jangan muat naik `.git`, `.work`, fail audio, dump database, konfigurasi sebenar atau dokumen dalaman.
5. Jika aplikasi berada terus dalam `public_html`, lokasi config di atas dikesan secara automatik. Jika dalam subfolder, tetapkan environment pelayan `CAAIT_CONFIG=/home/ACCOUNT/caait-config.php` menggunakan konfigurasi hosting atau arahan `SetEnv` dalam `.htaccess`. Nilainya ialah lokasi fail, bukan rahsia.
6. Letakkan `scripts/create-admin.php` sementara dalam `scripts/` di root projek untuk dijalankan melalui Terminal cPanel (HTTP ke folder ini disekat). Tetapkan `CAAIT_CONFIG` bagi CLI. Jika Terminal tiada, minta penyedia hosting menjalankan arahan ini; tiada endpoint setup awam.

```bash
export CAAIT_CONFIG=/home/ACCOUNT/caait-config.php
read -s -p 'Kata laluan admin: ' CAAIT_ADMIN_PASSWORD
printf '\n'
printf '%s\n' "$CAAIT_ADMIN_PASSWORD" | php scripts/create-admin.php Marlina 'Ts. Marlina Abdul Manaf'
unset CAAIT_ADMIN_PASSWORD
```

Gunakan kata laluan sekurang-kurangnya 12 aksara untuk production. Kata laluan tidak diletakkan dalam command arguments, fail atau repository. Akaun sedia ada tidak ditulis ganti oleh skrip. Login pertama terus ke panel. Flag CLI `--require-password-change` hanya untuk akaun yang sengaja memerlukan pertukaran.

7. Uji URL HTTPS: login betul/salah, logout, feedback sebenar yang dipersetujui, status selepas refresh, statistik antara dua pelayar dan larangan API tanpa login. Semak `config.example.php`, `.git/config`, `database/schema.sql` dan `.work` mengembalikan 403.
8. Sandarkan database melalui cPanel secara berkala. Tetapkan polisi simpanan feedback/analytics mengikut keperluan institusi. Jangan muat naik backup ke direktori awam.

## Definisi analytics

- Satu paparan ialah satu pembukaan modul awam, termasuk refresh. Menekan menu yang sudah aktif tanpa perubahan hash tidak menambah paparan.
- Setiap peristiwa mempunyai UUID unik; percubaan semula dengan UUID sama tidak menambah rekod.
- Pengecam UUID rawak dalam localStorage digunakan untuk anggaran pelawat unik. Database menyimpan SHA-256 pengecam tersebut. Tiada fingerprinting, user-agent atau IP mentah dalam rekod analytics.
- Pelawat unik ialah bilangan pengecam berbeza dalam julat dipilih. Peranti/pelayar berbeza atau storan yang dikosongkan boleh dikira berasingan; ia bukan ukuran manusia tepat.
- Aktiviti admin yang telah login tidak direkod. Paparan login admin juga tidak direkod.
- Data ujian bertanda `is_test=1` dikecualikan daripada laporan biasa. Mod ujian hanya boleh diaktifkan dalam persekitaran `local` melalui `?test=1`. Membuka URL biasa mematikannya semula.
- Tarikh laporan menggunakan Asia/Kuala_Lumpur. Julat tarikh merangkumi keseluruhan hari mula dan akhir, maksimum 366 hari.
- Purata rating tanpa feedback dipaparkan sebagai `—`, bukan sifar.
- Kawalan spam dan login menggunakan hash alamat IP bagi tempoh rate limit, berasingan daripada analytics.

## Semakan dan ujian

```powershell
node --check app.js
node --check content.js
Get-ChildItem api,scripts -Filter *.php -Recurse | ForEach-Object { & C:\xampp\php\php.exe -l $_.FullName }
node scripts/test-api.mjs
git diff --check
```

Suite API hanya membenarkan URL localhost. Jangan jalankan suite ujian terhadap database production. Had cubaan boleh menyebabkan ujian berulang terlalu cepat menerima 429; ini tingkah laku kawalan spam yang disengajakan.

GitHub Pages sesuai untuk dashboard latihan statik sahaja. Dashboard penuh ini memerlukan PHP/MySQL pada hosting yang telah dipilih.
