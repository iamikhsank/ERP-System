## 2026-07-02 — v1.4.0

### Ditambahkan / Diubah (Navigasi Bersarang dengan Pohon Visual di Sidebar)
- **Restrukturisasi Sidebar ERP Utama (`App.tsx`)**:
  - Menambahkan dukungan untuk `subItems` di bawah kelompok menu yang memiliki tab sub-halaman (Keuangan, Penjualan, Persediaan, Pengadaan, Kepegawaian).
  - Mengimplementasikan sistem pelacakan state `expandedMenus` untuk mendukung fitur expand/collapse sub-menu secara interaktif menggunakan ikon chevron-down berputar.
  - Membangun **diagram pohon visual (nested visual tree lines)** murni menggunakan lekukan CSS `border-l border-b border-slate-200 rounded-bl-md`.
  - Mengonfigurasi penyorotan cabang aktif (cabang visual melengkung berubah menjadi warna indigo semi-transparan `border-indigo-400/60` saat sub-item aktif).
- **Sinkronisasi State Antara Sidebar dan Halaman Modul**:
  - Mengangkat state tab aktif dari tingkat halaman lokal ke tingkat global `App.tsx` (`salesTab`, `financeTab`, `inventoryTab`, `procurementTab`, `hrTab`).
  - Memodifikasi seluruh halaman sub-modul (`Sales.tsx`, `Finance.tsx`, `Inventory.tsx`, `Procurement.tsx`, `HR.tsx`) agar menerima prop opsional `activeTab` dan `setActiveTab`, memungkinkan navigasi dua arah yang harmonis.

---

## 2026-07-02 — v1.3.0

### Ditambahkan / Diubah (Modul SDM, Payroll, dan Absensi/Cuti Terpadu)
- **Implementasi Halaman Multi-Tab Modul SDM & Gaji (HR Page)**:
  - **Tab 1: Direktori Karyawan**: Menampilkan KPI vital (Total Karyawan Terdaftar, Karyawan Aktif, Total Pengeluaran Gaji Pokok). Tabel mendukung input lengkap: Nama Lengkap, Jabatan, Departemen, Gaji Pokok, Email, Tanggal Mulai Bergabung (Join Date), dan Status Keaktifan (Active/Inactive), yang disinkronkan secara asinkron ke Google Sheets.
  - **Tab 2: Slip Gaji (Payroll Processing)**: Kalkulator gaji bulanan modern. Pengguna dapat memilih karyawan aktif (otomatis mengambil Gaji Pokok dari sistem), mengonfigurasi Tunjangan Jabatan/Bonus (+), Potongan Absensi/Denda (-), menghitung Gaji Bersih (Net Salary), serta menyimpan slip gaji berkemampuan *Draft* atau *Paid*. Melalui aksi asinkron "Bayar Gaji", status berubah menjadi *Paid* dan pengeluaran kas otomatis dicatat di pembukuan Buku Besar Keuangan. Dilengkapi pratinjau slip gaji yang siap cetak (printable slip).
  - **Tab 3: Kehadiran & Cuti (Attendance & Leave)**:
    - **Absensi Harian**: Form interaktif "Catat Absensi" untuk melacak status check-in, check-out, serta keterangan untuk status Hadir, Sakit, Izin, Cuti, dan Mangkir (Alpa).
    - **Permohonan Cuti**: Form pengajuan cuti dengan tanggal mulai, tanggal selesai, alasan cuti, dan alur persetujuan manager (*Pending*, *Approved*, *Rejected*).
- **Pembaruan Skema GAS (00-setup.gs)**:
  - Memperbarui kolom tabel `HR` dengan header: `['id', 'employeeName', 'position', 'department', 'status', 'email', 'salary', 'joinDate', 'createdAt']`.
  - Mendaftarkan tabel baru `Attendance` dengan header: `['id', 'employeeName', 'date', 'status', 'checkIn', 'checkOut', 'notes', 'createdAt']`.
  - Mendaftarkan tabel baru `LeaveRequests` dengan header: `['id', 'employeeName', 'startDate', 'endDate', 'reason', 'status', 'createdAt']`.
  - Mendaftarkan tabel baru `Payroll` with header: `['id', 'employeeName', 'month', 'basicSalary', 'allowance', 'deduction', 'netSalary', 'status', 'createdAt']`.
- **Modifikasi Modul GAS HR (13-hr.gs)**:
  - Menambahkan dukungan CRUD terperinci untuk tabel `HR` dengan data Departemen dan Tanggal Mulai Join.
  - Membuat API asinkron untuk Absensi (`getAttendance`, `createAttendance`).
  - Membuat API asinkron untuk Pengajuan Cuti (`getLeaves`, `createLeave`, `approveLeave`, `rejectLeave`).
  - Membuat API asinkron untuk Payroll (`getPayrolls`, `createPayroll`, `payPayroll`) yang secara cerdas menghubungkan pengeluaran Payroll ke pencatatan transaksi kas `Finance`.

---

## 2026-07-02 — v1.2.0

### Ditambahkan / Diubah (Arsitektur Sub-Modul Pengadaan & Direktori Vendor Mitra)
- **Implementasi Halaman Multi-Tab Modul Pengadaan (Procurement)**:
  - **Tab 1: Pengajuan Pembelian (Requisitions)**: Formulir pengajuan pengadaan asinkron lengkap dengan status persetujuan (*Pending*, *Approved*, *Rejected*). Disertai fitur *Auto-Reconcile* di mana penyetujuan pengadaan otomatis mencatat transaksi pengeluaran (Expense) di Buku Kas Keuangan, serta mengoreksi sisa stok reaktif dan mencatat mutasi masuk di modul Inventaris jika produk terdaftar.
  - **Tab 2: Direktori Vendor / Supplier**: Modul manajemen database rekanan penyuplai (*Suppliers*) terintegrasi dengan Google Sheets menggunakan tabel baru `Suppliers`. Menampilkan data kontak ponsel, email, performa ketepatan pengiriman (Delivery Performance), serta daftar katalog produk yang ditawarkan mitra vendor lengkap dengan dialog CRUD asinkron.
- **Pembaruan Skema GAS (00-setup.gs)**:
  - Mendaftarkan tabel baru `Suppliers` dengan kolom header: `id`, `name`, `contact`, `email`, `deliveryPerformance`, `catalog`, `createdAt`.
- **Modifikasi Modul GAS Pengadaan (14-procurement.gs)**:
  - Menambahkan aksi asinkron `getSuppliers`, `createSupplier`, `updateSupplier`, dan `deleteSupplier` untuk sinkronisasi direktori mitra.
  - Memperbarui penanganan status aksi `approve` dengan melampirkan pelaporan otomatis ke Buku Besar Keuangan dan penambahan stok otomatis ke Buku Mutasi Inventaris.

---

## 2026-07-02 — v1.1.0

### Ditambahkan / Diubah (Sub-Modul Inventaris & Gudang Terpadu dengan Stock Opname Audit)
- **Implementasi Halaman Multi-Tab Modul Stok & Gudang (Inventory)**:
  - **Tab 1: Stok Barang Aktual (Stock List)**: Menampilkan KPI vital (Total Macam SKU, SKU Kritis/Stok Minim, Estimasi Nilai Aset berbasis HPP). Tabel pencatatan stok mendukung pelacakan Harga Pokok Penjualan (HPP) dan Harga Jual per produk secara presisi, terhubung langsung ke Google Sheets.
  - **Tab 2: Riwayat Mutasi (Stock Ledger)**: Log kronologis asinkron terperinci yang mencatat arus keluar masuk unit barang (Initial, In, Out, Adjustment). Memudahkan audit stok harian dengan rincian rentang stok terdahulu, stok terbaru, serta deskripsi keterangan mutasi.
  - **Tab 3: Opname Fisik (Stock Adjustment)**: Workspace audit fisik khusus untuk mendeteksi selisih antara sistem komputer dengan rak gudang nyata. Menyediakan perhitungan selisih asinkron reaktif (Surplus, Defisit, atau Netral) disertai dialog alasan koreksi, yang langsung memperbarui sisa stok di Google Sheets secara aman.
- **Pembaruan Skema GAS (00-setup.gs)**:
  - Memperbarui kolom tabel `Inventory` dengan penambahan kolom `purchasePrice` (HPP) dan `sellingPrice` (Harga Jual).
  - Menambahkan tabel baru `StockMutations` dengan kolom header: `id`, `sku`, `name`, `type`, `quantity`, `prevQty`, `newQty`, `description`, `createdAt`.
- **Modifikasi Modul GAS Inventaris (11-inventory.gs)**:
  - Menambahkan dukungan mutasi log pada aksi `create` (pencatatan stok awal) dan `update` (jika kuantitas diedit).
  - Mengimplementasikan aksi baru `getMutations` dan `adjust` (Opname Fisik) untuk menjamin persistensi audit yang kuat di sisi Google Sheets.

---

## 2026-07-02 — v1.0.0

### Ditambahkan / Diubah (Arsitektur Sub-Modul Penjualan Terpadu & CRM Pelanggan)
- **Implementasi Halaman Multi-Tab Modul Penjualan (Sales)**:
  - **Tab 1: Pesanan & Faktur (Sales Orders)**: Workspace pelacakan transaksi penjualan, pembuatan pesanan (*Sales Order*) baru via modal dialog asinkron, serta penyesuaian status pembayaran (*Draft*, *Sent*, *Paid*, *Cancelled*) yang langsung berintegrasi dengan pembukuan otomatis Buku Besar Keuangan.
  - **Tab 2: Database Pelanggan (CRM)**: Modul pengelolaan pelanggan yang komprehensif. Menampilkan kontak ponsel, email, status, dan menghitung poin loyalitas dinamis serta sisa piutang dagang aktif berdasarkan transaksi berjalan. Dilengkapi dialog tambah/edit pelanggan yang sinkron ke database Google Sheets.
  - **Tab 3: Performa Produk**: Dashboard analitis real-time yang memetakan performa produk inventaris terdaftar (Top SKU). Menghitung kontribusi omset penjualan per SKU, unit terjual, rasio SKU produktif, sisa stok gudang, serta penentuan otomatis performa produk (*Best Seller*, *Moderate*, *Slow Moving*) lengkap dengan visualisasi Horizontal SVG Bar Chart reaktif.
- **Pembaruan Skema GAS (00-setup.gs)**:
  - Mendaftarkan tabel baru `Customers` dengan kolom header: `id`, `name`, `contact`, `email`, `loyaltyPoints`, `receivable`, `createdAt`.
- **Modifikasi Modul GAS Penjualan (15-sales.gs)**:
  - Menambahkan aksi asinkron `getCustomers`, `createCustomer`, `updateCustomer`, dan `deleteCustomer` untuk menjamin persistensi data CRM pelanggan seutuhnya di Google Sheets.

---

## 2026-07-02 — v0.9.0

### Ditambahkan / Diubah (Sub-Modul Keuangan Terintegrasi Google Sheets & Analisis SVG Donat)
- **Halaman dalam Halaman (Sub-Halaman) Modul Keuangan**:
  - **Tab 1: Buku Besar Kas (General Ledger)**: Menampilkan KPI statistik utama (Pemasukan, Pengeluaran, Laba Bersih), input transaksi terpadu, serta tabel pencatatan transaksi manual lengkap dengan sinkronisasi Sheets.
  - **Tab 2: Analisis Laba Rugi (P&L Summary)**: Visualisasi Donat SVG interaktif buatan sendiri (Custom Donut Chart) dengan efek sorot (*hover*) reaktif dan progress bar detail per kategori alokasi dana (Beban vs Pendapatan).
  - **Tab 3: Rekonsiliasi Kas & Bank**: Workspace komparasi real-time yang membandingkan mutasi internal Buku Besar dengan mutasi eksternal rekening koran bank. Dilengkapi asisten pencocokan otomatis (*auto-reconcile*) dan opsi pencatatan selisih instan yang langsung terupdate ke basis data Google Sheets.
- **Pembaruan Skema GAS (setup.gs)**:
  - Menambahkan kolom status `reconciled` dan `bankRef` pada inisialisasi tabel `Finance` untuk menjamin persistensi pencatatan rekonsiliasi yang sesungguhnya di sisi Google Sheets.

---

## 2026-07-02 — v0.8.1

### Ditambahkan / Diubah (Penggelapan Batas Border - High Contrast Slate)
- **Peningkatan Kontras Batas Container (Borders) Lebih Gelap**:
  - Memperkuat semua pembatas visual kartu bento, panel fungsional, sidebar navigasi, topbar header, status monitor, database info, tabel skema, dan elemen masukan di seluruh modul aplikasi (Dashboard, Sales, Finance, HR, Procurement, Reporting, Settings, dan komponen global `DataTable`) dari `border-slate-200` menjadi solid `border-slate-300`.
  - Memberikan kontras tingkat tinggi yang lebih terdefinisi, tegas, dan berpenampilan ultra-profesional di atas latar belakang abu-abu terang (`bg-slate-100`).

---

## 2026-07-02 — v0.8.0

### Ditambahkan / Diubah (Pembaruan Warna, Notifikasi Bell, Redesain Settings, & Ikon Sidebar Kustom)
- **Implementasi Ikon Panel Buka/Tutup Kustom**:
  - Menyederhanakan kontrol navigasi dengan **menghilangkan tombol buka/tutup di sidebar**, menjaga estetika lencana logo tetap murni.
  - Menempatkan **kontrol pemicu panel eksklusif di samping Judul Dashboard di baris Topbar** menggunakan visualisasi bingkai persegi bulat bersisian garis pembagi vertikal dengan penunjuk arah chevron dinamis (kiri saat sidebar terbuka, kanan saat sidebar tertutup).
- **Penguatan Batas Container (Borders) Seluruh Halaman**:
  - Memperkuat seluruh pembatas kartu bento, panel fungsional, dan tabel di seluruh halaman aplikasi (Dashboard, Sales, Finance, Inventory, Procurement, HR, Reporting, Settings, serta komponen global `DataTable`) dari warna transparan tipis (`border-slate-200/60`) menjadi solid `border-slate-200` yang kokoh, presisi, dan berkualitas tinggi di atas background dasar abu-abu muda (`bg-slate-100`).
- **Background Utama Sedikit Lebih Gelap**:
  - Mengubah warna background dasar pembungkus luar menjadi slate abu-abu muda (`bg-slate-100`) dan area main content menjadi `bg-slate-100/50`. Memberikan kontras tingkat tinggi yang membuat setiap bento-card putih murni (`bg-white`) terlihat melayang indah dan premium.
- **Fungsionalitas Ikon Notifikasi Bell**:
  - Menyematkan dropdown popover interaktif pada tombol Bell topbar dengan lencana unread dinamis.
  - Menambahkan list notifikasi fungsional untuk aktivitas sistem (transaksi lunas, peringatan stok, koneksi database).
  - Mengintegrasikan pemanggilan `logSystem` agar otomatis mendorong log aktivitas baru ke dalam feed notifikasi secara real-time.
  - Menyediakan aksi interaktif "Tandai Semua Dibaca" dan "Hapus Semua" dengan toast feedback.
- **Redesain & Perdetail Halaman Settings (Bento Grid)**:
  - **Profil Perusahaan**: Dirombak menjadi layout bento grid 3-kolom. Di bagian kiri berisi form konfigurasi organisasi, alamat, acuan mata uang, PPN, dan format nomor dokumen otomatis. Di bagian kanan berisi panel visual pemantau real-time Status Sistem (V8 Engine, latency ~120ms, dan grafik progres kuota panggilan API harian).
  - **Tab Baru - Integrasi Google Sheets**: Menyediakan tabel visualisasi skema dari 6 tabel Spreadsheet utama, tipe kolom, dan status sinkronisasi. Dilengkapi aksi interaktif "Uji Koneksi" dan "Sinkronisasi Skema" dengan spinner loading dan banner sukses.
  - **Manajemen User**: DataTable pengguna yang lebih rapi dilengkapi registrasi hak akses pengguna berbasis modal dialog yang detail.

---

## 2026-07-02 — v0.7.0

### Ditambahkan / Diubah (Redesain Navigasi Premium Ala Aivox)
- **Desain Sidebar Premium Light-Themed**:
  - Mengubah warna dasar navigasi samping dari warna gelap menjadi warna putih bersih (`bg-white`) dengan border kanan yang sangat halus (`border-slate-200/70`) guna menghadirkan tampilan premium modern.
  - Menghadirkan logo badge hitam melengkung elegan (`bg-slate-950`) dengan inisial font display miring *A* dan animasi pendaran cahaya (*pulse*).
- **Pengelompokan Navigasi Terstruktur (Grouped Navigation)**:
  - Menyusun menu navigasi ke dalam grup fungsional yang intuitif: *MAIN MENU* (Dashboard, Penjualan, Keuangan), *OPERATIONS* (Persediaan, Pengadaan, Kepegawaian), dan *PREFERENCES* (Pelaporan, Pengaturan).
  - Menggunakan label yang elegan dan ikon-ikon yang disesuaikan (misalnya mengganti ikon truk dengan `ShoppingBag` untuk modul Sales agar selaras dengan estetika SaaS modern).
- **Tombol Toggle Collapse Internal Terintegrasi**:
  - Menyematkan tombol kolaps sidebar bergaya layout dual-kolom di samping logo "Aivox" untuk meminimalkan sidebar secara anggun. Saat kolaps, header menyusut otomatis menjadi ikon inisial hitam yang interaktif.
- **Transisi dan Efek Hover yang Elegan**:
  - Tombol menu aktif kini menggunakan kapsul berwarna gelap solid (`bg-slate-950`) dengan teks putih cerah dan bayangan bento yang lembut. Menu tidak aktif menggunakan warna slate yang halus dengan efek hover berlatar belakang abu-abu terang.

---

## 2026-07-02 — v0.6.0

### Ditambahkan / Diubah (Redesain Antarmuka Premium ERP SaaS)
- **Sistem Tipografi Plus Jakarta Sans**:
  - Mengintegrasikan CDN Google Fonts untuk memuat *Plus Jakarta Sans* (Display & Headings), *Inter* (Body Text), dan *JetBrains Mono* (Monospace untuk angka & data visual).
- **Estetika High-Contrast Modern SaaS**:
  - **Sidebar Navigation**: Mengubah panel navigasi menjadi warna Slate 900 gelap yang elegan, dilengkapi tombol aktif berwarna gradien Indigo 600 ke Indigo 700 dengan hover state interaktif dan sudut melingkar penuh (*fully-rounded active capsules*).
  - **KPI & Bento Grid**: Mengubah widget metrik statis di Dashboard, Inventory, Finance, HR, Sales, dan Procurement menjadi kartu bento-style dengan batas tipis Slate 200/60 dan bayangan bayang-halus (`shadow-[0_8px_30px_rgb(0,0,0,0.012)]`).
  - **Kapsul Status & Tindakan Baru**: Merancang ulang seluruh label status (Lunas, Proses, Sukses, Batal) menjadi kapsul tag semitransparan yang indah (seperti Emerald, Blue, Rose, dan Slate) dengan ikon mini Lucide penjelas status.
  - **Form Input & Modal Premium**: Memperbarui semua isian form, select menu, date picker, dan teks area menggunakan background halus `slate-50/50`, efek hover interaktif, serta ring fokus berwarna ungu lembut (*Indigo 100*) untuk kemudahan entri data.
  - **Simulasi & Loader Real-Time Baru**: Mengganti dialog browser native `alert` pada modul Cetak Laporan (Reporting) dan Profil Perusahaan dengan banner notifikasi inline dan pemuat animatif (*spinning loader*) yang jauh lebih profesional dan aman untuk iframe sandboxed.

---

## 2026-07-02 — v0.5.3

### Ditambahkan / Diperbaiki
- **Persistensi Data Lokal Mode DEV (`localStorage`)**:
  - Mengganti mock data statis di dalam `gasClient.ts` dengan penyimpanan berbasis `localStorage` (`erp_mock_data`). Data yang dimasukkan atau diubah pengguna tidak akan hilang lagi saat halaman di-refresh di browser pengembangan.
  - Menginisialisasi data bawaan (laptop, mouse, transaksi keuangan, karyawan) secara otomatis saat pertama kali dibuka.
- **Kalkulasi Metrik Dashboard Dinamis**:
  - Menggantikan angka metrik dashboard hardcoded di mode DEV dengan algoritma perhitungan dinamis yang menghitung total pendapatan, jumlah pesanan, karyawan aktif, dan item stok rendah secara real-time langsung dari data di `localStorage`.
  - Membuat grafik arus kas bulanan dinamis berdasarkan riwayat transaksi yang tersimpan, serta daftar aktivitas sistem terbaru yang diperbarui secara dinamis dari modul Sales, Inventory, dan Procurement.

---

## 2026-07-02 — v0.5.2

### Dihapus / Dioptimalkan
- **Pembersihan UI & Penghapusan Floating Console**:
  - Menghapus komponen tombol console mengapung (`ErrorConsole.tsx`) di sudut kiri bawah layar agar tampilan antarmuka (UI) jauh lebih bersih, rapi, dan profesional.
  - Memodifikasi utilitas `logSystem` agar mencatat log sistem secara langsung ke standard browser developer tools console (`console.log`, `console.warn`, `console.error`) menggantikan penyimpanan state UI internal yang tidak diperlukan.
- **Pemisahan Pipeline Build (Frontend vs Backend GAS)**:
  - Memisahkan build monolithic yang berat menjadi dua pipeline mandiri:
    - `npm run build:gas` (Membangun backend `.gs` saja secara instan tanpa proses transpilation Vite yang berat).
    - `npm run build:html` (Menjalankan kompilasi aset Web via Vite dan menyuntikkannya ke file single-file HTML).
    - `npm run build` (Mengeksekusi keduanya secara bersamaan untuk kenyamanan rilis penuh).

---

## 2026-07-02 — v0.5.1

### Ditambahkan
- **Estetika Baris Header Google Sheets Otomatis (`setup.gs`)**:
  - Mengonfigurasi warna latar belakang baris header (Baris ke-1) menggunakan warna biru abu-abu gelap premium (`#1e293b` - Slate 800) yang kontras dan profesional.
  - Memformat teks header menjadi **Tebal (Bold)** dan **Rata Tengah (Center)** untuk pembacaan kolom yang rapi.
  - Membekukan baris pertama secara otomatis (`setFrozenRows(1)`) agar judul kolom tetap terlihat saat pengguna menggulir data ke bawah.
  - Menambahkan penyesuaian lebar kolom otomatis (`autoResizeColumns`) yang menyesuaikan ruang horizontal berdasarkan panjang nama kolom.

---

## 2026-07-02 — v0.5.0

### Ditambahkan
- **Integrasi Penuh CRUD Google Sheets**: Mengimplementasikan logika manipulasi baris spreadsheet dinamis (`insertRow`, `updateRow`, `deleteRow`) di dalam `/gas-src/99-utils.gs` dan menghubungkannya ke modul backend:
  - **Inventory**: Mendukung penambahan barang baru, pengeditan info, dan penghapusan barang.
  - **Finance**: Mendukung pencatatan transaksi pemasukan/pengeluaran baru, pengeditan, serta penghapusan.
  - **HR**: Mendukung pengelolaan data karyawan (nama, jabatan, gaji, email, status).
  - **Procurement**: Mendukung pengajuan pengadaan dengan nomor berurutan otomatis (`PR-XXX`), persetujuan, dan penolakan.
  - **Sales**: Mendukung pembuatan pesanan penjualan dengan nomor otomatis (`SO-XXX`) dan pembaruan status pembayaran.
  - **Manajemen User & Hak Akses (Auth)**: Mendukung pengelolaan daftar pengguna, pendaftaran akun baru, penyesuaian hak akses berdasarkan peran (*role-based access control* seperti Admin, Manager, Staff, Viewer), pembaruan data, hingga penghapusan secara persisten langsung ke tabel `Users` Google Sheets.
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
