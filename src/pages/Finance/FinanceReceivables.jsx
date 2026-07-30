import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Eye, X, Image as ImageIcon, Download, ChevronLeft, ChevronRight, Filter, Plus, Printer, MoreHorizontal, Shield } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { formatTransactionId } from '../../utils/formatId';
import { exportToCSV } from '../../utils/exportCSV';
import PrintInvoiceHandler from '../../components/PrintInvoiceHandler';
import PrintWarrantyHandler, { hasWarranty } from '../../components/PrintWarrantyHandler';

const FinanceReceivables = () => {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isPrintInvoiceOpen, setIsPrintInvoiceOpen] = useState(false);
  const [selectedPrintInvoice, setSelectedPrintInvoice] = useState(null);
  const [isPrintWarrantyOpen, setIsPrintWarrantyOpen] = useState(false);
  const [selectedPrintWarranty, setSelectedPrintWarranty] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReceivables();
  }, []);

  const fetchReceivables = async () => {
    try {
      setLoading(true);
      const url = window.API_URL ? `${window.API_URL}/api/finance/receivables` : '/api/finance/receivables';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal memuat daftar piutang');
      const data = await res.json();
      setReceivables(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };



  const filteredReceivables = receivables.filter(r => {
    const formattedId = formatTransactionId(r).toLowerCase();
    const matchesSearch = (r.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || formattedId.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'Semua' || r.status_pembayaran.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredReceivables.length / itemsPerPage);
  const paginatedData = filteredReceivables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    const headers = ['ID TRX', 'Pelanggan', 'Total Transaksi', 'Sisa Tagihan', 'Status'];
    const data = filteredReceivables.map(tx => [
      formatTransactionId(tx),
      tx.customer_name || 'Tanpa Nama',
      tx.total_amount,
      tx.sisa_tagihan,
      tx.status_pembayaran
    ]);
    exportToCSV(data, headers, `Laporan_Piutang_${new Date().getTime()}`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* New Page Header */}
      <div className="mb-6 text-left">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Piutang Pelanggan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola dan pantau status tagihan piutang dari setiap transaksi pelanggan</p>
      </div>

      {/* Integrated Toolbar */}
      <div className="mb-6 flex flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex gap-3 flex-1">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari berdasarkan Nama Pelanggan, ID TRX, atau ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm outline-none transition-all"
            />
          </div>
          <div className="relative hidden sm:block w-48 flex-shrink-0">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Belum Bayar">Belum Lunas</option>
              <option value="DP">DP / Sebagian</option>
            </select>
          </div>
        </div>
        <div className="flex-shrink-0">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm relative group"
            title="Unduh Data Hasil Pencarian Saat Ini"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">ID TRX</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Pelanggan</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total Transaksi</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Sisa Tagihan</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500">Tidak ada data piutang</td>
                </tr>
              ) : (
                paginatedData.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="py-3 px-6 text-sm font-medium text-gray-900 whitespace-nowrap">{formatTransactionId(tx)}</td>
                    <td className="py-3 px-6 text-sm text-gray-700">
                      <div className="font-medium">{tx.customer_name || 'Tanpa Nama'}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{tx.car_brand} {tx.car_model}</div>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-700 whitespace-nowrap">
                      {formatRupiah(tx.total_amount)}
                    </td>
                    <td className="py-3 px-6 text-sm font-bold text-red-700 whitespace-nowrap">
                      {formatRupiah(tx.sisa_tagihan)}
                    </td>
                    <td className="py-3 px-6 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                        tx.status_pembayaran.toLowerCase().includes('dp') || tx.status_pembayaran.toLowerCase().includes('sebagian')
                          ? 'bg-amber-100 text-amber-800 border-amber-200' 
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {tx.status_pembayaran}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={() => setSelectedTransaction(tx)}
                          title="Lihat Bukti"
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedPrintInvoice(tx); setIsPrintInvoiceOpen(true); }}
                          title="Print Nota"
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {hasWarranty(tx) && (
                          <button
                            onClick={() => { setSelectedPrintWarranty(tx); setIsPrintWarrantyOpen(true); }}
                            title="Cetak Garansi"
                            className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          title="Lainnya"
                          className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && filteredReceivables.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
            <span className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredReceivables.length)}</span> of <span className="font-medium text-gray-900">{filteredReceivables.length}</span> items
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
      </div>

      {/* Payment Proof Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bukti Pembayaran</h3>
                <p className="text-sm text-gray-500">{formatTransactionId(selectedTransaction)} - {selectedTransaction.customer_name}</p>
              </div>
              <button onClick={() => setSelectedTransaction(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {(!selectedTransaction.payments || selectedTransaction.payments.length === 0) ? (
                <div className="text-center py-8 text-gray-500">Belum ada riwayat pembayaran.</div>
              ) : (
                <div className="space-y-6">
                  {selectedTransaction.payments.map((payment, idx) => (
                    <div key={payment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">Termin {idx + 1}: {formatRupiah(payment.amount)}</p>
                          <p className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleString('id-ID')} - {payment.method}</p>
                        </div>
                        {payment.notes && <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">{payment.notes}</span>}
                      </div>
                      <div className="p-4 flex justify-center bg-gray-100 dark:bg-gray-800">
                        {payment.payment_proof ? (
                          <img src={payment.payment_proof} alt={`Bukti Pembayaran Termin ${idx + 1}`} className="max-w-full h-auto max-h-64 object-contain rounded" />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p className="text-sm">Tidak ada foto bukti</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={() => setSelectedTransaction(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handlers */}
      <PrintInvoiceHandler
        isOpen={isPrintInvoiceOpen}
        onClose={() => setIsPrintInvoiceOpen(false)}
        transaction={selectedPrintInvoice}
      />
      <PrintWarrantyHandler
        isOpen={isPrintWarrantyOpen}
        onClose={() => setIsPrintWarrantyOpen(false)}
        transaction={selectedPrintWarranty}
      />
    </div>
  );
};

export default FinanceReceivables;
