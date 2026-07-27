const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  console.log('Menghapus semua log cashflow lama...');
  await prisma.cashFlowLog.deleteMany();

  console.log('Menarik data Transaksi Lunas untuk Kas Masuk (Omset)...');
  const transactions = await prisma.transaction.findMany(); // All transactions to match Omset 422M exactly

  let totalKasMasuk = 0;
  for (const trx of transactions) {
    if (trx.total_amount > 0) {
      await prisma.cashFlowLog.create({
        data: {
          type: 'IN',
          amount: trx.total_amount,
          description: `Pendapatan Transaksi POS (${trx.customer_name || 'Umum'})`,
          referenceId: `TRX-${trx.id}`,
          date: trx.created_at
        }
      });
      totalKasMasuk += trx.total_amount;
    }
  }
  console.log(`Total Kas Masuk berhasil disinkronkan: Rp ${totalKasMasuk}`);

  console.log('Menarik data Expense...');
  const expenses = await prisma.expense.findMany();
  for (const exp of expenses) {
    await prisma.cashFlowLog.create({
      data: {
        type: 'OUT',
        amount: exp.amount,
        description: `Beban Operasional: ${exp.title}`,
        referenceId: `EXP-${exp.id}`,
        date: exp.date
      }
    });
  }

  console.log('Menarik data PurchaseOrder...');
  const pos = await prisma.purchaseOrder.findMany({
    where: {
      status: { in: ['Received', 'Paid'] }
    }
  });
  for (const po of pos) {
    await prisma.cashFlowLog.create({
      data: {
        type: 'OUT',
        amount: po.totalAmount,
        description: `Pembelian Stok dari Supplier: ${po.supplier}`,
        referenceId: `PO-${po.id}`,
        date: po.date
      }
    });
  }

  console.log('Selesai mem-backfill CashFlowLog!');
}

backfill()
  .catch(console.error)
  .finally(() => process.exit(0));
