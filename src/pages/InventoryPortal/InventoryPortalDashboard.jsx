import React, { useState } from 'react';
import { MessageSquareWarning, Plus, RefreshCw } from '@/icons/itshover';
import { useInventory } from '../../context/InventoryContext';
import { useInventoryComms } from './context/InventoryCommsContext';
import MegaphoneButton from '../../components/MegaphoneButton';
import InventoryOverviewWidget from './components/InventoryOverviewWidget';
import MasterStockTable from './components/MasterStockTable';
import RestockModal from './components/RestockModal';
import AdjustModal from './components/AdjustModal';
import AddStockModal from './components/AddStockModal';
import NewDiscrepancyModal from './components/NewDiscrepancyModal';
import StockDiscrepancyComms from './components/StockDiscrepancyComms';
import InventoryLogsTable from './components/InventoryLogsTable';
import { toast } from 'sonner';

const InventoryPortalDashboard = () => {
  const {
    inventory,
    inventoryLogs,
    addStock,
    updateStock,
    refreshInventoryFromApi
  } = useInventory();

  const {
    openCount,
    totalUnreadCount = 0,
    createTicket
  } = useInventoryComms();

  const [activeTab, setActiveTab] = useState('master'); // 'master' | 'comms' | 'logs'
  const [isLowStockOnly, setIsLowStockOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal States
  const [restockModalItem, setRestockModalItem] = useState(null);
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [discrepancyModalItem, setDiscrepancyModalItem] = useState(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (typeof refreshInventoryFromApi === 'function') {
      await refreshInventoryFromApi();
    }
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Data stok inventaris disinkronkan');
    }, 400);
  };

  // Restock confirmation handler
  const handleConfirmRestock = async ({ itemId, stokUtama, stokPecahan, addedUtama, actionSummary, note }) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    await updateStock(itemId, {
      ...item,
      stokUtama,
      stokPecahan,
      keterangan: note || `Restock masuk +${actionSummary || `${addedUtama} ${item.satuan}`}`
    });
  };

  // Adjust / Opname confirmation handler
  const handleConfirmAdjust = async ({ itemId, stokUtama, stokPecahan, diffUtama, deltaSummary, reason, note }) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const deltaLabel = deltaSummary || `${diffUtama >= 0 ? '+' : ''}${diffUtama} ${item.satuan}`;
    await updateStock(itemId, {
      ...item,
      stokUtama,
      stokPecahan,
      keterangan: `Stok opname (${reason}): ${deltaLabel}. Catatan: ${note}`
    });
  };

  // Create ticket handler
  const handleCreateTicketSubmit = (ticketData) => {
    createTicket(ticketData);
    setActiveTab('comms');
  };

  return (
    <div className="admin-inventory-page animate-fade-in">
      {/* Page Header identik dengan AdminInventory.jsx */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">Inventory &amp; Stok</h1>
          <p className="page-subtitle">Kelola data material, konversi satuan, dan ketersediaan barang bengkel</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <MegaphoneButton showLabel={true} />
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{ gap: '8px', opacity: isRefreshing ? 0.7 : 1 }}
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsNewTicketModalOpen(true)}
            style={{ gap: '8px' }}
          >
            <MessageSquareWarning size={18} />
            <span>Lapor Selisih Stok</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsAddStockModalOpen(true)}
            style={{ gap: '8px', backgroundColor: '#111827' }}
          >
            <Plus size={18} />
            <span>Tambah Stok Masuk</span>
          </button>
        </div>
      </div>

      {/* 1. Overview Metric Cards (Gaya AdminDashboard) */}
      <InventoryOverviewWidget
        inventory={inventory}
        inventoryLogs={inventoryLogs}
        openDiscrepancies={openCount}
        isLowStockOnly={isLowStockOnly}
        onToggleLowStockFilter={() => setIsLowStockOnly(!isLowStockOnly)}
        onSwitchTab={(tab) => setActiveTab(tab)}
      />

      {/* 2. Navigation Tabs bergaya Pill Bento (Seragam dengan Referensi UI) */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '20px',
          backgroundColor: '#f1f5f9',
          padding: '5px',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          maxWidth: '100%',
          overflowX: 'auto'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('master')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13.5px',
            color: activeTab === 'master' ? '#ffffff' : '#64748b',
            backgroundColor: activeTab === 'master' ? '#111827' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'master' ? '0 2px 6px rgba(17, 24, 39, 0.15)' : 'none',
            transition: 'all 0.18s ease'
          }}
        >
          <span>Data Master Inventory</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '1px 7px',
              borderRadius: '999px',
              backgroundColor: activeTab === 'master' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
              color: activeTab === 'master' ? '#ffffff' : '#475569'
            }}
          >
            {inventory.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13.5px',
            color: activeTab === 'logs' ? '#ffffff' : '#64748b',
            backgroundColor: activeTab === 'logs' ? '#111827' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'logs' ? '0 2px 6px rgba(17, 24, 39, 0.15)' : 'none',
            transition: 'all 0.18s ease'
          }}
        >
          <span>Riwayat Pemotongan (Logs)</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '1px 7px',
              borderRadius: '999px',
              backgroundColor: activeTab === 'logs' ? 'rgba(255,255,255,0.2)' : '#e2e8f0',
              color: activeTab === 'logs' ? '#ffffff' : '#475569'
            }}
          >
            {inventoryLogs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comms')}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '13.5px',
            color: activeTab === 'comms' ? '#ffffff' : '#64748b',
            backgroundColor: activeTab === 'comms' ? '#111827' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap',
            boxShadow: activeTab === 'comms' ? '0 2px 6px rgba(17, 24, 39, 0.15)' : 'none',
            transition: 'all 0.18s ease'
          }}
        >
          <MessageSquareWarning size={15} />
          <span>Chat Selisih Stok (Gudang)</span>
          {totalUnreadCount > 0 ? (
            <span
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                padding: '1px 7px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 800
              }}
            >
              {totalUnreadCount} Pesan Baru
            </span>
          ) : openCount > 0 ? (
            <span
              style={{
                backgroundColor: activeTab === 'comms' ? '#f59e0b' : '#fef3c7',
                color: activeTab === 'comms' ? '#ffffff' : '#92400e',
                padding: '1px 7px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              {openCount} Open
            </span>
          ) : null}
        </button>
      </div>

      {/* 3. Tab Contents */}
      <div>
        {activeTab === 'master' && (
          <MasterStockTable
            inventory={inventory}
            isLowStockOnly={isLowStockOnly}
            onToggleLowStockFilter={() => setIsLowStockOnly(!isLowStockOnly)}
            onOpenRestock={(item) => setRestockModalItem(item)}
            onOpenAdjust={(item) => setAdjustModalItem(item)}
            onOpenDiscrepancy={(item) => {
              setDiscrepancyModalItem(item);
              setIsNewTicketModalOpen(true);
            }}
          />
        )}

        {activeTab === 'comms' && (
          <StockDiscrepancyComms
            onOpenNewTicketModal={() => {
              setDiscrepancyModalItem(null);
              setIsNewTicketModalOpen(true);
            }}
          />
        )}

        {activeTab === 'logs' && (
          <InventoryLogsTable logs={inventoryLogs} />
        )}
      </div>

      {/* 4. Modals */}
      <RestockModal
        isOpen={Boolean(restockModalItem)}
        onClose={() => setRestockModalItem(null)}
        item={restockModalItem}
        onConfirmRestock={handleConfirmRestock}
      />

      <AdjustModal
        isOpen={Boolean(adjustModalItem)}
        onClose={() => setAdjustModalItem(null)}
        item={adjustModalItem}
        onConfirmAdjust={handleConfirmAdjust}
        onFlagIssue={(ticketData) => {
          createTicket(ticketData);
          setActiveTab('comms');
        }}
      />

      <NewDiscrepancyModal
        isOpen={isNewTicketModalOpen}
        onClose={() => {
          setIsNewTicketModalOpen(false);
          setDiscrepancyModalItem(null);
        }}
        inventory={inventory}
        preselectedItem={discrepancyModalItem}
        onSubmitTicket={handleCreateTicketSubmit}
      />

      <AddStockModal
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        inventory={inventory}
        onAddStock={addStock}
      />
    </div>
  );
};

export default InventoryPortalDashboard;
