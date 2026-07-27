# Product Requirements Document (PRD): Sistem Dashboard Sales & Pengurangan Stok Otomatis Admin (POS-Gallardo)

## 1. Ringkasan Eksekutif & Tujuan

Dokumen ini merinci kebutuhan sistem untuk mengisolasi **Dashboard Sales** secara mutlak agar tidak lagi menampilkan data global admin, serta menerapkan mekanisme **pengurangan stok otomatis terpusat di dashboard admin** setiap kali terjadi transaksi penjualan/pembelian baru oleh sales.

---

## 2. Fitur Utama & Kebutuhan Fungsional

### A. Isolasi dan Fungsionalitas Dashboard Sales

* **Pemisahan Tampilan & Data:** Halaman Dashboard Sales (`/sales/dashboard`) hanya boleh menampilkan metrik, grafik, dan daftar order yang **secara spesifik di-input oleh sales yang sedang aktif login** (berdasarkan pencocokan `event` atau `sales_id`).
* **Metrik Utama Sales:**
* **Total Order:** Jumlah transaksi yang berhasil diselesaikan oleh sales tersebut.
* **Total Customer:** Jumlah pelanggan unik yang terikat pada transaksi sales tersebut.
* **Status Transaksi:** Rekapitulasi jumlah transaksi lunas vs proses milik sales.
* **Grafik *Dynamics of Sales* & Produk Terlaris:** Tren omzet mingguan dan produk terlaris murni dari hasil penjualan sales aktif.


* **Pembatasan Akses (Security Guard):** Akun sales dilarang keras mengakses menu administratif seperti *Data Master & Kategori* (`/admin/vehicle-master`).

### B. Mekanisme Pemotongan Stok Otomatis ke Dashboard Admin

Setiap kali sales menyelesaikan transaksi penjualan (baik layanan *workshop* maupun produk grosir/roll), sistem backend harus langsung mengeksekusi operasi pemotongan stok pada inventaris pusat admin:

* **Rumus Pengurangan Stok:**

$$Stok Baru = Stok Saat Ini - Jumlah Qty Produk yang Terjual$$


* **Pencatatan Log & Peringatan Stok Menipis:**
* Jika stok produk menyentuh batas minimum setelah dikurangi, dashboard admin akan otomatis memicu **Peringatan Stok Menipis** secara *real-time*.
* Data omzet dan pergerakan stok toko di dashboard admin (`/admin/workspace`) akan langsung terakumulasi secara otomatis tanpa jeda.



---

## 3. Spesifikasi Teknis & Arsitektur Backend (Referensi Kode)

### A. Controller Dashboard Sales Terisolasi

```javascript
const getSalesDashboardStats = async (req, res) => {
  try {
    const loggedInUser = req.user.name; // Contoh: "Femy Sales"
    const userId = req.user.id;
    const searchName = loggedInUser ? loggedInUser.replace(/Sales/gi, '').trim() : '';

    // Filter transaksi spesifik milik sales
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { event: { contains: searchName, mode: 'insensitive' } },
          { sales_id: userId }
        ]
      },
      include: { customer: true, items: true }
    });

    const totalOrder = transactions.length;
    const uniqueCustomers = new Set(transactions.map(t => t.customer_phone || t.customer?.phone).filter(Boolean)).size;
    const transaksiLunas = transactions.filter(t => t.payment_status === 'LUNAS').length;
    const transaksiProses = transactions.filter(t => t.payment_status !== 'LUNAS').length;
    const totalOmzet = transactions.reduce((acc, curr) => acc + (curr.grandtotal || 0), 0);

    return res.status(200).json({
      success: true,
      stats: { totalOrder, totalCustomer: uniqueCustomers, transaksiLunas, transaksiProses, totalOmzet },
      transactions
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

```

### B. Logika Pengurangan Stok Otomatis (Transaction & Inventory Handler)

```javascript
const processSalesTransaction = async (req, res) => {
  const { items, customerId, grandtotal, paymentStatus, salesEvent } = req.body;

  try {
    // Gunakan Prisma Transaction untuk menjaga konsistensi data
    const result = await prisma.$transaction(async (tx) => {
      // 1. Buat transaksi baru
      const newTransaction = await tx.transaction.create({
        data: {
          customer_id: customerId,
          grandtotal: grandtotal,
          payment_status: paymentStatus,
          event: salesEvent, // Nama sales yang bertugas
          sales_id: req.user.id
        }
      });

      // 2. Loop item yang dibeli dan kurangi stok inventaris pusat admin
      for (const item of items) {
        const product = await tx.inventory.findUnique({
          where: { id: item.productId }
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`Stok produk ${product ? product.name : 'tidak ditemukan'} tidak mencukupi!`);
        }

        // Eksekusi rumus pengurangan stok
        await tx.inventory.update({
          where: { id: item.productId },
          data: { stock: product.stock - item.quantity }
        });
      }

      return newTransaction;
    });

    return res.status(201).json({
      success: true,
      message: "Transaksi berhasil diproses dan stok admin telah diperbarui.",
      data: result
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

```

---

## 4. Kriteria Keberhasilan (Acceptance Criteria)

* [ ] Dashboard Sales menampilkan data `0` secara bersih ketika belum ada transaksi yang di-input oleh sales tersebut, dan tidak menampilkan data global admin.
* [ ] Setiap transaksi baru yang di-input oleh sales otomatis mengurangi jumlah stok barang di database pusat.
* [ ] Dashboard Admin (`/admin/workspace`) secara otomatis memperbarui grafik omzet dan status peringatan stok berdasarkan hasil pengurangan transaksi sales tersebut secara *real-time*.