const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const updates = [
  { id: 'INV-020', stok_utama: 21 }, // DELUXE JET BLACK 70
  { id: 'INV-021', stok_utama: 21 }, // DELUXE JET BLACK 35
  { id: 'INV-022', stok_utama: 16 }, // DELUXE JET BLACK 20
  { id: 'INV-028', stok_utama: 23 }, // DELUXE JET BLACK 05
  
  { id: 'INV-017', stok_utama: 18 }, // DELUXE CH 35 (Classic 35)
  { id: 'INV-018', stok_utama: 18 }, // DELUXE CH 20 (Classic 20)
  { id: 'INV-019', stok_utama: 16 }, // DELUXE CH 05 (Classic 05)
  
  { id: 'INV-013', stok_utama: 23 }, // PERFOMANTE BLACK STONE 70
  { id: 'INV-014', stok_utama: 26 }, // PERFOMANTE BLACK STONE 35
  { id: 'INV-015', stok_utama: 33 }, // PERFOMANTE BLACK STONE 20
  { id: 'INV-016', stok_utama: 27 }, // PERFOMANTE BLACK STONE 05
  
  { id: 'INV-010', stok_utama: 26 }, // PERFOMANTE IRON BLACK 35
  { id: 'INV-011', stok_utama: 22 }, // PERFOMANTE IRON BLACK 20
  { id: 'INV-012', stok_utama: 40 }, // PERFOMANTE IRON BLACK 05
  
  { id: 'INV-001', stok_utama: 31 }, // VANSGARD ULTRA
  { id: 'INV-002', stok_utama: 39 }, // VANSGARD MATTE
  { id: 'INV-003', stok_utama: 41 }, // VANSGARD ARMOR
  { id: 'INV-004', stok_utama: 14 }  // VANSGARD SUPERSAFE
];

const newItems = [
  {
    id: 'INV-032',
    kategori: 'Kaca Film',
    brand: 'Safety',
    varian: '4 Mill',
    stok_utama: 15,
    stok_pecahan: 0,
    satuan: 'Roll'
  },
  {
    id: 'INV-033',
    kategori: 'Kaca Film',
    brand: 'Safety',
    varian: '8 Mill',
    stok_utama: 17,
    stok_pecahan: 0,
    satuan: 'Roll'
  },
  {
    id: 'INV-034',
    kategori: 'Kaca Film',
    brand: 'Safety',
    varian: '12 Mill',
    stok_utama: 9,
    stok_pecahan: 0,
    satuan: 'Roll'
  }
];

async function main() {
  console.log("Memulai update stok sesuai foto...");
  
  // Update existing items
  for (const item of updates) {
    await prisma.inventory.update({
      where: { id: item.id },
      data: { stok_utama: item.stok_utama }
    });
    console.log(`Updated ${item.id} -> ${item.stok_utama} Roll`);
  }
  
  // Insert new items if they don't exist
  for (const item of newItems) {
    const existing = await prisma.inventory.findUnique({ where: { id: item.id } });
    if (!existing) {
      await prisma.inventory.create({ data: item });
      console.log(`Created new item ${item.id} (${item.brand} ${item.varian}) -> ${item.stok_utama} Roll`);
    } else {
      await prisma.inventory.update({
        where: { id: item.id },
        data: { stok_utama: item.stok_utama }
      });
      console.log(`Updated ${item.id} -> ${item.stok_utama} Roll`);
    }
  }
  
  console.log("✅ Selesai update stok foto.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
