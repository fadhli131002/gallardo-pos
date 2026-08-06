const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Memasukkan data invoice sesungguhnya (Invoice ke-2)...");

  const trx = await prisma.transaction.create({
    data: {
      id: 44, // Sesuai dengan WRK/26080040044
      sales_id: 1, // ROSYID
      customer_name: "PT. CAHAYA ALAM SEJATI",
      customer_phone: "087718978989",
      customer_address: "Jl.Pulau Pamagaran Kim, Sampali, Percut Sei Tuan, Kab.Deli Serdang, Sumatera Utara.",
      car_brand: "XPENG",
      car_model: "X9",
      plate_number: "-",
      chassis_number: "MGGEXGM13TJ101556",
      engine_number: null,
      car_year: "-",
      car_color: "Nebula White",
      installation_date: "2026-08-05", // Dari EST Tgl Pasang: 05 Aug 2026
      installation_time: null,
      total_amount: 46300000,
      sales_commission: null,
      discount: 0,
      sisa_tagihan: 0,
      status_pembayaran: "Lunas",
      type: "WORKSHOP",
      event: "ROSYID", 
      payment_type: "Lunas",
      payment_method: "Transfer Bank (BCA 6050733252 a.n GALLARDO UTAMA SENTOSA PT)",
      notes: "Selesai pemasangan tgl 04 agustus 2026",
      additional_discount: 0,
      refund_amount: 0,
      created_at: new Date("2026-08-06T10:00:00.000Z"), // Tanggal Order: 06 Aug 2026
      updated_at: new Date("2026-08-06T10:00:00.000Z"),
      
      items: {
        create: [
          {
            product_name: "VANSGARD SUPER SAFE (FULL BODY MOBIL)",
            product_note: "Catatan: Free PPF Headunit, Free Coating Body, Free Coating Kaca, Free Interior Detailing dan Engine Detailing, Free Maintenance 3x, Free Towing 1x",
            price: 46300000,
            quantity: 1
          }
        ]
      },
      
      payments: {
        create: [
          {
            amount: 46300000,
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
      amount: 46300000,
      description: `Pembayaran Lunas untuk Transaksi #${trx.id} (PT. CAHAYA ALAM SEJATI)`,
      referenceId: String(trx.id),
      date: new Date("2026-08-06T10:00:00.000Z")
    }
  });

  console.log("✅ Berhasil memasukkan invoice ke-2!");
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
