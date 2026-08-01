import React, { useState, useEffect } from 'react';
import { Package, History, AlertTriangle, ArrowUpRight, ArrowDownRight, Archive, Box } from 'lucide-react';
import { toast } from 'sonner';

export default function OwnerInventory({ isDarkMode }) {
  const [activeSubTab, setActiveSubTab] = useState('summary'); // 'summary' or 'ledger'
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${window.API_URL}/api/inventory`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setInventory(data.data);
      }
    } catch (err) {
      toast.error('Gagal mengambil data inventaris');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      // Fetch recent 100 logs
      const res = await fetch(`${window.API_URL}/api/inventory/logs?limit=100`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (err) {
      toast.error('Gagal mengambil data riwayat stok');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'summary') fetchInventory();
    else if (activeSubTab === 'ledger') fetchLogs();
  }, [activeSubTab]);

  return (
    <div className={`mt-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
      
      {/* Sub Tabs */}
      <div className={`flex space-x-4 mb-6 border-b pb-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <button 
          onClick={() => setActiveSubTab('summary')}
          className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'summary' 
              ? (isDarkMode ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-primary-600 border-b-2 border-primary-600')
              : (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
          }`}
        >
          <Package size={16} className="mr-2" />
          Ringkasan Stok Saat Ini
        </button>
        <button 
          onClick={() => setActiveSubTab('ledger')}
          className={`flex items-center px-4 py-2 text-sm font-medium transition-colors ${
            activeSubTab === 'ledger' 
              ? (isDarkMode ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-primary-600 border-b-2 border-primary-600')
              : (isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
          }`}
        >
          <History size={16} className="mr-2" />
          Riwayat Stok (Ledger)
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Memuat data...</div>
      ) : (
        <div className={`rounded-xl shadow-sm border overflow-hidden ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          
          {activeSubTab === 'summary' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={`uppercase ${isDarkMode ? 'bg-gray-900 text-gray-400 border-b border-gray-700' : 'bg-gray-50 text-gray-500 border-b border-gray-200'}`}>
                  <tr>
                    <th className="px-6 py-4 font-semibold">Barang / Produk</th>
                    <th className="px-6 py-4 font-semibold">Kategori</th>
                    <th className="px-6 py-4 font-semibold text-right">Stok Utama</th>
                    <th className="px-6 py-4 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {inventory.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8 text-gray-500">Tidak ada data inventaris</td></tr>
                  ) : (
                    inventory.map(item => (
                      <tr key={item.id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg mr-3 ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                              <Archive size={18} />
                            </div>
                            <div>
                              <div className="font-semibold">{item.brand} {item.varian}</div>
                              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{item.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{item.kategori}</td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium">{item.stok_utama}</span> {item.satuan}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.is_low_stock ? (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${isDarkMode ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-red-100 text-red-800 border-red-200'}`}>
                              <AlertTriangle size={12} className="mr-1" /> Menipis
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${isDarkMode ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-green-100 text-green-800 border-green-200'}`}>
                              Aman
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeSubTab === 'ledger' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className={`uppercase ${isDarkMode ? 'bg-gray-900 text-gray-400 border-b border-gray-700' : 'bg-gray-50 text-gray-500 border-b border-gray-200'}`}>
                  <tr>
                    <th className="px-6 py-4 font-semibold">Tanggal & Waktu</th>
                    <th className="px-6 py-4 font-semibold">Barang / Produk</th>
                    <th className="px-6 py-4 font-semibold">Aktivitas</th>
                    <th className="px-6 py-4 font-semibold text-right">Perubahan</th>
                    <th className="px-6 py-4 font-semibold">Keterangan</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {logs.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-500">Tidak ada riwayat pergerakan stok</td></tr>
                  ) : (
                    logs.map(log => (
                      <tr key={log.id} className={`transition-colors ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                        <td className={`px-6 py-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {new Date(log.created_at).toLocaleString('id-ID')}
                        </td>
                        <td className="px-6 py-4 font-medium">
                          {log.inventory?.brand} {log.inventory?.varian}
                        </td>
                        <td className="px-6 py-4">
                          {log.jenis === 'RESTOCK' && (
                            <span className={`inline-flex items-center font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                              <ArrowDownRight size={16} className="mr-1" /> Masuk
                            </span>
                          )}
                          {log.jenis === 'DEDUCT' && (
                            <span className={`inline-flex items-center font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                              <ArrowUpRight size={16} className="mr-1" /> Keluar
                            </span>
                          )}
                          {log.jenis === 'ADJUST' && (
                            <span className={`inline-flex items-center font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              <Box size={16} className="mr-1" /> Penyesuaian
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          {log.jenis === 'RESTOCK' ? '+' : (log.jenis === 'DEDUCT' ? '-' : '')}
                          {log.jumlah} <span className="text-xs font-normal text-gray-500">{log.inventory?.satuan}</span>
                        </td>
                        <td className={`px-6 py-4 text-xs max-w-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} title={log.keterangan}>
                          {log.keterangan || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
