# Optimalisasi Batasan Google Apps Script (GAS Limits & Optimization)

Dokumen ini menjelaskan batas-batas kapasitas (quotas & limitations) bawaan dari platform **Google Apps Script (GAS)** serta merangkum strategi optimalisasi arsitektur dan penulisan kode (coding best practices) untuk memastikan aplikasi tetap berjalan cepat, responsif, dan stabil dalam skala enterprise.

---

## 1. Tabel Batasan Utama GAS (Google Apps Script Quotas)

Sebagai platform berbasis cloud terbagi (*shared cloud environment*), Google menerapkan batasan penggunaan harian demi menjaga stabilitas infrastruktur. Memahami batas-batas ini sangat krusial saat merancang aplikasi berbasis Google Sheets.

| Jenis Batasan / Quota | Akun Google Biasa (@gmail.com) | Akun Google Workspace (Enterprise) | Dampak & Gejala Jika Melebihi Batas |
| :--- | :--- | :--- | :--- |
| **Waktu Eksekusi Maksimal** | 6 menit / eksekusi | 6 menit / eksekusi | Runtime error: `Exceeded maximum execution time` |
| **Ukuran File HTML Output** | Max 50 MB | Max 50 MB | Lembar web gagal dimuat, crash, atau respons sangat lambat |
| **Ukuran Payload Google API** | 50 MB / panggilan | 50 MB / panggilan | Panggilan `google.script.run` gagal mengembalikan data |
| **Panggilan UrlFetch (HTTP)** | 20.000 / hari | 100.000 / hari | Gagal melakukan request API luar |
| **Kirim Email (MailApp)** | 100 penerima / hari | 1.500 penerima / hari | Notifikasi email sistem terhenti |
| **Batas Sel Google Sheets** | 10 juta sel / berkas | 10 juta sel / berkas | Spreadsheet mengunci, operasi tulis diblokir |

---

## 2. Strategi Optimalisasi Database (Google Sheets API)

Membaca dan menulis ke baris Google Sheets adalah operasi I/O paling lambat di backend GAS. Mengoptimalkan bagian ini akan secara drastis memotong waktu eksekusi skrip dari menit menjadi milidetik.

### A. Aturan Emas: Batching (Hindari Loop untuk I/O)
**DILARANG KERAS** memanggil `getValue()` atau `setValue()` di dalam perulangan (`for`/`while`). Setiap pemanggilan sel tunggal memicu request HTTP internal ke server Google Sheets.

#### ❌ Pola Buruk (Sangat Lambat & Boros Quota):
```javascript
// Membaca baris satu-persatu di dalam loop
var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
for (var i = 1; i <= 1000; i++) {
  var id = sheet.getRange(i, 1).getValue(); // 1000x Operasi Baca!
  if (id === targetId) {
    sheet.getRange(i, 2).setValue("Disetujui"); // Operasi Tulis Lambat
  }
}
```

#### ✅ Pola Optimal (Sangat Cepat - Batch Reading & Writing):
Ambil seluruh data ke memori RAM dalam bentuk array dua dimensi menggunakan `getValues()`, proses di memori, lalu tulis kembali sekaligus menggunakan `setValues()`.

```javascript
var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Inventory");
var lastRow = sheet.getLastRow();
var lastColumn = sheet.getLastColumn();

// 1. Ambil seluruh tabel dalam SATU operasi baca saja
var range = sheet.getRange(1, 1, lastRow, lastColumn);
var data = range.getValues(); 

// 2. Manipulasi data di dalam memory (RAM) menggunakan JS standar
for (var i = 0; i < data.length; i++) {
  if (data[i][0] === targetId) {
    data[i][1] = "Disetujui"; 
  }
}

// 3. Tulis kembali seluruh data dalam SATU operasi tulis saja
range.setValues(data);
```

---

## 3. Optimalisasi Performa Frontend di Lingkungan Iframe

Layanan `HtmlService` di GAS merender halaman web di dalam iframe yang terisolasi dengan performa render yang lebih rendah dibanding tab browser biasa.

### A. Pertahankan Ukuran HTML Di Bawah 2 MB (Eksternalisasi via CDN)
Setiap kilobita kode di dalam file HTML rilis akan memperlambat inisialisasi awal UI. Oleh karena itu:
1. **Gunakan Import Maps & CDN:** Jangan mem-bundle library besar (React, Lucide, Recharts) ke dalam file HTML. Load library tersebut langsung melalui CDN terpercaya (misal `esm.sh` atau `jsDelivr`) seperti yang dirancang di dalam file `GAS_VITE_BLUEPRINT.md`.
2. **Minifikasi Terser:** Konfigurasikan bundler Vite agar selalu mengompresi naskah Javascript dengan kompresi tingkat tinggi.

### B. Manfaatkan CacheService untuk Data Lambat
Jika data Spreadsheet Anda jarang berubah (seperti daftar kategori barang atau data profil karyawan), hindari membaca Spreadsheet pada setiap inisialisasi aplikasi. Gunakan **`CacheService`** di sisi backend GAS untuk menyimpan data sementara dalam memori RAM berkecepatan tinggi milik Google.

```javascript
function getCachedInventory() {
  var cache = CacheService.getScriptCache();
  var cachedData = cache.get("inventory_list");
  
  if (cachedData != null) {
    return cachedData; // Kembalikan string JSON dari cache (instan!)
  }
  
  // Jika cache kosong, ambil dari Spreadsheet
  var data = getInventoryFromSpreadsheet(); // Operasi lambat
  var jsonStr = JSON.stringify(data);
  
  // Simpan di cache selama 25 menit (maksimum 30 menit / 1800 detik)
  cache.put("inventory_list", jsonStr, 1500); 
  return jsonStr;
}
```

---

## 4. Efisiensi Serialisasi google.script.run

Ketika mengirimkan data dari frontend ke backend GAS menggunakan `google.script.run.namaFungsi(data)`, Google melakukan proses enkripsi-dekripsi (*serialization*) pada parameter data tersebut.

* **Hindari Mengirim Objek Kompleks:** Jangan mengirimkan objek state React yang besar atau elemen DOM langsung ke backend GAS.
* **Format Data Sederhana:** Kirimkan data dalam bentuk string JSON terkompresi atau tipe data primitif (string, angka, boolean).
* **Bungkus dengan JSON.stringify / JSON.parse:** Seringkali, mengompres objek di frontend menggunakan `JSON.stringify(payload)` kemudian mendekodekannya di backend GAS menggunakan `JSON.parse(payload)` jauh lebih cepat dan stabil dibanding membiarkan GAS melakukan serialisasi objek JavaScript mentah secara otomatis.
