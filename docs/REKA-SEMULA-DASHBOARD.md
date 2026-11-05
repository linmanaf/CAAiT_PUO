# Reka semula dashboard — 5 November 2026 (petang)

Semakan penuh projek, pembaikan ralat dan reka semula dashboard. Rujukan kandungan kekal `CAAIT (MAIC MEETING).pptx`; tiada fakta baharu dimasukkan.

## Semakan kandungan terhadap slide

Teks semua 8 slide diekstrak semula dan dibandingkan dengan `content.js`. Hasil: **tiada percanggahan**.

- Pengenalan dan empat misi sepadan dengan slide 2.
- Tujuh nama dan jawatan sepadan dengan slide 3; koordinator jabatan kekal tanpa nama kerana slide tidak menamakannya.
- Enam peringkat roadmap sepadan dengan slide 4; hanya penubuhan bertarikh (Ogos 2024).
- Dua belas entri program sepadan dengan slide 5–7, termasuk tiga angka `400++`, `2400++`, `400++`.
- Hala tuju dan peluang kerjasama sepadan dengan slide 8.

Nota kehati-hatian sedia ada dikekalkan: status LOI HanDe (M), tarikh PDIC yang perlu pengesahan, dan penawaran diploma 2027 sebagai impak/perancangan — bukan pengambilan.

## Ralat dan jurang yang dibaiki

| Perkara | Keadaan sebelum | Tindakan |
|---|---|---|
| Fail slide sumber terdedah | `CAAIT (MAIC MEETING).pptx` (5.1 MB) boleh dimuat turun sesiapa sahaja pada URL awam | `.htaccess` kini menyekat `.pptx`, `.doc(x)`, `.xls(x)` bersama `.sql`, `.md` dan `.ogg`. Disahkan: 403 |
| Warna di luar identiti | `--blue:#1a56db` dan hijau-biru `#35a38f` tiada dalam logo CAAiT | Semua token diganti dengan warna logo yang disahkan |
| Nombor count-up boleh tersangkut | Animasi bergantung sepenuhnya pada `requestAnimationFrame`; bila ia di-throttle (tab latar, penangkapan skrin) nombor kekal `0` | Nilai akhir ditulis dahulu, kemajuan dikira dengan jam dinding, dan pemasa sandaran memastikan nilai betul walaupun langsung tiada frame |
| Animasi berkelip di panel admin | `enhance()` dipanggil dua kali bagi render yang sama, membatalkan animasi yang baru bermula | Satu panggilan sahaja bagi setiap render; nod yang sudah dianimasi ditanda dan tidak diulang |
| BOM dalam fail sumber | `index.html` dan `styles.css` bermula dengan BOM UTF-8 | Dibuang |
| Pembolehubah bertindih | `const feedback` dalam `loadStats` menutupi fungsi paparan `feedback()` | Dinamakan semula kepada `inbox` |
| Meta sosial tiada | Tiada `theme-color` atau tag Open Graph | Ditambah |

## Pembaikan: "log masuk admin selalu keluar error"

**Punca.** Dasar idle aplikasi ialah 1800 saat, tetapi `session.gc_maxlifetime` PHP pada pelayan ini ialah 1440 saat. Pemungut sampah PHP membuang fail sesi **6 minit lebih awal** daripada yang aplikasi jangkakan. Oleh kerana `session.use_strict_mode` aktif, PHP menolak ID lama dan mencipta sesi baharu **secara senyap, dengan token CSRF baharu**. Halaman yang sudah terbuka masih memegang token lama, jadi hantaran seterusnya ditolak dengan `403 Sesi tamat. Muat semula halaman.` Itulah sebabnya ia nampak rawak: ia bergantung pada berapa lama tab dibiarkan terbuka.

**Tiga pembaikan.**

1. `app.js` — apabila satu hantaran ditolak kerana token basi, `api()` kini mengambil token semasa dan **mengulang hantaran itu sekali secara automatik**. Pengguna tidak perlu refresh atau menaip semula. Ralat `must_change` dikecualikan kerana ia 403 yang sah, bukan token basi.
2. `app.js` — sesi gantian turut mereset pengira anti-bot borang maklum balas (`form_start`). Ulangan bagi borang yang membawa `request_id` menunggu sehingga pengira itu melepasi tetingkap 2 saat, supaya pemulihan tidak tersangkut pada perisai anti-bot. Perisai itu sendiri tidak dilonggarkan.
3. `api/bootstrap.php` — `session.gc_maxlifetime` dinaikkan kepada sekurang-kurangnya 1800 saat supaya PHP tidak lagi membuang sesi lebih awal daripada dasar aplikasi.

**Cara ia disahkan.** Semua fail sesi dalam `C:\xampp\tmp` dipadam untuk meniru sesi yang luput, kemudian borang dihantar dari halaman yang masih memegang token lama:

| Ujian | Sebelum | Selepas |
|---|---|---|
| Log masuk admin dengan sesi mati | `Sesi tamat. Muat semula halaman.` | Log masuk berjaya |
| Hantar maklum balas dengan sesi mati | `Sesi tamat. Muat semula halaman.` | Maklum balas tersimpan |

## Pembaikan: "Tidak dapat menghubungi pelayan"

**Punca.** Bukan pepijat kod. Log akses Apache menunjukkan **tiada satu pun permintaan** daripada browser pada waktu ralat itu berlaku, sedangkan Apache hidup dan mendengar port 80 (disahkan dengan `curl`: `200 OK`). Halaman itu dibuka **terus daripada fail** — `file:///C:/xampp/htdocs/CAAIT Project/index.html` — bukan melalui `http://localhost/`.

Di bawah `file://`, HTML, CSS dan JavaScript semuanya dimuatkan seperti biasa, jadi dashboard kelihatan sempurna. Tetapi `fetch('api/index.php')` menyelesai kepada `file://…/api/index.php`, yang disekat browser. Setiap panggilan API gagal pada peringkat rangkaian, lalu `api()` melaporkan "Tidak dapat menghubungi pelayan".

**Pembaikan.** Aplikasi kini menamakan punca sebenar, bukan menyalahkan sambungan:

1. Sepanduk amaran dipaparkan sebaik halaman dimuatkan daripada `file://`, kerana dashboard nampak sihat dan pengguna tiada sebab untuk mengesyaki cara ia dibuka.
2. Mesej ralat rangkaian dibezakan: `file://` menyebut cara membukanya dengan betul; `http://` pula menyebut Apache dan MySQL dalam XAMPP.

| Cara dibuka | Sebelum | Selepas |
|---|---|---|
| `file:///…/index.html` | `Tidak dapat menghubungi pelayan. Semak sambungan…` | Sepanduk + "Halaman ini dibuka terus daripada fail… buka http://localhost/CAAIT%20Project/" |
| `http://localhost/…` | berfungsi | berfungsi, tiada sepanduk |

**Cara membuka dengan betul:** hidupkan Apache dan MySQL dalam XAMPP Control Panel, kemudian layari `http://localhost/CAAIT%20Project/`. Jangan klik dua kali `index.html`.

**Bonus.** Jadual `rate_limits` tidak pernah dibersihkan dan membesar selama-lamanya (37 baris tertunggak ditemui, semuanya sudah luput). `limit()` kini menyapu baris luput sekali-sekala.

Nota: rate-limit log masuk ialah 8 cubaan setiap 15 minit bagi setiap username. Jika kata laluan tersilap berulang kali, tunggu sehingga tetingkap itu tamat — ini perisai yang disengajakan, bukan pepijat.

## Reka semula dashboard

**Dashboard awam**

- Hero dengan jalinan nod lembut yang menggemakan motif rangkaian dalam logo.
- Empat kad statistik dengan count-up: 12 entri, 3,200++ jangkauan asas, tahun tersibuk, 3 modul latihan.
- **Carta lajur baharu — aktiviti mengikut tahun.** Setiap entri dikira sekali mengikut tarikh dalam slide: 2024=2, 2025=5, 2025–2026=2, 2026=2, tiada tarikh=1. Jumlah kekal 12 dan boleh disemak. Tahun tersibuk ditanda dengan magenta.
- Donat status rekod dengan jurang 2px dan angka utama di tengah.
- Bar jangkauan dengan label terus pada hujung dan satu bar aksen bagi nilai tertinggi.
- **Tangga roadmap baharu** — enam peringkat slide 4 dengan rel warna yang semakin pekat mengikut urutan. Peringkat tanpa tarikh dipaparkan secara perlahan, bukan ditonjolkan.

**Panel admin**

- Kad statistik kini membawa **perbandingan tempoh sebelum** (contoh: "naik 83% vs 30 hari sebelum") dan **sparkline** bagi jumlah paparan. Perbandingan disembunyikan apabila tempoh sebelum bernilai sifar, supaya tiada peratusan mengarut dipaparkan.
- Graf trend: titik harian dengan cincin putih 2px, penanda puncak magenta berlabel, penanda hari terakhir, garis panduan dan tooltip, grid garisan halus pejal.
- Taburan rating memakai tangga ordinal (5 bintang paling pekat).
- Modul paling banyak dibuka menonjolkan modul teratas dengan aksen.

Semua animasi dimatikan sepenuhnya apabila `prefers-reduced-motion: reduce`.

## Ujian

- `node scripts/test-api.mjs` — 8/8 lulus (tiada perubahan backend; dijalankan untuk mengesahkan tiada regresi).
- `node scripts/test-content.mjs` — **baharu**, 11/11 lulus. Menjaga kesetiaan angka slide dan output carta, termasuk pelepasan aksara untuk teks tidak dipercayai, keadaan kosong yang jujur, dan kehadiran jadual nilai.
- `powershell -ExecutionPolicy Bypass -File scripts/package-cpanel.ps1` — pakej dibina dan disahkan, 36 entri.
- Disemak dalam Chrome pada 1440px dan 390px: tiada ralat console, tiada skrol mendatar, semua 11 laluan memapar.

## Yang sengaja tidak dilakukan

- Tiada mod gelap ditambah — arahan adalah mengekalkan tema warna sedia ada.
- Tiada library carta ditambah; enjin carta ditulis sendiri supaya projek kekal tanpa dependency dan tanpa proses build.
- Data ujian `is_test=1` dalam database lokal dibiarkan untuk pratonton. Ia tidak muncul dalam laporan biasa dan hanya kelihatan melalui `?test=1` dalam mod lokal. Untuk membuangnya:

  ```sql
  DELETE FROM events WHERE is_test = 1;
  DELETE FROM feedback WHERE is_test = 1;
  ```
