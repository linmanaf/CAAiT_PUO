# Serahan dashboard CAAiT

Disediakan pada 4 November 2026 untuk serahan kepada Puan Marlina pada Khamis, 5 November 2026.

## Status

Aplikasi berjalan pada XAMPP lokal: http://localhost/CAAIT%20Project/

Hosting PHP/MySQL/cPanel telah disahkan oleh pengguna, tetapi akses hosting dan domain belum diberikan. Tiada deployment hosting atau pengesahan URL production dibuat. Perubahan belum di-commit/push dalam sesi ini; asas awal ialah commit `2a8da81`, branch `upload-terkini`, dan working tree bersih sebelum edit.

## Fungsi siap

- Dashboard, pengenalan/misi, struktur organisasi, roadmap, program/pencapaian serta kerjasama/hala tuju.
- Tiga latihan berasingan: Canva + Canva AI, IBM Bob dan GitHub. Setiap satu mempunyai objektif, prasyarat, langkah, latihan praktikal, hasil dan pautan dokumentasi rasmi.
- Sidebar dengan menu aktif, kecil/besar pada desktop, buka/tutup pada telefon; footer tepat mengikut arahan.
- Logo header mengikut urutan KPT, CAAiT, Politeknik Ungku Omar, dengan nisbah imej asal.
- MySQL menyimpan feedback dan analytics sebenar. Kejayaan borang hanya dipaparkan selepas simpanan disahkan.
- Admin: login, logout, pertukaran kata laluan, senarai/butiran feedback, status baharu/sudah dibaca/selesai, statistik dan penapis 7/30 hari atau julat tarikh.
- Password hashing, sesi HttpOnly/SameSite, perubahan session ID, timeout 30 minit, pembatalan sesi lain selepas password berubah, CSRF, prepared statements, validasi, rate limit dan deduplikasi permintaan.
- Paparan kosong, loading dan ralat; input berbahaya di-escape semasa dipaparkan.
- Konfigurasi contoh, skema, skrip penciptaan admin dan panduan cPanel.

Chatbot tidak ditambah kerana fungsi utama diberi keutamaan.

## Audit sumber

Sumber institusi tunggal: `CAAIT (MAIC MEETING).pptx`, **8 slide**, dibaca melalui teks XML dan render PowerPoint setiap slide. Gambar poster/sijil turut diperiksa pada resolusi asal. Tiada fail PDF ditemui dalam folder projek. Fail PowerPoint asal tidak diubah.

| Slide | Kandungan dan penggunaan |
|---|---|
| 1 | Logo/nama penuh CAAiT, identiti pusat |
| 2 | Poster imej: penerangan pusat dan empat misi; ditranskripsi ke modul pengenalan |
| 3 | Carta organisasi, tujuh nama/jawatan dan tujuh jabatan koordinator; carta asal boleh dibuka |
| 4 | Penubuhan Ogos 2024, projek, pasukan, fokus, pelan dan hala tuju; tiada tarikh rekaan bagi tahap lain |
| 5 | Lima entri pertama; hanya tiga program mempunyai angka active streaming: 400++, 2400++, 400++ |
| 6 | HanDe/LOI/perancangan loji, podcast, latihan pensyarah dan pertandingan video AI |
| 7 | PDIC, Program Madani Rakyat Perak dan SAS; sijil PDIC diperiksa termasuk kategori, judul dan nama pasukan |
| 8 | Arah program/penyelidikan/pengembangan serta peluang kolaborasi; tidak dilabel kerjasama yang telah selesai |

Semua render slide boleh dibuka dari modul Pengenalan. Jumlah 12 ialah **entri dalam slide**, bukan 12 program selesai. Kad/carta/senarai menggunakan `content.js`; angka tiada tidak dijadikan sifar. Angka “++” dikekalkan dan tidak dijumlahkan sebagai pelawat unik.

Data contoh yang dikeluarkan termasuk AI Innovation Summit 1 Ogos 2026, countdown, petikan ketua “AI is not the future...”, jumlah rakan/negara yang tidak disokong, status/progres projek rekaan, MoU yang tidak disahkan dan placeholder sosial. Halaman HTML lama kini redirect supaya tidak terus menyebarkan kandungan lama. `my-tvet-dashboard-plan.md` tidak digunakan sebagai fakta institusi.

## Perkara kandungan yang masih memerlukan pengesahan

1. **Jawatan Dr Shamsuri:** carta slide 3 menyatakan General Director of JPPKK, sedangkan poster forum slide 5 menyatakan Timbalan Ketua Pengarah (Perancangan). Carta dikekalkan sebagai rekod slide, bukan direktori semasa.
2. **Nama penolong ketua:** carta mencantumkan “AKHYARMOHD”; sijil menulis “MOHAMAD AKHYAR BIN MOHD NOOR”. Paparan carta ditranskripsi dengan jarak munasabah; ejaan rasmi untuk direktori semasa perlu pengesahan.
3. **Tarikh PDIC:** teks slide 7 menyatakan 3–5 April 2026, tetapi sijil hanya menyatakan tahun 2026. Tarikh belum disahkan oleh sijil.
4. **Program Madani Rakyat Perak:** tarikh/lokasi disokong poster, tetapi perenggan peranan CAAiT mengulangi teks podcast. Peranan tepat belum dapat dipastikan.
5. **HanDe:** LOI bertarikh 8 Oktober 2025 dinyatakan, manakala loji AI ialah rancangan pertengahan 2026. Tiada bukti dalam slide bahawa loji sudah siap/beroperasi.
6. **Diploma AI:** slide menggunakan beberapa variasi nama, termasuk Diploma in Applied Artificial Intelligence dan Diploma in Artificial Intelligence. Penawaran 2027 kekal sebagai perancangan/impak yang dinyatakan, bukan pengambilan yang telah bermula.
7. **SAS Institute/HRD Corp:** SAS ialah future collaboration; HRD Corp contoh peluang agensi pada slide 8. Tiada MoU selesai disahkan.
8. **Koordinator dan peserta:** tiada nama koordinator, jumlah peserta latihan atau bukti sijil individu diberikan. Maklumat ini tidak direka.
9. Teks sangat kecil pada beberapa poster tidak digunakan untuk mencipta fakta tambahan; bahan asal disediakan untuk semakan.

## Aset dan dokumentasi latihan

- CAAiT: imej asal terbenam slide 1; fail JPEG pengguna dikekalkan.
- KPT: https://www.mohe.gov.my/images/new_logo_kpt_black.svg
- PUO: https://www.puo.edu.my/webportal/wp-content/uploads/2026/05/cropped-PUO-270x270.png
- Canva: https://www.canva.com/help/using-magic-presentations/ dan https://www.canva.com/graphs/
- IBM Bob: https://bob.ibm.com/docs/ide serta halaman Modes dan Best practices.
- GitHub: dokumentasi Hello World, pushing commits dan creating a GitHub Pages site di https://docs.github.com/

Dokumentasi rasmi disemak pada 4 November 2026. Langkah latihan bersifat panduan tambahan, bukan pengumuman program/pensijilan institusi. Tiada akaun Canva/IBM/GitHub peserta digunakan untuk melaksanakan latihan produk dalam sesi ini.

## Ujian lokal

| Ujian | Keputusan |
|---|---|
| 12 paparan, viewport sebenar 375px | Lulus, tiada overflow mendatar |
| Tablet 820px dan desktop 1440px | Lulus, semua modul dibuka tanpa overflow |
| Sidebar kecil/besar dan menu telefon | Lulus |
| Susunan logo dan imej utama | Lulus, dimuatkan dari fail lokal |
| Filter program | Lulus, future collaboration memaparkan satu entri SAS |
| Login betul/salah dan pertukaran pertama | Lulus melalui API serta borang browser |
| Logout/API tanpa login/CSRF | Lulus, akses ditolak apabila tiada kebenaran |
| Had login | Cubaan ke-9 dalam tetingkap had menghasilkan 429 |
| Feedback borang → MySQL → admin | Lulus |
| Status baharu → dibaca → selesai dan refresh | Lulus melalui API; status dibaca kekal selepas reload browser |
| Sesi berbeza/peranti simulasi | Statistik/status konsisten dalam dua sesi HTTP berasingan |
| Deduplikasi event/feedback | Permintaan berulang dengan ID sama disimpan sekali |
| 3 pembukaan modul latihan melalui browser | Tepat 3 paparan; listener tidak berganda |
| 3 event, satu pengecam rawak | Tepat 3 paparan dan 1 pelawat unik dalam ujian API terkawal |
| Aktiviti admin dan data ujian | Dikecualikan daripada laporan biasa |
| Julat 7 hari dan tarikh kosong | Lulus; tempoh tanpa data memaparkan empty state |
| Input HTML/SQL berbahaya | Disimpan sebagai data; tiada elemen img/script atau pelaksanaan XSS pada senarai admin |
| Rangkaian offline ketika submit | Mesej ralat; tiada kejayaan palsu; butang boleh digunakan semula |
| JavaScript/asset | Tiada ralat console dalam aliran normal; asset utama HTTP 200/304 |
| PHP lint/JS syntax/git diff --check | Lulus |

Suite API akhir: **8 kumpulan ujian lulus**. Ujian awal turut menemui fixture berulang dan rate limit akibat pengulangan ujian; fixture dibuat unik dan rate limit ujian diasingkan. Isu mod ujian selepas logout dibetulkan dan diuji semula.

Pembersihan disahkan: tiada feedback/lawatan `is_test=1` berbaki selepas ujian. Akaun admin sementara dibuang; `marlina` dikekalkan dengan pertukaran kata laluan pertama masih diwajibkan. Tiada rekod pengguna sebenar dipadam.

Tiada build framework diperlukan. Tiada ujian hosting, telefon fizikal/LAN atau konfigurasi TLS production dibuat.

## Sebelum hosting

- Sediakan domain/URL, akses cPanel atau SFTP, nama database/pengguna/host database serta akses Terminal untuk setup admin.
- Tetapkan password production yang baharu, HTTPS, `secure_cookie=true`, `environment=production`, pengguna database terhad dan backup.
- Sahkan perkara kandungan di atas dengan Puan Marlina.
- Ralat Aria pada jadual sistem XAMPP perlu dinilai secara berasingan sebelum mengubah tetapan pengguna MySQL; ia tidak dibaiki dalam skop dashboard.
