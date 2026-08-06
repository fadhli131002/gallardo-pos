const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  // Page 1
  { id: 'INV-006', stok_utama: 19, stok_pecahan: 16 },
  { id: 'INV-007', stok_utama: 15, stok_pecahan: 0 },
  { id: 'INV-008', stok_utama: 9, stok_pecahan: 33 },
  { id: 'INV-009', stok_utama: 12, stok_pecahan: 0 },
  { id: 'INV-017', stok_utama: 10, stok_pecahan: 0 },
  { id: 'INV-018', stok_utama: 14, stok_pecahan: 10 },
  { id: 'INV-019', stok_utama: 14, stok_pecahan: 22 },
  { id: 'INV-020', stok_utama: 15, stok_pecahan: 0 },
  
  // Page 2
  { id: 'INV-021', stok_utama: 15, stok_pecahan: 0 },
  { id: 'INV-022', stok_utama: 14, stok_pecahan: 22 },
  { id: 'INV-028', stok_utama: 13, stok_pecahan: 10 },
  { id: 'INV-010', stok_utama: 6, stok_pecahan: 0 },
  { id: 'INV-011', stok_utama: 10, stok_pecahan: 0 },
  { id: 'INV-012', stok_utama: 10, stok_pecahan: 0 },
  { id: 'INV-013', stok_utama: 10, stok_pecahan: 0 },
  { id: 'INV-014', stok_utama: 10, stok_pecahan: 0 },
  { id: 'INV-015', stok_utama: 10, stok_pecahan: 0 },
  { id: 'INV-016', stok_utama: 10, stok_pecahan: 0 },
  { id: 'INV-001', stok_utama: 10, stok_pecahan: 0 },
  
  // Page 3
  { id: 'INV-002', stok_utama: 5, stok_pecahan: 13 },
  { id: 'INV-003', stok_utama: 3, stok_pecahan: 9 },
  { id: 'INV-004', stok_utama: 5, stok_pecahan: 12 },
  { id: 'INV-005', stok_utama: 10, stok_pecahan: 0 },
  { id: 'INV-023', stok_utama: 100, stok_pecahan: 0 },
  { id: 'INV-024', stok_utama: 50, stok_pecahan: 0 },
  { id: 'INV-025', stok_utama: 30, stok_pecahan: 0 },
  { id: 'INV-026', stok_utama: 5, stok_pecahan: 0 },
  { id: 'INV-027', stok_utama: 200, stok_pecahan: 0 }
];

async function main() {
  console.log("Memulai update stok sesuai PDF...");
  
  for (const item of updates) {
    await prisma.inventory.update({
      where: { id: item.id },
      data: {
        stok_utama: item.stok_utama,
        stok_pecahan: item.stok_pecahan
      }
    });
    console.log(`Updated ${item.id} -> ${item.stok_utama} Utama, ${item.stok_pecahan} Pecahan`);
  }
  
  console.log("✅ Selesai update stok.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
