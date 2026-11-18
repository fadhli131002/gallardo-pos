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

      {/* 2. Navigation Tabs identik dengan AdminInventory.jsx */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: '0',
          overflowX: 'auto'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('master')}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'master' ? '2px solid #111' : '2px solid transparent',
            color: activeTab === 'master' ? '#111' : '#6b7280',
            fontWeight: activeTab === 'master' ? 'bold' : '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          Data Master Inventory
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'logs' ? '2px solid #111' : '2px solid transparent',
            color: activeTab === 'logs' ? '#111' : '#6b7280',
            fontWeight: activeTab === 'logs' ? 'bold' : '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          Riwayat Pemotongan (Logs)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comms')}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'comms' ? '2px solid #4f46e5' : '2px solid transparent',
            color: activeTab === 'comms' ? '#4f46e5' : '#6b7280',
            fontWeight: activeTab === 'comms' ? 'bold' : '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <MessageSquareWarning size={16} />
          <span>Chat Selisih Stok (Gudang)</span>
          {totalUnreadCount > 0 ? (
            <span
              style={{
                backgroundColor: '#10b981',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                boxShadow: '0 1px 3px rgba(16, 185, 129, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ffffff' }} />
              {totalUnreadCount} Pesan Baru
            </span>
          ) : openCount > 0 ? (
            <span
              style={{
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                border: '1px solid #fde68a'
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
