const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Memasukkan data invoice sesungguhnya (Invoice ke-6)...");

  const trx = await prisma.transaction.create({
    data: {
      id: 40, // Sesuai dengan WRK/26080030040
      sales_id: 1, // ROSYID
      customer_name: "STANISLAUS RANDY T.H.",
      customer_phone: "085933083608",
      customer_address: "Perumahan The Golden Nest Blok C3, Jakarta Timur 13870",
      car_brand: "BYD",
      car_model: "M6",
      plate_number: "-",
      chassis_number: "LC0CE4CB0S0559558",
      engine_number: null,
      car_year: "-",
      car_color: "Harbour Grey",
      installation_date: "2026-08-01", // Dari EST Tgl Pasang: 01 Aug 2026
      installation_time: null,
      total_amount: 23730000,
      sales_commission: null,
      discount: 0,
      sisa_tagihan: 0,
      status_pembayaran: "Lunas", 
      type: "WORKSHOP",
      event: "ROSYID", 
      payment_type: "Lunas", 
      payment_method: "Transfer Bank (BCA 6050733252 a.n GALLARDO UTAMA SENTOSA PT)",
      notes: "-",
      additional_discount: 0,
      refund_amount: 0,
      created_at: new Date("2026-08-06T10:00:00.000Z"), // Tanggal Order: 06 Aug 2026
      updated_at: new Date("2026-08-06T10:00:00.000Z"),
      
      items: {
        create: [
          {
            product_name: "VANSGARD ARMOR (FULL BODY MOBIL)",
            product_note: "-",
            price: 21730000,
            quantity: 1
          },
          {
            product_name: "DELUXE JET BLACK 20 (KACA DEPAN)",
            product_note: "-",
            price: 2000000,
            quantity: 1
          }
        ]
      },
      
      payments: {
        create: [
          {
            amount: 23730000,
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
      type: "IN",
      amount: 23730000,
      description: `Pembayaran Lunas untuk Transaksi #${trx.id} (STANISLAUS RANDY T.H.)`,
      referenceId: String(trx.id),
      date: new Date("2026-08-06T10:00:00.000Z")
    }
  });

  console.log("✅ Berhasil memasukkan invoice ke-6!");
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
