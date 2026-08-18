const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixData() {
  try {
    const item = await prisma.inventory.findUnique({ where: { id: 'INV-006' } });
    console.log("INV-006 in DB:", item);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixData();
