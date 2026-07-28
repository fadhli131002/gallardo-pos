Siap, bro! Ini adalah modul paling krusial untuk *owner* (pemilik bisnis) karena menyangkut kesehatan finansial dan operasional secara *real-time*.

Berikut adalah **Product Requirement Document (PRD)** yang sangat detail, lengkap dengan **rancangan Frontend, Backend, struktur database, hingga rumus cara mengambil data (data source)** untuk ketujuh metrik yang lu minta.

---

# PRODUCT REQUIREMENT DOCUMENT (PRD)

## Modul: Dashboard Owner & Laporan Keuangan (Financial & Business Intelligence)

---

### 1. Tujuan Produk (Objective)

Menyediakan pusat informasi finansial bagi *owner* untuk memantau performa bisnis secara makro (tahunan/bulanan) hingga mikro (beban, arus kas, pembelian barang, dan kerugian komplain) secara otomatis berdasarkan data transaksi aktual di sistem POS & Workshop.

---

### 2. Daftar Metrik & Cara Mengambil Datanya (Data Source & Formulas)

| No | Metrik | Cara Ambil Data (Sumber & Logika Backend) |
| --- | --- | --- |
| 1 | **Laba Rugi Setiap Tahun** | Mengagregasi seluruh transaksi dengan status `LUNAS` dari tabel `Transaction` selama 1 tahun fiskal berjalan, lalu dikurangi Total HPP (Harga Pokok Penjualan) dan Total Beban/Pengeluaran di tahun tersebut. |
| 2 | **Laba Rugi Per Bulan** | Sama seperti tahunan, namun dikelompokkan (*grouped by*) berdasarkan bulan (`YYYY-MM`) untuk melihat tren grafik bulanan. |
| 3 | **Kerugian Atas Komplain** | Diambil dari tabel `Complaint / Warranty`. Nilai kerugian dihitung dari total harga modal barang/jasa pengganti atau biaya operasional perbaikan garansi yang berstatus `Selesai` atau `Proses` dalam rentang waktu tertentu. |
| 4 | **Beban Perusahaan** | Diambil dari tabel khusus pengeluaran operasional/beban perusahaan (misal: gaji karyawan, sewa tempat, listrik, internet) yang diinput manual oleh admin lewat menu *Expense*. |
| 5 | **Laporan Pembelian Barang** | Diambil dari tabel `PurchaseOrder` (pembelian stok dari *supplier* / restock material) yang statusnya sudah diterima (`Received`). |
| 6 | **Arus Kas (Cash Flow)** | Rekonsiliasi seluruh uang masuk (pembayaran dari customer, DP) dikurangi uang keluar (pembayaran *supplier*, biaya operasional, gaji) secara *real-time* berdasarkan tabel `CashFlowLog`. |
| 7 | **Pengeluaran Operasional** | Agregasi dari seluruh catatan pengeluaran rutin operasional di luar pembelian stok barang dagang. |

---

### 3. Perancangan Backend & Database (API & Schema)

#### A. Struktur Database (Prisma Schema Tambahan)

```prisma
model Expense {
  id          Int      @id @default(autoincrement())
  title       String   // e.g., "Gaji Karyawan Juli", "Sewa Ruko"
  category    String   // "Operational", "Salary", "Utility", "Other"
  amount      Float
  date        DateTime @default(now())
  proofUrl    String?  // Lampiran foto nota/kwitansi
  createdAt   DateTime @default(now())
}

model CashFlowLog {
  id          Int      @id @default(autoincrement())
  type        String   // "IN" (Masuk) atau "OUT" (Keluar)
  amount      Float
  description String
  referenceId String?  // ID Transaksi atau ID Expense
  date        DateTime @default(now())
}

```

#### B. Endpoint API Backend (`owner.controller.js`)

* **`GET /api/owner/dashboard-summary?year=2026&month=7`**
* *Response JSON*: Mengembalikan ringkasan total laba rugi, arus kas, total beban, dan kerugian komplain.


* **`GET /api/owner/profit-loss`**
* *Query Params*: `filter=yearly` atau `filter=monthly`
* *Response*: Grafik data perbandingan pendapatan, HPP, dan bersih (laba rugi).


* **`GET /api/owner/expenses`**
* *Response*: List data pengeluaran operasional dan filter tanggal.


* **`GET /api/owner/complaint-losses`**
* *Response*: Total nilai finansial dari klaim garansi/komplain yang dikeluarkan perusahaan.



---

### 4. Perancangan Frontend (UI/UX Requirement)

Halaman **Dashboard Owner** (`OwnerDashboard.jsx`) dirancang dengan tata letak bersih (*clean layout*) menggunakan kartu metrik ringkas (*summary cards*) di bagian atas dan grafik interaktif di bawahnya.

#### A. Komponen Tampilan (UI Structure)

1. **Filter Global (Header)**:
* Dropdown Pilihan Tahun (`2026`, `2025`, dst) & Bulan.
* Tombol **"Export PDF / Excel"** untuk laporan keuangan resmi.


2. **Top Summary Cards (Grid 4 Kolom)**:
* Card 1: **Laba Bersih Bulan Ini** (Menampilkan angka total + persentase kenaikan dari bulan lalu).
* Card 2: **Arus Kas Bersih (Cash Flow)** (Kas Masuk vs Kas Keluar).
* Card 3: **Total Beban & Operasional** (Akumulasi pengeluaran bulan ini).
* Card 4: **Kerugian Komplain / Garansi** (Nominal kerugian akibat klaim customer).


3. **Grafik & Tabel Analitik (Tab / Section)**:
* **Grafik Laba Rugi (Tahunan & Bulanan)**: Grafik garis (*Line Chart*) interaktif menampilkan omset, HPP, dan Laba Bersih.
* **Tabel Laporan Pembelian Barang**: Menampilkan histori restock material dari supplier lengkap dengan status dan total biayanya.
* **Tabel Pengeluaran Operasional**: Rincian beban perusahaan per kategori dengan tombol tambah pengeluaran manual bagi admin/owner.



---

### 5. Acceptance Criteria (Kriteria Keberhasilan)

* [ ] **Akurasi Data**: Angka laba rugi otomatis berubah secara *real-time* setiap kali ada transaksi kasir (`POS`) yang berstatus `LUNAS`.
* [ ] **Filter Waktu**: Owner dapat memfilter laporan secara spesifik berdasarkan rentang tanggal tertentu (*custom date range*).
* [ ] **Integritas Komplain**: Setiap ada komplain yang diselesaikan dengan penggantian barang/jasa gratis, sistem otomatis mencatat estimasi nilai modalnya sebagai komponen pengurang di laporan kerugian komplain.
* [ ] **Aksesibilitas**: Halaman ini hanya dapat diakses oleh akun dengan *role* `OWNER` atau `ADMIN`.


Username: owner
Password: owner123
Login As: Business Owner