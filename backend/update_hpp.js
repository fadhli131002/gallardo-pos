const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.inventory.findMany();
  for (const item of items) {
    let modal = 0;
    if (item.kategori === 'PPF') modal = 1500000;
    else if (item.kategori === 'Kaca Film') modal = 300000;
    else if (item.kategori === 'Coating') modal = 150000;
    else if (item.kategori === 'Tools') modal = 25000;
    else modal = 50000;

    await prisma.inventory.update({
      where: { id: item.id },
      data: { harga_modal: modal }
    });
  }
  console.log("Database harga_modal updated!");
}
main().finally(() => process.exit(0));
