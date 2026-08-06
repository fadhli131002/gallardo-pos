/**
 * inventory.controller.js
 * Mengelola data inventaris dan log stok untuk dashboard admin.
 */
const prisma = require('../../config/db');

// GET /api/inventory — semua data inventaris (admin)
const getInventory = async (req, res, next) => {
  try {
    const { branch, kategori } = req.query;
    const where = {};
    if (branch)   where.branch   = branch;
    if (kategori) where.kategori = kategori;

    const items = await prisma.inventory.findMany({
      where,
      orderBy: [{ kategori: 'asc' }, { brand: 'asc' }]
    });

    // Tandai item yang stoknya menipis
    const itemsWithFlag = items.map(item => ({
      ...item,
      is_low_stock: item.stok_utama <= item.min_stok
    }));

    const lowStockCount = itemsWithFlag.filter(i => i.is_low_stock).length;

    res.json({
      success: true,
      data: itemsWithFlag,
      summary: {
        total: items.length,
        low_stock_count: lowStockCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/inventory/low-stock — peringatan stok menipis untuk alert admin dashboard
const getLowStockAlert = async (req, res, next) => {
  try {
    const all = await prisma.inventory.findMany();
    const lowStock = all.filter(i => i.stok_utama <= i.min_stok);

    res.json({
      success: true,
      alert: lowStock.length > 0,
      count: lowStock.length,
      items: lowStock.map(i => ({
        id:          i.id,
        label:       `${i.brand} ${i.varian}`.trim(),
        kategori:    i.kategori,
        stok_utama:  i.stok_utama,
        min_stok:    i.min_stok,
        satuan:      i.satuan,
        branch:      i.branch
      }))
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/inventory/logs — riwayat pengurangan / penambahan stok
const getInventoryLogs = async (req, res, next) => {
  try {
    const { inventory_id, limit = 100 } = req.query;
    const where = {};
    if (inventory_id) where.inventory_id = inventory_id;

    const logs = await prisma.inventoryLog.findMany({
      where,
      include: {
        inventory: true,
        transaction: {
          include: { items: true }
        }
      },
      orderBy: { created_at: 'desc' },
      take: parseInt(limit)
    });

    res.json({ success: true, data: logs });
  } catch (error) {
    next(error);
  }
};

// PUT /api/inventory/:id — update stok manual (restock oleh admin)
const updateInventoryStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      stok_utama, stok_pecahan, min_stok, keterangan, harga_modal,
      kategori, brand, varian, kegelapan, satuan, konversi: konversi_body
    } = req.body;
    const { name: adminName } = req.user || {};

    const existing = await prisma.inventory.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });
    }

    let konversi = konversi_body !== undefined ? konversi_body : (existing.konversi || 1);
    if ((kategori || existing.kategori) === 'Kaca Film') konversi = 30;
    else if ((kategori || existing.kategori) === 'PPF') konversi = 15;

    const oldBase = (existing.stok_utama * existing.konversi) + existing.stok_pecahan;
    const newUtama   = stok_utama   !== undefined ? stok_utama   : existing.stok_utama;
    const newPecahan = stok_pecahan !== undefined ? stok_pecahan : existing.stok_pecahan;
    const newBase    = (newUtama * konversi) + newPecahan;
    const delta      = newBase - oldBase;

    const updated = await prisma.inventory.update({
      where: { id },
      data: {
        stok_utama:   newUtama,
        stok_pecahan: newPecahan,
        ...(kategori !== undefined && { kategori }),
        ...(brand !== undefined && { brand }),
        ...(varian !== undefined && { varian }),
        ...(kegelapan !== undefined && { kegelapan }),
        ...(satuan !== undefined && { satuan }),
        ...(konversi_body !== undefined && { konversi: konversi }),
        ...(min_stok !== undefined && { min_stok }),
        ...(harga_modal !== undefined && { harga_modal: Number(harga_modal) }),
        updated_at: new Date()
      }
    });

    // Catat log restock
    if (delta !== 0) {
      await prisma.inventoryLog.create({
        data: {
          inventory_id: id,
          jenis:        delta > 0 ? 'RESTOCK' : 'ADJUST',
          jumlah:       Math.abs(delta),
          stok_sebelum: oldBase,
          stok_sesudah: newBase,
          keterangan:   keterangan || `Manual ${delta > 0 ? 'restock' : 'adjustment'} oleh ${adminName || 'Admin'}`
        }
      });
    }

    res.json({
      success: true,
      message: 'Stok berhasil diperbarui.',
      data: { ...updated, is_low_stock: updated.stok_utama <= updated.min_stok }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/inventory — tambah item inventaris baru
const createInventoryItem = async (req, res, next) => {
  try {
    const { kategori, brand, varian, kegelapan, stok_utama, stok_pecahan, satuan, branch, konversi, min_stok, harga_modal } = req.body;
    
    const count = await prisma.inventory.count();
    const newId = `INV-${String(count + 1).padStart(3, '0')}`;

    const created = await prisma.inventory.create({
      data: {
        id:           newId,
        kategori,
        brand,
        varian,
        kegelapan:    kegelapan || null,
        stok_utama:   Number(stok_utama) || 0,
        stok_pecahan: Number(stok_pecahan) || 0,
        satuan:       satuan || 'Roll',
        branch:       branch || 'Gallardo',
        konversi:     kategori === 'Kaca Film' ? 30 : (kategori === 'PPF' ? 15 : (Number(konversi) || 1)),
        min_stok:     Number(min_stok) || 2,
        harga_modal:  harga_modal ? Number(harga_modal) : 0
      }
    });

    res.json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/inventory/:id — hapus item inventaris
const deleteInventoryItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.inventory.delete({ where: { id } });
    res.json({ success: true, message: 'Item berhasil dihapus.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInventory, getLowStockAlert, getInventoryLogs, updateInventoryStock, createInventoryItem, deleteInventoryItem };
