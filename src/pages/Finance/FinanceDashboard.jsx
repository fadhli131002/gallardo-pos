import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

const FinanceDashboard = () => {
  const [summary, setSummary] = useState({
    totalKasMasuk: 0,
    totalPiutang: 0,
    labaRugi: 0,
    totalOmset: 0,
    totalHpp: 0
  });
  const [dateFilter, setDateFilter] = useState('Hari Ini');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [dateFilter]);

  const fetchDashboardData = async () => {
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

      const url = window.API_URL ? `${window.API_URL}/api/finance/dashboard${query}` : `/api/finance/dashboard${query}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengambil data dashboard keuangan');
      const data = await res.json();
      setSummary(data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Keuangan</h1>
          <p className="text-gray-500 dark:text-gray-400">Ringkasan kas, piutang, dan profitabilitas</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kas Masuk Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Kas Masuk (Hari Ini)</h3>
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {formatRupiah(summary.totalKasMasuk)}
          </div>
        </motion.div>

        {/* Piutang Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Piutang (Belum Lunas)</h3>
            <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {formatRupiah(summary.totalPiutang)}
          </div>
        </motion.div>

        {/* Laba/Rugi Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Laba / Rugi Standar</h3>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${summary.labaRugi >= 0 ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {summary.labaRugi >= 0 ? (
                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {formatRupiah(summary.labaRugi)}
          </div>
          <div className="text-xs text-gray-400 mt-auto">
            Omset: {formatRupiah(summary.totalOmset)} | HPP: {formatRupiah(summary.totalHpp)}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
