const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const trxs = await prisma.transaction.findMany({
    where: { created_at: { gte: new Date('2026-01-01'), lt: new Date('2027-01-01') } },
    include: { inventory_logs: { include: { inventory: true } } }
  });

  let totalAll = 0;
  let totalLunas = 0;
  let totalHppAll = 0;

  trxs.forEach(t => {
    totalAll += t.total_amount;
    
    // Check if lunas based on logic in analytics
    const isLunas = t.status_pembayaran?.toUpperCase() === 'LUNAS' || 
                    t.sisa_tagihan <= 0;
    
    if (isLunas) {
      totalLunas += t.total_amount;
    }

    t.inventory_logs.forEach(log => {
      if (log.inventory) {
        totalHppAll += (log.inventory.harga_modal || 0) * (log.quantity || 0);
      }
    });
  });

  console.log("Total All (Admin dashboard logic):", totalAll);
  console.log("Total Lunas (isLunas):", totalLunas);
  console.log("Total HPP All:", totalHppAll);
}

check().then(() => process.exit(0)).catch(e => console.error(e));
