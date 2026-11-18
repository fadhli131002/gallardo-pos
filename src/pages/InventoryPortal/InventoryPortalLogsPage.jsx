import React, { useState } from 'react';
import { RefreshCw, ArrowLeft } from '@/icons/itshover';
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
    <div className="admin-inventory-page animate-fade-in">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Riwayat Pemotongan &amp; Mutasi Stok</h1>
          <p className="page-subtitle">
            Log pencatatan barang masuk (restock), pemotongan kasir POS, dan audit penyesuaian stok opname fisik
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link
            to="/inventory-portal/dashboard"
            className="btn-secondary"
            style={{ textDecoration: 'none', gap: '8px' }}
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Dashboard</span>
          </Link>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-secondary"
            style={{ gap: '8px', opacity: isRefreshing ? 0.7 : 1 }}
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan Log'}</span>
          </button>
        </div>
      </div>

      <InventoryLogsTable logs={inventoryLogs} />
    </div>
  );
};

export default InventoryPortalLogsPage;
