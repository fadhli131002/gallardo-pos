import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight, Save, Loader2, Download, Calendar as CalendarIcon } from 'lucide-react';
import { exportToCSV } from '../../utils/exportCSV';

const FinanceCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('Bulan Ini');
  const [expandedRows, setExpandedRows] = useState({});
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    fetchCommissions();
  }, [dateFilter]);

  const fetchCommissions = async () => {
    try {
      setLoading(true);
      
      let query = '';
      const now = new Date();
      let startDate = '';
      let endDate = '';
    
      if (dateFilter === 'Hari Ini') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      } else if (dateFilter === 'Bulan Ini') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      } else if (dateFilter === 'Tahun Ini') {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
      }
    
      if (dateFilter !== 'Semua Waktu') {
        query = `?startDate=${startDate}&endDate=${endDate}`;
      }

      const url = window.API_URL ? `${window.API_URL}/api/finance/commissions${query}` : `/api/finance/commissions${query}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengambil data komisi sales');
      const data = await res.json();
      setCommissions(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (salesId) => {
    setExpandedRows(prev => ({ ...prev, [salesId]: !prev[salesId] }));
  };

  const handleUpdateCommission = async (transactionId, newCommission) => {
    try {
      setSavingId(transactionId);
      const url = window.API_URL ? `${window.API_URL}/api/finance/commissions/${transactionId}` : `/api/finance/commissions/${transactionId}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ commissionAmount: newCommission })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Gagal menyimpan komisi');
      }
      
      toast.success('Komisi berhasil disimpan');
      // Re-fetch data to recalculate everything
      fetchCommissions();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingId(null);
    }
  };

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  const handleExport = () => {
    const headers = ['Nama Sales', 'Total Transaksi Lunas', 'Total Omset', 'Total Komisi'];
    const data = commissions.map(sales => [
      sales.sales_name || 'Tanpa Nama',
      sales.total_transactions,
      sales.total_omset,
      sales.total_komisi
    ]);
    exportToCSV(data, headers, `Laporan_Komisi_${dateFilter.replace(' ', '_')}_${new Date().getTime()}`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 hidden">Laporan Komisi Sales</h1>
          <p className="text-sm font-semibold text-gray-800">Rekapitulasi komisi berdasarkan transaksi lunas</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm font-medium transition-all appearance-none cursor-pointer w-full sm:w-auto min-w-[140px]"
            >
              <option value="Hari Ini">Hari Ini</option>
              <option value="Bulan Ini">Bulan Ini</option>
              <option value="Tahun Ini">Tahun Ini</option>
              <option value="Semua Waktu">Semua Waktu</option>
            </select>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
      >
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Nama Sales</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">Total Transaksi (Lunas)</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Total Omset</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Total Komisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    Memuat data komisi...
                  </td>
                </tr>
              ) : commissions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    Tidak ada data transaksi lunas pada periode ini.
                  </td>
                </tr>
              ) : (
                commissions.map((item, index) => (
                  <Fragment key={item.sales_id}>
                    <tr 
                      className="hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => toggleRow(item.sales_id)}
                    >
                      <td className="p-4 text-gray-400 group-hover:text-primary-600 transition-colors">
                        {expandedRows[item.sales_id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {item.sales_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-center text-gray-700">
                        <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-medium">
                          {item.total_transactions}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-gray-900 font-medium whitespace-nowrap">
                        {formatRupiah(item.total_omset)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-green-700 font-bold whitespace-nowrap">
                        {formatRupiah(item.estimated_commission)}
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedRows[item.sales_id] && (
                        <motion.tr 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-gray-50/80"
                        >
                          <td colSpan="5" className="p-0 border-b border-gray-100">
                            <div className="p-4 pl-14">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Detail Transaksi</h4>
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-gray-500 border-b border-gray-200 bg-white shadow-sm">
                                    <th className="py-2 px-3 text-left font-medium rounded-tl-lg">ID Transaksi</th>
                                    <th className="py-2 px-3 text-left font-medium">Tanggal</th>
                                    <th className="py-2 px-3 text-left font-medium">Customer</th>
                                    <th className="py-2 px-3 text-right font-medium">Total Nominal</th>
                                    <th className="py-2 px-3 text-right font-medium rounded-tr-lg w-48">Komisi (Rp)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {item.transactions?.map(trx => (
                                      <tr key={trx.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-3 text-gray-800 font-medium">TRX/{trx.id}</td>
                                      <td className="py-3 px-3 text-gray-600">
                                        {new Date(trx.date).toLocaleDateString('id-ID')}
                                      </td>
                                      <td className="py-3 px-3 text-gray-600">{trx.customer_name || '-'}</td>
                                      <td className="py-3 px-3 text-right text-gray-800">{formatRupiah(trx.total_amount)}</td>
                                      <td className="py-3 px-3 text-right">
                                        <div className="flex items-center justify-end gap-2 relative">
                                          {trx.is_manual ? (
                                            <span className="absolute -left-4 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" title="Komisi Manual"></span>
                                          ) : null}
                                          <input 
                                            type="number"
                                            defaultValue={trx.commission}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.target.blur();
                                              }
                                            }}
                                            onBlur={(e) => {
                                              const val = e.target.value;
                                              if (val !== '' && Number(val) !== trx.commission) {
                                                handleUpdateCommission(trx.id, Number(val));
                                              }
                                            }}
                                            disabled={savingId === trx.id}
                                            className="w-32 px-3 py-1.5 text-right text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-gray-50 focus:bg-white transition-colors"
                                            placeholder="Default 5%"
                                          />
                                          <button 
                                            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-primary-600 transition-colors"
                                            title="Simpan perubahan"
                                            onClick={(e) => {
                                              // Steal focus to trigger onBlur on the input
                                              e.currentTarget.focus();
                                            }}
                                          >
                                            {savingId === trx.id ? <Loader2 size={16} className="animate-spin text-primary-500" /> : <Save size={16} />}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                ))
              )}
            </tbody>
            {!loading && commissions.length > 0 && (
              <tfoot className="bg-gray-50/80 font-bold text-gray-900 border-t-2 border-gray-200">
                <tr>
                  <td className="py-4 px-6 text-sm" colSpan="2">TOTAL KESELURUHAN</td>
                  <td className="py-4 px-6 text-sm text-center">
                    <span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full">
                      {commissions.reduce((sum, item) => sum + item.total_transactions, 0)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-sm text-right whitespace-nowrap">
                    {formatRupiah(commissions.reduce((sum, item) => sum + item.total_omset, 0))}
                  </td>
                  <td className="py-4 px-6 text-sm text-right text-green-700 whitespace-nowrap">
                    {formatRupiah(commissions.reduce((sum, item) => sum + item.estimated_commission, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default FinanceCommissions;
