## 2026-07-02 — v0.5.0

### Ditambahkan
- **Integrasi Penuh CRUD Google Sheets**: Mengimplementasikan logika manipulasi baris spreadsheet dinamis (`insertRow`, `updateRow`, `deleteRow`) di dalam `/gas-src/99-utils.gs` dan menghubungkannya ke modul backend:
  - **Inventory**: Mendukung penambahan barang baru, pengeditan info, dan penghapusan barang.
  - **Finance**: Mendukung pencatatan transaksi pemasukan/pengeluaran baru, pengeditan, serta penghapusan.
  - **HR**: Mendukung pengelolaan data karyawan (nama, jabatan, gaji, email, status).
  - **Procurement**: Mendukung pengajuan pengadaan dengan nomor berurutan otomatis (`PR-XXX`), persetujuan, dan penolakan.
  - **Sales**: Mendukung pembuatan pesanan penjualan dengan nomor otomatis (`SO-XXX`) dan pembaruan status pembayaran.
- **Sinkronisasi Antar-Modul Otomatis**: Ketika pesanan penjualan diset menjadi "Lunas (Paid)", sistem secara otomatis mencatatkan entri pemasukan baru di modul Keuangan (Finance) lengkap dengan nama pelanggan dan referensi nomor pesanan.
- **Kalkulasi Metrik Dashboard Dinamis**: Merombak total `/gas-src/modules/10-dashboard.gs` dari data tiruan statis menjadi perhitungan analitis waktu nyata (real-time) langsung dari database lembar kerja Google Sheets (pendapatan bersih, total transaksi, karyawan aktif, stok kritis, dan arus kas 6 bulan terakhir).

---

## 2026-07-02 — v0.4.0

### Ditambahkan
- **Proteksi Data Produksi & Tree-shaking Data Dummy**: Memisahkan logika mock secara ketat dengan menggunakan deteksi lingkungan `import.meta.env.DEV` di `/src/api/gasClient.ts`.
  - Selama pengerjaan development lokal, data dummy tetap aktif demi kemudahan preview fungsional.
  - Di dalam hasil build produksi (`npm run build`), data dummy dibersihkan (tree-shaken) sepenuhnya dari bundel keluaran akhir untuk keamanan, integritas privasi data enterprise, dan optimalisasi ukuran file.
  - Menambahkan kegagalan aman (fail-safe) berupa penolakan asinkron dengan pesan edukatif terarah jika file rilis produksi dibuka langsung di luar Google Apps Script / Google Sheets.

---

## 2026-07-02 — v0.3.0

### Ditambahkan
- **In-Memory Cache System (Stale-While-Revalidate)**: Mengimplementasikan sistem penyimpanan data sementara berbasis Map di `/src/api/gasClient.ts` untuk melayani pembacaan data instan (`get` dan `getMetrics`) per modul. Pengguna yang membuka halaman baru akan langsung disajikan data dari cache (jika ada) sehingga transisi antarhalaman menjadi sangat cepat (instant transition) tanpa spinner loading berputar di seluruh layar. Di saat bersamaan, query asinkron berjalan di latar belakang untuk memperbarui data ke versi terbaru dari Google Sheets.
- **Unmount-Safe Kill Pattern (Abort state update)**: Menambahkan pola penanganan pembatalan asinkron berbasis bendera status aktif (`active` flag) di dalam hook `useEffect` semua halaman modul utama (`Dashboard`, `Inventory`, `Finance`, `HR`, `Procurement`, `Sales`). Jika pengguna berpindah halaman dengan cepat sebelum panggilan `callGas` selesai, callback asinkron dari GAS yang tertunda akan langsung di-kill (diabaikan) sepenuhnya demi mencegah lag, tumpukan antrean, dan peringatan leak memori React karena memperbarui state pada komponen yang telah di-unmount.

### Diubah
- Memperbarui `/src/api/gasClient.ts` untuk mengotomatiskan pembersihan cache (cache invalidation) pada modul terkait dan dashboard ketika terjadi mutasi atau operasi penulisan data (`create`, `update`, `delete`, `approve`, `reject`, `updateStatus`).

---

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
- **Perbaikan Dual React Instance & Penyesuaian Konfigurasi Vite**: Memperbaiki kegagalan layar putih kosong (blank screen) dengan menyelaraskan konfigurasi `vite.config.ts` dan `index.html`. Mengonfigurasi `rollupOptions.external` untuk mengisolasi `react`, `react-dom`, `recharts`, `lucide-react`, dan `xlsx`, serta memetakan `react/jsx-runtime` dan dependensi lainnya ke CDN `esm.sh` menggunakan parameter `?external=react,react-dom` agar semuanya menggunakan instance React tunggal yang konsisten.
- **Resolusi Konflik Minifikasi, Terser, & Safe Line-Splitter**: Menggantikan logika pemisahan baris (`splitLineSafely`) yang bermasalah dengan fungsi pembersihan spasi terarah (`formatHtmlForGas`). Mengintegrasikan paket `terser` asinkron dan mengaktifkan `minify: 'terser'` di dalam konfigurasi `vite.config.ts` untuk mematangkan integritas sintaksis kode dan memperkecil ukuran bundel tanpa merusak struktur token sintaksis.
- **Penguatan Keamanan Sandbox Iframe (`01-main.gs`)**: Menambahkan konfigurasi `.setSandboxMode(HtmlService.SandboxMode.NATIVE)` dan meta tag `X-UA-Compatible` bernilai `IE=Edge` untuk memastikan kompatibilitas penafsiran script dan mencegah kerentanan sandbox escape pada lingkungan Google Apps Script.

### Catatan Teknis
- Seluruh linter pemeriksaan `tsc --noEmit` dan build produksi `npm run build` dinyatakan **100% Lulus (Green/Sukses)**.
- Aplikasi berhasil dikompilasi menjadi satu file HTML mandiri (`webapp.html` / `Dashboard-for-Spreadsheet.html`) yang memuat pustaka eksternal secara asinkron dari CDN dengan menggunakan Import Maps dan teknik isolasi dependensi.

## 2026-07-02 — v0.1.0

### Ditambahkan
- Inisialisasi project Vite + React + Tailwind.
- Konfigurasi `vite-plugin-singlefile` untuk output 1 file HTML agar kompatibel dengan Google Apps Script.
- Membuat struktur direktori `gas-src/` untuk pemecahan modul backend GAS (Dashboard, Inventory, Finance, HR, Procurement, Sales, Reporting, Settings).
- Membuat skrip build custom `scripts/build-gas.mjs` untuk menggabungkan file `.gs` menjadi `code.gs` dan menduplikasi output `index.html` menjadi `Dashboard-for-Spreadsheet.html` & `.txt`.
- Mock API data (fallback untuk environment lokal / development tanpa koneksi langsung ke GAS).
- Layout antarmuka Dashboard utama (Sidebar, Topbar, Content Area) dengan React dan icon dari Lucide.
- Dokumentasi `REQUIREMENTS.md` dan `REKAP_PENGEMBANGAN.md`.
