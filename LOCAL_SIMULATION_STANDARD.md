# Standar Simulasi Lokal (Local Simulation Standard) untuk Pengembangan GAS-Vite

Dokumen ini mendefinisikan standar teknis dan arsitektur untuk mensimulasikan lingkungan backend **Google Apps Script (GAS)** di komputer lokal (`DEV` mode). Standar ini memastikan bahwa aplikasi dapat didebug, didemonstrasikan, dan diuji secara penuh tanpa memerlukan koneksi langsung ke Google Sheets, sekaligus menjaga keselarasan struktur data dengan lingkungan produksi (`PROD` mode).

---

## 1. Mengapa Simulasi Lokal Sangat Penting?

Dalam ekosistem Google Apps Script:
1. Objek `google.script.run` **tidak tersedia** ketika aplikasi dijalankan di luar iframe Google Sheets (seperti pada Vite dev server `http://localhost:3000`).
2. Penggunaan data statis (*hardcoded mock data*) yang tidak berubah saat di-refresh menyulitkan pengujian alur bisnis interaktif (seperti pembuatan formulir, persetujuan transaksi, atau pelaporan dinamis).
3. **Solusi:** Kita menerapkan **Simulasi Database Persisten** menggunakan `localStorage` browser dan **Mesin Kalkulasi Dinamis** di dalam `gasClient.ts` untuk menghadirkan pengalaman pengembangan lokal yang sangat mendekati sistem produksi.

---

## 2. Pilar Utama Simulasi Lokal

### A. Persistensi State Berbasis `localStorage`
Semua data tiruan (*mock data*) wajib disimpan dan dikelola melalui `localStorage` dengan kunci unik `'erp_mock_data'`.

1. **Idempotent Seeding:** Saat aplikasi pertama kali dimuat dan `localStorage` kosong, sistem harus menginjeksikan data awal (*seed data*) terstruktur secara otomatis.
2. **Real Mutation:** Operasi penambahan (Create), pembaruan (Update), dan penghapusan (Delete) wajib langsung memutasi objek di dalam `localStorage` agar perubahan tetap bertahan saat halaman di-refresh.
3. **Simulasi Latensi:** Setiap panggilan fungsi lokal harus dibungkus dalam `setTimeout` selama **400ms s.d. 800ms** untuk mensimulasikan latensi jaringan sesungguhnya, membantu pengujian status loading spinner pada UI.

### B. Kalkulasi Metrik Dinamis (Dashboard Metrics)
Angka ringkasan (*Summary Cards*) dan grafik analitik di halaman utama **tidak boleh ditulis statis (hardcoded)**. Semua metrik harus dihitung secara *real-time* langsung dari data mutakhir di `localStorage`:

1. **Total Pendapatan (Revenue):** 
   $$\text{Revenue} = \sum \text{FinanceTransactions(Type = 'Income')}$$
2. **Total Pengeluaran (Expense):** 
   $$\text{Expense} = \sum \text{FinanceTransactions(Type = 'Expense')}$$
3. **Karyawan Aktif (Active Employees):**
   Count data tabel `HR` dengan filter `status === 'Active'`.
4. **Peringatan Stok Menipis (Low Stock Alert):**
   Mencocokkan kuantitas saat ini (`quantity`) dengan batas minimum (`minStock`) dari data `Inventory`. Jika `quantity <= minStock`, item tersebut ditandai kritis.
5. **Grafik Arus Kas (Dynamic Cashflow Chart):**
   Memetakan tanggal transaksi pendapatan dan pengeluaran ke dalam grup bulan (6 bulan terakhir) secara dinamis untuk disajikan ke dalam grafik visual (Recharts).

### C. Automasi Berantai (Chained Automation)
Untuk mensimulasikan integrasi lintas departemen pada sistem ERP nyata, operasi pada satu modul harus memicu efek samping (*side effects*) otomatis pada modul lain:

```text
[Sales Order Approved] ──> Otomatis Membuat ──> [Finance Income Transaction]
[Procurement Approved] ──> Otomatis Menambah ──> [Inventory Quantity + Item]
```

* **Integrasi Keuangan Otomatis:** Ketika pengguna menyetujui Sales Order di halaman *Sales*, simulasi lokal harus otomatis menyisipkan rekaman transaksi masuk (`Income`) baru ke dalam array `Finance` sebesar total nominal order terkait.
* **Integrasi Inventori Otomatis:** Ketika pengajuan pengadaan (*Procurement*) barang disetujui, kuantitas item di gudang bersangkutan harus otomatis bertambah di tabel *Inventory*.

---

## 3. Struktur Data Sinkron (Types & Interfaces)

Kontrak tipe data di frontend (`src/types.ts`) adalah **sumber kebenaran tunggal** bagi database lokal (`localStorage`) maupun kolom-kolom Google Sheets yang disiapkan oleh backend (`setup.gs`).

### Contoh Sinkronisasi Kontrak Tipe Data (`src/types.ts`)
Setiap entitas data wajib memiliki atribut dasar pelacakan audit: `id`, `createdAt`, `updatedAt`, dan `createdBy` (atau `email` pengguna aktif).

```typescript
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  warehouse: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  price: number;
  createdAt: string;
  updatedAt?: string;
}

export interface FinanceTransaction {
  id: string;
  type: 'Income' | 'Expense';
  amount: number;
  category: string;
  description: string;
  date: string;
  createdBy: string;
  createdAt: string;
}
```

---

## 4. Cara Menambahkan Simulasi Baru (Panduan Developer)

Jika Anda menambahkan fitur baru (misalnya modul *Asset Management*), ikuti langkah-langkah simulasi lokal berikut:

1. **Definisikan Interface** baru di `src/types.ts` (misal: `interface Asset`).
2. **Tambahkan Array Kosong** pada inisialisasi awal database di `src/api/gasClient.ts` (`assets: []`).
3. **Implementasikan Kasus Baru di `callGas`:**
   ```typescript
   case 'getAssets':
     resolve(db.assets);
     break;
   case 'createAsset':
     const newAsset = { ...args[0], id: `AST-${db.assets.length + 1}` };
     db.assets.push(newAsset);
     saveLocalData(db);
     resolve(newAsset);
     break;
   ```
4. **Tulis Endpoint Backend yang Setara** di `gas-src/modules/` (e.g., `modules/18-assets.gs`) dengan logika penulisan baris Spreadsheet yang serupa, agar saat aplikasi dibangun ke mode produksi (`PROD`), perpindahan API berjalan transparan tanpa perlu merubah satu baris pun kode di komponen UI Anda.
