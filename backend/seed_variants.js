const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const seed = async () => {
  const peruntukanData = [
    { name: 'Full Body Mobil', category: 'PPF' },
    { name: 'Partial', category: 'PPF' },
    { name: 'Interior', category: 'PPF' },
    { name: 'Motor', category: 'PPF' },
    { name: 'Raket Padel', category: 'PPF' },
    { name: 'Maintenance', category: 'PPF' },
    { name: 'RANTIZ MOBIL', category: 'Coating' },
    { name: 'RANTIZ PARTIAL', category: 'Coating' },
    { name: 'RANTIZ GLASS', category: 'Coating' },
    { name: 'COATING RANTIZ LEATHER', category: 'Coating' },
    { name: 'RANTIZ MOTOR', category: 'Coating' },
    { name: 'RANTIZ MAINTENANCE', category: 'Coating' },
  ];
  
  for (const item of peruntukanData) {
    await prisma.productPeruntukan.upsert({
      where: { id: 0 }, // fake where to trigger create
      update: {},
      create: item,
    }).catch(() => prisma.productPeruntukan.create({ data: item }));
  }

  const posisiData = ['Full Body', 'Kaca Depan', 'Kaca Samping', 'Kaca Belakang', 'Kaca Sunroof / Panoramic'];
  for (const item of posisiData) {
    await prisma.posisiPemasangan.upsert({
      where: { name: item },
      update: {},
      create: { name: item }
    });
  }

  const partialData = ['Kaca Samping Depan Kiri', 'Kaca Samping Depan Kanan', 'Kaca Samping Tengah Kiri', 'Kaca Samping Tengah Kanan', 'Kaca Samping Belakang Kiri', 'Kaca Samping Belakang Kanan'];
  for (const item of partialData) {
    await prisma.posisiPartial.upsert({
      where: { name: item },
      update: {},
      create: { name: item }
    });
  }
  
  console.log('Seeding variants completed');
  await prisma.$disconnect();
};

seed();
