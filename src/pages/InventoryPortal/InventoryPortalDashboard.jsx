import React, { useState } from 'react';
import { Package, MessageSquareWarning, History, Plus, RefreshCw, Warehouse, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import { useInventoryComms } from './context/InventoryCommsContext';
import InventoryOverviewWidget from './components/InventoryOverviewWidget';
import MasterStockTable from './components/MasterStockTable';
import RestockModal from './components/RestockModal';
import AdjustModal from './components/AdjustModal';
import NewDiscrepancyModal from './components/NewDiscrepancyModal';
import StockDiscrepancyComms from './components/StockDiscrepancyComms';
import InventoryLogsTable from './components/InventoryLogsTable';
import { toast } from 'sonner';

const InventoryPortalDashboard = () => {
  const { user } = useAuth();
  const {
    inventory,
    inventoryLogs,
    updateStock,
    refreshInventoryFromApi
  } = useInventory();

  const {
    openCount,
    totalUnreadCount = 0,
    createTicket,
    tickets
  } = useInventoryComms();

  const [activeTab, setActiveTab] = useState('master'); // 'master' | 'comms' | 'logs'
  const [isLowStockOnly, setIsLowStockOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal States
  const [restockModalItem, setRestockModalItem] = useState(null);
  const [adjustModalItem, setAdjustModalItem] = useState(null);
  const [discrepancyModalItem, setDiscrepancyModalItem] = useState(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);

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
  const handleConfirmRestock = async ({ itemId, stokUtama, stokPecahan, addedUtama, note }) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    await updateStock(itemId, {
      ...item,
      stokUtama,
      stokPecahan,
      keterangan: note || `Restock masuk +${addedUtama} ${item.satuan}`
    });
  };

  // Adjust / Opname confirmation handler
  const handleConfirmAdjust = async ({ itemId, stokUtama, stokPecahan, diffUtama, reason, note }) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    await updateStock(itemId, {
      ...item,
      stokUtama,
      stokPecahan,
      keterangan: `Stok opname (${reason}): ${diffUtama >= 0 ? '+' : ''}${diffUtama} ${item.satuan}. Catatan: ${note}`
    });
  };

  // Create ticket handler
  const handleCreateTicketSubmit = (ticketData) => {
    createTicket(ticketData);
    setActiveTab('comms');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bento Header Container */}
      <div
        className="w-full bg-white border border-slate-200/90 rounded-2xl px-6 py-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-row items-center justify-between gap-6"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        {/* Left: Icon + Title + Subtitle + Brand Badge */}
        <div className="flex items-center gap-4 min-w-0 text-left">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
            <Warehouse size={22} className="text-white" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Portal Manajemen Stok Gudang
              </h1>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80 font-mono tracking-tight flex-shrink-0">
                Gallardo Auto Sport &bull; New Ratu
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-500 font-normal mt-1 leading-relaxed text-left">
              Monitoring fisik, pencatatan restock, stok opname, dan ruang komunikasi selisih barang terintegrasi dengan POS Kasir.
            </p>
          </div>
        </div>

        {/* Right: Action Buttons neatly positioned to the far right on the same horizontal plane */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all flex items-center gap-2 shadow-[0_1px_2px_rgba(0,0,0,0.05)] active:scale-95 disabled:opacity-50"
            title="Sinkronkan data dengan server"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-slate-500' : 'text-slate-500'} />
            <span>{isRefreshing ? 'Menyinkronkan...' : 'Sinkronkan Data'}</span>
          </button>

          <button
            onClick={() => setIsNewTicketModalOpen(true)}
            className="h-10 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-xl shadow-[0_1px_3px_rgba(225,29,72,0.25)] flex items-center gap-2 transition-all"
          >
            <Plus size={16} />
            <span>Lapor Selisih Stok</span>
          </button>
        </div>
      </div>

      {/* 1. Overview Widgets */}
      <InventoryOverviewWidget
        inventory={inventory}
        inventoryLogs={inventoryLogs}
        openDiscrepancies={openCount}
        isLowStockOnly={isLowStockOnly}
        onToggleLowStockFilter={() => setIsLowStockOnly(!isLowStockOnly)}
        onSwitchTab={(tab) => setActiveTab(tab)}
      />

      {/* 2. Main Navigation Tabs (Bento Segmented Control) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-fit">
        <button
          onClick={() => setActiveTab('master')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'master'
              ? 'bg-white text-slate-900 shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Package size={15} />
          <span>Master Stok Gudang</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
            activeTab === 'master' ? 'bg-slate-100 text-slate-700 font-bold' : 'bg-slate-200/70 text-slate-600'
          }`}>
            {inventory.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('comms')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all relative ${
            activeTab === 'comms'
              ? 'bg-white text-amber-700 shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <MessageSquareWarning size={15} />
          <span>Stock Discrepancy Comms</span>
          {totalUnreadCount > 0 ? (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              {totalUnreadCount} Pesan Baru
            </span>
          ) : openCount > 0 ? (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
              {openCount} Open
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-all ${
            activeTab === 'logs'
              ? 'bg-white text-indigo-700 shadow-sm font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <History size={15} />
          <span>Mutasi & Riwayat Stok</span>
          {inventoryLogs.length > 0 && (
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeTab === 'logs' ? 'bg-indigo-100 text-indigo-800 font-bold' : 'bg-slate-200/70 text-slate-600'
            }`}>
              {inventoryLogs.length}
            </span>
          )}
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
      {/* Restock Modal */}
      <RestockModal
        isOpen={Boolean(restockModalItem)}
        onClose={() => setRestockModalItem(null)}
        item={restockModalItem}
        onConfirmRestock={handleConfirmRestock}
      />

      {/* Adjust Modal */}
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

      {/* New Discrepancy Ticket Modal */}
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
    </div>
  );
};

export default InventoryPortalDashboard;
