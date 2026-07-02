# Sistem ERP Berbasis Google Apps Script (GAS)

## 1. Deskripsi Proyek
Sistem ERP ini dibangun sepenuhnya di atas ekosistem Google Workspace untuk menjawab kebutuhan bisnis akan platform operasional yang terintegrasi, hemat biaya, dan enterprise-ready. Menggunakan backend murni dari Google Apps Script dan database berbasis Google Sheets.

## 2. Arsitektur
Aplikasi berjalan sebagai Single Page Application (SPA).
`Frontend (React/Vite)` ↔ `google.script.run (Async)` ↔ `code.gs (Google Apps Script)` ↔ `Google Sheets`.
Agar frontend dapat dilayani oleh fungsi `HtmlService` dari Apps Script, frontend dikompilasi menjadi satu buah file HTML utuh. Eksternalisasi modul tambahan dilakukan dengan import maps ke CDN agar mengurangi ukuran memori.

## 3. Struktur Folder
- `/src`: Berisi kode React frontend (komponen, API handler, CSS).
- `/gas-src`: Berisi kode modular backend Google Apps Script.
- `/scripts`: Berisi script nodejs utilitas seperti compiler `build-gas.mjs`.
- `/dist-gas`: Output kompilasi dari backend (hanya berisi `setup.gs` dan `code.gs`).

## 4. Cara Setup Lokal
- `npm install`
- `npm run dev` (Berjalan di mode local/mock).

## 5. Build & Sinkronisasi
- Jalankan perintah: `npm run build:all`
- Perintah ini akan menjalankan Vite (build frontend) lalu mengeksekusi build gas.
- Output akhir yang dibutuhkan ada di `dist-gas/` dan `Dashboard-for-Spreadsheet.html`.
- Anda dapat mengcopy file `setup.gs`, `code.gs`, dan isi dari `Dashboard-for-Spreadsheet.html` ke Google Apps Script Editor Anda.

## 6. Deployment Apps Script
- Buat proyek Apps Script baru, tempel kode dari file `.gs` yang dihasilkan.
- Untuk menginisialisasi spreadsheet, jalankan fungsi `runSetup()` SATU KALI dari Apps Script Editor.
- Buat file html baru di Editor Apps Script dan beri nama `webapp.html` atau sesuaikan dengan routing anda, tempel kode hasil build vite HTML.
- Terapkan (Deploy) aplikasi sebagai "Aplikasi Web" dengan opsi akses "Sesuai kebutuhan".
