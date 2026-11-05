# Pemasangan CAAiT di cPanel JimatHosting

Pakej ini disediakan untuk upload kemudian; belum diterbitkan pada hosting. Domain, versi PHP dan ciri sebenar pakej JimatHosting belum diperiksa melalui akaun hosting.

## 1. Muat naik fail website

Extract ZIP pada komputer. Pakej mempunyai `public_html/`, `installation/`, panduan ini dan manifest SHA-256.

Di File Manager cPanel, buka document root domain yang hendak digunakan (lazimnya `public_html`). Upload **kandungan** folder `public_html` sahaja ke situ, termasuk `.htaccess` (aktifkan Show Hidden Files). Jangan letakkan satu lagi folder `public_html` di dalamnya. Jika guna fungsi Extract cPanel, extract pakej penuh di home akaun terlebih dahulu, kemudian pindahkan hanya kandungan runtime ke document root.

Jangan upload `installation/`, skema SQL, fail admin SQL atau config sebenar ke direktori awam. Pakej tidak mengandungi kata laluan atau data feedback/analytics lokal.

## 2. Database

Gunakan Database Wizard / MySQL Databases cPanel untuk mencipta database serta pengguna khusus. Catat nama penuh termasuk prefix akaun cPanel. Import `installation/schema.sql` melalui tab Import phpMyAdmin pada database yang betul. Selepas import, runtime hanya memerlukan SELECT, INSERT, UPDATE dan DELETE pada database ini.

Jangan import keseluruhan database sistem `mysql` daripada XAMPP. Isu Aria XAMPP tidak perlu dipindahkan ke hosting.

## 3. Konfigurasi persendirian

Salin `installation/config.example.php` menjadi `/home/USERNAME_CPANEL/caait-config.php`, di luar `public_html`. Isi DSN, username database dan password database yang sebenar. Pastikan `environment` ialah `production` dan `secure_cookie` ialah `true`.

Jika domain menggunakan `public_html` sebagai root, config di home akaun dikesan secara automatik. Jika domain menggunakan subfolder atau document root berlainan, tetapkan lokasi config melalui environment pelayan atau tambah dalam `.htaccess`:

```apache
SetEnv CAAIT_CONFIG /home/USERNAME_CPANEL/caait-config.php
```

Aktifkan SSL/HTTPS domain melalui hosting. Aplikasi memerlukan PHP minimum 8.1 dengan PDO MySQL; pilih versi PHP yang masih disokong oleh pihak hosting. `display_errors` hendaklah Off. Jika ada 500 sebelum halaman dibuka, semak Error Log cPanel dan sokongan mod_rewrite/AllowOverride dengan hosting; jangan buang sekatan fail secara membuta tuli.

## 4. Admin pertama tanpa Terminal hosting

Jalankan arahan PowerShell ini pada komputer XAMPP dalam folder projek. Masukkan **kata laluan production baharu**, minimum 12 aksara dan maksimum 72 bait UTF-8. Arahan menyimpan SQL di `.work`, yang disekat daripada akses web dan dikecualikan Git.

```powershell
$adminSecret = Read-Host 'Kata laluan production baharu' -AsSecureString
$secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($adminSecret)
try {
    $adminPlain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)
    $adminSql = $adminPlain | & C:\xampp\php\php.exe scripts/export-admin.php Marlina 'Ts. Marlina Abdul Manaf'
    if ($LASTEXITCODE -ne 0) { throw 'Penjanaan admin gagal; semak syarat password.' }
    [IO.File]::WriteAllText((Join-Path $pwd '.work\admin-production.sql'), ($adminSql -join "`n"), (New-Object Text.UTF8Encoding($false)))
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
    $adminPlain = $null
    $adminSecret = $null
    $adminSql = $null
}
```

Jika menggunakan fail daripada ZIP sahaja, ubah lokasi skrip kepada `installation/export-admin.php` dan simpan output di folder persendirian lokal.

Import `admin-production.sql` menggunakan phpMyAdmin pada database CAAiT. Fail mengandungi hash password sahaja, tetapi tetap perlu dianggap persendirian. Username yang sudah wujud tidak ditulis ganti. Padam fail import persendirian selepas selesai. Jangan gunakan kata laluan sementara lokal untuk production.

Login melalui `https://DOMAIN/#admin`. Akaun yang dicipta terus masuk tanpa pertukaran kata laluan wajib. Kaedah ini tidak memerlukan halaman setup awam atau Terminal cPanel.

## 4b. Tiga perangkap yang menghasilkan gejala "login rosak"

Ketiga-tiganya menunjukkan simptom yang hampir sama — dashboard kelihatan sempurna tetapi log masuk gagal — jadi semak mengikut urutan ini.

**1. HTTPS belum aktif tetapi `secure_cookie => true`.** Ini yang paling kerap. Cookie bertanda `Secure` tidak akan dihantar browser melalui HTTP biasa, jadi sesi tidak pernah melekat: log masuk nampak berjaya, kemudian terus tercampak keluar, atau ralat `Sesi tamat` berulang. **Penyelesaian: aktifkan SSL dan pastikan kau melayari `https://`, bukan `http://`.** Jangan tetapkan `secure_cookie => false` untuk "membetulkannya" — itu mendedahkan cookie sesi.

**2. Melayari `http://` sedangkan SSL sudah aktif.** Gejala sama seperti di atas. Paksa HTTPS melalui cPanel (Domains → Force HTTPS Redirect).

**3. Config tidak dijumpai atau tidak lengkap.** API akan membalas `Konfigurasi pelayan diperlukan` atau `Konfigurasi pelayan tidak lengkap` dengan status 503. Semak lokasi fail config dan pastikan kelima-lima kunci (`dsn`, `user`, `password`, `secure_cookie`, `environment`) ada. Kalau `environment` ialah `production` sementara `secure_cookie` bukan `true`, API sengaja menolak dengan `Production memerlukan secure_cookie=true dan HTTPS.`

Cara pantas membezakan: buka `https://DOMAIN/api/index.php?action=session` terus dalam browser.

| Apa yang dipaparkan | Maksudnya |
|---|---|
| JSON dengan `"csrf"` dan `"local":false` | Backend sihat; masalahnya cookie/HTTPS |
| `{"error":"Konfigurasi pelayan ..."}` | Masalah config (perangkap 3) |
| Halaman ralat 500 | `.htaccess` atau mod_rewrite; semak Error Log cPanel |
| Muat turun fail atau kod PHP mentah | PHP tidak dilaksanakan; semak versi PHP domain |

Nota import admin: SQL yang dijana ialah `INSERT` biasa. Jika username itu sudah wujud, phpMyAdmin akan memaparkan ralat *Duplicate entry* — itu perlindungan yang disengajakan supaya akaun sedia ada tidak ditulis ganti, bukan kerosakan.

## 5. Sahkan pada URL sebenar

- Semua logo/menu/latihan dibuka; uji telefon 375px.
- Login salah ditolak; login betul, tukar password, logout, dan akses API tanpa login disekat.
- Hantar satu feedback yang dipersetujui, pastikan muncul di admin, tukar status dan refresh.
- Buka modul dari pelayar lain dan semak statistik bagi tarikh hari ini.
- `config.example.php`, `.git/config`, `database/schema.sql` dan `scripts/` tidak boleh dibaca dari URL awam.
- Semak tiada ralat JavaScript atau aset gagal; pastikan trafik melalui HTTPS.
- Aktifkan backup database di hosting.

Data semakan production perlu dikenal pasti secara khusus sebelum dibersihkan; jangan padam rekod pengguna sebenar.

## Rujukan rasmi

- Database Wizard: https://docs.cpanel.net/cpanel/databases/mysql-database-wizard/
- Import phpMyAdmin: https://support.cpanel.net/hc/en-us/articles/360055713714-How-do-you-import-and-export-databases-via-phpMyAdmin
- File Manager: https://docs.cpanel.net/cpanel/files/file-manager/110/

Panduan disemak pada 5 November 2026. Nama menu mungkin berbeza mengikut versi cPanel dan ciri yang diaktifkan penyedia hosting.
