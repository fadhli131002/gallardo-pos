const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
  'Walk-In (Workshop)', 
  'Digital Ads (Sosmed)', 
  'Event / Pameran', 
  'Reseller (Pembelian Roll)', 
  'Kemitraan / Cabang', 
  'Sales External', 
  'Home Service', 
  'Penawaran'
];

async function main() { 
  for (const name of data) { 
    await prisma.salesCategory.upsert({ 
      where: { name }, 
      update: {}, 
      create: { name } 
    }); 
  } 
  console.log('Seeded'); 
} 

main().catch(console.error).finally(() => prisma.$disconnect());
