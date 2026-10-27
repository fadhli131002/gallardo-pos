import React, { useState } from 'react';
import { History, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import InventoryLogsTable from './components/InventoryLogsTable';

const InventoryPortalLogsPage = () => {
  const { inventoryLogs, refreshInventoryFromApi } = useInventory();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (typeof refreshInventoryFromApi === 'function') {
      await refreshInventoryFromApi();
    }
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bento Header Container */}
      <div
        className="w-full bg-white border border-slate-200/90 rounded-2xl px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-row items-center justify-between gap-6"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {/* Left: Icon + Title + Subtitle + Badge */}
        <div className="flex items-center gap-4 min-w-0 text-left">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
            <History size={22} className="text-indigo-600" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Riwayat Mutasi & Opname Gudang
              </h1>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 font-mono tracking-tight flex-shrink-0">
                Audit & Log Real-Time
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-normal mt-1 leading-relaxed text-left">
              Log pencatatan barang masuk (restock), pemotongan kasir POS, dan audit penyesuaian stok opname fisik.
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link
            to="/inventory-portal/dashboard"
            className="h-10 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-95"
          >
            <ArrowLeft size={14} className="text-slate-500" />
            <span>Kembali ke Dashboard</span>
          </Link>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-95 disabled:opacity-50"
            title="Sinkronkan log terbaru dari server"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan Log'}</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <InventoryLogsTable logs={inventoryLogs} />
    </div>
  );
};

export default InventoryPortalLogsPage;
