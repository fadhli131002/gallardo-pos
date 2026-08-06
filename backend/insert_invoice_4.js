const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Memasukkan data invoice sesungguhnya (Invoice ke-4)...");

  const trx = await prisma.transaction.create({
    data: {
      id: 43, // Sesuai dengan WRK/26080030043
      sales_id: 1, // ROSYID
      customer_name: "INDO TANOTO",
      customer_phone: "081314162002",
      customer_address: "Dasana indah",
      car_brand: "I-CAR",
      car_model: "V23",
      plate_number: "-",
      chassis_number: "-",
      engine_number: null,
      car_year: "-",
      car_color: "HITAM",
      installation_date: "2026-08-05", // Dari EST Tgl Pasang: 05 Aug 2026
      installation_time: null,
      total_amount: 20900000,
      sales_commission: null,
      discount: 0,
      sisa_tagihan: 0,
      status_pembayaran: "Lunas", 
      type: "WORKSHOP",
      event: "ROSYID", 
      payment_type: "Lunas", 
      payment_method: "Cash",
      notes: "Estimasi selesai hari sabtu jam 17:00",
      additional_discount: 0,
      refund_amount: 0,
      created_at: new Date("2026-08-06T10:00:00.000Z"), // Tanggal Order: 06 Aug 2026
      updated_at: new Date("2026-08-06T10:00:00.000Z"),
      
      items: {
        create: [
          {
            product_name: "VANSGARD ARMOR (FULL BODY MOBIL)",
            product_note: "-",
            price: 18000000,
            quantity: 1
          },
          {
            product_name: "DELUXE JET BLACK 20 (KACA DEPAN)",
            product_note: "-",
            price: 1500000,
            quantity: 1
          },
          {
            product_name: "DELUXE JET BLACK 05 (KACA SAMPING)",
            product_note: "-",
            price: 1000000,
            quantity: 1
          },
          {
            product_name: "DELUXE JET BLACK 05 (KACA BELAKANG)",
            product_note: "-",
            price: 400000,
            quantity: 1
          }
        ]
      },
      
      payments: {
        create: [
          {
            amount: 20900000,
            method: "Cash",
            notes: "Cash (Lunas)",
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
      amount: 20900000,
      description: `Pembayaran Lunas untuk Transaksi #${trx.id} (INDO TANOTO)`,
      referenceId: String(trx.id),
      date: new Date("2026-08-06T10:00:00.000Z")
    }
  });

  console.log("✅ Berhasil memasukkan invoice ke-4!");
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
