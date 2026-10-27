import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquareWarning,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flag,
  User,
  ShieldCheck,
  Bot,
  Plus,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInventoryComms } from '../context/InventoryCommsContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';

const QUICK_SNIPPETS = [
  'Admin, mohon dicek transaksi kasir yang belum terpotong.',
  'Fisik di rak gudang sudah kami hitung ulang sebanyak 2 kali.',
  'Barang sisa potongan meteran ada di kardus baki.',
  'Sudah disinkronkan di sistem, terima kasih atas laporannya!',
  'Sedang kami telusuri riwayat SPK pengerjaan bengkel.'
];

const StockDiscrepancyComms = ({ onOpenNewTicketModal }) => {
  const { user } = useAuth();
  const {
    tickets,
    activeTicketId,
    setActiveTicketId,
    addMessage,
    updateTicketStatus,
    resolveWithStockAdjustment,
    openCount,
    inProgressCount,
    resolvedCount,
    markTicketAsRead,
    totalUnreadCount,
    getTicketUnreadCount
  } = useInventoryComms();

  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [resolutionNoteInput, setResolutionNoteInput] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  // Simulation role toggle (helpful for testing conversation between Gudang & Admin)
  const currentRole = user?.role || 'inventory';
  const [activePersonaRole, setActivePersonaRole] = useState(currentRole);

  const messagesEndRef = useRef(null);

  // Active ticket
  const activeTicket = tickets.find(t => t.id === activeTicketId) || tickets[0] || null;

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeTicket?.messages]);

  // Auto-mark active ticket as read when viewing it
  useEffect(() => {
    if (activeTicket?.id && typeof markTicketAsRead === 'function') {
      markTicketAsRead(activeTicket.id);
    }
  }, [activeTicket?.id, activeTicket?.messages?.length]);

  // Filtered tickets list
  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'ALL' && ticket.status !== statusFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchId = ticket.id.toLowerCase().includes(q);
      const matchName = ticket.itemName.toLowerCase().includes(q);
      const matchCategory = ticket.category.toLowerCase().includes(q);
      return matchId || matchName || matchCategory;
    }
    return true;
  });

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!messageInput.trim() || !activeTicket) return;

    addMessage(activeTicket.id, messageInput);
    setMessageInput('');
  };

  const handleSnippetClick = (snippet) => {
    setMessageInput(snippet);
  };

  const handleConfirmResolve = async () => {
    if (!activeTicket) return;
    await resolveWithStockAdjustment(activeTicket.id, resolutionNoteInput);
    setShowResolveModal(false);
    setResolutionNoteInput('');
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col h-[760px] transition-colors">
      {/* Comms Header Banner */}
      <div
        className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex flex-row items-center justify-between gap-4 w-full flex-shrink-0"
        style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div className="flex items-center gap-3.5 min-w-0 text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-200/80 flex items-center justify-center flex-shrink-0 shadow-sm">
            <MessageSquareWarning size={20} />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Stock Discrepancy Comms
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 font-mono">
                Ruang Komunikasi Gudang & Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5 text-left">
              Pelaporan selisih fisik vs sistem, verifikasi transaksi kasir, dan rekonsiliasi stok terpusat.
            </p>
          </div>
        </div>

        {/* Action button: Create Ticket */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onOpenNewTicketModal}
            className="h-10 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-sm flex items-center gap-2 transition-all"
          >
            <Plus size={16} />
            <span>Lapor Selisih Baru</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div
        className="flex-1 flex flex-row overflow-hidden w-full"
        style={{ display: 'flex', flexDirection: 'row' }}
      >
        {/* LEFT COLUMN: Ticket List (35%) */}
        <div
          className="w-80 md:w-[350px] lg:w-[380px] flex-shrink-0 border-r border-slate-100 flex flex-col bg-slate-50/30"
          style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}
        >
          {/* Search & Status Filters */}
          <div className="p-3 border-b border-slate-100 space-y-2 bg-white">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari ID tiket atau nama item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none placeholder:text-slate-400 text-slate-800 shadow-sm"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                Semua ({tickets.length})
              </button>
              <button
                onClick={() => setStatusFilter('OPEN')}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                  statusFilter === 'OPEN'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-700 hover:bg-rose-50'
                }`}
              >
                Open ({openCount})
              </button>
              <button
                onClick={() => setStatusFilter('IN_PROGRESS')}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                  statusFilter === 'IN_PROGRESS'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-amber-700 hover:bg-amber-50'
                }`}
              >
                Proses ({inProgressCount})
              </button>
              <button
                onClick={() => setStatusFilter('RESOLVED')}
                className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all ${
                  statusFilter === 'RESOLVED'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Selesai ({resolvedCount})
              </button>
            </div>
          </div>

          {/* Ticket List Scrollable */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Filter size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium">Tidak ada tiket ditemukan</p>
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const isActive = ticket.id === activeTicket?.id;
                const lastMsg = ticket.messages[ticket.messages.length - 1];
                const unreadCount = typeof getTicketUnreadCount === 'function' ? getTicketUnreadCount(ticket, user?.role) : 0;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      setActiveTicketId(ticket.id);
                      if (typeof markTicketAsRead === 'function') {
                        markTicketAsRead(ticket.id);
                      }
                    }}
                    className={`p-3.5 cursor-pointer transition-all duration-150 border-l-4 hover:bg-slate-100/60 relative ${
                      isActive
                        ? 'bg-white border-indigo-600 shadow-sm'
                        : ticket.status === 'OPEN'
                        ? 'border-rose-400 bg-rose-50/20'
                        : ticket.status === 'IN_PROGRESS'
                        ? 'border-amber-400 bg-amber-50/20'
                        : 'border-emerald-400 bg-emerald-50/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {ticket.id}
                        </span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.2 min-w-[18px] h-[18px] rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-sm flex items-center justify-center animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ticket.status === 'OPEN'
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : ticket.status === 'IN_PROGRESS'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>

                    <div className={`font-bold text-xs mt-1 line-clamp-1 ${unreadCount > 0 ? 'text-slate-900 font-extrabold' : 'text-slate-900'}`}>
                      {ticket.itemName}
                    </div>

                    {/* Stock Discrepancy Difference Tag */}
                    <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                      <span className="text-slate-500">
                        Sistem: <strong className="text-slate-700">{ticket.systemStock}</strong> | Fisik: <strong className="text-slate-700">{ticket.physicalStock}</strong>
                      </span>
                      <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[10px] ${
                        ticket.discrepancy < 0
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {ticket.discrepancy > 0 ? `+${ticket.discrepancy}` : ticket.discrepancy} {ticket.unit}
                      </span>
                    </div>

                    {/* Last message snippet */}
                    {lastMsg && (
                      <div className="flex items-center justify-between mt-2">
                        <p className={`text-[11px] line-clamp-1 ${unreadCount > 0 ? 'text-slate-900 font-bold not-italic' : 'text-slate-500 italic'}`}>
                          {lastMsg.sender.split(' ')[0]}: "{lastMsg.content}"
                        </p>
                        {unreadCount > 0 && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 ml-1"></span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Ticket Conversation Room (65%) */}
        {activeTicket ? (
          <div
            className="flex-1 flex flex-col bg-white min-w-0"
            style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}
          >
            {/* Thread Header */}
            <div
              className="px-6 py-3.5 border-b border-slate-100 bg-white flex flex-row items-center justify-between gap-4 flex-shrink-0 w-full"
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {activeTicket.id}
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <h3 className="text-sm font-extrabold text-slate-900 truncate">
                    {activeTicket.itemName}
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                    {activeTicket.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                  <span>Dilaporkan oleh <strong className="text-slate-800">{activeTicket.reportedBy}</strong></span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="font-mono">
                    Stok Sistem: <strong className="text-slate-700">{activeTicket.systemStock} {activeTicket.unit}</strong> &rarr; Fisik: <strong className="text-slate-700">{activeTicket.physicalStock} {activeTicket.unit}</strong>
                  </span>
                  <span className={`font-mono font-bold px-1.5 py-0.2 rounded text-[11px] ${
                    activeTicket.discrepancy < 0 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    ({activeTicket.discrepancy > 0 ? `+${activeTicket.discrepancy}` : activeTicket.discrepancy} {activeTicket.unit})
                  </span>
                </div>
              </div>

              {/* Status Selector & Quick Resolution */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={activeTicket.status}
                  onChange={(e) => updateTicketStatus(activeTicket.id, e.target.value)}
                  className={`h-9 text-xs font-bold px-3 rounded-xl border focus:outline-none cursor-pointer shadow-sm ${
                    activeTicket.status === 'OPEN'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : activeTicket.status === 'IN_PROGRESS'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  <option value="OPEN">🔴 Status: OPEN</option>
                  <option value="IN_PROGRESS">🟡 Status: IN PROGRESS</option>
                  <option value="RESOLVED">🟢 Status: RESOLVED</option>
                </select>

                {activeTicket.status !== 'RESOLVED' && (
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="h-9 px-3.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle2 size={15} />
                    <span>Sinkronkan & Selesai</span>
                  </button>
                )}
              </div>
            </div>

            {/* Messages Stream Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/20 dark:bg-neutral-950/20">
              {activeTicket.messages.map((msg, index) => {
                if (msg.isSystem) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center my-3"
                    >
                      <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5 font-medium">
                        <Bot size={13} className="text-indigo-500" />
                        <span>{msg.content}</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </motion.div>
                  );
                }

                const isGudang = msg.role === 'inventory';

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex gap-3 max-w-[85%] ${isGudang ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                  >
                    {/* User Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isGudang
                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                    }`}>
                      {isGudang ? <User size={15} /> : <ShieldCheck size={15} />}
                    </div>

                    {/* Message Bubble */}
                    <div className="space-y-1">
                      <div className={`flex items-center gap-2 text-[11px] ${isGudang ? 'justify-start' : 'justify-end'}`}>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {msg.sender}
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                          isGudang
                            ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300'
                            : 'bg-purple-50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300'
                        }`}>
                          {isGudang ? 'Gudang' : 'Admin'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                        isGudang
                          ? 'bg-white dark:bg-[#242424] text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-neutral-700/80 rounded-tl-sm'
                          : 'bg-indigo-600 dark:bg-indigo-700 text-white rounded-tr-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Snippets Bar */}
            <div className="px-6 py-2.5 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2 overflow-x-auto text-xs flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" />
                Template Cepat:
              </span>
              {QUICK_SNIPPETS.map((snippet, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSnippetClick(snippet)}
                  className="px-2.5 py-1 text-[11px] rounded-full bg-white border border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 whitespace-nowrap transition-colors shadow-sm"
                >
                  {snippet}
                </button>
              ))}
            </div>

            {/* Compose Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white flex items-center gap-3 flex-shrink-0">
              <input
                type="text"
                placeholder={`Ketik pesan sebagai ${user?.name || (user?.role === 'admin' ? 'Admin' : 'Gudang')}... (Tekan Enter)`}
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 h-10 px-4 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 focus:outline-none placeholder:text-slate-400 text-slate-800 shadow-sm"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="h-10 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-40 rounded-xl shadow-sm flex items-center gap-2 transition-all flex-shrink-0"
              >
                <Send size={15} />
                <span>Kirim</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
            <MessageSquareWarning size={48} className="mb-3 text-gray-300 dark:text-neutral-700" />
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Belum ada tiket dipilih</h4>
            <p className="text-xs text-gray-400 max-w-sm mt-1">
              Pilih salah satu tiket laporan selisih stok di kolom kiri atau buat laporan baru.
            </p>
          </div>
        )}
      </div>

      {/* RESOLVE & SYNCHRONIZE MODAL */}
      {showResolveModal && activeTicket && createPortal(
        <AnimatePresence>
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowResolveModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 space-y-4 my-auto"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    Sinkronkan & Selesaikan Isu
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tiket {activeTicket.id} &bull; {activeTicket.itemName}
                  </p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5">
                <div className="font-semibold text-emerald-800 dark:text-emerald-300">
                  Tindakan Penyesuaian Otomatis:
                </div>
                <div className="text-emerald-900 dark:text-emerald-200">
                  Stok sistem ({activeTicket.systemStock} {activeTicket.unit}) akan disinkronkan ke kuantitas fisik (<strong>{activeTicket.physicalStock} {activeTicket.unit}</strong>).
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Catatan Penyelesaian
                </label>
                <textarea
                  rows="2"
                  placeholder="Contoh: Telah dicek fisik dan disesuaikan stok opname resmi..."
                  value={resolutionNoteInput}
                  onChange={(e) => setResolutionNoteInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white resize-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolve}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-sm flex items-center gap-1.5"
                >
                  <Check size={16} />
                  Konfirmasi Selesai
                </button>
              </div>
            </motion.div>
          </div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default StockDiscrepancyComms;
