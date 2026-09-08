import React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';

export default function DashboardDetailsModal({ isOpen, onClose, type, data, loading }) {

  const handleOpenInvoice = (transactionId) => {
    if (!transactionId) return;
    const cleanId = String(transactionId).replace(/\//g, '-');
    window.open(`/sales/invoices/print/${cleanId}`, '_blank');
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: id });
    } catch {
      return dateString;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'kas-masuk': return 'Rincian Kas Masuk';
      case 'piutang': return 'Rincian Piutang Belum Lunas (All Time)';
      case 'piutang-periode': return 'Rincian Piutang Bulan Ini';
      case 'terkumpul': return 'Rincian Pembayaran Terkumpul (Cicilan & Termin)';
      case 'piutang-lama': return 'Rincian Pelunasan Piutang Lama (Cicilan Invoice Lalu)';
      case 'komisi': return 'Rincian Komisi Sales';
      case 'hpp': return 'Rincian HPP (Harga Pokok Penjualan)';
      case 'omset': return 'Rincian Transaksi (Omset)';
      case 'laba-rugi': return 'Analisis Laba Rugi Transaksi';
      case 'arus-kas':
      case 'net-cashflow':
      case 'cashflow': return 'Rincian Net Cashflow (Arus Kas Masuk & Keluar)';
      default: return 'Rincian';
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Tidak ada data untuk periode ini.
        </div>
      );
    }

    if (type === 'kas-masuk') {
      const totalKas = data.reduce((sum, item) => sum + (item.amount || 0), 0);
      return (
        <div className="flex flex-col gap-3">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan / Sumber Dana</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal Masuk</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatDate(item.date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-semibold text-gray-900">{item.description}</div>
                    {item.transaction && (
                      <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-gray-700">{item.transaction.customer_name}</span>
                        {item.transaction.plate_number && item.transaction.plate_number !== '-' && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[11px]">
                            {item.transaction.plate_number}
                          </span>
                        )}
                        {(item.transaction.car_brand || item.transaction.car_model) && (
                          <span className="text-gray-400">• {item.transaction.car_brand} {item.transaction.car_model}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">
                    +{formatRupiah(item.amount)}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {(item.transaction_id || item.transaction?.id) ? (
                      <button
                        type="button"
                        onClick={() => handleOpenInvoice(item.transaction_id || item.transaction?.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all shadow-sm active:scale-95 border border-blue-200/60"
                        title="Lihat & Cetak Invoice"
                      >
                        <FileText size={13} className="text-blue-600" />
                        <span>Invoice</span>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                <td colSpan="2" className="px-4 py-3 text-sm text-gray-700 text-right uppercase">
                  Total Kas Masuk ({data.length} transaksi):
                </td>
                <td className="px-4 py-3 text-sm font-black text-emerald-700 text-right">
                  +{formatRupiah(totalKas)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (type === 'piutang') {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Transaksi</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sisa Piutang</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  <div className="font-semibold text-gray-900">{item.customer_name || 'Tanpa Nama'}</div>
                  <div className="text-xs text-gray-500 font-normal flex items-center gap-1.5 mt-0.5">
                    <span>{formatDate(item.created_at)}</span>
                    {item.id && (
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[11px] font-mono">
                        #{item.id}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatRupiah(item.total_amount)}</td>
                <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">
                  {formatRupiah(item.sisa_tagihan)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 font-medium">
                    {item.status_pembayaran}
                  </span>
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleOpenInvoice(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all shadow-sm active:scale-95 border border-blue-200/60"
                    title="Lihat & Cetak Invoice"
                  >
                    <FileText size={13} className="text-blue-600" />
                    <span>Invoice</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (type === 'omset' || type === 'laba-rugi') {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaksi</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nilai Omset</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">HPP (Modal)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Potongan Komisi</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Laba Bersih</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  <div className="font-semibold text-gray-900">{item.customer_name || 'Tanpa Nama'}</div>
                  <div className="text-xs text-gray-500 font-normal flex items-center gap-1.5 mt-0.5">
                    <span>{formatDate(item.created_at)}</span>
                    {item.id && (
                      <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[11px] font-mono">
                        #{item.id}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-blue-600 font-semibold text-right">{formatRupiah(item.total_amount)}</td>
                <td className="px-4 py-3 text-sm text-red-600 font-medium text-right">-{formatRupiah(item.hpp)}</td>
                <td className="px-4 py-3 text-sm text-red-600 font-medium text-right">-{formatRupiah(item.komisi || 0)}</td>
                <td className={`px-4 py-3 text-sm font-bold text-right ${item.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.labaBersih > 0 ? '+' : ''}{formatRupiah(item.labaBersih)}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => handleOpenInvoice(item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all shadow-sm active:scale-95 border border-blue-200/60"
                    title="Lihat & Cetak Invoice"
                  >
                    <FileText size={13} className="text-blue-600" />
                    <span>Invoice</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (type === 'beban') {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.date)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.title}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{item.category}</td>
                <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">
                  {formatRupiah(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (type === 'arus-kas' || type === 'net-cashflow' || type === 'cashflow') {
      const totalIn = data.filter(i => i.type === 'IN').reduce((sum, i) => sum + (i.amount || 0), 0);
      const totalOut = data.filter(i => i.type === 'OUT').reduce((sum, i) => sum + (i.amount || 0), 0);
      const net = totalIn - totalOut;

      return (
        <div className="flex flex-col gap-4">
          {/* Summary Mini Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1">
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-3 flex flex-col">
              <span className="text-xs font-semibold text-emerald-700">Total Kas Masuk (IN)</span>
              <span className="text-lg font-black text-emerald-800 mt-1">+{formatRupiah(totalIn)}</span>
            </div>
            <div className="bg-rose-50/80 border border-rose-200/80 rounded-xl p-3 flex flex-col">
              <span className="text-xs font-semibold text-rose-700">Total Kas Keluar (OUT)</span>
              <span className="text-lg font-black text-rose-800 mt-1">-{formatRupiah(totalOut)}</span>
            </div>
            <div className={`${net >= 0 ? 'bg-cyan-50/80 border-cyan-200/80' : 'bg-amber-50/80 border-amber-200/80'} border rounded-xl p-3 flex flex-col`}>
              <span className={`text-xs font-semibold ${net >= 0 ? 'text-cyan-700' : 'text-amber-700'}`}>Net Cashflow (Selisih)</span>
              <span className={`text-lg font-black mt-1 ${net >= 0 ? 'text-cyan-900' : 'text-rose-600'}`}>
                {net < 0 ? '-' : ''}{formatRupiah(Math.abs(net))}
              </span>
            </div>
          </div>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aliran</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan / Sumber Dana</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kas Masuk (IN)</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kas Keluar (OUT)</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">{formatDate(item.date)}</td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      item.type === 'IN' 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {item.type === 'IN' ? 'MASUK' : 'KELUAR'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="font-semibold text-gray-900">{item.description}</div>
                    {item.transaction && (
                      <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium text-gray-700">{item.transaction.customer_name}</span>
                        {item.transaction.plate_number && item.transaction.plate_number !== '-' && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-[11px]">
                            {item.transaction.plate_number}
                          </span>
                        )}
                        {(item.transaction.car_brand || item.transaction.car_model) && (
                          <span className="text-gray-400">• {item.transaction.car_brand} {item.transaction.car_model}</span>
                        )}
                      </div>
                    )}
                    {item.referenceId && !item.transaction && (
                      <div className="text-xs text-gray-400 font-mono mt-0.5">
                        Ref: {item.referenceId}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right whitespace-nowrap">
                    {item.type === 'IN' ? `+${formatRupiah(item.amount)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-rose-600 text-right whitespace-nowrap">
                    {item.type === 'OUT' ? `-${formatRupiah(item.amount)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {(item.transaction_id || item.transaction?.id) ? (
                      <button
                        type="button"
                        onClick={() => handleOpenInvoice(item.transaction_id || item.transaction?.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all shadow-sm active:scale-95 border border-blue-200/60"
                        title="Lihat & Cetak Invoice"
                      >
                        <FileText size={13} className="text-blue-600" />
                        <span>Invoice</span>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50/90 font-bold border-t-2 border-gray-300">
                <td colSpan="3" className="px-4 py-3 text-sm text-gray-700 uppercase tracking-wider text-right">
                  Total ({data.length} Arus Kas):
                </td>
                <td className="px-4 py-3 text-sm font-black text-emerald-700 text-right whitespace-nowrap">
                  +{formatRupiah(totalIn)}
                </td>
                <td className="px-4 py-3 text-sm font-black text-rose-700 text-right whitespace-nowrap">
                  -{formatRupiah(totalOut)}
                </td>
                <td className="px-4 py-3 text-center text-xs font-bold text-slate-700 whitespace-nowrap">
                  Net: {net < 0 ? '-' : ''}{formatRupiah(Math.abs(net))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    if (type === 'terkumpul' || type === 'piutang-lama') {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Pembayaran</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan / Transaksi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metode</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah Masuk</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.payment_date)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {item.transaction?.customer_name || 'Pelanggan Umum'}
                  <div className="text-xs text-gray-500 font-normal">
                    {item.transaction?.plate_number ? `${item.transaction.plate_number} • ` : ''}Order #{item.transaction_id}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-medium">
                    {item.method || 'Tunai / Cash'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 text-xs">{item.notes || '-'}</td>
                <td className="px-4 py-3 text-sm font-bold text-green-600 text-right">
                  +{formatRupiah(item.amount)}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {(item.transaction?.id || item.transaction_id) ? (
                    <button
                      type="button"
                      onClick={() => handleOpenInvoice(item.transaction?.id || item.transaction_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all shadow-sm active:scale-95 border border-blue-200/60"
                      title="Lihat & Cetak Invoice"
                    >
                      <FileText size={13} className="text-blue-600" />
                      <span>Invoice</span>
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (type === 'komisi') {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Transaksi</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales / PIC</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Transaksi</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Komisi Sales</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.created_at)}</td>
                <td className="px-4 py-3 text-sm text-blue-700 font-bold">{item.sales_name || '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {item.customer_name || 'Tanpa Nama'}
                  <div className="text-xs text-gray-400">Order #{item.id}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatRupiah(item.total_amount)}</td>
                <td className="px-4 py-3 text-sm font-bold text-purple-600 text-right">
                  {formatRupiah(item.commission)}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {item.id ? (
                    <button
                      type="button"
                      onClick={() => handleOpenInvoice(item.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all shadow-sm active:scale-95 border border-blue-200/60"
                      title="Lihat & Cetak Invoice"
                    >
                      <FileText size={13} className="text-blue-600" />
                      <span>Invoice</span>
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (type === 'hpp') {
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Pemakaian</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item / Bahan</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan / Plat</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pemakaian</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Modal (HPP)</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Invoice</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.created_at)}</td>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.product_name}</td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.customer_name}
                  {item.plate_number && item.plate_number !== '-' ? (
                    <div className="text-xs text-gray-400">{item.plate_number}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 text-center">
                  {item.jumlah} {item.satuan}
                </td>
                <td className="px-4 py-3 text-sm font-bold text-red-600 text-right">
                  {formatRupiah(item.totalModal)}
                </td>
                <td className="px-4 py-3 text-center whitespace-nowrap">
                  {item.transaction_id ? (
                    <button
                      type="button"
                      onClick={() => handleOpenInvoice(item.transaction_id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all shadow-sm active:scale-95 border border-blue-200/60"
                      title="Lihat & Cetak Invoice"
                    >
                      <FileText size={13} className="text-blue-600" />
                      <span>Invoice</span>
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return null;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden relative z-10"
          >
            {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">{getTitle()}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-2">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            Tutup
          </button>
        </div>
      </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
