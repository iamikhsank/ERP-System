## 2026-07-02 — v0.2.0

### Ditambahkan
- **Modular Pages**: Membuat modul halaman terpisah di folder `src/pages/` untuk membagi logika bisnis dan UI:
  - `Dashboard.tsx`: KPI widgets, status sistem, visualisasi grafik SVG arus kas semesteran.
  - `Inventory.tsx`: Master data stok barang, alert kuantitas minim, modal tambah/edit.
  - `Finance.tsx`: Pencatatan transaksi pemasukan/pengeluaran, statistik laba rugi.
  - `HR.tsx`: Data induk karyawan, jabatan, penggajian bulanan.
  - `Procurement.tsx`: Pengajuan Purchase Request, persetujuan/penolakan (Approval flow).
  - `Sales.tsx`: Sales Order tracking, penentuan status pembayaran lunas/batal.
  - `Reporting.tsx`: Antarmuka filter laporan rentang tanggal, mockup cetak PDF/Excel.
  - `Settings.tsx`: Konfigurasi organisasi, format penomoran dokumen otomatis (Auto-numbering), manajemen pengguna & hak akses (Role-Based Access Control / RBAC).
- **ErrorBoundary Component (`src/components/ErrorBoundary.tsx`)**: Mengimplementasikan penanganan error global (ErrorBoundary) menggunakan React Class Component yang ramah pengguna. Menampilkan pesan galat berbahasa Indonesia, tombol Reload, tombol kembali ke Beranda, serta log diagnostik teknis lengkap yang dapat disalin guna mencegah layar putih kosong (blank white screen) bila terjadi crash JavaScript di lingkungan Google Apps Script.
- **Reusable UI Components**:
  - `DataTable.tsx`: Tabel pintar yang mendukung Sorting, Filtering (Search), dan Pagination.
  - `Modal.tsx`: Jendela dialog modular pop-up untuk form entri data secara dinamis.
  - `Toast.tsx`: Notifikasi popup adaptif untuk feedback asinkron instan.
  - `ErrorConsole.tsx`: Panel debug log konsol standar industri (Production-Grade) sesuai PRD 4.2 dengan tombol salin detail teknis yang dibatasi hanya untuk peran Admin.
- **Tipe Data Sistem (`src/types.ts`)**: Mendefinisikan kontrak tipe data TypeScript yang seragam untuk semua entitas modul ERP.
- **Pustaka Tipe Data TypeScript (`@types/react`, `@types/react-dom`)**: Ditambahkan sebagai `devDependencies` untuk memastikan kompilasi tipe data komponen kelas React berjalan sempurna.

### Diubah
- Mengintegrasikan modul halaman dan komponen ke dalam berkas utama `/src/App.tsx`.
- Memperbaiki penulisan tipe data parameter `key` opsional di komponen `ToastItem` guna meloloskan pemeriksaan TypeScript linter.
- Memperbarui skrip `"build"` di `package.json` agar otomatis menjalankan kompilasi backend modular `build-gas.mjs` serta membatasi alokasi memori Node.js maksimal 2 GB (`--max-old-space-size=2048`) demi stabilitas proses build.
- **Perbaikan Bug Key React**: Menghindari masalah tabrakan key (`Encountered two children with the same key`) di `Toast` dan `ErrorConsole` dengan mengganti metode pembuatan ID unik menggunakan gabungan nilai `Date.now()` dan string acak berbasis base-36. Hal serupa juga diterapkan pada pendaftaran pengguna baru di halaman `Settings`.

### Catatan Teknis
- Seluruh linter pemeriksaan `tsc --noEmit` dan build produksi `npm run build` dinyatakan **100% Lulus (Green/Sukses)**.
- Aplikasi berhasil dikompilasi menjadi satu file HTML mandiri (`webapp.html` / `Dashboard-for-Spreadsheet.html`) yang memuat pustaka eksternal secara asinkron dari CDN dengan menggunakan Import Maps.

## 2026-07-02 — v0.1.0

### Ditambahkan
- Inisialisasi project Vite + React + Tailwind.
- Konfigurasi `vite-plugin-singlefile` untuk output 1 file HTML agar kompatibel dengan Google Apps Script.
- Membuat struktur direktori `gas-src/` untuk pemecahan modul backend GAS (Dashboard, Inventory, Finance, HR, Procurement, Sales, Reporting, Settings).
- Membuat skrip build custom `scripts/build-gas.mjs` untuk menggabungkan file `.gs` menjadi `code.gs` dan menduplikasi output `index.html` menjadi `Dashboard-for-Spreadsheet.html` & `.txt`.
- Mock API data (fallback untuk environment lokal / development tanpa koneksi langsung ke GAS).
- Layout antarmuka Dashboard utama (Sidebar, Topbar, Content Area) dengan React dan icon dari Lucide.
- Dokumentasi `REQUIREMENTS.md` dan `REKAP_PENGEMBANGAN.md`.
