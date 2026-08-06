const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Memperbaiki sales_id untuk invoice Rosyid...");

  // Update transaksi yang baru saja dimasukkan agar sesuai dengan ID User Rosyid (ID: 7)
  const result = await prisma.transaction.updateMany({
    where: {
      id: {
        in: [46, 45, 44, 43, 41, 40]
      }
    },
    data: {
      sales_id: 7 // ID dari tabel User untuk "Rosyid Sales"
    }
  });

  console.log(`✅ Berhasil mengupdate ${result.count} transaksi ke user ID 7 (Rosyid Sales)`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
