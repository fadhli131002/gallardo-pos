const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const transaction = await prisma.transaction.findUnique({
    where: { id: 43 }
  });
  
  if (transaction) {
    console.log('Found transaction:', transaction.customer_name);
    await prisma.transaction.update({
      where: { id: 43 },
      data: {
        status_pembayaran: 'Penawaran',
        payment_type: 'Penawaran',
        payment_method: 'Penawaran',
        sisa_tagihan: transaction.total_amount
      }
    });
    
    // optionally remove payment logs
    await prisma.payment.deleteMany({
      where: { transaction_id: 43 }
    });
    
    console.log('Successfully updated transaction 43 to Penawaran');
  } else {
    console.log('Transaction 43 not found.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
