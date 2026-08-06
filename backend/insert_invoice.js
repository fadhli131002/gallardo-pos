const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Memasukkan data invoice sesungguhnya...");

  const trx = await prisma.transaction.create({
    data: {
      id: 46, // Sesuai dengan WRK/26080010046
      sales_id: 1, // ROSYID
      customer_name: "SANTO SETIAWAN",
      customer_phone: "-",
      customer_address: "JL. Duri permai II/NO. 86E",
      car_brand: "XPENG",
      car_model: "X9",
      plate_number: "-",
      chassis_number: "-",
      engine_number: null,
      car_year: "-",
      car_color: "-",
      installation_date: "2026-08-05", // Dari EST Tgl Pasang: 05 Aug 2026
      installation_time: null,
      total_amount: 8500000,
      sales_commission: null,
      discount: 3000000,
      sisa_tagihan: 0,
      status_pembayaran: "Lunas",
      type: "WORKSHOP",
      event: "ROSYID", 
      payment_type: "Lunas",
      payment_method: "Transfer Bank (BCA 6050733252 a.n GALLARDO UTAMA SENTOSA PT)",
      notes: "Unit indent nanti di kabari kalau sudah ready",
      additional_discount: 0,
      refund_amount: 0,
      created_at: new Date("2026-08-06T10:00:00.000Z"), // Tanggal Order: 06 Aug 2026
      updated_at: new Date("2026-08-06T10:00:00.000Z"),
      
      items: {
        create: [
          {
            product_name: "RANTIZ 20H (RANTIZ MOBIL)",
            product_note: "Catatan: Coating body 20H garansi 5 tahun Free coating kaca",
            price: 8500000,
            quantity: 1
          }
        ]
      },
      
      payments: {
        create: [
          {
            amount: 5500000,
            method: "Transfer Bank",
            notes: "Transfer Bank (BCA 6050733252 a.n GALLARDO UTAMA SENTOSA PT)",
            payment_date: new Date("2026-08-06T10:00:00.000Z")
          }
        ]
      }
    },
    include: {
      items: true,
      payments: true
    }
  });

  // Tambahkan CashFlow Log
  await prisma.cashFlowLog.create({
    data: {
      transaction_id: trx.id,
      jenis: "IN",
      jumlah: 5500000,
      keterangan: `Pembayaran Lunas untuk Transaksi #${trx.id} (SANTO SETIAWAN)`,
      metode: "Transfer Bank",
      created_at: new Date("2026-08-06T10:00:00.000Z")
    }
  });

  console.log("✅ Berhasil memasukkan invoice!");
  console.log(trx);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
