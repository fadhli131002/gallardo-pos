import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const FinanceCommissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('Bulan Ini');

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

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Komisi Sales</h1>
          <p className="text-gray-500 dark:text-gray-400">Rekapitulasi komisi berdasarkan transaksi lunas</p>
        </div>
        <div>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="Hari Ini">Hari Ini</option>
            <option value="Bulan Ini">Bulan Ini</option>
            <option value="Tahun Ini">Tahun Ini</option>
            <option value="Semua Waktu">Semua Waktu</option>
          </select>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                <th className="p-4 font-medium">Nama Sales</th>
                <th className="p-4 font-medium text-center">Total Transaksi (Lunas)</th>
                <th className="p-4 font-medium text-right">Total Omset</th>
                <th className="p-4 font-medium text-right">Estimasi Komisi (5%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
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
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 dark:text-white">
                      {item.sales_name}
                    </td>
                    <td className="p-4 text-center text-gray-600 dark:text-gray-300">
                      {item.total_transactions}
                    </td>
                    <td className="p-4 text-right text-gray-900 dark:text-white font-medium">
                      {formatRupiah(item.total_omset)}
                    </td>
                    <td className="p-4 text-right text-green-600 dark:text-green-400 font-bold">
                      {formatRupiah(item.estimated_commission)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {!loading && commissions.length > 0 && (
              <tfoot className="bg-gray-50 dark:bg-gray-900/50 font-bold text-gray-900 dark:text-white">
                <tr>
                  <td className="p-4">TOTAL</td>
                  <td className="p-4 text-center">
                    {commissions.reduce((sum, item) => sum + item.total_transactions, 0)}
                  </td>
                  <td className="p-4 text-right">
                    {formatRupiah(commissions.reduce((sum, item) => sum + item.total_omset, 0))}
                  </td>
                  <td className="p-4 text-right text-green-600 dark:text-green-400">
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
