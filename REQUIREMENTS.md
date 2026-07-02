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
- `build`: Menjalankan build Vite + menjalankan skrip pasca-proses `build-gas.mjs` dengan limit memori 2 GB.
- `build:gas`: Menggabungkan multi-file `gas-src/*.gs` ke dalam `dist-gas/code.gs` dan menyalin serta memformat file output HTML dengan limit memori 2 GB.
- `build:all`: Gabungan penuh dari build frontend dan backend.

### 5. Font & Warna
- **Font**: Inter (Google Fonts CDN)
- **Warna Utama**: Tailwind Default Scale (Gray-900 untuk sidebar, Blue-600 untuk primary buttons, Gray-50 untuk background).

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
Untuk memastikan rilis produksi (`Dashboard-for-Spreadsheet.html` dan `Dashboard-for-Spreadsheet.txt`) benar-benar bersih dari data sampel/dummy dan hanya terhubung ke Google Sheets:
1. **Tree-Shaking Data Dummy**: Variabel `mockData` di `/src/api/gasClient.ts` hanya diakses dalam blok kondisi `if ((import.meta as any).env.DEV)`. Saat dijalankan dalam skrip produksi (`npm run build`), modul bundler Vite secara otomatis memotong (tree-shaking) seluruh struktur data dummy tersebut agar tidak masuk ke hasil kompilasi akhir.
2. **Kewajiban Lingkungan Google Sheets**: Jika aplikasi rilis produksi dibuka di luar platform Google Sheets (yaitu `window.google.script` tidak terdeteksi), sistem secara otomatis memblokir pemanggilan asinkron dan memberikan pesan kesalahan edukatif berbahasa Indonesia yang memandu pengguna untuk mengaksesnya melalui Google Sheets.

### 8. Integrasi CRUD Penuh & Perhitungan Waktu Nyata (Real-Time)
1. **Fungsi CRUD Google Sheets**: Semua halaman modul utama telah diintegrasikan secara penuh dengan fungsi database Google Sheets di `/gas-src/99-utils.gs` (`insertRow`, `updateRow`, `deleteRow`). Perubahan data dari pengguna disimpan langsung secara persisten ke sheet masing-masing.
2. **Kalkulasi Metrik Dashboard**: Halaman dashboard mengabaikan data tiruan statis di server dan secara dinamis menjumlahkan seluruh transaksi keuangan, menghitung jumlah karyawan aktif, mendeteksi stok barang di bawah ambang batas minimal secara real-time, serta memetakan tren arus kas asinkron langsung dari data spreadsheet riil.
3. **Automasi Berantai (Inter-Module Workflow)**: Menyetujui status pesanan penjualan sebagai "Lunas" akan secara otomatis memicu pembuatan entri pencatatan buku kas masuk baru di dalam sheet Keuangan (Finance).

