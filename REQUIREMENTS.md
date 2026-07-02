## 10. Konfigurasi Sistem ERP GAS + Vite

### 1. Daftar Library & Versi CDN
| Library | Versi | CDN URL | Dipakai di | Alasan |
|---------|-------|---------|------------|--------|
| React | 19.0.1 | https://esm.sh/react@19.0.1 | Core UI | Ringan, cepat dimuat, versi selaras lokal |
| React-DOM | 19.0.1 | https://esm.sh/react-dom@19.0.1 | Core Render | Rendering UI via ESM Import Maps |
| Lucide React | 0.460.0 | https://esm.sh/lucide-react@0.460.0?external=react,react-dom | Iconography | Di-load dari CDN asinkron anti dual-react |
| Recharts | 2.12.7 | https://esm.sh/recharts@2.12.7?external=react,react-dom | Data Charts | Visualisasi data analitis via CDN |
| XLSX | 0.18.5 | https://esm.sh/xlsx@0.18.5 | Sheet Export | Manajemen ekspor data ke Excel |
| Tailwind CSS | 4.1.14 | (Bundled Inline) | Styling | Utility-first styling terkompilasi |
| Vite SingleFile | 2.3.3 | (Dev Dependency) | Build Tool | Output mandiri single-file HTML |

### 2. Import Map
```html
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@19.0.1",
    "react-dom": "https://esm.sh/react-dom@19.0.1",
    "react-dom/client": "https://esm.sh/react-dom@19.0.1/client",
    "react/jsx-runtime": "https://esm.sh/react@19.0.1/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@19.0.1/jsx-runtime",
    "lucide-react": "https://esm.sh/lucide-react@0.460.0?external=react,react-dom",
    "recharts": "https://esm.sh/recharts@2.12.7?external=react,react-dom",
    "xlsx": "https://esm.sh/xlsx@0.18.5"
  }
}
</script>
```

### 3. Konfigurasi Vite & Optimasi Ukuran Berkas Menggunakan Terser Minification
Vite dikonfigurasi menggunakan plugin `vite-plugin-singlefile` agar seluruh aset lokal (seperti CSS Tailwind terkompilasi) di-inline ke dalam satu file `index.html`. 

Untuk memastikan stabilitas eksekusi di Google Apps Script editor, seluruh library berat (**React**, **React-DOM**, **Lucide-React**, **Recharts**, **XLSX**) telah **dieksternalisasi secara penuh ke CDN via Import Maps**, sehingga ukuran bundle HTML berkurang drastis (hanya memuat logika bisnis lokal) serta menghindari duplikasi instansiasi React (anti dual-react instance).

Selain itu, opsi `minify: 'terser'` diaktifkan di `vite.config.ts` untuk mengompresi kode produksi secara aman tanpa merusak struktur sintaksis token (tidak memicu SyntaxError akibat pemotongan karakter sembarangan). Skrip pasca-proses otomatis di `/scripts/build-gas.mjs` juga menggunakan fungsi penyelarasan spasi terarah `formatHtmlForGas` yang membersihkan spasi redundan di antara tag HTML untuk menjamin kebersihan dan keringanan ukuran file saat di-sync ke `Dashboard-for-Spreadsheet.html` dan `Dashboard-for-Spreadsheet.txt`.

### 3a. Penanganan Galat Global (ErrorBoundary)
Untuk mencegah terjadinya layar putih kosong (blank white screen) jika terjadi kegagalan eksekusi JavaScript (misal masalah pemuatan CDN atau bentrokan state asinkron):
1. **Penyekatan Error**: Seluruh pohon komponen React dibungkus dengan komponen `ErrorBoundary` berbasis Class Component di `/src/main.tsx`.
2. **Antarmuka Pemulihan**: Jika terjadi kegagalan, aplikasi akan mengalihkan ke halaman ramah pengguna berisi tombol **Muat Ulang Dashboard** (untuk me-refresh window), **Kembali ke Beranda** (untuk soft state reset), serta panel diagnostik yang menyajikan stack trace lengkap yang dapat disalin dengan mudah.

### 4. Konfigurasi Scripts & Batasan Memori Build (Maksimal 2 GB)
Untuk menghindari kegagalan out-of-memory pada environment build yang terbatas, proses build dikonfigurasi menggunakan bendera Node `--max-old-space-size=2048` guna membatasi penggunaan RAM maksimal di angka 2 GB.

- `dev`: Menjalankan server dev Vite.
- `build:html`: Membangun file frontend menggunakan Vite, memformat, dan menyalinnya ke file rilis HTML (`Dashboard-for-Spreadsheet.html` dan `.txt`).
- `build:gas`: Menyusun backend Google Apps Script dengan menggabungkan multi-file `gas-src/*.gs` ke dalam `dist-gas/code.gs` dan menyalin `setup.gs` (sangat ringan, cepat, tanpa proses Vite).
- `build` / `build:all`: Menjalankan proses build penuh secara berurutan (`build:html` diikuti oleh `build:gas`).

### 5. Font & Warna (SaaS ERP Redesign System)
- **Font Stack**: 
  - **Display / Headings**: *Plus Jakarta Sans* (Loaded from Google Fonts Google CDN) untuk nuansa modern, tech-forward, dan premium.
  - **Body Text**: *Inter* (Loaded from Google Fonts CDN) untuk keterbacaan tinggi di berbagai resolusi layar.
  - **Monospace / Code / Data**: *JetBrains Mono* (Loaded from Google Fonts CDN) untuk angka-angka finansial, format status, dan data tabel.
- **Palet Warna Premium (Aivox Redesign System)**:
  - **Sidebar Navigation**: Berwarna dasar putih murni (`bg-white`) dengan batas kanan yang solid (`border-slate-300`) dan bayangan lembut bento-style (`shadow-[8px_0_40px_rgba(0,0,0,0.015)]`). Dilengkapi logo lencana hitam solid (`bg-slate-950`) dengan inisial display miring *A* dan pendaran lampu status. Menu navigasi dikelompokkan ke dalam kategori terstruktur (*MAIN MENU*, *OPERATIONS*, *PREFERENCES*) dengan menu aktif berbentuk kapsul hitam pekat solid (`bg-slate-950`) berpendar putih, serta menu tidak aktif bertekstur hover abu-abu terang.
  - **Ikon Panel Buka/Tutup Kustom**: Untuk menjaga kemurnian tata letak sidebar, ikon buka/tutup dinonaktifkan dari kepala logo sidebar dan **ditempatkan secara eksklusif di Topbar di sebelah Judul Dashboard**. Tombol ini menggunakan desain bingkai persegi bulat bersisian garis pembagi vertikal dengan indikator chevron penunjuk arah dinamis (kiri saat terbuka, kanan saat tertutup) untuk kontrol visual yang elegan.
  - **Background Dasar Utama**: Warna background dasar luar disetel ke warna slate abu-abu muda (`bg-slate-100`) dengan area main content disetel ke `bg-slate-100/50`. Modifikasi ini memberikan kontras visual yang luar biasa, membuat setiap kartu bento putih murni (`bg-white`) seolah mengambang indah di layar.
  - **Interactive Accent**: *Indigo 600* sebagai warna aksi utama dan tombol penting, dipadukan dengan focus ring *Indigo 100*.
  - **Status Success & Lunas**: *Emerald 50/700* dengan border *Emerald 100* untuk indikasi transaksi lunas atau barang tersedia.
  - **Status Cancel / Alert**: *Rose 50/700* dengan border *Rose 100* untuk transaksi dibatalkan atau pengeluaran kritis.
  - **Dashboard & Bento Cards**: *White* (`#ffffff`) dengan pembatas solid abu-abu yang lebih kuat dan tebal (`border-slate-300`) dan bayangan lembut bento-style (`shadow-[0_8px_30px_rgb(0,0,0,0.012)]`) guna menghadirkan estetika premium yang kokoh, tegas, dan presisi tinggi.

### 5b. Fungsionalitas Lanjutan & Redesain Pengaturan (Settings)
1. **Interactive Notification Bell Hub**:
   - Ikon Bell topbar difungsikan sepenuhnya sebagai pusat kontrol notifikasi dengan indikator gelembung unread dinamis.
   - Dilengkapi menu dropdown pop-up bento-style yang interaktif, menampilkan log aktivitas sistem real-time (seperti transaksi lunas, konektivitas database, status stok rendah).
   - Menyediakan fitur "Tandai Semua Dibaca" untuk mereset unread count dan "Hapus Semua" untuk membersihkan riwayat.
   - Perekaman log via `logSystem` secara otomatis didorong ke dalam feed notifikasi untuk menjaga data tetap segar secara real-time.

2. **Redesain Halaman Settings Bento-Style**:
   - **Profil Perusahaan**: Didesain ulang menjadi tata letak bento grid 3-kolom. Sisi kiri menyajikan formulir detail organisasi, mata uang acuan, format pajak, dan prefix penomoran dokumen otomatis. Sisi kanan menyajikan widget real-time Pemantau Status Sistem (Server engine Google Apps Script V8, metrik latency, pemakaian kuota panggilan API harian, dan tautan konsol internal).
   - **Tab Baru - Integrasi Google Sheets**: Menyediakan modul khusus untuk memeriksa detail database Spreadsheet yang terhubung. Menampilkan visualisasi skema dari 6 tabel utama (`tb_users`, `tb_inventory`, `tb_finance`, `tb_employees`, `tb_procurement`, `tb_sales`), tipe kolom, dan jumlah baris data. Dilengkapi tombol interaktif "Uji Koneksi" (dengan simulasi pemrosesan asinkron & feedback sukses) serta tombol "Sinkronisasi Skema" yang meregenerasi meta-tabel secara instan.
   - **Manajemen User**: DataTable yang elegan dengan kontrol registrasi pengguna baru, pengeditan hak akses, dan role-based access control (Admin, Manager, Staff, Viewer) berbasis modal dialog yang sangat detail.

### 6. Optimasi Transisi Halaman & Manajemen Caching Ringan
Aplikasi ini dikonfigurasi untuk menangani batasan koneksi asinkron Google Apps Script (`google.script.run`) melalui pendekatan frontend terarah:

1. **Stale-While-Revalidate (SWR) Caching**:
   - Fungsi global `getGasCache` dan `setGasCache` di `/src/api/gasClient.ts` menyimpan hasil query modul asinkron terbaru di memori.
   - Saat berpindah halaman, halaman akan langsung merender data dari cache (jika tersedia), menghilangkan delay loading putih kosong (blank screens) bagi pengguna.
   - Pemicuan sinkronisasi asinkron berjalan mulus di belakang layar untuk memperbarui tampilan jika terdapat perubahan terbaru.
   
2. **Invalidasi Cache Otomatis**:
   - Setiap kali terjadi mutasi data (operasi tulis seperti `create`, `update`, `delete`, `approve`), cache modul tersebut serta cache modul `Dashboard` otomatis dibersihkan (`clearGasCache`) guna menjamin integritas kesegaran data.

3. **Unmount-Safe Kill Pattern**:
   - Hook `useEffect` pada seluruh modul halaman dibungkus dengan kontrol bendera status aktif (`active` boolean).
   - Pada saat unmount (misal ketika pengguna berpindah menu), pembaruan state pada promise yang sedang berjalan otomatis dibatalkan/di-kill, menghindari tumpukan proses di browser (backlog threads) dan menjaga kinerja aplikasi tetap responsif.

### 7. Isolasi Data Rilis Produksi vs. Lokal
Untuk memastikan rilis produksi (`Dashboard-for-Spreadsheet.html`) benar-benar bersih dari data sampel/dummy dan hanya terhubung ke Google Sheets:
1. **Penyimpanan Lokal Persisten (`localStorage`)**: Di mode pengembangan lokal/AI Studio Preview (`DEV` mode), data tidak lagi disimpan di memori RAM transien yang gampang hilang. Data disimpan ke dalam `localStorage` (`erp_mock_data`) secara persisten, sehingga input data pengguna tetap utuh saat halaman di-refresh.
2. **Kalkulasi Metrik Lokal Dinamis**: Metrik Dashboard dihitung secara dinamis dari data `localStorage` menggunakan formula yang persis sama dengan backend GAS, bukan menggunakan data tiruan yang di-hardcode.
3. **Tree-Shaking Data Dummy**: Logika mock lokal ini hanya aktif dalam blok kondisi `if ((import.meta as any).env.DEV)`. Saat dijalankan dalam skrip produksi (`npm run build`), modul bundler Vite secara otomatis memotong (tree-shaking) seluruh logika mock agar tidak masuk ke hasil kompilasi akhir.
4. **Kewajiban Lingkungan Google Sheets**: Jika aplikasi rilis produksi dibuka di luar platform Google Sheets (yaitu `window.google.script` tidak terdeteksi), sistem secara otomatis memblokir pemanggilan asinkron dan memberikan pesan kesalahan edukatif berbahasa Indonesia yang memandu pengguna untuk mengaksesnya melalui Google Sheets.

### 8. Integrasi CRUD Penuh & Perhitungan Waktu Nyata (Real-Time)
1. **Fungsi CRUD Google Sheets**: Semua halaman modul utama telah diintegrasikan secara penuh dengan fungsi database Google Sheets di `/gas-src/99-utils.gs` (`insertRow`, `updateRow`, `deleteRow`). Perubahan data dari pengguna disimpan langsung secara persisten ke sheet masing-masing.
2. **Kalkulasi Metrik Dashboard**: Halaman dashboard mengabaikan data tiruan statis di server dan secara dinamis menjumlahkan seluruh transaksi keuangan, menghitung jumlah karyawan aktif, mendeteksi stok barang di bawah ambang batas minimal secara real-time, serta memetakan tren arus kas asinkron langsung dari data spreadsheet riil.
3. **Automasi Berantai (Inter-Module Workflow)**: Menyetujui status pesanan penjualan sebagai "Lunas" akan secara otomatis memicu pembuatan entri pencatatan buku kas masuk baru di dalam sheet Keuangan (Finance).
4. **Estetika & Format Baris Header Otomatis (`setup.gs`)**: Saat inisialisasi awal atau pemuatan ulang setup, baris header pertama di setiap sheet secara otomatis ditata dengan latar belakang abu-abu biru gelap premium (`#1e293b`), teks putih tebal (bold), perataan rata tengah (center), pembekuan baris pertama (`setFrozenRows(1)`), serta auto-resize lebar kolom agar visualisasi lembar kerja rapi dan profesional.
5. **Optimasi Antarmuka Bebas Gangguan (Distraction-Free UI)**: Seluruh komponen floating system console (`ErrorConsole.tsx`) telah dihapus secara total agar tidak mengganggu pemandangan visual pengguna, dengan fungsionalitas pencatatan log sistem dialihkan langsung secara bersih ke native developer console (`console.log`, `console.warn`, `console.error`).


