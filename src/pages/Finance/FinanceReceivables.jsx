import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Eye, X, Image as ImageIcon } from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { formatTransactionId } from '../../utils/formatId';

const FinanceReceivables = () => {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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
    return (
      (r.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      formattedId.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Piutang Pelanggan</h1>
          <p className="text-gray-500 dark:text-gray-400">Daftar tagihan transaksi yang belum lunas (Read-Only)</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari pelanggan / ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm outline-none dark:text-white"
          />
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID TRX</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pelanggan</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Transaksi</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sisa Tagihan</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredReceivables.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-gray-500">Tidak ada data piutang</td>
                </tr>
              ) : (
                filteredReceivables.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6 text-sm font-medium text-gray-900 dark:text-white">{formatTransactionId(tx)}</td>
                    <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                      <div>{tx.customer_name || 'Tanpa Nama'}</div>
                      <div className="text-xs text-gray-400">{tx.car_brand} {tx.car_model}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-700 dark:text-gray-300">
                      {formatRupiah(tx.total_amount)}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-red-600 dark:text-red-400">
                      {formatRupiah(tx.sisa_tagihan)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                        {tx.status_pembayaran}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedTransaction(tx)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Bukti
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
    </div>
  );
};

export default FinanceReceivables;
