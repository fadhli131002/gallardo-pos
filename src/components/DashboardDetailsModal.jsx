import React from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardDetailsModal({ isOpen, onClose, type, data, loading }) {

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
      case 'piutang': return 'Rincian Piutang Belum Lunas';
      case 'omset': return 'Rincian Transaksi (Omset)';
      case 'laba-rugi': return 'Analisis Laba Rugi Transaksi';
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
      return (
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keterangan</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nominal</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.date)}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">
                  +{formatRupiah(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {item.customer_name || 'Tanpa Nama'}
                  <div className="text-xs text-gray-500 font-normal">{formatDate(item.created_at)}</div>
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item, idx) => (
              <tr key={idx}>
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                  {item.customer_name || 'Tanpa Nama'}
                  <div className="text-xs text-gray-500 font-normal">{formatDate(item.created_at)}</div>
                </td>
                <td className="px-4 py-3 text-sm text-blue-600 font-medium text-right">{formatRupiah(item.total_amount)}</td>
                <td className="px-4 py-3 text-sm text-red-600 font-medium text-right">-{formatRupiah(item.hpp)}</td>
                <td className="px-4 py-3 text-sm text-red-600 font-medium text-right">-{formatRupiah(item.komisi || 0)}</td>
                <td className={`px-4 py-3 text-sm font-bold text-right ${item.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.labaBersih > 0 ? '+' : ''}{formatRupiah(item.labaBersih)}
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
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden relative z-10"
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
