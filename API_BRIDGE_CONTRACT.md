# Kontrak Jembatan API (API Bridge Contract) untuk Integrasi GAS-Vite

Dokumen ini mendefinisikan **kontrak antarmuka pemrograman (API Contract)** yang menjembatani komunikasi antara **Frontend (React)** dan **Backend (Google Apps Script / Google Sheets)**. 

Kontrak ini adalah jaminan mutlak agar perubahan pada UI tidak merusak integrasi database Google Sheets, dan sebaliknya. Setiap fungsi yang dipanggil oleh frontend melalui `callGas('namaFungsi', ...)` wajib didefinisikan di sini dan diimplementasikan secara identik baik dalam file simulasi lokal (`gasClient.ts`) maupun file controller modular backend (`gas-src/modules/*.gs`).

---

## 1. Standar Format Respon API (Standard Response Wrapper)

Semua fungsi API backend wajib mengembalikan data dengan format JSON terstruktur yang seragam. Ini memungkinkan penanganan error secara otomatis di sisi frontend (Error Boundary, Toast Notifikasi, dan Logging).

```typescript
interface ApiResponse<T = any> {
  success: boolean;       // Status keberhasilan operasi (true/false)
  data: T | null;         // Data muatan utama yang dikembalikan (null jika gagal)
  error: string | null;   // Pesan kesalahan rinci yang ramah pengguna (null jika sukses)
  timestamp: string;      // Waktu pencatatan server (ISO 8601)
}
```

---

## 2. Daftar Kontrak API per Modul ERP

### A. Modul Inventory & Multi-Gudang
Mengelola data stok barang, ambang batas minimum persediaan, dan lokasi penyimpanan gudang.

#### 1. `getInventory()`
* **Deskripsi:** Mengambil daftar seluruh barang di inventori.
* **Parameter:** Tidak ada.
* **Kembalian (Data Payload):** `InventoryItem[]`
* **Contoh Objek Data:**
  ```json
  {
    "id": "INV-001",
    "name": "Laptop Pro 14",
    "category": "Elektronik",
    "quantity": 25,
    "minStock": 5,
    "unit": "Unit",
    "warehouse": "Gudang Utama",
    "status": "In Stock",
    "price": 15000000,
    "createdAt": "2026-07-02T05:00:00.000Z"
  }
  ```

#### 2. `createInventory(item: Omit<InventoryItem, 'id' | 'createdAt'>)`
* **Deskripsi:** Menambahkan barang baru ke dalam database inventori.
* **Parameter:** Objek barang tanpa ID dan tanggal pembuatan (ID akan dibuat otomatis secara urut oleh sistem).
* **Kembalian (Data Payload):** `InventoryItem` (Barang yang berhasil disimpan lengkap dengan ID baru).

---

### B. Modul Keuangan (Finance)
Mencatat seluruh transaksi arus kas masuk (pemasukan) dan arus kas keluar (pengeluaran).

#### 1. `getFinance()`
* **Deskripsi:** Mengambil semua daftar transaksi keuangan.
* **Parameter:** Tidak ada.
* **Kembalian (Data Payload):** `FinanceTransaction[]`

#### 2. `createFinance(transaction: Omit<FinanceTransaction, 'id' | 'createdAt'>)`
* **Deskripsi:** Mencatat transaksi keuangan baru.
* **Parameter:** Objek transaksi baru.
* **Kembalian (Data Payload):** `FinanceTransaction`

---

### C. Modul Kepegawaian (HR)
Mengelola data induk karyawan, departemen, dan informasi gaji dasar untuk penggajian (*payroll*).

#### 1. `getHR()`
* **Deskripsi:** Mengambil seluruh data karyawan aktif maupun tidak aktif.
* **Parameter:** Tidak ada.
* **Kembalian (Data Payload):** `Employee[]`

#### 2. `createHR(employee: Omit<Employee, 'id' | 'createdAt'>)`
* **Deskripsi:** Menambahkan karyawan baru ke dalam sistem.
* **Parameter:** Objek data karyawan baru.
* **Kembalian (Data Payload):** `Employee`

---

### D. Modul Pengadaan Barang (Procurement)
Menangani alur pengajuan pembelian barang operasional yang membutuhkan persetujuan berjenjang (*Approval Flow*).

#### 1. `getProcurement()`
* **Deskripsi:** Mengambil semua daftar pengajuan pengadaan barang beserta status persetujuannya.
* **Parameter:** Tidak ada.
* **Kembalian (Data Payload):** `ProcurementRequest[]`

#### 2. `createProcurement(request: Omit<ProcurementRequest, 'id' | 'createdAt' | 'status'>)`
* **Deskripsi:** Membuat pengajuan pengadaan baru dengan status awal otomatis `'Pending'`.
* **Parameter:** Objek detail pengajuan.
* **Kembalian (Data Payload):** `ProcurementRequest`

#### 3. `approveProcurement(id: string, approvedBy: string)`
* **Deskripsi:** Menyetujui pengajuan pengadaan barang.
* **Efek Samping (Automasi):** Secara otomatis menambah kuantitas barang yang bersangkutan di modul `Inventory` (jika nama barang & spesifikasi cocok).
* **Parameter:** ID Pengajuan dan nama pemberi persetujuan.
* **Kembalian (Data Payload):** `{ success: boolean, request: ProcurementRequest }`

#### 4. `rejectProcurement(id: string, rejectedBy: string, reason: string)`
* **Deskripsi:** Menolak pengajuan pengadaan barang dengan menyertakan alasan penolakan.
* **Parameter:** ID Pengajuan, nama penolak, dan alasan penolakan.
* **Kembalian (Data Payload):** `ProcurementRequest`

---

### E. Modul Penjualan (Sales)
Mencatat pesanan penjualan (*Sales Order*) dari pelanggan dan mengintegrasikan invoice langsung ke kas keuangan.

#### 1. `getSales()`
* **Deskripsi:** Mengambil seluruh daftar pesanan penjualan.
* **Parameter:** Tidak ada.
* **Kembalian (Data Payload):** `SalesOrder[]`

#### 2. `createSales(order: Omit<SalesOrder, 'id' | 'createdAt' | 'status'>)`
* **Deskripsi:** Membuat pesanan penjualan baru.
* **Parameter:** Objek detail pesanan.
* **Kembalian (Data Payload):** `SalesOrder`

#### 3. `approveSales(id: string, approvedBy: string)`
* **Deskripsi:** Menyetujui pesanan penjualan.
* **Efek Samping (Automasi Keuangan):** Otomatis membuat pencatatan transaksi kas masuk baru (`Income`) di modul `Finance` sebesar nilai total pesanan tersebut (`totalAmount`) sebagai pendapatan realisasi.
* **Parameter:** ID Pesanan dan nama penyetuju.
* **Kembalian (Data Payload):** `{ success: boolean, order: SalesOrder }`

---

### F. Modul Pengaturan Sistem (Settings)
Mengelola parameter global seperti konfigurasi nama perusahaan, timezone, dan format penomoran otomatis dokumen.

#### 1. `getSettings()`
* **Deskripsi:** Mengambil konfigurasi parameter sistem yang tersimpan secara persistent di `ScriptProperties` backend.
* **Parameter:** Tidak ada.
* **Kembalian (Data Payload):** `SystemSettings`

#### 2. `updateSettings(settings: SystemSettings)`
* **Deskripsi:** Memperbarui parameter konfigurasi sistem secara menyeluruh.
* **Parameter:** Objek pengaturan sistem baru.
* **Kembalian (Data Payload):** `SystemSettings`

---

## 3. Siklus Hidup Panggilan Data (Lifecycle of API Call)

Berikut adalah visualisasi langkah-demi-langkah bagaimana komponen React melakukan request data sampai dirender dengan aman:

1. **Inisiasi UI:** Komponen memanggil fungsi `callGas` di dalam hook `useEffect`.
2. **Identifikasi Environment:** `gasClient.ts` mendeteksi mode:
   * **Mode DEV:** Membaca data secara instan dari simulasi `localStorage` browser dan mensimulasikan latensi jaringan dengan `setTimeout`.
   * **Mode PROD:** Memanggil server Google Apps Script menggunakan objek `google.script.run`.
3. **Format Respon Terpadu:** Backend memproses data Sheets dan mengembalikan string JSON ter-wrapper (`createResponse`).
4. **Verifikasi Keberhasilan:** Jembatan API Promise memeriksa atribut `success`:
   * Jika `true`, data langsung diteruskan ke state komponen (`resolve`).
   * Jika `false`, promise ditolak (`reject`) dan memicu sistem Toast untuk menampilkan pesan error teknis kepada pengguna tanpa menghentikan aplikasi.
