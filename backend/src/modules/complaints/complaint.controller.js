const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Set up storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', '..', '..', 'public', 'uploads');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'complaint-' + Date.now() + path.extname(file.originalname));
  }
});

// Init upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images Only!');
    }
  }
}).single('proof_photo');

exports.uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err });
    }
    next();
  });
};

exports.getAllComplaints = async (req, res, next) => {
  try {
    const { status, transaction_id } = req.query;
    let where = {};
    if (status) where.status = status;
    if (transaction_id) where.transaction_id = parseInt(transaction_id);

    const complaints = await prisma.complaint.findMany({
      where,
      include: {
        transaction: {
          select: {
            customer_name: true,
            customer_phone: true,
            car_brand: true,
            car_model: true,
            plate_number: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(complaints);
  } catch (error) {
    next(error);
  }
};

exports.createComplaint = async (req, res, next) => {
  try {
    const { transaction_id, problem_type, description, status, inventory_items } = req.body;
    let proof_photo = null;

    if (!transaction_id || isNaN(parseInt(transaction_id))) {
      return res.status(400).json({ error: 'Data Transaksi tidak valid' });
    }

    if (req.file) {
      proof_photo = `/public/uploads/${req.file.filename}`;
    }

    let inventoryItemsData = [];
    if (inventory_items) {
      try {
        inventoryItemsData = JSON.parse(inventory_items);
      } catch (e) {
        console.error('Failed to parse inventory_items', e);
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const stockLogs = [];

      // 1. Inventory Deduction
      if (Array.isArray(inventoryItemsData) && inventoryItemsData.length > 0) {
        for (const invItem of inventoryItemsData) {
          let { inventory_id, quantity } = invItem;
          if (!inventory_id || !quantity) continue;
          
          quantity = parseFloat(quantity) || 1;

          const product = await tx.inventory.findUnique({
            where: { id: inventory_id }
          });

          if (!product) {
            throw new Error(`Produk dengan ID ${inventory_id} tidak ditemukan di inventaris!`);
          }

          const konversi = product.konversi || 1;
          const totalBaseStock = (product.stok_utama * konversi) + product.stok_pecahan;

          if (totalBaseStock < quantity) {
            throw new Error(
              `Stok produk "${product.brand} ${product.varian}" tidak mencukupi! ` +
              `Stok tersisa: ${product.stok_utama} ${product.satuan} ` +
              `(${totalBaseStock} satuan dasar), dibutuhkan: ${quantity} satuan dasar.`
            );
          }

          const newTotalBase = totalBaseStock - quantity;
          const newStokUtama = Math.floor(newTotalBase / konversi);
          const newStokPecahan = newTotalBase % konversi;

          await tx.inventory.update({
            where: { id: inventory_id },
            data: {
              stok_utama: newStokUtama,
              stok_pecahan: newStokPecahan,
              updated_at: new Date()
            }
          });

          stockLogs.push({
            inventory_id,
            jenis: 'DEDUCT',
            jumlah: quantity,
            stok_sebelum: totalBaseStock,
            stok_sesudah: newTotalBase,
            keterangan: 'Penggunaan Komplain/Garansi'
          });
        }
      }

      // 2. Create Complaint
      const complaint = await tx.complaint.create({
        data: {
          transaction_id: parseInt(transaction_id),
          problem_type,
          description,
          proof_photo,
          status: status || 'Pending'
        }
      });

      // 3. Create Logs
      if (stockLogs.length > 0) {
        await tx.inventoryLog.createMany({
          data: stockLogs.map(log => ({
            ...log,
            // Assuming inventory logs need a reference; complaint doesn't directly link to InventoryLog in schema 
            // but we can link it to the transaction_id or just leave transaction_id null if it's optional.
            // Wait, schema might require transaction_id or allow null. 
            // In POS transaction, we link it. Here, we link it to the original transaction_id.
            transaction_id: parseInt(transaction_id)
          }))
        });
      }

      return complaint;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.message && error.message.includes('tidak mencukupi')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const complaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    res.json(complaint);
  } catch (error) {
    next(error);
  }
};
