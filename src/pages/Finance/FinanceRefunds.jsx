import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { formatRupiah } from '../../utils/formatRupiah';
import { formatTransactionId } from '../../utils/formatId';
import { exportToCSV } from '../../utils/exportCSV';
import { Search, RotateCcw, AlertTriangle, X, CheckCircle2, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FinanceRefunds = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('history'); // history | create
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Search state for "Buat Refund Baru"
  const [searchTxId, setSearchTxId] = useState('');
  const [isSearchingTx, setIsSearchingTx] = useState(false);
  const [searchedTransaction, setSearchedTransaction] = useState(null);

  // Refund Form State
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchRefundHistory();
    }
  }, [activeTab]);

  const fetchRefundHistory = async () => {
    try {
      setLoading(true);
      const url = window.API_URL ? `${window.API_URL}/api/finance/refunds` : '/api/finance/refunds';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal memuat riwayat refund');
      const data = await res.json();
      setRefunds(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTransaction = async (e) => {
    e.preventDefault();
    if (!searchTxId.trim()) return;

    let cleanId = searchTxId;
    if (searchTxId.includes('/')) {
      const parts = searchTxId.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart.length >= 4) {
        cleanId = lastPart.slice(-4);
      }
    }
    cleanId = cleanId.replace(/\D/g, '');
    
    if (!cleanId) {
      toast.error('Format ID Transaksi tidak valid');
      return;
    }

    try {
      setIsSearchingTx(true);
      setSearchedTransaction(null);
      const url = window.API_URL ? `${window.API_URL}/api/transactions/${cleanId}` : `/api/transactions/${cleanId}`;
      
      const token = sessionStorage.getItem('token');
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        if (res.status === 404) throw new Error('Transaksi tidak ditemukan');
        throw new Error('Gagal mencari transaksi');
      }
      
      const data = await res.json();
      setSearchedTransaction(data);
      setRefundAmount('');
      setRefundReason('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSearchingTx(false);
    }
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!searchedTransaction) return;
    if (!refundAmount || Number(refundAmount) <= 0) {
      toast.error('Nominal refund harus lebih dari 0');
      return;
    }
    if (!refundReason) {
      toast.error('Alasan refund wajib diisi');
      return;
    }

    try {
      setIsProcessing(true);
      const url = window.API_URL ? `${window.API_URL}/api/finance/refund` : `/api/finance/refund`;
      const token = sessionStorage.getItem('token');
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          transactionId: searchedTransaction.id,
          refundAmount: Number(refundAmount),
          refundReason: refundReason
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gagal memproses refund');

      toast.success('Refund berhasil diproses');
      
      // Reset form & go to history
      setSearchedTransaction(null);
      setSearchTxId('');
      setRefundAmount('');
      setRefundReason('');
      setActiveTab('history');
      
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRefunds = refunds.filter(item => 
    item.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.id.toString().includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredRefunds.length / itemsPerPage);
  const paginatedData = filteredRefunds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    const headers = ['ID TRX', 'Pelanggan', 'Total Transaksi', 'Total Refund', 'Alasan Refund'];
    const data = filteredRefunds.map(tx => [
      formatTransactionId(tx),
      tx.customer_name || 'Tanpa Nama',
      tx.total_amount,
      tx.refund_amount,
      tx.refund_reason
    ]);
    exportToCSV(data, headers, `Laporan_Refund_${new Date().getTime()}`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 hidden">Refund Transaksi</h1>
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Riwayat Refund
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'create' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Buat Refund Baru
            </button>
          </div>
        </div>
        
        {activeTab === 'history' && (
          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari pelanggan / ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm outline-none transition-all"
              />
            </div>
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {activeTab === 'history' ? (
          <>
            <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">ID TRX</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Pelanggan</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total Transaksi</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total Refund</th>
                  <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Alasan Refund</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500">Memuat data...</td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500">Tidak ada data refund</td>
                  </tr>
                ) : (
                  paginatedData.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="py-3 px-6 text-sm font-medium text-gray-900 whitespace-nowrap">{formatTransactionId(tx)}</td>
                      <td className="py-3 px-6 text-sm text-gray-700">
                        <div className="font-medium">{tx.customer_name || 'Tanpa Nama'}</div>
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-700 whitespace-nowrap">
                        {formatRupiah(tx.total_amount)}
                      </td>
                      <td className="py-3 px-6 text-sm font-bold text-red-600 whitespace-nowrap">
                        {formatRupiah(tx.refund_amount)}
                      </td>
                      <td className="py-3 px-6 text-sm text-gray-500 max-w-xs truncate">
                        {tx.refund_reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Footer */}
          {!loading && filteredRefunds.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
              <span className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredRefunds.length)}</span> of <span className="font-medium text-gray-900">{filteredRefunds.length}</span> items
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          </>
        ) : (
          <div className="p-6 md:p-8 max-w-3xl mx-auto w-full">
            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-6 mb-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="text-red-600 dark:text-red-400 w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-400 mb-1">Perhatian!</h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Proses refund akan menarik dana dari Kas Keluar di dashboard keuangan Anda. Pastikan nominal dan tujuan pengembalian dana sudah sesuai dengan SOP perusahaan.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSearchTransaction} className="mb-8">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cari ID Transaksi
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchTxId}
                    onChange={(e) => setSearchTxId(e.target.value)}
                    placeholder="Contoh: 102 atau TRX-102"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:text-white transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingTx}
                  className="px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  {isSearchingTx ? 'Mencari...' : 'Cari'}
                </button>
              </div>
            </form>

            {searchedTransaction && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
              >
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Detail Transaksi Ditemukan
                  </h4>
                </div>
                
                <form onSubmit={handleProcessRefund} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Nama Pelanggan</div>
                      <div className="font-medium text-gray-900 dark:text-white text-lg">
                        {searchedTransaction.customer_name || 'Tanpa Nama'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {searchedTransaction.car_brand} {searchedTransaction.car_model} - {searchedTransaction.plate_number}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-500">Total Transaksi</span>
                          <span className="font-semibold dark:text-white">{formatRupiah(searchedTransaction.total_amount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                          <span className="text-sm">Total Telah Dibayar</span>
                          <span className="font-semibold">{formatRupiah(searchedTransaction.total_amount - searchedTransaction.sisa_tagihan)}</span>
                        </div>
                        {searchedTransaction.refund_amount > 0 && (
                          <div className="flex justify-between items-center text-orange-500 mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm">Riwayat Refund Sebelumnya</span>
                            <span className="font-semibold">{formatRupiah(searchedTransaction.refund_amount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nominal Refund (Rp) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={refundAmount ? Number(refundAmount).toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          setRefundAmount(raw);
                        }}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:text-white transition-all text-lg font-medium"
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Maksimal yang bisa di-refund saat ini: <strong>{formatRupiah((searchedTransaction.total_amount - searchedTransaction.sisa_tagihan) - (searchedTransaction.refund_amount || 0))}</strong>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Alasan Refund <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:text-white transition-all resize-none"
                        placeholder="Jelaskan alasan pengembalian dana..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSearchedTransaction(null)}
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                      <RotateCcw size={18} />
                      {isProcessing ? 'Memproses...' : 'Setujui Refund'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceRefunds;
