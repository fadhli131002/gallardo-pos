const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const trxs = await prisma.transaction.findMany({
    where: { created_at: { gte: new Date('2026-01-01'), lt: new Date('2027-01-01') } }
  });

  trxs.forEach(t => {
    const isLunas = t.status_pembayaran?.toUpperCase() === 'LUNAS' || 
                    t.sisa_tagihan <= 0;
    
    if (!isLunas) {
      console.log(`Missed Lunas: id=${t.id} amount=${t.total_amount} status_pembayaran='${t.status_pembayaran}' payment_type='${t.payment_type}' sisa_tagihan=${t.sisa_tagihan}`);
    }
  });
}
check().then(() => process.exit(0));
