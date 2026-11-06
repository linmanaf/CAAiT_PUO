-- CAAiT: pembetulan set aksara.
--
-- Masalah: jadual yang dicipta tanpa charset eksplisit mewarisi default database.
-- Pada hosting yang defaultnya latin1 (cp1252), aksara seperti anak panah → ditolak
-- semasa INSERT dengan ralat "Incorrect string value", walaupun petikan melengkung
-- “ ” diterima, kerana cp1252 mengandungi petikan itu tetapi tiada anak panah.
--
-- Kesannya bukan pada modul latihan sahaja: feedback.message turut terdedah, jadi
-- pelawat yang menaip emoji atau anak panah akan gagal menghantar maklum balas.
--
-- Skrip ini menukar database dan semua jadual kepada utf8mb4. Data sedia ada ditukar,
-- bukan dipadam. Selamat dijalankan berulang kali.
--
-- Nota: ALTER DATABASE tanpa nama bermaksud database yang sedang dipilih dalam
-- phpMyAdmin. Pastikan database CAAiT dipilih di sebelah kiri sebelum menjalankannya.

ALTER DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE admins      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE feedback    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE events      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE rate_limits CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE training    CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Sahkan: setiap baris patut memaparkan utf8mb4_unicode_ci.
SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME;
