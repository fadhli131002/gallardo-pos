const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Memulai proses update transaksi lama...');

  // Cari semua transaksi yang customer_name-nya null atau string kosong
  const oldTransactions = await prisma.transaction.findMany({
    where: {
      OR: [
        { customer_name: null },
        { customer_name: '' }
      ]
    }
  });

  if (oldTransactions.length === 0) {
    console.log('Tidak ada transaksi lama yang perlu diupdate.');
    return;
  }

  console.log(`Ditemukan ${oldTransactions.length} transaksi lama. Mengupdate...`);

  // Update semuanya menjadi 'Pelanggan Lama (Tanpa Nama)' agar terlihat lebih rapi atau 
  // ganti dengan nama default lain jika diinginkan.
  const updateResult = await prisma.transaction.updateMany({
    where: {
      OR: [
        { customer_name: null },
        { customer_name: '' }
      ]
    },
    data: {
      customer_name: 'Pelanggan Umum (Tanpa Nama)',
      customer_phone: '-'
    }
  });

  console.log(`Berhasil mengupdate ${updateResult.count} transaksi lama.`);
}

main()
  .catch(e => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
