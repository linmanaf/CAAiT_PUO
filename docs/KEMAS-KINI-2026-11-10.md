# Kemas kini 10 November 2026

Sumber kerja ini ialah `New update dashboard/DASHBOARD CORRECTION.docx` — satu pusingan pembetulan ke atas modul Program & Pencapaian, berserta bahan foto, tiga pautan Google Drive dan satu halaman baharu.

Dashboard kini **hidup di production** pada https://caaitpuo.info/ (JimatHosting, LiteSpeed). Disahkan pada tarikh ini: HTTPS berfungsi, config production dimuatkan dari luar webroot (`"local":false`), jadual `training` berisi, `docs/`, `database/`, `scripts/` dan `.work/` semuanya membalas 403, dan header CSP/X-Frame-Options/nosniff disajikan. Fail kerja lokal adalah identik bait-ke-bait dengan yang live sebelum kerja ini bermula.

## Halaman baharu: Prakata Ketua Pusat

Laluan `#prakata`, diletakkan selepas "Selamat datang" dalam menu. Halaman mendarat kekal `welcome`, jadi bookmark sedia ada tidak terjejas.

`prakata` turut ditambah ke senarai putih `$modules` dalam `api/index.php` — tanpa itu, setiap paparan dan maklum balas bagi halaman ini akan ditolak dengan 422. Ia juga dimasukkan ke senarai pengecam terpelihara `training-save`, supaya admin tidak boleh mencipta modul latihan yang berlanggar dengan laluan ini.

## Aset

31 imej diekstrak daripada dokumen, diproses melalui .NET System.Drawing (tiada dependency baharu masuk projek):

| | Sebelum | Selepas |
|---|---|---|
| 24 gambar program | ~17 MB | 2.5 MB (`assets/programs/`, maks 1200px, JPEG q82) |
| 4 logo latihan | — | 36 KB (`assets/training/`) |
| 1 potret prakata | 141 KB | 125 KB (`assets/people/marlina-potret.png`, alfa dikekalkan) |

Imej yang sumbernya sudah JPEG termampat **disalin terus**, kerana encode semula menjadikannya lebih besar. Logo Canva dan Canva AI tiada saluran alfa, jadi ia disimpan sebagai JPEG (7–8 KB) dan bukan PNG (35–40 KB).

`hdphoto1.wdp` dalam dokumen hanyalah sisa kesan "remove background" Word; PNG potret sudah membawa alfa sebenar, jadi fail itu tidak digunakan.

## Perubahan kandungan

- **Benchmarking Series** kekal **satu** entri dengan galeri tiga lokasi (Melbourne 6 gambar, HEJIM UKM 4, CAIRO UTM 2). Memecahkannya kepada tiga entri akan menjadikan jumlah 14 dan memecahkan kad statistik, carta lajur tahun, donat status serta ujian yang mengawalnya.
- Galeri ditambah kepada AI Awareness, AI Project in Action, PNA, Forum, HanDe dan Madani Rakyat — 23 gambar merentas 7 entri.
- Butiran baharu: kumpulan penyelidik dan taburan responden PNA, fokus program AI Awareness dan Forum, laporan booth Madani Rakyat.
- Enam pautan luar (Google Drive dan YouTube) sebagai **pautan biasa yang membuka tab baharu**. Tiada perubahan CSP diperlukan; embed iframe akan memerlukan `frame-src` dilonggarkan.
- Panel "Kerjasama dalam perancangan" dalam modul Kerjasama dibuang seperti diminta, digantikan dengan **Pelantikan dalam MAIC**.
- Logo produk pada indeks Latihan. Peta logo diletakkan di sebelah slug dalam `app.js`, **bukan** sebagai lajur database — jadi modul ciptaan admin terus berfungsi tanpa logo, dan database production tidak perlu migrasi.

## Angka

1. **Jumlah responden PNA.** Bahan sumber memaparkan **1,274** sebagai angka besar, tetapi kelima-lima komponennya (392 + 383 + 300 + 169 + 31) berjumlah **1,275**. Percanggahan ini dibangkitkan kepada pengguna, yang mengesahkan **1,275** sebagai angka yang betul. Jumlah itu kini dipaparkan bersama kelima-lima komponennya, jadi pembaca boleh menyemak sendiri hasil tambahnya.
2. **"60 peserta" Madani Rakyat** dilabel sebagai laporan setakat 1.00 tengah hari, bukan jumlah akhir, kerana itulah yang dinyatakan sumber.

## Ujian kosa kata sumber tidak pernah berfungsi

`scripts/test-content.mjs` mengandungi satu ujian yang sepatutnya menghalang nama dokumen sumber daripada bocor ke teks yang dibaca pelawat. Coraknya ditulis sebagai:

```
const banned = /\b(slide|MAIC)\b/i;
```

tetapi kedua-dua `\b` itu disimpan dalam fail sebagai **aksara backspace literal** (U+0008), bukan escape dua aksara. Corak sebenar menjadi `/\x08(slide|MAIC)\x08/i`, yang memerlukan aksara backspace sebenar mengapit perkataan — jadi ia tidak boleh padan dengan apa-apa. Ujian itu lulus sejak hari pertama tanpa pernah menyemak sesuatu.

Corak dibetulkan, dan liputannya diluaskan kepada kapsyen, blok butiran, prakata serta pelantikan. Selepas dibetulkan, semuanya tetap lulus — jadi tiada kosa kata sumber yang benar-benar bocor.

Larangan turut diperhalusi: ia kini menyasarkan **dokumen** sumber (`MAIC MEETING`, `.pptx`, perkataan `slide`), bukan singkatan `MAIC` itu sendiri. MAIC ialah konsortium yang CAAiT sertai dan merupakan kandungan sah yang perlu diterbitkan.

## Pengesahan

| Semakan | Keputusan |
|---|---|
| `node scripts/test-content.mjs` | 19/19 lulus (14 sedia ada + 5 baharu) |
| `node scripts/test-api.mjs` | 9/9 kumpulan lulus, tiada regresi |
| `node --check` app.js, content.js | Lulus |
| PHP lint `api/`, `scripts/` | Lulus |
| 30 rujukan aset | Semua wujud; tiada imej rosak pada runtime |
| Laluan pada 375px sebenar (emulasi peranti) | prakata, partners, training, welcome, dashboard, programs — tiada limpahan mendatar |
| `prakata` pada endpoint event | 200; modul tidak dikenali masih 422 |
| Pakej cPanel | 71 entri (dahulu 36), ZIP 7.70 MB |

Enam rekod analytics yang tercipta semasa semakan telah dibuang daripada database lokal. Tiada rekod pengguna sebenar disentuh, dan tiada apa-apa ditulis ke database production.

## Lima perkara taksa, dan keputusannya

Kelima-limanya dibangkitkan sebelum kerja bermula dan diputuskan oleh pengguna.

| Perkara | Keputusan |
|---|---|
| Jumlah responden PNA: 1,274 atau 1,275? | **1,275** — hasil tambah komponen |
| Penyelidik PNA: 6 (teks) atau 8 (imej kumpulan)? | **6**, mengikut senarai bertaip |
| Jawatan Dr Shamsuri — tiga versi bercanggah merentas bahan | **Carta organisasi dalam sistem yang sahih.** Semua jawatan dalam blok sokongan PNA kini diambil dari situ |
| RMIT University kelihatan pada papan tanda dalam gambar Melbourne tetapi tiada dalam teks | Ikut dokumen: gambar dikekalkan, kapsyen hanya menyatakan apa yang kelihatan pada papan tanda, tiada dakwaan ditambah |
| "IBM University of New South Wales" — taksa | Ikut perkataan dokumen seadanya |

Jawatan Dr Shamsuri patut diberi perhatian pada masa hadapan: poster forum dalam dokumen yang sama menamakannya "Timbalan Ketua Pengarah (Perancangan) JPPKK", manakala teks PNA menamakannya "Pengarah Politeknik Ungku Omar" — sedangkan bahagian MAIC dalam dokumen yang sama menamakan Dr Hajah Salmi sebagai Pengarah PUO. Laman ini kini konsisten dengan dirinya sendiri kerana satu sumber sahaja digunakan, tetapi percanggahan dalam bahan asal masih belum diselesaikan.

Frasa "IBM University of New South Wales" dikekalkan seperti ditulis dalam dokumen. Ia boleh dibaca sebagai dua penyedia (IBM, dan UNSW) atau satu nama — pengguna tidak pasti dan memilih untuk mengekalkan perkataan sumber. Jika maksudnya dua, koma perlu ditambah selepas "IBM".

## Muat naik

**Diterbitkan ke https://caaitpuo.info/ pada 10 November 2026.** Dimuat naik oleh pengguna melalui cPanel File Manager menggunakan pakej delta (`dist/CAAiT-kemaskini-*.zip`, 33 fail, 2.52 MB) — hanya empat fail runtime yang berubah dan 29 aset baharu, bukan keluaran penuh 7.7 MB.

Disahkan selepas muat naik: `app.js`, `content.js` dan `analytics.css` sepadan bait-ke-bait dengan salinan lokal; kesemua 29 aset membalas 200 dengan saiz yang betul; `index.html`, `styles.css`, `visuals.js`, `.htaccess` dan kelima-lima HTML redirect kekal utuh; `docs/`, `database/`, `scripts/`, `dist/`, `.work/` dan `.git/` semuanya masih 403.

`api/index.php` disahkan secara berfungsi, bukan melalui hash — fail PHP dilaksanakan, jadi ia tidak boleh dibandingkan melalui HTTP. Buktinya: POST ke endpoint `event` bagi modul `prakata` membalas **200**. Fail lama akan menolaknya dengan 422, kerana `prakata` tiada dalam senarai putih `$modules`-nya.

Tiada perubahan skema database diperlukan — `prakata` ialah senarai putih sisi aplikasi, bukan jadual.

## Susulan 12 November: cache-buster tidak dinaikkan

Semakan pada 12 November mendapati setiap fail pada server **betul** — kelima-lima fail runtime sepadan bait-ke-bait dengan salinan lokal, dan kesemua 50 aset hadir dengan saiz yang tepat. Namun perubahan itu **tidak kelihatan** kepada sesiapa yang pernah melawat laman ini sebelum muat naik.

Puncanya: `index.html` memuatkan setiap fail CSS dan JS dengan tanda versi, contohnya `analytics.css?v=20261105-v23`. Tanda itu tidak pernah dinaikkan, sedangkan server menghantar `Cache-Control: public, max-age=604800` — **tujuh hari**. URL tidak berubah, jadi browser pelawat berulang terus menyajikan stylesheet lamanya sendiri dan langsung tidak bertanya kepada server. Pelawat baharu nampak reka bentuk baharu; pelawat berulang tidak. Itulah sebabnya ia kelihatan seperti muat naik yang gagal sedangkan fail sebenarnya betul.

Ia turut menipu semakan: `curl` dan muat semula paksa memintas cache, jadi kedua-duanya melaporkan "betul" sementara pelawat sebenar masih melihat yang lama.

Tanda dinaikkan kepada `?v=20261112-v24` pada kesemua lima rujukan.

**Untuk setiap keluaran akan datang: naikkan tanda `?v=` dalam `index.html` setiap kali mana-mana fail CSS atau JS berubah, dan muat naik `index.html` bersama fail tersebut.** Tanpa itu, kerja yang dimuat naik tidak akan sampai kepada pelawat sedia ada selama seminggu. Ini satu-satunya fail yang mudah terlupa, kerana `index.html` sendiri jarang berubah.
