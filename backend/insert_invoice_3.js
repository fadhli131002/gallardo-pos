const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Memasukkan data invoice sesungguhnya (Invoice ke-3)...");

  const trx = await prisma.transaction.create({
    data: {
      id: 45, // Sesuai dengan WRK/26080030045
      sales_id: 1, // ROSYID
      customer_name: "PT. GEUPO SUMBER JAYA",
      customer_phone: "08",
      customer_address: "-",
      car_brand: "GWM",
      car_model: "TANK 500",
      plate_number: "-",
      chassis_number: "-",
      engine_number: null,
      car_year: "-",
      car_color: "-",
      installation_date: "2026-08-05", // Dari EST Tgl Pasang: 05 Aug 2026
      installation_time: null,
      total_amount: 39000000,
      sales_commission: null,
      discount: 0,
      sisa_tagihan: 39000000,
      status_pembayaran: "Belum Bayar", // Karena ini Penawaran dan dibayar 0
      type: "WORKSHOP",
      event: "ROSYID", 
      payment_type: "Belum Lunas", // Atau Penawaran
      payment_method: "Penawaran",
      notes: "-",
      additional_discount: 0,
      refund_amount: 0,
      created_at: new Date("2026-08-06T10:00:00.000Z"), // Tanggal Order: 06 Aug 2026
      updated_at: new Date("2026-08-06T10:00:00.000Z"),
      
      items: {
        create: [
          {
            product_name: "VANSGARD ARMOR (FULL BODY MOBIL)",
            product_note: "Catatan: PPF GLOSSY",
            price: 39000000,
            quantity: 1
          }
        ]
      }
      // TIDAK ADA PAYMENTS karena Total Dibayar = 0 (Penawaran)
    },
    include: {
      items: true,
      payments: true
    }
  });

  // TIDAK ADA CASHFLOW LOG karena ini Penawaran dan uang belum masuk.

  console.log("✅ Berhasil memasukkan invoice ke-3 (Penawaran)!");
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
