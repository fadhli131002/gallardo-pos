const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const lowStockItems = await prisma.inventory.findMany({
      where: {
        stok_utama: { lte: prisma.inventory.fields.min_stok }
      }
    });
    console.log("Success:", lowStockItems);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
main();
