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

### 3. Konfigurasi Vite & Pembatasan Panjang Baris (Limit 300 Chars)
Vite dikonfigurasi menggunakan plugin `vite-plugin-singlefile` agar seluruh aset lokal (seperti CSS Tailwind terkompilasi) di-inline ke dalam satu file `index.html`. 

Untuk memastikan stabilitas eksekusi di Google Apps Script editor, seluruh library berat (**React**, **React-DOM**, **Lucide-React**, **Motion**) telah **dieksternalisasi secara penuh ke CDN via Import Maps**, sehingga ukuran bundle HTML berkurang drastis (hanya memuat logika bisnis lokal). 

Selain itu, opsi `minify: false` diaktifkan di `vite.config.ts`, serta diterapkan skrip pasca-proses otomatis (**safe line-splitter** di `/scripts/build-gas.mjs`) yang memotong dan merapikan seluruh baris kode yang melebihi **300 karakter** tanpa merusak sintaksis (misalnya membagi import multipel, class CSS panjang, atau baris HTML panjang pada pemisah aman seperti koma `,`, spasi ` `, atau titik koma `;`).

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
