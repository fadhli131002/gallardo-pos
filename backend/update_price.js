const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  // Page 1
  { id: 'INV-006', harga_modal: 250000 },
  { id: 'INV-007', harga_modal: 150000 },
  { id: 'INV-008', harga_modal: 150000 },
  { id: 'INV-009', harga_modal: 150000 },
  { id: 'INV-017', harga_modal: 7600000 },
  { id: 'INV-018', harga_modal: 7600000 },
  { id: 'INV-019', harga_modal: 7600000 },
  { id: 'INV-020', harga_modal: 11200000 },
  { id: 'INV-021', harga_modal: 11200000 },
  { id: 'INV-022', harga_modal: 11200000 },
  { id: 'INV-028', harga_modal: 11200000 },
  
  // Page 2
  { id: 'INV-010', harga_modal: 1850000 },
  { id: 'INV-011', harga_modal: 1850000 },
  { id: 'INV-012', harga_modal: 1850000 },
  { id: 'INV-013', harga_modal: 4900000 },
  { id: 'INV-014', harga_modal: 4900000 },
  { id: 'INV-015', harga_modal: 4900000 },
  { id: 'INV-016', harga_modal: 4900000 },
  { id: 'INV-001', harga_modal: 8200000 },
  { id: 'INV-002', harga_modal: 9350000 },
  { id: 'INV-003', harga_modal: 11800000 },
  { id: 'INV-004', harga_modal: 16300000 },
  { id: 'INV-005', harga_modal: 12500000 },
  
  // Page 3
  { id: 'INV-023', harga_modal: 2000000 },
  { id: 'INV-024', harga_modal: 25000 },
  { id: 'INV-025', harga_modal: 25000 },
  { id: 'INV-026', harga_modal: 25000 },
  { id: 'INV-027', harga_modal: 25000 }
];

async function main() {
  console.log("Memulai update harga modal sesuai gambar...");
  
  for (const item of updates) {
    await prisma.inventory.update({
      where: { id: item.id },
      data: {
        harga_modal: item.harga_modal
      }
    });
    console.log(`Updated ${item.id} -> Rp ${item.harga_modal.toLocaleString('id-ID')}`);
  }
  
  console.log("✅ Selesai update harga modal.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
