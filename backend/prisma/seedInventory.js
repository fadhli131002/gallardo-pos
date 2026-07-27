/**
 * seedInventory.js — Populate tabel Inventory di database
 * Jalankan: node prisma/seedInventory.js (dari folder backend/)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const inventoryData = [
  { id: 'INV-001', kategori: 'PPF', brand: 'Vansgard', varian: 'Ultra', stok_utama: 10, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-002', kategori: 'PPF', brand: 'Vansgard', varian: 'Matte', stok_utama: 10, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-003', kategori: 'PPF', brand: 'Vansgard', varian: 'Armor', stok_utama: 10, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-004', kategori: 'PPF', brand: 'Vansgard', varian: 'Super Safe', stok_utama: 10, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-005', kategori: 'PPF', brand: 'Vansgard', varian: 'Color', stok_utama: 10, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-006', kategori: 'Coating', brand: 'Rantiz', varian: '9H', stok_utama: 20, stok_pecahan: 0, satuan: 'Botol', branch: 'Gallardo', konversi: 50, min_stok: 3 },
  { id: 'INV-007', kategori: 'Coating', brand: 'Rantiz', varian: '14H', stok_utama: 20, stok_pecahan: 0, satuan: 'Botol', branch: 'Gallardo', konversi: 50, min_stok: 3 },
  { id: 'INV-008', kategori: 'Coating', brand: 'Rantiz', varian: '20H', stok_utama: 20, stok_pecahan: 0, satuan: 'Botol', branch: 'Gallardo', konversi: 50, min_stok: 3 },
  { id: 'INV-009', kategori: 'Coating', brand: 'Rantiz', varian: 'Glass Coating', stok_utama: 20, stok_pecahan: 0, satuan: 'Botol', branch: 'Gallardo', konversi: 50, min_stok: 3 },
  { id: 'INV-010', kategori: 'Kaca Film', brand: 'Performante - Iron Black', varian: 'Performante Iron Black 35', kegelapan: '40%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-011', kategori: 'Kaca Film', brand: 'Performante - Iron Black', varian: 'Performante Iron Black 20', kegelapan: '60%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-012', kategori: 'Kaca Film', brand: 'Performante - Iron Black', varian: 'Performante Iron Black 05', kegelapan: '80%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-013', kategori: 'Kaca Film', brand: 'Performante - Black Stone', varian: 'Performante Black Stone 70', kegelapan: '20%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-014', kategori: 'Kaca Film', brand: 'Performante - Black Stone', varian: 'Performante Black Stone 35', kegelapan: '40%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-015', kategori: 'Kaca Film', brand: 'Performante - Black Stone', varian: 'Performante Black Stone 20', kegelapan: '60%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-016', kategori: 'Kaca Film', brand: 'Performante - Black Stone', varian: 'Performante Black Stone 05', kegelapan: '80%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-017', kategori: 'Kaca Film', brand: 'Deluxe - Classic', varian: 'Deluxe Classic 35', kegelapan: '40%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-018', kategori: 'Kaca Film', brand: 'Deluxe - Classic', varian: 'Deluxe Classic 20', kegelapan: '60%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-019', kategori: 'Kaca Film', brand: 'Deluxe - Classic', varian: 'Deluxe Classic 05', kegelapan: '80%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-020', kategori: 'Kaca Film', brand: 'Deluxe - Jet Black', varian: 'Deluxe Jet Black 70', kegelapan: '20%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-021', kategori: 'Kaca Film', brand: 'Deluxe - Jet Black', varian: 'Deluxe Jet Black 35', kegelapan: '40%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-022', kategori: 'Kaca Film', brand: 'Deluxe - Jet Black', varian: 'Deluxe Jet Black 20', kegelapan: '60%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-028', kategori: 'Kaca Film', brand: 'Deluxe - Jet Black', varian: 'Deluxe Jet Black 05', kegelapan: '80%', stok_utama: 15, stok_pecahan: 0, satuan: 'Roll', branch: 'Gallardo', konversi: 15, min_stok: 2 },
  { id: 'INV-023', kategori: 'Tools & Equipment', brand: 'Aplikator', varian: '-', stok_utama: 100, stok_pecahan: 0, satuan: 'Pcs', branch: 'Gallardo', konversi: 1, min_stok: 10 },
  { id: 'INV-024', kategori: 'Tools & Equipment', brand: 'Detailing Brush', varian: '-', stok_utama: 50, stok_pecahan: 0, satuan: 'Pcs', branch: 'Gallardo', konversi: 1, min_stok: 5 },
  { id: 'INV-025', kategori: 'Tools & Equipment', brand: 'Skep', varian: '-', stok_utama: 30, stok_pecahan: 0, satuan: 'Pcs', branch: 'Gallardo', konversi: 1, min_stok: 5 },
  { id: 'INV-026', kategori: 'Tools & Equipment', brand: 'Mesin Rotary', varian: '-', stok_utama: 5, stok_pecahan: 0, satuan: 'Unit', branch: 'Gallardo', konversi: 1, min_stok: 1 },
  { id: 'INV-027', kategori: 'Tools & Equipment', brand: 'Lap Microfiber', varian: '-', stok_utama: 200, stok_pecahan: 0, satuan: 'Pcs', branch: 'Gallardo', konversi: 1, min_stok: 20 },
];

async function main() {
  console.log('🌱 Seeding inventory...');
  for (const item of inventoryData) {
    await prisma.inventory.upsert({
      where: { id: item.id },
      update: item,
      create: item,
    });
  }
  console.log(`✅ ${inventoryData.length} item inventaris berhasil di-seed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
