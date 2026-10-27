const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const content = `### Ringkasan Pembaruan Sistem (v2.6.0)

Sistem POS & Inventaris Gallardo Autosport kini telah diperbarui dengan fitur-fitur mutakhir untuk mendukung kolaborasi real-time antara tim Kasir, Admin Bengkel, dan Tim Gudang:

### 1. Portal Manajemen Stok Gudang (Bento SaaS Light)
- **Tampilan Bento Modern**: Desain bersih (Light Theme), terstruktur, dan presisi tanpa elemen bertumpuk.
- **Master Stok & Konversi Pecahan**: Monitoring stok utama roll/botol beserta pecahan meteran/ml secara akurat.
- **Fitur Aksi Cepat**: Modal popup responsif di layar untuk Restock Masuk, Penyesuaian Fisik (Opname), dan Lapor Selisih.
- **Peringatan Stok Menipis**: Indikator otomatis untuk barang dengan stok kurang dari 2 unit.

### 2. Ruang Chat Selisih Stok (Discrepancy Comms)
- **Komunikasi 2 Arah Real-Time**: Tim Gudang (Mba Umi) dan Admin dapat berdiskusi langsung mengenai selisih fisik vs sistem.
- **Tersedia di Dashboard Admin & Gudang**: Admin dapat mengakses chat lewat tab "Chat Selisih Stok (Gudang)" di menu Inventory & Stok.
- **Sinkronisasi Otomatis**: Tombol "Sinkronkan & Selesai" langsung mengoreksi kuantitas stok di sistem sesuai temuan fisik gudang.

### 3. Sistem Notifikasi Pintar ala WhatsApp
- **Audio Chime Notifikasi**: Nada dering pesan baru dual-tone jernih saat lawan bicara mengirim pesan.
- **Floating Toast Banner**: Cuplikan pesan mengambang di pojok layar dengan nama pengirim dan barang yang dibahas.
- **Badge Hijau Pesan Belum Terbaca**: Angka unread pada tiket, tab menu, dan sidebar yang otomatis hilang saat tiket dibuka/dibaca.

### 4. Riwayat Mutasi & Audit Real-Time
- **Pencatatan Otomatis**: Setiap transaksi kasir (Workshop & Retail SPK) dan restock tercatat rapi secara real-time.
- **Filter Fleksibel**: Pencarian Order ID, filter tanggal periode, dan filter kategori transaksi.
- **Sinkronisasi Aman**: Data terproteksi dan terintegrasi penuh dengan backend database.`;

  // Upsert or create
  const existing = await prisma.releaseNote.findFirst({
    where: { version: 'v2.6.0' }
  });

  if (existing) {
    const updated = await prisma.releaseNote.update({
      where: { id: existing.id },
      data: {
        title: 'Pembaruan Besar: Portal Manajemen Stok Gudang & Chat Selisih Terintegrasi POS',
        content: content,
        is_published: true
      }
    });
    console.log('Updated existing release note:', updated.version);
  } else {
    const created = await prisma.releaseNote.create({
      data: {
        version: 'v2.6.0',
        title: 'Pembaruan Besar: Portal Manajemen Stok Gudang & Chat Selisih Terintegrasi POS',
        content: content,
        is_published: true,
        author_name: 'Superadmin'
      }
    });
    console.log('Created new release note:', created.version);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
