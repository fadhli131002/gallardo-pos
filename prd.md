Berikut adalah dokumen **Project Requirements Document (PRD)** yang telah diperbarui dengan menyisipkan fitur **Sistem Manajemen Inventaris & Pelacakan Stok Otomatis** pada poin baru (**Poin 3.4**), lengkap dengan aturan integrasi *POS-to-Inventory* yang presisi.

---

# PRD — Project Requirements Document

## Proyek: Sistem POS & Manajemen Operasional Bengkel (Gallardo Auto Sport)

## 1. Overview

### 1.1 Latar Belakang

Bengkel Gallardo Auto Sport merupakan penyedia layanan otomotif premium yang mengelola berbagai brand dengan spesialisasi berbeda, yaitu Kaca Film (Deluxe, Performante), Coating (Rantiz), dan PPF (Vansgard). Kompleksitas operasional saat ini mencakup penentuan harga komparatif berdasarkan ukuran kendaraan (Small, Medium, Large, XL/Luxury), variasi bagian pemasangan (SKKB vs Kaca Depan), pelacakan inventaris (roll dan botol), penelusuran garansi pelanggan berbasis data spesifik kendaraan, serta kebutuhan pelaporan multi-divisi.

### 1.2 Tujuan Utama

Membangun platform Point of Sale (POS) dan sistem manajemen bengkel berbasis web yang memfasilitasi pencatatan order multi-brand secara fleksibel, integrasi data inventaris real-time, manajemen garansi terpusat, serta penyajian metrik performa toko yang dikhususkan untuk tiga peran pengguna: Admin, Sales, dan Finance.

---

## 2. Requirements & User Roles

### 2.1 Aksesibilitas Sistem

* **Aplikasi Berbasis Web:** Dioptimalkan untuk penggunaan pada Desktop/Laptop guna memudahkan input data manual yang mendetail oleh Admin, Sales, dan Finance.

### 2.2 Hak Akses Pengguna (User Roles)

1. **Dashboard Admin:** Pusat kontrol operasional penuh, monitoring status workshop (kapasitas slot), manajemen produk/master data, pencatatan check-in kendaraan, analitik komprehensif, serta **Manajemen Inventaris & Stok Barang (CRUD)**.
2. **Dashboard Sales:** Berfokus pada aktivitas penjualan, pengelolaan prospek/data customer baru, pembuatan booking/order lewat POS Cashier, dan sistem kalender penjadwalan (booking slot).
3. **Dashboard Finance:** Berfokus pada arus kas, validasi pembayaran (DP, Pelunasan, Piutang), penerbitan invoice, manajemen refund, dan grafik cash flow.

### 2.3 Batasan Data Operasional & Estimasi Waktu Kerja

Sistem wajib mengunci durasi estimasi pengerjaan default per jenis layanan sebagai berikut untuk keperluan sistem booking slot:

* **Kaca Film (Deluxe & Performante):** 3 Jam
* **Coating (Rantiz):** Minimal 1 Hari, Maksimal 2 Hari (Tergantung tingkat kesulitan/kondisi)
* **PPF (Vansgard):** 7 Hari (1 Minggu)
* **Klasifikasi Ukuran Kendaraan:** Setiap penentuan harga layanan dan produk wajib dikategorikan ke dalam 4 tipe ukuran: Small Car, Medium Car, Large Car, dan XL / Luxury Car.
* **Satuan Stok:** Kaca Film & PPF dicatat dalam satuan Roll, sedangkan Coating serta cairan pendukung kimia dicatat dalam satuan Botol.

---

## 3. Core Features & Master Product Data

### 3.1 Aturan Matriks Harga & Spesifikasi Layanan

Sistem POS harus mengunci harga otomatis di kasir/order form berdasarkan kombinasi: Brand + Series + Ukuran Mobil + Pilihan Bagian/Paket.

**A. Kategori Kaca Film (Satuan Pengurangan Stok: Roll)**

* **Performante — Iron Black Series (Nano Carbon Polyester)**
* *Pilihan Varian & Kegelapan:* Iron Black 35 (40%), Iron Black 20 (60%), Iron Black 05 (80%)
* *Matriks Harga:*
* Small Car: Rp 225.000 (Depan) / Rp 412.500 (SKKB) / Rp 562.500 (Full)
* Medium Car: Rp 265.000 (Depan) / Rp 487.500 (SKKB) / Rp 675.000 (Full)
* Large Car: Rp 300.000 (Depan) / Rp 600.000 (SKKB) / Rp 825.000 (Full)
* XL Car: Rp 337.500 (Depan) / Rp 675.000 (SKKB) / Rp 937.500 (Full)




* **Performante — Black Stone Series (Nano Carbon Material)**
* *Pilihan Varian & Kegelapan:* Black Stone 70 (20%), Black Stone 35 (40%), Black Stone 20 (60%), Black Stone 05 (80%)
* *Matriks Harga:*
* Small Car: Rp 675.000 (Depan) / Rp 825.000 (SKKB) / Rp 1.425.000 (Full)
* Medium Car: Rp 750.000 (Depan) / Rp 900.000 (SKKB) / Rp 1.575.000 (Full)
* Large Car: Rp 862.500 (Depan) / Rp 1.012.500 (SKKB) / Rp 1.725.000 (Full)
* XL Car: Rp 975.000 (Depan) / Rp 1.125.000 (SKKB) / Rp 1.875.000 (Full)




* **Deluxe — Classich Series (Nano Ceramic Material)**
* *Pilihan Varian & Kegelapan:* Classich 40 (40%), Classich 60 (60%), Classich 80 (80%)
* *Matriks Harga:*
* Small Car: Rp 750.000 (Depan) / Rp 1.162.500 (SKKB) / Rp 1.762.500 (Full)
* Medium Car: Rp 787.500 (Depan) / Rp 1.312.500 (SKKB) / Rp 1.912.500 (Full)
* Large Car: Rp 862.500 (Depan) / Rp 1.425.000 (SKKB) / Rp 2.062.500 (Full)
* XL Car: Rp 937.500 (Depan) / Rp 1.537.500 (SKKB) / Rp 2.287.500 (Full)




* **Deluxe — Jet Black Series (Night Drive Vision Technology)**
* *Pilihan Varian & Kegelapan:* Jet Black 20%, Jet Black 40%, Jet Black 60%, Jet Black 80%
* *Matriks Harga:*
* Small Car: Rp 975.000 (Depan) / Rp 1.350.000 (SKKB) / Rp 2.175.000 (Full)
* Medium Car: Rp 1.125.000 (Depan) / Rp 1.425.000 (SKKB) / Rp 2.437.500 (Full)
* Large Car: Rp 1.200.000 (Depan) / Rp 1.575.000 (SKKB) / Rp 2.625.000 (Full)
* XL Car: Rp 1.275.000 (Depan) / Rp 1.725.000 (SKKB) / Rp 2.850.000 (Full)





### 3.2 Modul Penjadwalan Cerdas & Pembatasan Slot (Anti-Tumpuk)

* **Dashboard Sales** dilengkapi dengan sistem kalender penjadwalan pemasangan.
* **Aturan Validasi Ketersediaan:** Ketika Sales memilih tanggal booking, sistem akan memeriksa kapasitas slot harian di *workshop*. Jika kuota pengerjaan penuh, sistem akan otomatis mengunci/menolak pengerjaan di tanggal tersebut.
* **Pengecualian Blokir:** Tanggal yang penuh bisa terbuka kembali hanya jika Sales atau Admin mengubah status order berjalan di hari tersebut menjadi **Selesai** (artinya mobil sudah keluar dan kapasitas slot kosong kembali).

### 3.3 Modul Data Customer & Garansi Otomatis (Warranty Engine)

Ketika status pesanan dinyatakan Lunas/Selesai melalui modal konfirmasi, sistem membuat kartu garansi digital otomatis terikat pada nomor rangka. Durasi masa aktif:

* Vansgard PPF (Ultra & Matte): 5 Tahun | (Armor & Super Safe): 10 Tahun
* Rantiz Coating 9H+: 1 Tahun | 14H: 3 Tahun | 20H: 5 Tahun
Data kendaraan wajib: `id`, `customer_id`, `brand`, `model`, `plat_nomor`, `no_mesin`, `no_rangka`.

### 3.4 Modul Manajemen Inventaris & Pelacakan Stok Otomatis (Inventory Engine)

Menyediakan modul navigasi **'Inventory & Stok'** di area Admin untuk memantau ketersediaan material workshop serta mengelola pasokan barang masuk secara CRUD terintegrasi dengan POS Cashier.

* **A. Operasional CRUD Inventory (Hak Akses Admin):**
* **Create:** Menambahkan item material baru atau mencatat dokumen stok masuk baru via form modal.
* **Read:** Menampilkan tabel visual ketersediaan barang dengan batas ambang kritis (*Low Stock Warning*) jika stok $\le 2$ unit.
* **Update:** Mengubah identitas barang atau menyesuaikan kuantitas stok berdasarkan stok opname fisik di gudang.
* **Delete:** Menghapus item material dari daftar inventaris aktif dengan validasi keamanan.


* **B. Logika Pemotongan Stok Otomatis (POS Integration):**
Setiap kali transaksi diselesaikan di POS Cashier oleh Sales, sistem memicu pengurangan stok *real-time* di gudang dengan aturan konsumsi bahan 1 kendaraan:
* **Layanan Kaca Film:** Otomatis memotong **1 Roll** stok material Kaca Film terpilih.
* **Layanan Coating:** Otomatis memotong **1 Botol** stok cairan kimia *Coating / Nano Ceramic* terpilih.
* **Layanan PPF (Paint Protection Film):** Bersifat paket gabungan (*Bundling*), otomatis memotong **2 item sekaligus**:
1. **1 Roll** material bahan PPF terpilih.
2. **1 Botol** cairan pelapis dasar **Rantiz 9H** (Kategori *Liquid & Chemical*).





---

## 4. Struktur Dashboard Ruang Kerja (Workspace)

*(Admin memantau total pengerjaan, mengontrol master data dan inventaris; Sales fokus pada kalender penjadwalan booking dan pengisian POS Cashier; Finance memvalidasi DP & Pelunasan serta menentukan target bulanan).*

---

## 5. Tambahan Aturan Logika Bisnis (Untuk API & Database)

### 5.1 Skema Pembayaran & ENUM Database
Pada tabel `payments` atau kolom metode pembayaran di tabel `orders`, tipe data `payment_method` WAJIB menggunakan struktur ENUM berikut ini secara ketat:
`ENUM('QRIS', 'CASH', 'DEBIT', 'KARTU_KREDIT', 'TRANSFER_BANK', 'ONLINE_SHOP', 'FREE_OF_CHARGE')`

**Logika Khusus FREE_OF_CHARGE:**
Jika frontend mengirimkan metode `FREE_OF_CHARGE`, sistem backend harus mengizinkan transaksi tersebut tersimpan dengan status LUNAS (Paid) meskipun nilai uang yang masuk (Nominal Terbayar) adalah 0. Sistem tidak boleh menolak transaksi ini dengan alasan underpayment.


Sales:

username: rosyid, password: rosyidsales123

username: femysales, password: Femysales123

Admin:

username: femyadmin, password: Femyadmin123

username: danieladmin, password: Danieladmin123

Finance:

username: deafinance, password: Deafinance123