/**
 * transaction.controller.js
 * Handles CRUD for POS transactions.
 * createTransaction now uses prisma.$transaction for atomic stock deduction.
 */
const prisma = require('../../config/db');
const { createAuditLog } = require('../audit/audit.controller');

// ──────────────────────────────────────────────
// GET  /api/transactions
// ──────────────────────────────────────────────
const getTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) },
      include: {
        items: true,
        payments: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

const getPublicTransactionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let dbId = parseInt(id);
    if (isNaN(dbId)) {
      if (typeof id === 'string' && id.includes('-')) {
        const parts = id.split('-');
        dbId = parseInt(parts[parts.length - 1], 10);
      }
    }

    if (isNaN(dbId)) {
       return res.status(400).json({ message: 'Format ID Transaksi tidak valid' });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: dbId },
      include: {
        items: true,
        payments: true
      }
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Invoice tidak ditemukan' });
    }

    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const { role, user_id, id } = req.user || {};
    const userId = parseInt(user_id || id);

    let transactions;
    if (role === 'sales' || role === 'sales_team') {
      // Remove 'Sales', 'Team' etc from name to match event
      const baseName = (req.user?.name || '').replace(/\s*(sales|team|internal|admin)\s*/gi, '').trim();

      transactions = await prisma.transaction.findMany({
        where: {
          sales_id: userId
        },
        include: { payments: true, items: true, complaints: true },
        orderBy: { created_at: 'desc' }
      });
    } else {
      // Admin / Finance sees all
      transactions = await prisma.transaction.findMany({
        include: { payments: true, items: true, complaints: true },
        orderBy: { created_at: 'desc' }
      });
    }

    res.json({ success: true, data: transactions || [] });
  } catch (error) {
    next(error);
  }
};

const getDuplicateTransactions = async (req, res, next) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        items: true
      },
      orderBy: { created_at: 'desc' }
    });

    const notifications = await prisma.notification.findMany({
      where: { type: 'DUPLICATE_WARNING' }
    });
    const warnedTrxIds = new Set(notifications.map(n => n.transaction_id));

    const users = await prisma.user.findMany({
      select: { id: true, name: true, username: true }
    });
    const userMap = new Map(users.map(u => [u.id, u.name]));

    const plateGroups = {};
    const custGroups = {};

    transactions.forEach(t => {
      const d = new Date(t.created_at);
      const dayStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      
      const rawPlate = (t.plate_number || '').trim().toUpperCase().replace(/\s+/g, '');
      if (rawPlate && rawPlate !== '-' && rawPlate !== 'B1234XYZ') {
        const key = `${dayStr}___PLATE___${rawPlate}`;
        if (!plateGroups[key]) plateGroups[key] = [];
        plateGroups[key].push(t);
      }

      const rawName = (t.customer_name || '').trim().toLowerCase();
      const rawPhone = (t.customer_phone || '').trim().replace(/[^0-9]/g, '');
      const isGenericName = !rawName || rawName === '-' || rawName.includes('pelanggan umum');
      const isGenericPhone = !rawPhone || rawPhone === '-' || rawPhone.length < 5;

      if (!isGenericName && !isGenericPhone) {
        const key = `${dayStr}___CUST___${rawName}___${rawPhone}`;
        if (!custGroups[key]) custGroups[key] = [];
        custGroups[key].push(t);
      }
    });

    const duplicateGroups = [];
    const duplicateTrxIdSet = new Set();
    const processedGroupTrxSets = [];

    const addGroup = (key, list, reasonText) => {
      if (list.length < 2) return;
      
      const ids = list.map(x => x.id).sort().join(',');
      if (processedGroupTrxSets.includes(ids)) return;
      processedGroupTrxSets.push(ids);

      const enrichedTransactions = list.map(t => {
        duplicateTrxIdSet.add(t.id);
        const salesName = t.event || userMap.get(t.sales_id) || 'Sales Team';
        return {
          id: t.id,
          formattedId: `TRX-DB-${t.id}`,
          customerName: t.customer_name || 'Pelanggan Umum',
          customerPhone: t.customer_phone || '-',
          plateNumber: t.plate_number || '-',
          carBrand: t.car_brand || '-',
          carModel: t.car_model || '-',
          serviceType: t.type || 'WORKSHOP',
          items: t.items?.map(i => i.product_name).join(', ') || '-',
          totalAmount: t.total_amount || 0,
          statusPembayaran: t.status_pembayaran || 'Proses',
          sisaTagihan: t.sisa_tagihan || 0,
          date: t.created_at,
          salesId: t.sales_id,
          salesName: salesName,
          warningSent: warnedTrxIds.has(t.id)
        };
      });

      duplicateGroups.push({
        groupKey: key,
        reason: reasonText,
        transactions: enrichedTransactions
      });
    };

    for (const [key, list] of Object.entries(plateGroups)) {
      const [day, , plate] = key.split('___');
      addGroup(key, list, `Plat Nomor Sama (${plate}) pada tanggal ${day}`);
    }

    for (const [key, list] of Object.entries(custGroups)) {
      const [day, , name, phone] = key.split('___');
      addGroup(key, list, `Nama & No HP Sama (${name.toUpperCase()} - ${phone}) pada tanggal ${day}`);
    }

    res.json({
      success: true,
      hasDuplicates: duplicateGroups.length > 0,
      totalDuplicates: duplicateTrxIdSet.size,
      duplicateGroups,
      duplicateTransactionIds: Array.from(duplicateTrxIdSet)
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// POST /api/transactions
// Menggunakan prisma.$transaction agar pembuatan
// transaksi + pengurangan stok berjalan atomik.
// Jika stok kurang → seluruh operasi di-rollback.
// ──────────────────────────────────────────────
const createTransaction = async (req, res, next) => {
  try {
    const { user_id, id: tokenId, name: loggedInName } = req.user || {};
    const userId = parseInt(user_id || tokenId);

    const {
      type,
      total_amount,
      discount = 0,
      sisa_tagihan,
      status_pembayaran,
      items = [],
      customer_name,
      customer_phone,
      event,           // nama sales/PIC yang bertugas (dari field Event di POS)
      inventory_items, // [{ inventory_id, quantity }] — opsional, hanya untuk retail
      payment_type,
      payment_method,
      termin_schedule,
      notes,
      customer_address,
      car_brand,
      car_model,
      car_color,
      plate_number,
      chassis_number,
      engine_number,
      car_year,
      installation_date,
      installation_time,
      payment_proof,
      branch         // Cabang tempat order dibuat (Gallardo / New Ratu)
    } = req.body;

    const transactionType = type
      ? type.toUpperCase()
      : ((customer_name && customer_name.toLowerCase().includes('pelanggan umum')) ? 'RETAIL' : 'WORKSHOP');

    // Fallback event: strip " Sales" dari nama login jika tidak dikirim
    const salesEvent = event
      || (loggedInName ? loggedInName.replace(/\s*sales\s*/gi, '').trim() : null);

    // ── Jalankan dalam satu Prisma Transaction (atomik) ──────────────────
    const result = await prisma.$transaction(async (tx) => {

      // 1. Validasi & potong stok inventaris (jika ada inventory_items di payload)
      const stockLogs = [];

      if (Array.isArray(inventory_items) && inventory_items.length > 0) {
        for (const invItem of inventory_items) {
          let { inventory_id, quantity, is_ppf, ukuran_potongan_ppf, peruntukan_potongan_ppf } = invItem;
          if (!inventory_id || !quantity) continue;

          // Ambil data produk dari DB
          const product = await tx.inventory.findUnique({
            where: { id: inventory_id }
          });

          if (!product) {
            throw new Error(`Produk dengan ID ${inventory_id} tidak ditemukan di inventaris!`);
          }

          if (is_ppf) {
            if (!ukuran_potongan_ppf || !peruntukan_potongan_ppf) {
              throw new Error("Pilihan ukuran dan peruntukan potongan PPF wajib disertakan.");
            }
            
            // Cari data master potongan matrix secara spesifik (harus 100% cocok)
            let ppfMaster = await tx.masterPotonganPPF.findFirst({
              where: { ukuranKendaraan: ukuran_potongan_ppf, peruntukan: peruntukan_potongan_ppf }
            });

            if (!ppfMaster) {
              throw new Error(`Master data potongan untuk kombinasi '${ukuran_potongan_ppf}' dan '${peruntukan_potongan_ppf}' tidak ditemukan di database. Pastikan data tidak terhapus.`);
            }
            
            // potonganCm: jika terinput <= 50 (misal 15 atau 17), berarti dalam satuan meter -> ubah ke cm
            let cmValue = ppfMaster.potonganCm;
            if (cmValue <= 50) {
              cmValue = cmValue * 100;
            }
            // potonganCm dibagi 100 untuk menjadi satuan meter dasar
            quantity = (cmValue / 100) * quantity;
          }

          // Hitung total stok dalam satuan dasar (meter/ml/pcs)
          let konversi = product.konversi || 1;
          if (product.kategori === 'Kaca Film') konversi = 30;
          else if (product.kategori === 'PPF') konversi = 15;
          const totalBaseStock = (product.stok_utama * konversi) + product.stok_pecahan;

          // ── Validasi kecukupan stok ───────────────────────────────────
          if (totalBaseStock < quantity) {
            throw new Error(
              `Stok produk "${product.brand} ${product.varian}" tidak mencukupi! ` +
              `Stok tersisa: ${product.stok_utama} ${product.satuan} ` +
              `(${totalBaseStock} satuan dasar), dibutuhkan: ${quantity} satuan dasar.`
            );
          }

          // ── Rumus Stok Baru = Stok Saat Ini - Qty Terjual ────────────
          const newTotalBase   = Math.round((totalBaseStock - quantity) * 100) / 100;
          const newStokUtama   = Math.floor(newTotalBase / konversi);
          const newStokPecahan = Math.round((newTotalBase % konversi) * 100) / 100;

          // Update stok di DB
          await tx.inventory.update({
            where: { id: inventory_id },
            data: {
              stok_utama:   newStokUtama,
              stok_pecahan: newStokPecahan,
              updated_at:   new Date()
            }
          });

          // Simpan log untuk ditulis setelah transaksi terbentuk
          stockLogs.push({
            inventory_id,
            jenis:        'DEDUCT',
            jumlah:       quantity,
            stok_sebelum: totalBaseStock,
            stok_sesudah: newTotalBase,
            keterangan:   `Penjualan POS — customer: ${customer_name || 'Umum'}`
          });
        }
      }

      // 2. Buat transaksi utama
      let finalSisaTagihan = sisa_tagihan;
      let finalStatusPembayaran = status_pembayaran || 'Proses';
      let finalPaymentType = payment_type || null;

      if (payment_method === 'Penawaran') {
        finalStatusPembayaran = 'Penawaran';
        finalPaymentType = 'Penawaran';
        finalSisaTagihan = total_amount;
      }

      const newTransaction = await tx.transaction.create({
        data: {
          sales_id:          userId,
          type:              transactionType,
          customer_name:     customer_name || null,
          customer_phone:    customer_phone || null,
          total_amount,
          discount,
          sisa_tagihan:      finalSisaTagihan,
          status_pembayaran: finalStatusPembayaran,
          event:             salesEvent || null,
          payment_type:      finalPaymentType,
          payment_method:    payment_method || null,
          termin_schedule:   termin_schedule ? JSON.stringify(termin_schedule) : null,
          notes:             notes || null,
          customer_address:  customer_address || null,
          car_brand:         car_brand || null,
          car_model:         car_model || null,
          car_color:         car_color || null,
          plate_number:      plate_number || null,
          chassis_number:    chassis_number || null,
          engine_number:     engine_number || null,
          car_year:          car_year || null,
          installation_date: installation_date || null,
          installation_time: installation_time || null,
          branch:            branch || 'Gallardo',
          items: {
            create: items.map(item => ({
              product_name: item.product_name,
              product_note: item.product_note || null,
              price:        item.price        || 0,
              quantity:     item.quantity     || 1
            }))
          },
          ...(total_amount > finalSisaTagihan ? {
            payments: {
              create: [{
                amount: total_amount - finalSisaTagihan,
                method: payment_method || 'Tunai / Cash',
                notes: 'Pembayaran Awal',
                payment_proof: payment_proof || null
              }]
            }
          } : {})
        },
        include: { items: true, payments: true }
      });

      // 3. Tulis inventory logs (non-blocking, tapi masih di dalam tx)
      if (stockLogs.length > 0) {
        await tx.inventoryLog.createMany({
          data: stockLogs.map(log => ({
            ...log,
            transaction_id: newTransaction.id
          }))
        });
      }

      // 4. Catat Cash Flow jika ada pembayaran di awal
      if (total_amount > sisa_tagihan) {
        const paidAmount = total_amount - sisa_tagihan;
        await tx.cashFlowLog.create({
          data: {
            type: 'IN',
            amount: paidAmount,
            description: `Pembayaran Transaksi POS (${customer_name || 'Umum'})`,
            referenceId: `TRX-${newTransaction.id}`,
            transaction_id: newTransaction.id
          }
        });
      }

      return newTransaction;
    });
    // ─────────────────────────────────────────────────────────────────────

    // Cek apakah ada stok menipis setelah transaksi selesai (untuk alert admin)
    const lowStockItems = await prisma.inventory.findMany({
      where: {
        stok_utama: { lte: prisma.inventory.fields.min_stok }
      }
    }).catch(() => []); // graceful: jika query gagal, abaikan

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil diproses dan stok admin telah diperbarui.',
      data: result,
      lowStockWarning: lowStockItems.length > 0
        ? lowStockItems.map(i => `${i.brand} ${i.varian} (sisa: ${i.stok_utama} ${i.satuan})`)
        : []
    });
  } catch (error) {
    // Error dari validasi stok akan ditangkap di sini → 400
    if (error.message && error.message.includes('tidak mencukupi')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// ──────────────────────────────────────────────
// DELETE /api/transactions/:id
// ──────────────────────────────────────────────
const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const actor = req.user || {};

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
    }

    // ── Audit Trail: catat pembatalan invoice ──────────────────────────
    await createAuditLog({
      userId: parseInt(actor.user_id || actor.id || 0),
      userName: actor.name || 'Unknown',
      action: 'CANCEL_INVOICE',
      targetType: 'Transaction',
      targetId: parseInt(id),
      reason: reason || 'Tidak ada alasan diberikan',
      oldValue: {
        status_pembayaran: transaction.status_pembayaran,
        total_amount: transaction.total_amount,
        sisa_tagihan: transaction.sisa_tagihan,
        customer_name: transaction.customer_name,
      },
      newValue: { status: 'DELETED' },
    });

    // Hapus dependencies manual sebelum menghapus transaksi
    await prisma.transactionItem.deleteMany({ where: { transaction_id: parseInt(id) } });
    await prisma.payment.deleteMany({ where: { transaction_id: parseInt(id) } });
    await prisma.cashFlowLog.deleteMany({ 
      where: { 
        OR: [
          { referenceId: `TRX-${id}` },
          { referenceId: String(id) },
          { transaction_id: parseInt(id) }
        ]
      } 
    });
    await prisma.inventoryLog.deleteMany({ where: { transaction_id: parseInt(id) } });
    await prisma.transaction.delete({ where: { id: parseInt(id) } });

    res.json({ success: true, message: 'Transaksi berhasil dihapus' });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PATCH /api/transactions/:id/pay
// ──────────────────────────────────────────────
const updatePaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paid_amount, amount, payment_method, notes, payment_proof } = req.body;
    
    // Ambil nilai amount (support req.body.amount atau req.body.paid_amount)
    const rawAmount = amount !== undefined ? amount : paid_amount;
    const cleanAmount = Number(rawAmount.toString().replace(/\D/g, ''));

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
    }

    const previousPaid = transaction.total_amount - transaction.sisa_tagihan;
    const totalPaid = previousPaid + cleanAmount;
    const sisaTagihan = Math.max(0, transaction.total_amount - totalPaid);

    let newStatus = transaction.status_pembayaran;
    let newPaymentType = transaction.payment_type;
    
    if (sisaTagihan <= 0) {
      newStatus = 'Lunas';
      newPaymentType = 'Lunas';
    } else {
      // Biarkan status Belum Bayar atau ubah jadi Cicilan/DP
      newStatus = newStatus === 'Belum Bayar' ? 'Belum Bayar' : newStatus;
      newPaymentType = newPaymentType === 'Belum Bayar' ? 'Belum Bayar' : newPaymentType;
      // You can also enforce it to 'Cicilan' or 'DP' as per user's preference, but let's keep it as is unless it's strictly required
      if (newStatus === 'Belum Bayar') {
        newStatus = 'DP / Sebagian';
        newPaymentType = 'DP / Sebagian';
      }
    }

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        sisa_tagihan: sisaTagihan,
        status_pembayaran: newStatus,
        payment_type: newPaymentType,
      }
    });

    // Add payment history
    await prisma.payment.create({
      data: {
        transaction_id: parseInt(id),
        amount: cleanAmount,
        method: payment_method || 'Tunai / Cash',
        notes: notes || null,
        payment_proof: payment_proof || null
      }
    });

    // Catat ke Cash Flow
    if (cleanAmount > 0) {
      await prisma.cashFlowLog.create({
        data: {
          type: 'IN',
          amount: cleanAmount,
          description: `Pembayaran/Cicilan Transaksi POS (${transaction.customer_name || 'Umum'})`,
          referenceId: `TRX-${id}`,
          transaction_id: parseInt(id)
        }
      });
    }

    res.json({ success: true, message: 'Pembayaran berhasil', data: updated });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/transactions/:id
// ──────────────────────────────────────────────
const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      customer_name,
      customer_phone,
      customer_address,
      car_brand,
      car_model,
      car_color,
      plate_number,
      chassis_number,
      engine_number,
      car_year,
      installation_date,
      installation_time,
      notes,
      event,
      status_pembayaran,
      payment_type,
      type,
      payment_method,
      created_at
    } = req.body;

    const existingTx = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingTx) {
      return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
    }

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        customer_name: customer_name !== undefined ? customer_name : existingTx.customer_name,
        customer_phone: customer_phone !== undefined ? customer_phone : existingTx.customer_phone,
        customer_address: customer_address !== undefined ? customer_address : existingTx.customer_address,
        car_brand: car_brand !== undefined ? car_brand : existingTx.car_brand,
        car_model: car_model !== undefined ? car_model : existingTx.car_model,
        car_color: car_color !== undefined ? car_color : existingTx.car_color,
        plate_number: plate_number !== undefined ? plate_number : existingTx.plate_number,
        chassis_number: chassis_number !== undefined ? chassis_number : existingTx.chassis_number,
        engine_number: engine_number !== undefined ? engine_number : existingTx.engine_number,
        car_year: car_year !== undefined ? car_year : existingTx.car_year,
        installation_date: installation_date !== undefined ? installation_date : existingTx.installation_date,
        installation_time: installation_time !== undefined ? installation_time : existingTx.installation_time,
        notes: notes !== undefined ? notes : existingTx.notes,
        event: event !== undefined ? event : existingTx.event,
        status_pembayaran: status_pembayaran !== undefined ? status_pembayaran : existingTx.status_pembayaran,
        payment_type: payment_type !== undefined ? payment_type : existingTx.payment_type,
        type: type !== undefined ? type : existingTx.type,
        payment_method: payment_method !== undefined ? payment_method : existingTx.payment_method,
        created_at: created_at ? new Date(created_at) : existingTx.created_at,
      }
    });

    res.json({ success: true, message: 'Transaksi berhasil diupdate', data: updated });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// PUT /api/transactions/:id/price
// ──────────────────────────────────────────────
const updateTransactionPrice = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { items, total_amount } = req.body;
    const actor = req.user || {};

    const existingTx = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: { items: true }
    });

    if (!existingTx) {
      return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
    }

    // ── Audit Trail: catat perubahan harga ────────────────────────────
    await createAuditLog({
      userId: parseInt(actor.user_id || actor.id || 0),
      userName: actor.name || 'Unknown',
      action: 'EDIT_PRICE',
      targetType: 'Transaction',
      targetId: parseInt(id),
      reason: 'Edit harga via menu transaksi',
      oldValue: { total_amount: existingTx.total_amount, sisa_tagihan: existingTx.sisa_tagihan },
      newValue: { total_amount },
    });

    // Update the items
    for (const item of items) {
      if (item.id) {
        await prisma.transactionItem.update({
          where: { id: item.id },
          data: { price: item.price }
        });
      }
    }

    const paidAmount = existingTx.total_amount - existingTx.sisa_tagihan;
    const newSisaTagihan = Math.max(0, total_amount - paidAmount);

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        total_amount: total_amount,
        sisa_tagihan: newSisaTagihan
      }
    });

    res.json({ success: true, message: 'Harga transaksi berhasil diupdate', data: updated });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────
// PUT /api/transactions/:id/payment-status-manual
// ────────────────────────────────────────
const updatePaymentStatusManual = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_type, sisa_tagihan, reason } = req.body;
    const actor = req.user || {};

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });
    }

    const cleanSisaTagihan = Number(sisa_tagihan);

    // ── Audit Trail: catat perubahan status pembayaran manual ─────────
    if (payment_type === 'Lunas' || cleanSisaTagihan !== transaction.sisa_tagihan) {
      await createAuditLog({
        userId: parseInt(actor.user_id || actor.id || 0),
        userName: actor.name || 'Unknown',
        action: payment_type === 'Lunas' ? 'MARK_PAID' : 'EDIT_DISCOUNT',
        targetType: 'Transaction',
        targetId: parseInt(id),
        reason: reason || 'Ubah status pembayaran manual',
        oldValue: { payment_type: transaction.payment_type, sisa_tagihan: transaction.sisa_tagihan, status_pembayaran: transaction.status_pembayaran },
        newValue: { payment_type, sisa_tagihan: cleanSisaTagihan },
      });
    }

    const updated = await prisma.transaction.update({
      where: { id: parseInt(id) },
      data: {
        payment_type: payment_type,
        sisa_tagihan: cleanSisaTagihan,
        ...(payment_type === 'Lunas' ? { status_pembayaran: 'Selesai' } : {})
      }
    });

    res.json({ success: true, message: 'Status pembayaran berhasil diubah manual', data: updated });
  } catch (error) {
    next(error);
  }
};

const processPaymentBalance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { paymentMethod, additionalDiscount, amount_paid, payment_proof, notes } = req.body;
    const discount = Number(additionalDiscount) || 0;

    const transaction = await prisma.transaction.findUnique({
      where: { id: Number(id) }
    });

    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });
    if (transaction.status_pembayaran === 'LUNAS' && transaction.sisa_tagihan <= 0) {
      return res.status(400).json({ message: 'Tagihan sudah lunas' });
    }

    // Recalculate real sisa tagihan in case it's bugged as 0 in DB
    const payments = await prisma.payment.findMany({ where: { transaction_id: Number(id) } });
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    let realSisa = Math.max(0, transaction.total_amount - totalPaid);

    let currentSisa = Math.round(transaction.sisa_tagihan);
    if (currentSisa <= 0 && realSisa > 0) {
        currentSisa = Math.round(realSisa);
    }

    if (realSisa <= 0) {
        // Data is corrupted: payment history covers total amount, but status is not Lunas. Auto-correct it!
        await prisma.transaction.update({
            where: { id: Number(id) },
            data: { sisa_tagihan: 0, status_pembayaran: 'LUNAS', payment_type: 'Lunas' }
        });
        return res.json({ message: 'Pelunasan berhasil (Sistem otomatis memperbaiki status karena tagihan telah dibayar lunas sebelumnya)', actualPayment: 0 });
    }

    const maxPayable = currentSisa - Math.round(discount);
    const actualPayment = amount_paid !== undefined ? Math.round(Number(amount_paid)) : maxPayable;

    if (isNaN(actualPayment) || actualPayment < 0 || actualPayment > maxPayable) {
      return res.status(400).json({ 
        message: 'Nominal pembayaran tidak valid', 
        debug: { actualPayment, maxPayable, currentSisa, realSisa, discount, amount_paid } 
      });
    }

    const actor = req.user || {};
    const newSisaFinal = (currentSisa - discount) - actualPayment;
    const isLunasFinal = newSisaFinal <= 0;

    // ── Audit Trail: catat pelunasan atau cicilan ──────────────────────
    await createAuditLog({
      userId: parseInt(actor.user_id || actor.id || 0),
      userName: actor.name || 'Unknown',
      action: isLunasFinal ? 'MARK_PAID' : 'EDIT_DISCOUNT',
      targetType: 'Transaction',
      targetId: Number(id),
      reason: discount > 0 ? `Pelunasan dengan diskon Rp${discount}` : 'Pelunasan/cicilan sisa tagihan',
      oldValue: { sisa_tagihan: transaction.sisa_tagihan, status_pembayaran: transaction.status_pembayaran },
      newValue: { sisa_tagihan: Math.max(0, newSisaFinal), status_pembayaran: isLunasFinal ? 'LUNAS' : 'DP' },
    });

    await prisma.$transaction(async (tx) => {
      const currentAdditional = transaction.additional_discount || 0;
      const newSisa = maxPayable - actualPayment;
      const isLunas = newSisa <= 0;

      await tx.transaction.update({
        where: { id: Number(id) },
        data: {
          sisa_tagihan: newSisa,
          status_pembayaran: isLunas ? 'LUNAS' : 'DP',
          payment_type: isLunas ? 'Lunas' : 'DP / Sebagian',
          additional_discount: currentAdditional + discount
        }
      });

      if (actualPayment > 0) {
        await tx.payment.create({
          data: {
            transaction_id: Number(id),
            amount: actualPayment,
            method: paymentMethod || 'CASH',
            notes: notes || (discount > 0 ? `Pelunasan dengan diskon Rp${discount}` : 'Pelunasan sisa tagihan'),
            payment_proof: payment_proof || null
          }
        });

        await tx.cashFlowLog.create({
          data: {
            type: 'IN',
            amount: actualPayment,
            description: `Pelunasan piutang TRX-${id} (${transaction.customer_name})`,
            referenceId: `TRX-${id}`,
            transaction_id: Number(id)
          }
        });
      }
    });

    res.json({ message: 'Pelunasan berhasil diproses', actualPayment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTransactions,
  getDuplicateTransactions,
  getTransactionById,
  getPublicTransactionById,
  createTransaction,
  deleteTransaction,
  updatePaymentStatus,
  updatePaymentStatusManual,
  updateTransaction,
  updateTransactionPrice,
  processPaymentBalance
};
