# Kemas kini 5 November 2026

Hosting JimatHosting telah dibeli. Kerja ini menyediakan pakej cPanel untuk upload kemudian; tiada login ke hosting atau deployment dibuat.

## Paparan dan analytics

- Kad statistik masuk secara berperingkat; bar berkembang dari kiri dan carta donut masuk dengan gerakan ringan.
- Carta donut mengira 10 entri dilaporkan, 1 LOI/perancangan dan 1 kerjasama masa hadapan daripada `content.js`. Ini jumlah entri, bukan dakwaan semua program selesai.
- Trend harian admin kini graf garis/area SVG dengan tooltip, slider hari untuk sentuhan/keyboard dan jadual data penuh. Hari tiada lawatan diisi sifar hanya untuk analytics dalam julat laporan yang diketahui.
- Angka statistik dan “++” tidak diubah atau digantikan dengan angka simulasi. Tiada pertumbuhan palsu atau carta institusi rekaan ditambah.
- Reduced motion mematikan animasi. Tiada library/dependency baharu ditambah.
- Respons penapis statistik lama tidak boleh menggantikan hasil permintaan yang lebih baharu. Ralat logout dipaparkan secara inline.

## Pembaikan pemasangan dan backend

- Config mesti tersedia di luar webroot; fallback automatik kepada root database dibuang. Konfigurasi production memerlukan secure cookie.
- UUID diperiksa mengikut format v4 sebenar.
- Had panjang password diselaraskan dengan bcrypt (maksimum 72 bait UTF-8), mengelakkan pemotongan senyap password panjang.
- Feedback dengan ID sama yang tiba serentak dikendalikan secara atomik oleh unique key dan upsert.
- `scripts/export-admin.php` menjana SQL admin berhash melalui stdin untuk import persendirian phpMyAdmin. Tiada endpoint setup awam atau default password.
- `scripts/package-cpanel.ps1` membina ZIP daripada senarai fail runtime yang ditetapkan serta menyemak manifest dan ketiadaan config/secrets lokal.

## Pengesahan

- Suite regresi API: 8 kumpulan ujian lulus selepas pembaikan backend.
- Tooltip graf sama dengan nilai hari dalam data; jumlah 7 hari sama dengan kad statistik (57 dalam data ujian bertanda, bukan data awam).
- Pada 375px, graf/slider dan dashboard tidak melimpah mendatar. Semua modul pada tablet 820px dibuka tanpa overflow; desktop turut diperiksa.
- Reduced motion: sifar animasi aktif, nilai 12 / 3 / 2400++ / 3 dikekalkan.
- PHP lint, JavaScript syntax dan `git diff --check` lulus.
- Penjana SQL admin diuji: hash sepadan dengan password yang dijana secara rawak; password pendek ditolak; config hilang gagal secara terkawal.
- ZIP akhir disemak 36 entri, menggunakan pemisah laluan `/` yang serasi Linux, tanpa config/database/akaun sebenar. Fail runtime, skema pemasangan dan panduan diasingkan.

Data yang dijana untuk semakan graf ditanda `is_test=1` dan dibersihkan selepas semakan. Akaun Marlina dan rekod sebenar tidak diubah.

## Baki yang memerlukan tindakan luar

- Percanggahan fakta dalam slide masih disenaraikan dalam `SERAHAN.md`; tidak diteka atau disahkan tanpa bukti.
- Semakan baca sahaja `CHECK TABLE mysql.db` mengesahkan jadual sistem XAMPP rosak. Pembaikan jadual sistem perlu backup serta skop berasingan kerana dikongsi projek lain. Database aplikasi InnoDB berfungsi dan tidak perlu membawa jadual sistem XAMPP ke hosting.
- Domain, akses cPanel, database hosting dan ujian HTTPS production belum diberikan/dibuat. Ikut `CPANEL.md` apabila bersedia.

## Arahan akaun terkini dan paparan admin

Username lokal ditetapkan kepada `Marlina`, password dikemas kini mengikut arahan pengguna dan disimpan sebagai hash sahaja. Tiada pertukaran password wajib; akaun terus membuka analytics. Tetapan ini menggantikan arahan pertukaran pertama dalam laporan terdahulu.

Panel admin ditambah header sambutan, graf trend yang kekal kelihatan walaupun data kosong, carta donut status feedback, histogram rating dan kad lawatan Canva/IBM Bob/GitHub. Semua agregat menggunakan database serta julat tarikh yang sama. Animasi menghormati reduced motion. Login sebenar, 8 kumpulan ujian API, desktop, 375px dan console telah diperiksa.
