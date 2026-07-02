# GAS-Vite Blueprint: Panduan Standar Arsitektur Web App Enterprise di Google Apps Script

Dokumen ini adalah **blue print (cetak biru) standar industri** untuk membangun aplikasi web modern, interaktif, dan berkinerja tinggi yang di-hosting sepenuhnya di dalam ekosistem **Google Apps Script (GAS)** dengan frontend berbasis **React, Vite, dan Tailwind CSS**.

Cetak biru ini memastikan aplikasi Anda terbebas dari kesalahan fatal runtime (seperti layar blank putih), sangat mudah dipelihara, dan memiliki performa setara dengan aplikasi cloud modern, meskipun berjalan di dalam batasan sandbox iframe Google Workspace.

---

## 1. Konsep Utama & Filosofi Arsitektur

Google Apps Script memiliki keterbatasan intrinsik:
1. **Model Eksekusi:** Backend berjalan di server Google, sedangkan frontend dirender di browser pengguna dalam iframe yang sangat terisolasi.
2. **Batasan File:** Proyek GAS paling stabil dan mudah dikelola jika dikemas dalam sesedikit mungkin file di editor online-nya. Standar blueprint ini menetapkan batas **maksimal 3 file** di lingkungan produksi GAS:
   * `setup.gs` (Inisialisasi database Sheets & konfigurasi sistem)
   * `code.gs` (Seluruh backend logic hasil penggabungan otomatis)
   * `Dashboard-for-Spreadsheet.html` (Frontend SPA tunggal hasil build ter-inline)

Untuk menjaga kode tetap bersih dan mudah dikembangkan, proses pengembangan dilakukan secara **modular terpisah** di komputer lokal (Development), kemudian dikompilasi secara otomatis menjadi berkas siap pakai (Production).

---

## 2. Struktur Proyek Standar (Lokal vs Produksi)

### A. Struktur Folder Pengembangan (Multi-File / Lokal)
```text
/my-gas-app
├── src/                                # KODE SUMBER FRONTEND (REACT + VITE)
│   ├── main.tsx                        # Entry point React
│   ├── App.tsx                         # Router & layout utama (Sidebar, Topbar, Content)
│   ├── types.ts                        # Definisi tipe data & kontrak interface TypeScript
│   ├── index.css                       # Integrasi Tailwind CSS (@import "tailwindcss")
│   ├── api/
│   │   └── gasClient.ts                # Jembatan API (Mode DEV: localStorage | Mode PROD: google.script.run)
│   ├── components/                     # Komponen UI reusable (DataTable, Modal, Toast, dll)
│   └── pages/                          # Halaman fitur modular (Dashboard, Inventory, dll)
│
├── gas-src/                            # KODE SUMBER BACKEND MODULAR (GS)
│   ├── 00-setup.gs                     # Skrip pembuat sheet & skema awal (idempotent)
│   ├── 01-main.gs                      # Integrasi doGet(e) untuk memanggil HTML frontend
│   ├── 02-auth.gs                      # Autentikasi & kontrol hak akses (Role-Based Access)
│   ├── 99-utils.gs                     # Helper formatting & standardisasi API response
│   └── modules/                        # Logika API per modul (e.g., inventory.gs, finance.gs)
│
├── scripts/                            # SKRIP OTOMATISASI BUILD (NODE.JS)
│   ├── build-gas-backend.mjs           # Penggabung file backend (*.gs) -> dist-gas/code.gs
│   └── build-gas-frontend.mjs          # Post-processor HTML hasil build -> root/Dashboard-for-Spreadsheet.html
│
├── dist-gas/                           # OUTPUT BACKEND SIAP UPLOAD
│   ├── setup.gs                        # Copy langsung dari 00-setup.gs
│   └── code.gs                         # Hasil gabungan modular backend
│
├── Dashboard-for-Spreadsheet.html      # OUTPUT FRONTEND TUNGGAL SIAP UPLOAD (di Root)
├── index.html                          # Template HTML pengembangan lokal
├── package.json                        # Konfigurasi dependensi & skrip perintah build
└── REQUIREMENTS.md                     # Dokumentasi library, versi CDN, & aturan integrasi
```

---

## 3. Spesifikasi Teknis Frontend (Vite & Bundling)

Untuk memasukkan seluruh aplikasi React ke dalam satu file HTML (`Dashboard-for-Spreadsheet.html`), kita harus menggunakan konfigurasi khusus agar seluruh aset (CSS, JS, SVG) tertanam langsung secara *inline*.

### A. Konfigurasi `vite.config.ts` Wajib
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile() // Meng-inline-kan seluruh JS dan CSS langsung ke dalam file HTML
  ],
  build: {
    minify: 'terser', // Wajib memakai Terser untuk minifikasi yang aman bagi sintaks GAS
    terserOptions: {
      compress: {
        passes: 2,
        drop_console: false // Pertahankan console.log untuk memudahkan triase error di browser
      }
    },
    rollupOptions: {
      // Deklarasikan pustaka eksternal agar tidak dibundle ganda (mencegah tabrakan React Instance)
      external: [
        'react',
        'react-dom',
        'lucide-react',
        'recharts'
      ]
    }
  }
});
```

### B. Isolasi Dependensi via Import Maps (`index.html`)
Pustaka pihak ketiga yang bergantung pada React harus dimuat dari CDN dengan parameter isolasi agar tidak memicu error dual instance React. Masukkan *Import Map* berikut ke dalam tag `<head>` sebelum script module utama:

```html
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "lucide-react": "https://esm.sh/lucide-react@0.460.0?external=react,react-dom",
    "recharts": "https://esm.sh/recharts@2.12.7?external=react,react-dom"
  }
}
</script>
```

---

## 4. Jembatan Komunikasi Hybrid (`gasClient.ts`)

Salah satu tantangan terbesar pengembangan GAS lokal adalah fungsi `google.script.run` tidak tersedia di browser luar lingkungan Google Sheets. 

Pola **Hybrid Client** memecahkan masalah ini dengan menyediakan simulasi database berbasis `localStorage` yang berjalan secara persisten dan dinamis saat mode pengembangan (`DEV`), dan otomatis beralih menggunakan API server GAS sesungguhnya saat mode produksi (`PROD`).

### Implementasi Standar `src/api/gasClient.ts`
```typescript
import { ERPData, InventoryItem, FinanceTransaction, Employee, ProcurementRequest, SalesOrder } from '../types';

// Periksa apakah aplikasi berjalan di dalam sandbox Google Apps Script asli
const isGAS = typeof google !== 'undefined' && google.script && google.script.run;

// --- 1. SIMULASI LOCALSTORAGE UNTUK MODE DEV ---
const MOCK_STORAGE_KEY = 'erp_mock_data';

const initialMockData: ERPData = {
  inventory: [
    { id: 'INV-001', name: 'Laptop Pro 14', category: 'Elektronik', quantity: 20, minStock: 5, unit: 'Unit', warehouse: 'Gudang Utama', status: 'In Stock', price: 15000000, createdAt: new Date().toISOString() },
    { id: 'INV-002', name: 'Wireless Mouse', category: 'Aksesoris', quantity: 3, minStock: 10, unit: 'Pcs', warehouse: 'Gudang Utama', status: 'Low Stock', price: 250000, createdAt: new Date().toISOString() }
  ],
  finance: [
    { id: 'FIN-001', type: 'Income', amount: 30000000, category: 'Penjualan', description: 'Pembayaran Invoice SO-001', date: new Date().toISOString(), createdBy: 'Admin', createdAt: new Date().toISOString() }
  ],
  hr: [
    { id: 'EMP-001', name: 'Budi Santoso', email: 'budi@company.com', phone: '08123456789', position: 'Manager', department: 'IT', status: 'Active', basicSalary: 12000000, hireDate: '2025-01-15', createdAt: new Date().toISOString() }
  ],
  procurement: [],
  sales: []
};

function getLocalData(): ERPData {
  const data = localStorage.getItem(MOCK_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(initialMockData));
    return initialMockData;
  }
  return JSON.parse(data);
}

function saveLocalData(data: ERPData) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
}

// --- 2. WRAPPER JEMBATAN API (HYBRID BRIDGE) ---
export function callGas(functionName: string, ...args: any[]): Promise<any> {
  return new Promise((resolve, reject) => {
    if (isGAS) {
      // --- MODE PROD: Panggil server GAS asli ---
      const runner = google.script.run
        .withSuccessHandler((response: any) => {
          try {
            const res = typeof response === 'string' ? JSON.parse(response) : response;
            if (res.success) {
              resolve(res.data);
            } else {
              reject(new Error(res.error || 'Terjadi kesalahan pada server GAS.'));
            }
          } catch (e) {
            resolve(response); // fallback jika respon bukan JSON terstruktur
          }
        })
        .withFailureHandler((err: any) => {
          reject(new Error(err.message || 'Koneksi ke Google Apps Script terputus.'));
        });

      if (typeof runner[functionName] === 'function') {
        runner[functionName](...args);
      } else {
        reject(new Error(`Fungsi backend "${functionName}" tidak ditemukan.`));
      }
    } else {
      // --- MODE DEV: Jalankan logika database simulasi lokal ---
      setTimeout(() => {
        try {
          const db = getLocalData();
          
          switch (functionName) {
            case 'getInventory':
              resolve(db.inventory);
              break;
              
            case 'createInventory': {
              const newItem: InventoryItem = {
                ...args[0],
                id: `INV-${String(db.inventory.length + 1).padStart(3, '0')}`,
                createdAt: new Date().toISOString()
              };
              db.inventory.push(newItem);
              saveLocalData(db);
              resolve(newItem);
              break;
            }
            
            case 'getFinance':
              resolve(db.finance);
              break;
              
            case 'createFinance': {
              const newTx: FinanceTransaction = {
                ...args[0],
                id: `FIN-${String(db.finance.length + 1).padStart(3, '0')}`,
                createdAt: new Date().toISOString()
              };
              db.finance.push(newTx);
              saveLocalData(db);
              resolve(newTx);
              break;
            }

            case 'getSales':
              resolve(db.sales);
              break;

            case 'approveSales': {
              const soId = args[0];
              const orderIndex = db.sales.findIndex(o => o.id === soId);
              if (orderIndex !== -1) {
                db.sales[orderIndex].status = 'Approved';
                
                // --- AUTOMATION INTEGRATION (Chained Automation) ---
                // Otomatis catat kas masuk di Finance ketika Sales disetujui
                const so = db.sales[orderIndex];
                const newIncome: FinanceTransaction = {
                  id: `FIN-${String(db.finance.length + 1).padStart(3, '0')}`,
                  type: 'Income',
                  amount: so.totalAmount,
                  category: 'Penjualan',
                  description: `Kas masuk otomatis dari pesanan ${so.id} (${so.customerName})`,
                  date: new Date().toISOString(),
                  createdBy: 'System (Automation)',
                  createdAt: new Date().toISOString()
                };
                db.finance.push(newIncome);
                
                saveLocalData(db);
                resolve({ success: true, order: db.sales[orderIndex] });
              } else {
                reject(new Error('Pesanan tidak ditemukan'));
              }
              break;
            }
            
            default:
              reject(new Error(`Simulasi lokal untuk fungsi "${functionName}" belum diimplementasikan.`));
          }
        } catch (e: any) {
          reject(e);
        }
      }, 400); // simulasi latensi server 400ms
    }
  });
}
```

---

## 5. Standar Backend & Aturan Bebas Runtime Error

Di dalam lingkungan modern Google Apps Script, terdapat pembatasan ketat terkait metode rendering HTML yang sering diabaikan dan menyebabkan aplikasi mati total.

### A. Larangan Keras Sandbox Mode Usang (`01-main.gs`)
**SANGAT PENTING:** Objek `HtmlOutput` yang dikembalikan oleh fungsi utama `doGet(e)` **dilarang keras** menggunakan metode `.setSandboxMode(HtmlService.SandboxMode.NATIVE)` atau menambahkan tag kompatibilitas browser `X-UA-Compatible` bernilai `IE=Edge`. 

Menggunakan metode-metode usang (*deprecated*) tersebut pada server Google Apps Script modern akan memicu kesalahan fatal runtime berupa:
```text
Exception: The meta tag you specified is not allowed in this context.
```

### B. Pola Fungsi `doGet` yang Benar & Aman
Gunakan potongan kode baku ini untuk fungsi `doGet(e)` di dalam file backend utama:

```javascript
/**
 * Merender frontend aplikasi ke dalam browser user.
 */
function doGet(e) {
  // Memanggil file kompilasi akhir tanpa menyertakan ekstensi '.html'
  return HtmlService.createTemplateFromFile('Dashboard-for-Spreadsheet')
      .evaluate()
      .setTitle('ERP System Enterprise')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL) // Mengizinkan render di iframe Google Sheet
      .addMetaTag('viewport', 'width=device-width, initial-scale=1'); // Menjamin responsivitas mobile
}
```

### C. Pola API Response Standard (`99-utils.gs`)
Semua komunikasi data backend wajib dibungkus dengan format JSON terpadu agar penanganan galat (error handling) di frontend dapat diotomatisasi secara rapi:

```javascript
/**
 * Standar Wrapper untuk semua respon API backend.
 */
function createResponse(success, data, errorMsg) {
  var response = {
    success: success,
    data: data || null,
    error: errorMsg || null,
    timestamp: new Date().toISOString()
  };
  return JSON.stringify(response);
}

// Contoh pemakaian fungsi API backend:
function getInventory() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Inventory');
    if (!sheet) throw new Error("Sheet 'Inventory' tidak ditemukan.");
    
    var values = sheet.getDataRange().getValues();
    // logika parsing baris menjadi array of object ...
    
    return createResponse(true, inventoryList);
  } catch (err) {
    return createResponse(false, null, err.message);
  }
}
```

---

## 6. Alur Automasi Build & Sinkronisasi (Deployment Workflow)

Untuk menyederhanakan proses rilis, buat perintah terintegrasi di dalam berkas `package.json` Anda:

### Perintah Penting di `package.json`
```json
"scripts": {
  "dev": "vite",
  "build:html": "vite build && node scripts/build-gas-frontend.mjs",
  "build:gas": "node scripts/build-gas-backend.mjs",
  "build:all": "npm run build:html && npm run build:gas",
  "lint": "tsc --noEmit"
}
```

### Alur Kerja Rilis:
1. Jalankan **`npm run build:all`** di terminal komputer Anda.
2. Proses build akan:
   * Mengompilasi frontend React menggunakan plugin `vite-plugin-singlefile` menjadi satu file `dist/index.html`.
   * Menjalankan skrip `build-gas-frontend.mjs` untuk memampatkan spasi redundan dan menyalin hasilnya ke root dengan nama **`Dashboard-for-Spreadsheet.html`**.
   * Menjalankan skrip `build-gas-backend.mjs` untuk menyatukan semua kode backend modular di `gas-src/` menjadi satu file terpadu **`dist-gas/code.gs`**.
3. Buka editor Google Apps Script Anda, lalu:
   * Unggah/tempel isi file **`dist-gas/setup.gs`**
   * Unggah/tempel isi file **`dist-gas/code.gs`**
   * Buat file HTML baru di editor GAS dengan nama **`Dashboard-for-Spreadsheet`** (Apps Script akan menambahkan ekstensi .html secara otomatis) lalu tempelkan seluruh isi file dari root folder komputer Anda.
4. Simpan proyek, jalankan fungsi `runSetup` sekali saja secara manual dari editor GAS untuk inisialisasi sheet database, lalu Deploy sebagai **Web App** (akses: *Anyone*, jalankan sebagai: *Me*).
