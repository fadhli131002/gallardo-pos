# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## SISTEM PORTAL GALLARDO (POS, WORKSHOP & FINANCIAL MANAGEMENT ECOSYSTEM)
**Gallardo Auto Sport & New Ratu**

---

### Informasi Dokumen
* **Nama Proyek:** Sistem Portal Terpadu Gallardo Auto Sport & New Ratu
* **Versi Dokumen:** v3.0 (Master Ecosystem PRD)
* **Status:** Approved / Active Production
* **Target Pengguna:** Superadmin, Admin Workshop, Sales Frontliner, Tim Finance, Business Owner, Pelanggan (Public)
* **Platform:** Web Responsive Desktop & Tablet (React + Vite + Express + Prisma + SQLite/MySQL)

---

## 1. Executive Summary & Latar Belakang

### 1.1 Latar Belakang Bisnis
**Gallardo Auto Sport** (dan cabang **New Ratu**) adalah workshop otomotif spesialis proteksi kendaraan premium yang mengelola tiga divisi produk utama:
1. **Kaca Film (Window Film):** Brand Deluxe (Classich, Jet Black) & Performante (Iron Black, Black Stone).
2. **Nano Ceramic Coating:** Brand Rantiz (9H+, 14H, 20H).
3. **Paint Protection Film (PPF):** Brand Vansgard (Ultra, Matte, Armor, Super Safe).
4. **Retail & Grosir:** Penjualan bahan baku per-roll, per-meter, dan botol kimia.

Tantangan utama yang dihadapi workshop adalah:
* Kompleksitas matriks harga dinamis (kombinasi Brand $\times$ Tipe Produk $\times$ Ukuran Kendaraan Small/Medium/Large/XL $\times$ Posisi Pasang Depan/SKKB/Full).
* Kebutuhan isolasi data antar-sales (tiap sales hanya melihat portofolio & komisi miliknya sendiri).
* Sinkronisasi inventaris stok gudang (Roll dan Botol) secara otomatis ketika kasir menyelesaikan pesanan.
* Penjadwalan kapasitas workshop (slot booking) agar tidak terjadi penumpukan pengerjaan mobil (*overbooking*).
* Validasi pembayaran bertahap (Down Payment / Termin / Pelunasan) oleh tim Finance.
* Visibilitas eksekutif bagi Business Owner untuk memantau Laba Bersih, Arus Kas, dan Beban Operasional secara *real-time*.

### 1.2 Tujuan Produk (Product Objectives)
Membangun satu ekosistem portal terpusat (*Single Source of Truth*) yang membagi alur kerja operasional bengkel ke dalam **6 Sub-Portal Terintegrasi** dengan isolasi wewenang ketat (Role-Based Access Control):
1. **Sales Portal (`/sales`):** POS Kasir, Kalender Slot, CRM Pelanggan, Klaim Komplain.
2. **Admin & Workshop Portal (`/admin`):** Monitoring Slot Bengkel, Master Data, Manajemen Stok Global, Approval Hapus Transaksi, Audit Trail.
3. **Finance Portal (`/finance`):** Piutang Usaha, Validasi Pembayaran, Refund, Komisi Sales, dan Penentuan HPP.
4. **Owner Portal (`/owner-portal`):** Business Intelligence, Analisis Laba Rugi, Arus Kas, dan Beban Operasional.
5. **Inventory Portal (`/inventory-portal`):** Manajemen Stok Gudang Khusus, Restock, Stok Opname, dan Ruang Diskusi Selisih Stok (Stock Discrepancy Comms).
6. **Customer Public Portal (`/public`):** E-Invoice dan E-Warranty Card digital berbasis nomor rangka kendaraan.

---

## 2. Arsitektur Multi-Portal & Role-Based Access Control (RBAC)

### 2.1 Matriks Wewenang & Hak Akses

| Fitur / Modul | Sales | Admin | Superadmin | Finance | Owner | Inventory | Public |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **POS Kasir (Workshop & Retail)** | ✅ Input | ✅ Input | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Dashboard Metrik Pribadi** | ✅ Milik Sendiri | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Admin Workspace (Global Metrik)** | ❌ | ✅ Read | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Booking & Slot Workshop** | ✅ Booking | ✅ Full | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Master Data (Kendaraan & Harga)** | ❌ | ✅ CRUD | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| **Inventory Portal (`/inventory-portal`)** | ❌ | ✅ Read/Comms | ✅ Full | ❌ | ❌ | ✅ Full Gudang | ❌ |
| **Restock & Stok Opname (Adjust)** | ❌ | ✅ CRUD | ✅ Full | ❌ | ❌ | ✅ CRUD | ❌ |
| **Stock Discrepancy Comms (Chat/Isu)** | ❌ | ✅ Balas/Selesai | ✅ Full | ❌ | ❌ | ✅ Buat/Balas | ❌ |
| **Pengajuan Hapus Invoice** | ✅ Request Only | ✅ Request Only | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Approval Hapus Data (Deletion)** | ❌ | ❌ | ✅ Approve/Reject | ❌ | ❌ | ❌ | ❌ |
| **Validasi Piutang & Pelunasan** | ❌ | ❌ | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Pencatatan HPP Modal** | ❌ | ❌ | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Komisi Sales & Refund** | ❌ (View Sendiri) | ❌ | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| **Laporan Keuangan & Laba Rugi** | ❌ | ❌ | ✅ Full | ✅ View/Report | ✅ Full | ❌ | ❌ |
| **Input Beban Operasional (Expense)** | ❌ | ❌ | ✅ Full | ✅ Input | ✅ Full | ❌ | ❌ |
| **Akses E-Invoice & E-Warranty** | ✅ Generate | ✅ Generate | ✅ Generate | ✅ Print | ✅ View | ❌ | ✅ View Only |

### 2.2 Isolasi Multi-Cabang (Multi-Branch)
Sistem mendukung multi-cabang dengan isolasi otomatis pada sesi login:
* `Gallardo` (Pusat)
* `New Ratu` (Cabang)
* `Global` (Akses Superadmin, Finance, & Owner untuk melihat konsolidasi seluruh cabang)

---

## 3. Spesifikasi Fungsional: 5 Portal Utama

### 3.1 Portal 1: Sales Portal (`/sales`)

#### A. Isolated Sales Dashboard (`/sales/dashboard`)
* **Data Isolation:** Hanya menampilkan data transaksi di mana `sales_id === user.id` atau `event` cocok dengan nama sales. Tidak ada kebocoran omzet toko atau sales lain.
* **Key Metrics:**
  * Total Orders Closing
  * Total Pelanggan Unik
  * Rasio Transaksi Lunas vs Pending / DP
  * Total Omzet Sales Bulan Berjalan
  * Grafik *Dynamics of Sales* (Mingguan/Bulanan)
* **What's New Notification (Megaphone):** Popup otomatis saat admin merilis pembaruan sistem (*Release Notes*).

#### B. POS Cashier & Smart Pricing Matrix (`/sales/pos`)
* **Klasifikasi Kendaraan Otomatis:**
  * Penentuan kategori ukuran mobil: *Small Car*, *Medium Car*, *Large Car*, *XL / Luxury Car*.
  * Terhubung dengan database master kendaraan (`Vehicle`).
* **Katalog Layanan & Aturan Matriks Harga:**
  * **Kaca Film:**
    * *Performante Iron Black (Nano Carbon Polyester):* 35, 20, 05 (Depan / SKKB / Full).
    * *Performante Black Stone (Nano Carbon Material):* 70, 35, 20, 05.
    * *Deluxe Classich (Nano Ceramic):* 40, 60, 80.
    * *Deluxe Jet Black (Night Drive Vision):* 20, 40, 60, 80.
  * **Coating (Rantiz):**
    * Rantiz 9H+ (Garansi 1 Thn), 14H (Garansi 3 Thn), 20H (Garansi 5 Thn).
  * **PPF (Vansgard):**
    * Vansgard Ultra & Matte (Garansi 5 Thn), Armor & Super Safe (Garansi 10 Thn).
    * Opsi: Full Body, Partial Body, Interior, Headlamp.
* **Ketentuan Pembayaran & Skema Termin:**
  * Tipe pembayaran: LUNAS, DP (Down Payment), TERMIN (Cicilan Pengerjaan).
  * Metode Pembayaran: `QRIS`, `CASH`, `DEBIT`, `KARTU_KREDIT`, `TRANSFER_BANK`, `ONLINE_SHOP`, `FREE_OF_CHARGE`.
  * **Aturan Khusus `FREE_OF_CHARGE`:** Untuk endorsement, klaim garansi gratis, atau reward owner. Transaksi otomatis berstatus **LUNAS** dengan total tagihan 0 rupiah tanpa validasi underpayment.
* **Cetak Nota & Surat Perintah Kerja (SPK):**
  * Format Thermal Kasir (80mm) dan Format Surat Jalan / Invoice Resmi (A4).

#### C. Smart Calendar & Workshop Slot Booking (`/sales/calendar`)
* **Slot Capacity Guard (Anti-Tumpuk):**
  * Membatasi jumlah mobil yang boleh masuk per hari sesuai kuota workshop.
  * Durasi default: Kaca Film = 3 Jam; Coating = 1-2 Hari; PPF = 7 Hari.
  * Jika kapasitas hari terpilih penuh, tanggal otomatis dikunci merah (*Disabled*).
  * Pembukaan kunci otomatis terjadi jika status mobil di hari tersebut diubah menjadi `Selesai` (mobil keluar).

#### D. Customers & Digital Warranty Hub (`/sales/customers`)
* Pencarian data pelanggan berdasarkan Nama, No. HP, No. Polisi, atau No. Rangka.
* Monitoring status garansi aktif pelanggan.
* Pembuatan tiket komplain langsung jika ada klaim gelembung/kupas.

---

### 3.2 Portal 2: Admin & Workshop Portal (`/admin`)

#### A. Admin Workspace (`/admin/workspace`)
* **Global Monitoring:**
  * Total Omzet Gabungan Seluruh Sales & Cabang.
  * Jumlah Kendaraan Sedang Dikerjakan (*Active in Workshop*).
  * Peringatan Kapasitas Slot Hari Ini (*Workshop Occupancy Rate*).
  * Visualisasi Top-Performing Products & Leaderboard Sales.

#### B. Inventory Engine & Pemotongan Stok Otomatis (`/admin/inventory`)
* **Struktur Stok Dua Lapis (Two-Tier Stock):**
  * Satuan Utama: Roll (Kaca Film & PPF), Botol (Chemical Coating).
  * Satuan Pecahan: Meter (Kaca Film/PPF), Mililiter (Chemical).
  * Dilengkapi nilai konversi (misal: 1 Roll = 15 Meter; 1 Botol = 50 ml).
* **Aturan Pengurangan Otomatis POS-to-Inventory:**
  * **Layanan Kaca Film:** Potong **1 Roll** (atau meter sesuai konfigurasi partial).
  * **Layanan Coating:** Potong **1 Botol** cairan coating terpilih.
  * **Layanan PPF Bundling:** Potong **1 Roll** bahan PPF **+ 1 Botol** primer *Rantiz 9H*.
  * **POS Retail:** Potong sesuai kuantitas unit yang dijual langsung.
* **Low Stock Critical Warning:**
  * Jika sisa stok $\le 2$ unit, sistem menampilkan badge merah mencolok dan notifikasi restock.
* **Audit Pergerakan Stok (`InventoryLog`):**
  * Mencatat setiap aksi `DEDUCT` (terikat `transaction_id`), `RESTOCK`, dan `ADJUST` (Stok Opname) beserta stok sebelum dan sesudah.

#### C. Master Data Management (`/admin/vehicle-master`)
* CRUD Master Kendaraan (Merk, Model, Kategori Ukuran).
* CRUD Master Peruntukan Produk & Posisi Pemasangan (Depan, SKKB, Full, Partial).
* CRUD Master Potongan PPF (Tabel panduan ukuran potong cm per tipe mobil).
* CRUD Profil Sales Master (ID Sales, Nama, Target).

#### D. Sistem Keamanan & Approval Hapus Invoice (`DeletionRequest`)
* **Two-Man Rule (Prinsip Keamanan Akuntansi):**
  * Sales dan Admin dilarang menghapus invoice secara langsung dari database.
  * Sales mengajukan *Request Deletion* melalui tombol khusus dengan mencantumkan alasan tertulis.
  * Permintaan masuk ke antrean Superadmin (`PENDING`).
  * Superadmin memverifikasi dan memilih `APPROVE` atau `REJECT`.
  * Jika disetujui, transaksi di-*soft delete* / dibatalkan, stok barang otomatis dikembalikan (*Reverted*), dan tercatat di `AuditLog`.

#### E. Audit Trail & Log Aktivitas (`AuditLog`)
* Mencatat seluruh aksi sensitif: Pembatalan Invoice, Pelunasan Manual, Perubahan Diskon, Penyesuaian Stok Opname.
* Menyimpan rekaman: `user_id`, `action`, `target_id`, `reason`, `old_value` (JSON), `new_value` (JSON).

#### F. Release Notes & Broadcast System (`/admin/release-notes`)
* Admin dapat mempublikasikan pengumuman update fitur baru.
* Pengguna di portal Sales/Finance otomatis menerima banner notifikasi *What's New*.

---

### 3.3 Portal 3: Finance Portal (`/finance`)

#### A. Finance Dashboard & Cash Control (`/finance/dashboard`)
* Ringkasan Total Pendapatan Kotor (*Gross Revenue*).
* Total Kas Masuk Aktual (*Actual Cash In*) vs Piutang Berjalan (*Pending Receivables*).
* Rekapitulasi Pembayaran per Channel (QRIS, Transfer Bank, Tunai, Kartu Kredit, EDC).

#### B. Piutang Pelanggan & Validasi Pembayaran (`/finance/receivables`)
* Monitoring seluruh transaksi dengan status `Proses` atau `DP`.
* Fitur **Input Pembayaran Pelunasan / Termin**:
  * Input nominal pembayaran baru.
  * Unggah bukti transfer/struk EDC.
  * Sistem otomatis menghitung `sisa_tagihan`.
  * Jika sisa tagihan = 0, status otomatis berganti menjadi `LUNAS`.

#### C. Manajemen Refund & Retur (`/finance/refunds`)
* Pencatatan klaim pengembalian dana konsumen akibat pembatalan atau revisi paket.
* Rekonsiliasi langsung dengan arus kas keluar (`CashFlowLog` bertipe `OUT`).

#### D. Laporan Komisi Sales (`/finance/commissions`)
* Perhitungan otomatis insentif closing sales berdasarkan persentase atau nominal flat per layanan yang berstatus `LUNAS`.
* Rekap per periode pencairan gaji bulanan.

#### E. Pengaturan Harga Pokok Penjualan / HPP (`/finance/hpp`)
* Input nilai modal per unit material (`harga_modal` pada tabel `Inventory`).
* Menjadi basis kalkulasi Laba Kotor dan Laba Bersih yang ditampilkan di Owner Dashboard.

---

### 3.4 Portal 4: Owner Portal / Business Intelligence (`/owner-portal`)

Khusus dirancang untuk Business Owner guna memantau kesehatan finansial bengkel secara independen dan akurat.

#### 7 Metrik Finansial Utama:
1. **Laba Rugi Tahunan (Yearly P&L):**
   $$\text{Laba Bersih} = \sum \text{Omzet Lunas} - \sum \text{HPP Material} - \sum \text{Beban Operasional}$$
2. **Laba Rugi Bulanan (Monthly P&L):** Grafik tren pendapatan vs pengeluaran per bulan (`YYYY-MM`).
3. **Kerugian Komplain / Garansi:** Total biaya material & operasional yang dikeluarkan untuk menangani komplain customer tanpa biaya tambahan.
4. **Beban Perusahaan (Corporate Expenses):** Input dan monitoring biaya tetap (*Fixed Cost*) seperti Sewa Gedung, Gaji Karyawan, Listrik/Air, dan Internet.
5. **Laporan Pembelian Barang (Supplier Purchase Orders):** Histori restock material dari supplier lengkap dengan status pembayaran.
6. **Arus Kas Bersih (Net Cash Flow):** Rekonsiliasi kas masuk aktual dikurangi kas keluar aktual secara harian dan bulanan.
7. **Pengeluaran Operasional Rutin (Operational OpEx):** Biaya consumable workshop (lakban, pisau cutter, kain microfiber, konsumsi).

#### Fitur Eksekutif:
* Filter global rentang tanggal (*Custom Date Range* atau filter Bulan/Tahun).
* Ekspor laporan resmi (PDF / Excel) untuk arsip pembukuan pajak dan investor.
* Mode gelap (*Dark Mode Theme*) premium untuk kenyamanan visual eksekutif.

---

### 3.5 Portal 5: Customer Public Portal (`/public`)

Halaman publik tanpa autentikasi yang dapat diakses pelanggan via scan QR Code atau tautan WhatsApp:

#### A. E-Invoice Digital (`/public/invoice/:transactionId`)
* Tampilan invoice resmi berlogo Gallardo Auto Sport / New Ratu.
* Status LUNAS / DP dengan stempel digital resmi.
* Rincian spesifikasi kendaraan, item pengerjaan, dan riwayat termin pembayaran.
* Tombol cetak PDF langsung dari browser handphone/laptop pelanggan.

#### B. E-Warranty Card Digital (`/public/warranty/:transactionId`)
* Kartu garansi digital interaktif dengan efek visual sertifikat holografik.
* Data validasi: Merk/Model Mobil, Nomor Polisi, Nomor Rangka (*Chassis*), dan Nomor Mesin.
* Penghitung mundur masa aktif garansi (*Countdown Timer* Tahun/Bulan).
* Ketentuan klaim garansi resmi dan kontak layanan darurat bengkel.

### 3.6 Portal 6: Inventory Portal (`/inventory-portal`)

Sub-portal eksklusif yang dirancang khusus untuk tim gudang (*role: inventory*) untuk mengontrol ketersediaan fisik material secara presisi dan terisolasi dari proses kasir/penjualan:

#### A. Inventory Overview Widgets
* **Total Master SKU:** Visualisasi jumlah katalog material aktif.
* **Peringatan Stok Menipis:** Indikator merah berkedip jika sisa unit $\le 2$, dilengkapi filter sekali klik (*quick-filter toggle*).
* **Mutasi Hari Ini:** Akumulasi pergerakan barang masuk (*Restock*), barang keluar (*POS Usage*), dan penyesuaian (*Opname*).
* **Widget Isu Selisih:** Menampilkan jumlah tiket laporan selisih yang masih berstatus `OPEN`.

#### B. Master Stock Management (`/inventory-portal/dashboard`)
* Tabel visual interaktif dengan kolom ID SKU, Kategori, Brand & Varian, Kegelapan, Stok Utama (Roll/Botol/Pcs), Stok Pecahan (m/ml), Satuan, dan Status Stok.
* **Modal Restock Cepat:** Input penerimaan barang masuk dari supplier dengan kalkulasi langsung (*Stok Sekarang + Masuk = Stok Baru*).
* **Modal Adjust (Stok Opname):** Penyesuaian fisik vs sistem dengan deteksi varians defisit/surplus serta pemilihan alasan resmi.

#### C. Stock Discrepancy Comms (Ruang Komunikasi Gudang & Admin) (`/inventory-portal/comms`)
* **Sistem Tiketing Selisih Fisik:** Tim gudang dapat membuat tiket ketika jumlah fisik tidak sesuai dengan catatan sistem (contoh: *"Admin, fisik botol Rantiz sisa 18 di rak B, di sistem sisa 20"*).
* **Thread Obrolan Real-Time:** Admin dan petugas gudang dapat berdiskusi langsung dalam thread yang sama untuk mencari akar penyebab (misal verifikasi transaksi SPK kasir yang belum lunas).
* **Status Resolusi:** `OPEN` &rarr; `IN_PROGRESS` &rarr; `RESOLVED`.
* **Sinkronisasi Otomatis:** Tombol *"Sinkronkan & Selesai"* yang secara otomatis mengoreksi stok master ke kuantitas fisik dan menutup tiket.

#### D. Mutasi & Log Riwayat Stok (`/inventory-portal/logs`)
* Histori lengkap pergerakan bahan workshop dan retail secara kronologis.

---

## 4. Skema Database & Relasi Entitas (Prisma Schema Reference)

```prisma
// Ringkasan Model Inti Database
model User {
  id       Int    @id @default(autoincrement())
  name     String
  username String @unique
  password String
  role     String // "sales" | "admin" | "superadmin" | "finance" | "owner" | "inventory"
}

model Transaction {
  id                Int               @id @default(autoincrement())
  sales_id          Int
  customer_name     String?
  customer_phone    String?
  plate_number      String?
  chassis_number    String?
  car_brand         String?
  car_model         String?
  installation_date String?
  total_amount      Float
  discount          Float             @default(0)
  sisa_tagihan      Float
  status_pembayaran String            @default("Proses") // "Proses" | "LUNAS" | "Batal"
  type              String            @default("WORKSHOP") // "WORKSHOP" | "RETAIL"
  event             String?           // Nama Sales PIC
  payment_method    String?
  branch            String            @default("Gallardo")
  items             TransactionItem[]
  payments          Payment[]
  inventory_logs    InventoryLog[]
  complaints        Complaint[]
  cash_flow_logs    CashFlowLog[]
}

model TransactionItem {
  id             Int         @id @default(autoincrement())
  transaction_id Int
  product_name   String
  price          Float
  quantity       Float       @default(1)
  transaction    Transaction @relation(fields: [transaction_id], references: [id], onDelete: Cascade)
}

model Inventory {
  id           String         @id // e.g. "INV-KF-01"
  kategori     String         // "Kaca Film" | "Coating" | "PPF" | "Liquid"
  brand        String
  varian       String
  harga_jual   Float          @default(0)
  harga_modal  Float          @default(0) // HPP
  stok_utama   Int            @default(0) // Roll / Botol
  satuan       String         @default("Roll")
  min_stok     Int            @default(2)
  branch       String         @default("Gallardo")
  logs         InventoryLog[]
}

model DeletionRequest {
  id             Int       @id @default(autoincrement())
  transaction_id Int?
  customer_name  String
  plate_number   String?
  total_amount   Float?
  cashier_name   String
  reason         String
  status         String    @default("PENDING") // "PENDING" | "APPROVED" | "REJECTED"
  action_by_name String?
  created_at     DateTime  @default(now())
}

model AuditLog {
  id          Int      @id @default(autoincrement())
  user_name   String
  action      String   // "CANCEL_INVOICE" | "STOCK_ADJUST" | "EDIT_PRICE"
  target_type String
  target_id   Int
  reason      String?
  old_value   String?  // JSON
  new_value   String?  // JSON
  created_at  DateTime @default(now())
}
```

---

## 5. Aturan Logika Bisnis Kritis (Core Business Rules)

1. **Konsistensi Transaksi & Mutasi Stok:**
   * Setiap transaksi kasir wajib dieksekusi dalam satu blok Prisma `$transaction`.
   * Jika stok bahan di gudang tidak mencukupi, transaksi otomatis digagalkan dengan *error message* yang informatif.
2. **Pencegahan Fraud & Pembatalan:**
   * Status invoice yang sudah `LUNAS` tidak dapat diedit atau dihapus sembarangan oleh sales. Harus melalui mekanisme `DeletionRequest` ke Superadmin.
3. **Pengakuan Kas Masuk (Cash Flow Principle):**
   * Kas masuk hanya dihitung dari uang riil yang sudah disetor via tabel `Payment` atau `CashFlowLog` bertipe `IN`. Sisa piutang belum diakui sebagai kas likuid.
4. **Masa Berlaku Garansi Otomatis:**
   * Garansi diaktifkan pada tanggal `installation_date` dan dikunci ke `chassis_number`. Penggantian nomor plat tidak menghanguskan garansi selama nomor rangka tetap sama.

---

## 6. Kebutuhan Non-Fungsional (NFR)

* **Keamanan Data & Privasi:**
  * Password dienkripsi menggunakan hashing standar industri (bcrypt).
  * JWT (JSON Web Token) dengan masa kedaluwarsa sesi dan sanitasi input dari serangan XSS / SQL Injection.
* **Performa & Kecepatan:**
  * Response time API rata-rata $\le 300\text{ ms}$ untuk endpoint transaksional.
  * Tampilan kasir tetap responsif (*zero-lag input*) saat memilih puluhan opsi varian mobil dan kaca film.
* **Kompatibilitas Tampilan:**
  * Dioptimalkan untuk layar Desktop (1920x1080 & 1366x768) serta Tablet iPad/Android untuk frontliner kasir.
  * Dukungan CSS `@media print` presisi tanpa sidebar untuk cetak invoice dan kartu garansi.

---

## 7. Roadmap Pengembangan & Kriteria Penerimaan (Acceptance Criteria)

* [x] **Fase 1 (Core POS & Master Data):** Matriks harga mobil, POS Kasir, Kalender Booking, Cetak Nota.
* [x] **Fase 2 (Inventory & Warranty Engine):** Integrasi pemotongan stok otomatis, sistem garansi digital, audit log stok opname.
* [x] **Fase 3 (Finance Hub):** Pelunasan piutang, refund flow, komisi sales, pengaturan HPP modal.
* [x] **Fase 4 (Owner BI & Financial Metrics):** Dashboard Laba Rugi, Arus Kas, Pencatatan Beban, Kerugian Komplain.
* [x] **Fase 5 (Security & Governance):** Two-man rule deletion request approval, audit trail perubahaan, broadcast release notes.
* [ ] **Fase 6 (Ekspansi Selanjutnya):** Integrasi payment gateway otomatis (Xendit/Midtrans) & Notifikasi WhatsApp otomatis ke pelanggan via Cloud API.
