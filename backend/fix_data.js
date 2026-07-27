const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixData() {
  try {
    // 1. Fix ID 19 (Ahmad) and ID 20 (Sauqi Lilahi) to LUNAS
    const updated19 = await prisma.transaction.update({
      where: { id: 19 },
      data: {
        status_pembayaran: 'Lunas',
        sisa_tagihan: 0,
        payment_type: 'Lunas'
      }
    });
    console.log("Updated ID 19:", updated19.id, updated19.status_pembayaran);

    const updated20 = await prisma.transaction.update({
      where: { id: 20 },
      data: {
        status_pembayaran: 'Lunas',
        sisa_tagihan: 0,
        payment_type: 'Lunas'
      }
    });
    console.log("Updated ID 20:", updated20.id, updated20.status_pembayaran);

  } catch (error) {
    console.error("Error fixing data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixData();
