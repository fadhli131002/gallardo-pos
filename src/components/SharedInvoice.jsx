import React from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '../data/mockData';
import logoGallardo from '../assets/logo-gallardo.png';
import RetailInvoice from './RetailInvoice';

const angkaToTerbilang = (angka) => {
  const huruf = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh", "Sebelas"];
  if (angka < 12) return huruf[angka];
  if (angka < 20) return angkaToTerbilang(angka - 10) + " Belas";
  if (angka < 100) return angkaToTerbilang(Math.floor(angka / 10)) + " Puluh " + angkaToTerbilang(angka % 10);
  if (angka < 200) return "Seratus " + angkaToTerbilang(angka - 100);
  if (angka < 1000) return angkaToTerbilang(Math.floor(angka / 100)) + " Ratus " + angkaToTerbilang(angka % 100);
  if (angka < 2000) return "Seribu " + angkaToTerbilang(angka - 1000);
  if (angka < 1000000) return angkaToTerbilang(Math.floor(angka / 1000)) + " Ribu " + angkaToTerbilang(angka % 1000);
  if (angka < 1000000000) return angkaToTerbilang(Math.floor(angka / 1000000)) + " Juta " + angkaToTerbilang(angka % 1000000);
  if (angka < 1000000000000) return angkaToTerbilang(Math.floor(angka / 1000000000)) + " Milyar " + angkaToTerbilang(angka % 1000000000);
  return "";
};

const getTerbilang = (amount) => {
  if (amount === 0) return "Nol";
  return angkaToTerbilang(amount).replace(/\s+/g, ' ').trim();
};

export default function SharedInvoice({ order }) {
  if (!order) return null;

  if (order.type === 'RETAIL') {
    return <RetailInvoice order={order} />;
  }

  const calculatedTotalTagihan = (order.items || []).reduce((acc, item) => {
    const price = item.finalPrice !== undefined ? item.finalPrice : (item.price || item.harga || 0);
    const discount = item.discount || 0;
    return acc + ((price * item.qty) - discount);
  }, 0);

  const orderTotalPrice = order.totalPrice !== undefined ? order.totalPrice : (calculatedTotalTagihan > 0 ? calculatedTotalTagihan : 0);

  const subTotalForDiscount = order.subTotal || calculatedTotalTagihan || 0;
  const discountPercentage = (order.discountAmount && subTotalForDiscount > 0) ? ((order.discountAmount / subTotalForDiscount) * 100) : 0;

  let labelStatus = 'BELUM BAYAR';
  let totalDibayar = 0;
  let sisaKurangBayar = orderTotalPrice;
  let watermarkColor = 'rgba(220, 38, 38, 0.05)';

  const status = order.paymentType || order.paymentStatus || order.type || 'BELUM BAYAR';
  const statusUpper = status.toUpperCase();

  const isPenawaran = order.billType === 'Penawaran' || order.salesCategory === 'Penawaran' || order.paymentMethod === 'Penawaran' || order.method === 'Penawaran';

  const totalPaidHistory = (order.paymentHistory || order.payments || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const fallbackPaidAmount = order.paidAmount !== undefined ? Number(order.paidAmount) : (order.dpAmount ? Number(order.dpAmount) : 0);
  
  if (isPenawaran) {
    labelStatus = 'PENAWARAN';
    totalDibayar = 0;
    sisaKurangBayar = orderTotalPrice;
    watermarkColor = '#e5e7eb';
  } else if (totalPaidHistory > 0 || fallbackPaidAmount > 0) {
    totalDibayar = totalPaidHistory > 0 ? totalPaidHistory : fallbackPaidAmount;
    sisaKurangBayar = Math.max(0, orderTotalPrice - totalDibayar);
    if (sisaKurangBayar <= 0) {
      labelStatus = 'SUDAH LUNAS';
      watermarkColor = 'rgba(5, 150, 105, 0.05)';
    } else {
      labelStatus = 'DP / BELUM LUNAS';
      watermarkColor = 'rgba(249, 115, 22, 0.08)';
    }
  } else if (statusUpper === 'LUNAS' || statusUpper === 'SELESAI') {
    labelStatus = 'SUDAH LUNAS';
    totalDibayar = orderTotalPrice;
    sisaKurangBayar = 0;
    watermarkColor = 'rgba(5, 150, 105, 0.05)';
  } else if (statusUpper.includes('DP')) {
    labelStatus = 'DP / BELUM LUNAS';
    if (statusUpper === 'DP 50%') {
      totalDibayar = orderTotalPrice / 2;
    } else {
      totalDibayar = 0;
    }
    sisaKurangBayar = Math.max(0, orderTotalPrice - totalDibayar);
    watermarkColor = 'rgba(249, 115, 22, 0.08)';
  } else {
    labelStatus = 'BELUM BAYAR';
    totalDibayar = 0;
    sisaKurangBayar = orderTotalPrice;
    watermarkColor = 'rgba(220, 38, 38, 0.05)';
  }

  return (
    <div id="invoice-content-to-print" className="flex flex-col print:!p-0 print:!m-0 print:!border-none print:!shadow-none print:!w-full print:!max-w-none print:!h-auto print:scale-[0.96] print:origin-top" style={{ backgroundColor: '#ffffff', padding: '24px 32px', color: '#111', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', width: '100%', minWidth: '100%', maxWidth: '100%', boxSizing: 'border-box', position: 'relative', overflow: 'visible', pageBreakInside: 'avoid', breakInside: 'avoid' }}>

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) rotate(-45deg)',
        fontSize: '100px',
        fontWeight: 'bold',
        color: watermarkColor,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 0
      }}>
        {labelStatus}
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', flex: 1, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #111', paddingBottom: '12px', marginBottom: '14px' }}>
          <div>
            <img src={logoGallardo} alt="Gallardo Autosport" style={{ height: '40px', objectFit: 'contain', marginBottom: '10px' }} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#111', letterSpacing: '2px' }}>INVOICE</h2>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>{order.id || order.invoiceId}</p>
          </div>
        </div>

        {/* 2-COLUMN INFO */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '12px', fontWeight: '500', lineHeight: '1.5' }}>
          {/* Kolom Kiri */}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '13px', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px', fontWeight: 'bold' }}>Info Pelanggan & Kendaraan</h3>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '130px', padding: '1px 0', color: '#555' }}>Nama Pelanggan</td>
                  <td style={{ padding: '1px 0', fontWeight: 'bold' }}>: {((order.customer && order.customer.name) || order.customerName || order.nama_pelanggan || '').toUpperCase()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555' }}>No. HP</td>
                  <td style={{ padding: '1px 0' }}>: {(order.customer && order.customer.phone) || order.customerHp || order.customerPhone || order.no_hp || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555' }}>Alamat</td>
                  <td style={{ padding: '1px 0' }}>: {(order.customer && order.customer.address) || order.customerAddress || order.address || order.alamat || order.location || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555' }}>Merek / Tipe Mobil</td>
                  <td style={{ padding: '1px 0', fontWeight: 'bold' }}>: {((order.vehicle && order.vehicle.brand) || order.carBrand || '')} {((order.vehicle && order.vehicle.model) || order.carModel || '')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555' }}>Plat Nomor</td>
                  <td style={{ padding: '1px 0', fontWeight: 'bold' }}>: {((order.vehicle && order.vehicle.plateNumber) || order.plateNumber || order.plat_nomor || '-').toUpperCase()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555' }}>No. Rangka</td>
                  <td style={{ padding: '1px 0', fontWeight: 'bold' }}>: {((order.vehicle && order.vehicle.chassisNumber) || order.chassisNumber || order.no_rangka || order.vin || '-').toUpperCase()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555' }}>Tahun</td>
                  <td style={{ padding: '1px 0', fontWeight: 'bold' }}>: {(order.vehicle && order.vehicle.year) || order.carYear || order.year || order.tahun || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555' }}>Warna Kendaraan</td>
                  <td style={{ padding: '1px 0', fontWeight: 'bold' }}>: {order.carColor || order.warna || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ width: '30px' }}></div> {/* Spacer */}

          {/* Kolom Kanan */}
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '13px', borderBottom: '1px solid #ddd', paddingBottom: '4px', marginBottom: '6px', fontWeight: 'bold' }}>Info Pemasangan & Sales</h3>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '120px', padding: '1px 0', color: '#555' }}>Tgl. Order</td>
                  <td style={{ padding: '1px 0' }}>: {format(new Date(), 'dd MMM yyyy')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555' }}>EST Tgl. Pasang</td>
                  <td style={{ padding: '1px 0' }}>: {(order.installationDate || order.estimatedDate || order.tanggal_pasang) ? format(new Date(order.installationDate || order.estimatedDate || order.tanggal_pasang), 'dd MMM yyyy') : '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555' }}>Sales</td>
                  <td style={{ padding: '1px 0', fontWeight: 'bold' }}>: {(order.spgName || order.salesName || '-').toUpperCase()}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555' }}>Tipe Order</td>
                  <td style={{ padding: '1px 0' }}>: {order.billType || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '1px 0', color: '#555', verticalAlign: 'top' }}>Catatan</td>
                  <td style={{ padding: '1px 0', verticalAlign: 'top' }}>: {order.notes || order.keterangan || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontWeight: '500', marginBottom: '12px', backgroundColor: 'transparent' }}>
          <thead>
            <tr style={{ backgroundColor: 'transparent', borderTop: '2px solid #111', borderBottom: '2px solid #111' }}>
              <th style={{ padding: '6px 8px', textAlign: 'center', width: '5%' }}>No.</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', width: '30%' }}>Item</th>
              <th style={{ padding: '6px 8px', textAlign: 'left', width: '20%' }}>Varian</th>
              <th style={{ padding: '6px 8px', textAlign: 'center', width: '5%' }}>Qty</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', width: '15%' }}>Harga Satuan</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', width: '10%' }}>Diskon</th>
              <th style={{ padding: '6px 8px', textAlign: 'right', width: '15%' }}>Total Harga</th>
            </tr>
          </thead>
          <tbody>
            {order.items && order.items.length > 0 ? (
              order.items.map((item, idx) => {
                const price = item.finalPrice !== undefined ? item.finalPrice : (item.price || item.harga || 0);
                const discount = item.discount || 0;
                const totalItemPrice = (price * item.qty) - discount;

                let itemName = (item.baseName || item.name).toUpperCase();
                if (item.category === 'Kaca Film' && item.kegelapan) {
                  itemName = `${itemName} - KEGELAPAN ${item.kegelapan}`;
                }

                let varian = item.posisi || item.peruntukan || item.ukuran || '-';

                return (
                  <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '6px 8px', textAlign: 'center', color: '#555' }}>{idx + 1}.</td>
                    <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>
                      {itemName}
                      {(item.catatan || item.notes || item.product_note) && (
                        <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'normal', marginTop: '2px' }}>
                          Catatan: {item.catatan || item.notes || item.product_note}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '6px 8px', color: '#555' }}>{varian}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(price).replace('Rp', '').trim()}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{discountPercentage > 0 ? discountPercentage.toFixed(1) + '%' : '0'}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(totalItemPrice).replace('Rp', '').trim()}</td>
                  </tr>
                );
              })
            ) : (
              <tr style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '6px 8px', textAlign: 'center', color: '#555' }}>1.</td>
                <td style={{ padding: '6px 8px', fontWeight: 'bold' }}>{(order.service || '').toUpperCase()}</td>
                <td style={{ padding: '6px 8px', color: '#555' }}>{order.filmVariation || '-'}</td>
                <td style={{ padding: '6px 8px', textAlign: 'center' }}>1</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatCurrency(orderTotalPrice).replace('Rp', '').trim()}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right' }}>{discountPercentage > 0 ? discountPercentage.toFixed(1) + '%' : '0'}</td>
                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(orderTotalPrice).replace('Rp', '').trim()}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* BOTTOM SECTION */}
        <div className="flex-1 flex flex-col" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
          {/* Row 1: Signatures and Table */}
          <div className="mt-2 print:!mt-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pageBreakInside: 'avoid', breakInside: 'avoid' }}>

            {/* Notes & Signatures */}
            <div style={{ flex: 1, paddingRight: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', marginBottom: '6px', padding: '0 10px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 35px 0', fontSize: '11px', color: '#555' }}>Pelanggan,</p>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '11px' }}>{(order.customerName || '').toUpperCase()}</p>
                  <div style={{ borderBottom: '1px solid #111', margin: '2px 10px 0 10px' }}></div>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 35px 0', fontSize: '11px', color: '#555' }}>Admin,</p>
                  <p style={{ margin: 0, fontWeight: 'bold', fontSize: '11px' }}>{(order.spgName || order.salesName || 'ADMIN').toUpperCase()}</p>
                  <div style={{ borderBottom: '1px solid #111', margin: '2px 10px 0 10px' }}></div>
                </div>
              </div>

              <div style={{ fontWeight: 'bold', fontSize: '10px', color: '#111', marginBottom: '10px', padding: '0 10px' }}>
                Metode Pembayaran : {order.paymentMethod || order.method || '-'} ({order.paymentType || order.paymentStatus || order.type || '-'})
              </div>
            </div>

            {/* Calculation */}
            <div style={{ width: '260px', backgroundColor: 'transparent' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', backgroundColor: 'transparent' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 6px', color: '#555' }}>Total Tagihan</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px' }}>{formatCurrency(orderTotalPrice).replace('Rp', '').trim()}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '4px 6px', color: '#555' }}>Diskon/Potongan</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right' }}>{order.discountAmount > 0 ? `- ${formatCurrency(order.discountAmount).replace('Rp', '').trim()}` : '0'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 6px', fontWeight: 'bold', fontSize: '13px' }}>Total Dibayar</td>
                    <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 'bold', fontSize: '13px', color: '#111' }}>{formatCurrency(totalDibayar).replace('Rp', '').trim()}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 6px', color: '#555' }}>Sisa / Kurang Bayar</td>
                    <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', color: sisaKurangBayar > 0 ? '#dc2626' : '#111' }}>{formatCurrency(sisaKurangBayar).replace('Rp', '').trim()}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ textAlign: 'right', fontStyle: 'italic', fontSize: '10px', color: '#111', fontWeight: 'bold', marginTop: '10px' }}>
                TERBILANG: # {getTerbilang(totalDibayar)} Rupiah #
              </div>
            </div>
          </div>

          {/* Row 2: Catatan Penting and Bank Info */}
          <div className="mt-auto pt-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div style={{ textAlign: 'justify', backgroundColor: 'transparent' }}>
              <div style={{ fontSize: '10px', color: '#111', lineHeight: '1.4' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>Gallardo Auto Sport</div>
                <div style={{ marginBottom: '2px' }}>Ruko Alicante, Blok D9 - D10, Medang, Kec. Pagedangan, Kabupaten Tangerang, Banten 15334</div>
                <div style={{ marginBottom: '2px' }}>0822-5802-6577</div>
                <div style={{ marginBottom: '2px' }}>(Untuk Transfer Pembayaran ke:)</div>
                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>No. Rekening BCA 6050733252 a.n GALLARDO UTAMA SENTOSA PT</div>
                <div style={{ fontStyle: 'italic', fontSize: '9px', color: '#555' }}>Kami (Gallardo Auto Sport, Deluxe, VansgardPPF, Rantiz, Performante) HANYA menggunakan rekening BCA di atas.</div>
              </div>
            </div>

            <div style={{ textAlign: 'justify' }}>
              <div style={{ fontSize: '10px', color: '#444', lineHeight: '1.4' }}>
                <p style={{ margin: '0 0 3px 0', fontWeight: 'bold', color: '#111', textAlign: 'left' }}>Catatan Penting:</p>
                <ol style={{ margin: 0, paddingLeft: '14px', listStyleType: 'decimal', listStylePosition: 'outside', textAlign: 'justify' }}>
                  <li style={{ marginBottom: '1px' }}>Pihak Gallardo Autosport tidak bertanggung jawab atas segala bentuk kerusakan atau malfungsi pada jalur pemanas kaca (Defogger Line) akibat proses instalasi kaca film.</li>
                  <li style={{ marginBottom: '1px' }}>Harap tunjukkan dokumen faktur ini kepada staf kami pada saat jadwal pemasangan.</li>
                  <li style={{ marginBottom: '1px' }}>Pesanan akan otomatis dibatalkan apabila tidak ada pengerjaan/pemasangan dalam kurun waktu 90 hari sejak transaksi.</li>
                  <li style={{ marginBottom: '1px' }}>Faktur cetak ini sah dan berlaku sebagai kuitansi pembayaran resmi.</li>
                  <li style={{ marginBottom: '1px' }}>Segala bentuk pembayaran nontunai (Transfer Bank, Kartu Kredit, QRIS, dll) baru dinyatakan sah setelah dana terverifikasi masuk ke mutasi rekening resmi kami.</li>
                  <li style={{ marginBottom: '1px' }}>Uang muka (Down Payment/DP) yang telah dibayarkan tidak dapat dikembalikan (non-refundable) apabila terjadi pembatalan sepihak oleh konsumen.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
