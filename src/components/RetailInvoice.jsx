import React from 'react';
import { format } from 'date-fns';
import logoGallardo from '../assets/logo-gallardo.png';

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
  return angkaToTerbilang(amount).replace(/\s+/g, ' ').trim() + " Rupiah";
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(value);
};

export default function RetailInvoice({ order }) {
  if (!order) return null;

  const date = order.date ? new Date(order.date) : new Date();
  
  const calculatedSubTotal = (order.items || []).reduce((acc, item) => {
    const price = item.finalPrice !== undefined ? item.finalPrice : (item.price || item.harga || 0);
    return acc + (price * item.qty);
  }, 0);

  const calculatedDiscount = (order.items || []).reduce((acc, item) => {
    return acc + (item.discount || 0);
  }, 0);

  const grandTotal = order.totalPrice !== undefined ? order.totalPrice : (calculatedSubTotal - calculatedDiscount);

  const getKeterangan = () => {
    return order.notes && order.notes.trim() !== '' ? order.notes.trim() : '-';
  };

  return (
    <div id="invoice-content-to-print" className="flex flex-col min-h-[800px] print:!min-h-[27cm] print:!p-0 print:!m-0 print:!border-none print:!shadow-none print:!w-full print:!max-w-none print:!h-auto print:scale-[0.95] print:origin-top" style={{ backgroundColor: '#ffffff', padding: '40px', color: '#000', width: '100%', minWidth: '100%', maxWidth: '100%', boxSizing: 'border-box', position: 'relative' }}>
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center" style={{ gap: '60px' }}>
          <img src={logoGallardo} alt="Gallardo Autosport" style={{ height: '32px', objectFit: 'contain' }} />
          <div>
            <div className="font-bold uppercase m-0 leading-tight whitespace-nowrap" style={{ fontSize: '14px' }}>PT GALLARDO UTAMA SENTOSA</div>
            <p className="m-0 leading-snug" style={{ fontSize: '12px', marginTop: '4px' }}>Ruko allicante blok D9-D10<br/>Kab. Tangerang Banten<br/>Indonesia</p>
          </div>
        </div>
        
        <div className="w-80">
          <div className="font-bold text-center mb-2" style={{ fontSize: '16px' }}>Faktur Penjualan</div>
          <table className="w-full border-collapse border border-black text-left" style={{ borderCollapse: 'collapse', border: '1px solid black', fontSize: '12px' }}>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 w-1/2" style={{ border: '1px solid black' }}>
                  <div className="text-xs">Tanggal</div>
                  <div className="font-bold">{format(date, 'dd MMM yyyy')}</div>
                </td>
                <td className="border border-black px-2 py-1 w-1/2" style={{ border: '1px solid black' }}>
                  <div className="text-xs">Nomor</div>
                  <div className="font-bold">RTL-{order.id.replace(/[^0-9]/g, '').slice(-8)}</div>
                </td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1" colSpan="2" style={{ border: '1px solid black' }}>
                  <div className="text-xs">Syarat Pembayaran</div>
                  <div className="font-bold">{order.paymentType || order.paymentMethod || 'C.O.D'}</div>
                  {(order.paymentType === 'Kredit Dagang' || order.paymentType === 'Kredit Dagang (Credit Term)') && (
                    <div className="mt-1 text-xs" style={{ borderTop: '1px dashed #000', paddingTop: '4px', marginTop: '4px' }}>
                      <div className="font-semibold mb-1">Batas Waktu Pelunasan:</div>
                      {order.terminSchedule && order.terminSchedule.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2px' }}>
                          {order.terminSchedule.map((t, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                              <span>{t.terminIndex === 1 && t.status === 'Lunas' ? 'DP Awal' : 'Pelunasan'}: {new Date(t.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              <span>{t.amount.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <div>Jatuh Tempo: {order.terminStartDate ? new Date(order.terminStartDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</div>
                          <div>Catatan: {order.terminNotes || '-'}</div>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <hr className="border-t-2 border-black mb-1" />
      <hr className="border-t border-black mb-4" />

      {/* KEPADA */}
      <div className="mb-4 text-sm" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '60px' }}>Kepada</div>
          <div style={{ width: '15px' }}>:</div>
          <div className="font-bold uppercase">{order.customerName || order.supplierName || 'CUSTOMER RETAIL'}</div>
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '60px' }}>Alamat</div>
          <div style={{ width: '15px' }}>:</div>
          <div>
            {order.customerAddress || 'Alamat tidak tersedia'}
            {order.customerHp ? ` (Telp: ${order.customerHp})` : ''}
          </div>
        </div>
      </div>

      {/* TABEL RINCIAN */}
      <table className="w-full border-collapse border border-black text-sm mb-4" style={{ borderCollapse: 'collapse', border: '1px solid black' }}>
        <thead>
          <tr className="border border-black">
            <th className="border border-black px-2 py-1 font-normal text-center w-24" style={{ border: '1px solid black' }}>Kode Barang</th>
            <th className="border border-black px-2 py-1 font-normal text-center" style={{ border: '1px solid black' }}>Nama Barang</th>
            <th className="border border-black px-2 py-1 font-normal text-center w-16" style={{ border: '1px solid black' }}>Meter</th>
            <th className="border border-black px-2 py-1 font-normal text-center w-24" style={{ border: '1px solid black' }}>@Harga</th>
            <th className="border border-black px-2 py-1 font-normal text-center w-24" style={{ border: '1px solid black' }}>Diskon</th>
            <th className="border border-black px-2 py-1 font-normal text-center w-32" style={{ border: '1px solid black' }}>Total Harga</th>
          </tr>
        </thead>
        <tbody>
          {(order.items || []).map((item, idx) => {
            const price = item.finalPrice !== undefined ? item.finalPrice : (item.price || item.harga || 0);
            const discount = item.discount || 0;
            const total = (price * item.qty) - discount;
            const idBarang = item.id_barang ? String(item.id_barang).substring(0, 6) : `10000${idx+1}`;
            
            const isMeteran = item.satuanBeli === 'Meteran (Ecer)' || item.isMeteran === true;
            
            // Validation Check: Memisahkan variabel secara eksplisit agar tidak bersinggungan
            const safeQty = Number(item.qty) || 1;
            const jumlahRoll = isMeteran ? 0 : safeQty;
            const jumlahMeterInput = isMeteran ? safeQty : 0;
            
            let konversi = item.konversi || 15;
            const kat = item.kategori || item.category || '';
            if (kat === 'Kaca Film') konversi = 30;
            else if (kat === 'PPF') konversi = 15;
            else if (!kat) {
               const upperName = (item.name || item.nama || '').toUpperCase();
               if (upperName.includes('KACA FILM') || upperName.includes('PERFORMANTE') || upperName.includes('DELUXE')) {
                  konversi = 30;
               } else if (upperName.includes('PPF') || upperName.includes('VANSGARD')) {
                  konversi = 15;
               }
            }
            
            const displayedMeter = isMeteran ? jumlahMeterInput : (jumlahRoll * konversi);
            const displayedPrice = price;
            
            // Update string (1 Roll) atau (X Meter) sesuai dengan qty terbaru
            let itemName = item.name || item.nama;
            if (itemName && !isMeteran && itemName.includes('(1 Roll)')) {
               itemName = itemName.replace('(1 Roll)', `(${safeQty} Roll)`);
            } else if (itemName && isMeteran && itemName.match(/\(\d+ Meter\)/)) {
               itemName = itemName.replace(/\(\d+ Meter\)/, `(${safeQty} Meter)`);
            }
            
            return (
              <tr key={idx} className="border border-black">
                <td className="border border-black px-2 py-1 text-left" style={{ border: '1px solid black' }}>{idBarang}</td>
                <td className="border border-black px-2 py-1 text-left" style={{ border: '1px solid black' }}>
                  {itemName}
                  {(item.catatan || item.notes || item.product_note) && (
                    <div style={{ fontSize: '10px', color: '#6b7280', fontWeight: 'normal', marginTop: '2px' }}>
                      Catatan: {item.catatan || item.notes || item.product_note}
                    </div>
                  )}
                </td>
                <td className="border border-black px-2 py-1 text-left" style={{ border: '1px solid black' }}>{displayedMeter}</td>
                <td className="border border-black px-2 py-1 text-left" style={{ border: '1px solid black' }}>{formatCurrency(displayedPrice)}</td>
                <td className="border border-black px-2 py-1 text-left" style={{ border: '1px solid black' }}>{formatCurrency(discount)}</td>
                <td className="border border-black px-2 py-1 text-left" style={{ border: '1px solid black' }}>{formatCurrency(total)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* TERBILANG & KALKULASI */}
      <div className="flex text-sm mb-4 gap-4">
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col space-y-1">
            <div className="whitespace-nowrap font-bold">Terbilang :</div>
            <div className="w-full py-1 italic">
              {getTerbilang(grandTotal)}
            </div>
          </div>
          <div className="flex flex-col space-y-1">
            <div className="whitespace-nowrap font-bold">Keterangan :</div>
            <div className="py-1 min-h-[80px] w-full italic">
              {getKeterangan()}
            </div>
          </div>
          {order.paymentHistory && order.paymentHistory.length > 0 && (
            <div className="flex flex-col space-y-1 mt-4">
              <div className="whitespace-nowrap font-bold">Riwayat Pembayaran :</div>
              <table className="w-full border-collapse border border-black text-xs" style={{ borderCollapse: 'collapse', border: '1px solid black' }}>
                <thead>
                  <tr className="border border-black bg-gray-100">
                    <th className="border border-black px-2 py-1 font-normal text-left" style={{ border: '1px solid black' }}>Tanggal</th>
                    <th className="border border-black px-2 py-1 font-normal text-left" style={{ border: '1px solid black' }}>Metode</th>
                    <th className="border border-black px-2 py-1 font-normal text-right" style={{ border: '1px solid black' }}>Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.paymentHistory.map((p, idx) => (
                    <tr key={idx} className="border border-black">
                      <td className="border border-black px-2 py-1 text-left" style={{ border: '1px solid black' }}>{new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="border border-black px-2 py-1 text-left" style={{ border: '1px solid black' }}>{p.method || '-'}</td>
                      <td className="border border-black px-2 py-1 text-right font-semibold" style={{ border: '1px solid black' }}>{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="w-72">
          <table className="w-full border-collapse border border-black text-sm" style={{ borderCollapse: 'collapse', border: '1px solid black' }}>
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1" style={{ border: '1px solid black' }}>Sub Total</td>
                <td className="border border-black px-2 py-1 text-right" style={{ border: '1px solid black' }}>{formatCurrency(calculatedSubTotal)}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1" style={{ border: '1px solid black' }}>Diskon</td>
                <td className="border border-black px-2 py-1 text-right" style={{ border: '1px solid black' }}>{formatCurrency(calculatedDiscount)}</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1" style={{ border: '1px solid black' }}>PPN (0%)</td>
                <td className="border border-black px-2 py-1 text-right" style={{ border: '1px solid black' }}>0</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1" style={{ border: '1px solid black' }}>Biaya Lain-lain</td>
                <td className="border border-black px-2 py-1 text-right" style={{ border: '1px solid black' }}>0</td>
              </tr>
              <tr className="border-2 border-black font-bold" style={{ border: '2px solid black' }}>
                <td className="border-2 border-black px-2 py-1" style={{ border: '2px solid black' }}>Total</td>
                <td className="border-2 border-black px-2 py-1 text-right" style={{ border: '2px solid black' }}>{formatCurrency(grandTotal)}</td>
              </tr>
              {(() => {
                const totalPaidHistory = (order.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);
                const sisaTagihan = Math.max(0, grandTotal - totalPaidHistory);
                return (
                  <>
                    <tr style={{ border: '1px solid black' }}>
                      <td className="border border-black px-2 py-1 font-bold" style={{ border: '1px solid black' }}>Total Dibayar</td>
                      <td className="border border-black px-2 py-1 text-right font-bold" style={{ border: '1px solid black' }}>{formatCurrency(totalPaidHistory)}</td>
                    </tr>
                    <tr style={{ border: '1px solid black' }}>
                      <td className="border border-black px-2 py-1 font-bold" style={{ border: '1px solid black', color: sisaTagihan > 0 ? '#dc2626' : 'inherit' }}>Sisa Tagihan</td>
                      <td className="border border-black px-2 py-1 text-right font-bold" style={{ border: '1px solid black', color: sisaTagihan > 0 ? '#dc2626' : 'inherit' }}>{formatCurrency(sisaTagihan)}</td>
                    </tr>
                  </>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* TANDA TANGAN & PERHATIAN */}
      <div className="flex text-sm mt-auto w-full items-end justify-between">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', width: '60%', marginTop: '32px', paddingRight: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>Disiapkan Oleh</div>
            <div style={{ borderTop: '1px solid black', paddingTop: '4px', width: '100%', textAlign: 'left' }}>Tgl</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>Disetujui Oleh</div>
            <div style={{ borderTop: '1px solid black', paddingTop: '4px', width: '100%', textAlign: 'left' }}>Tgl.</div>
          </div>
        </div>
        
        <div className="p-2 text-sm italic leading-tight w-[35%]">
          <div className="font-bold mb-1">Perhatian</div>
          <div>Barang yang sudah dibeli tidak dapat dikembalikan</div>
          <div className="mb-2">Harap membawa bukti transaksi ini saat melakukan claim</div>
          
          <div className="font-bold">Transfer Melalui BCA</div>
          <div className="font-bold">605-073-3252 A/n GALLARDO UTAMA SENTOSA PT</div>
        </div>
      </div>

    </div>
  );
}
