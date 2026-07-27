const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const trxs = await prisma.transaction.findMany({
    include: { inventory_logs: { include: { inventory: true } } }
  });

  trxs.forEach(t => {
    t.inventory_logs.forEach(log => {
      console.log(`Log ID: ${log.id}, qty: ${log.quantity}, inventory:`, log.inventory);
    });
  });
}
check().then(() => process.exit(0));
