import React, { createContext, useContext, useState, useEffect } from 'react';
import { useInventory } from '../../../context/InventoryContext';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'sonner';

const InventoryCommsContext = createContext();

export const useInventoryComms = () => {
  const context = useContext(InventoryCommsContext);
  if (!context) {
    throw new Error('useInventoryComms must be used within an InventoryCommsProvider');
  }
  return context;
};

const INITIAL_DISCREPANCY_TICKETS = [
  {
    id: 'DISC-2026-001',
    inventoryId: 'INV-006',
    itemName: 'Rantiz 9H Coating',
    category: 'Coating',
    systemStock: 20,
    physicalStock: 18,
    discrepancy: -2,
    unit: 'Botol',
    status: 'OPEN', // 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
    priority: 'HIGH', // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    reportedBy: 'Mba Umi (Gudang)',
    reportedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    resolvedBy: null,
    resolvedAt: null,
    resolutionNote: '',
    messages: [
      {
        id: 'msg-101',
        sender: 'Mba Umi (Gudang)',
        role: 'inventory',
        content: 'Admin, fisik botol Rantiz 9H sisa 18 di rak chemical B, tapi di sistem masih tercatat 20 botol. Mohon dicek apakah ada transaksi kasir yang belum terpotong otomatis.',
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
      },
      {
        id: 'msg-102',
        sender: 'Daniel (Admin)',
        role: 'admin',
        content: 'Halo Mba Umi, kami cek ada transaksi SPK #0044 kemarin sore untuk coating Honda CR-V yang baru diselesaikan mekanik. Saya cek ke kasir apakah statusnya sudah lunas atau pending ya.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ]
  },
  {
    id: 'DISC-2026-002',
    inventoryId: 'INV-002',
    itemName: 'Vansgard Matte',
    category: 'PPF',
    systemStock: 10,
    physicalStock: 9,
    discrepancy: -1,
    unit: 'Roll',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    reportedBy: 'Mba Umi (Gudang)',
    reportedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    resolvedBy: null,
    resolvedAt: null,
    resolutionNote: '',
    messages: [
      {
        id: 'msg-201',
        sender: 'Mba Umi (Gudang)',
        role: 'inventory',
        content: 'Admin, 1 Roll Vansgard Matte telah dikeluarkan untuk pengerjaan Porsche Macan kemarin, fisik di gudang sisa 9 roll, tapi di master stok sistem masih tertera 10.',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString()
      },
      {
        id: 'msg-202',
        sender: 'Femy (Admin)',
        role: 'admin',
        content: 'Invoice Porsche Macan sedang menunggu pelunasan DP dari customer. Sudah saya koordinasikan dengan Finance, nanti sore akan disinkronkan.',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
      },
      {
        id: 'msg-203',
        sender: 'Mba Umi (Gudang)',
        role: 'inventory',
        content: 'Baik Min, kami tandai In Progress agar tidak membingungkan shift malam yang stok opname.',
        createdAt: new Date(Date.now() - 3600000 * 11).toISOString()
      }
    ]
  },
  {
    id: 'DISC-2026-003',
    inventoryId: 'INV-014',
    itemName: 'Performante Black Stone 35',
    category: 'Kaca Film',
    systemStock: 15,
    physicalStock: 15,
    discrepancy: 0,
    unit: 'Roll',
    status: 'RESOLVED',
    priority: 'LOW',
    reportedBy: 'Mba Umi (Gudang)',
    reportedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    resolvedBy: 'Daniel (Admin)',
    resolvedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    resolutionNote: 'Stok pecahan 5.5 meter telah diinput manual ke database sistem.',
    messages: [
      {
        id: 'msg-301',
        sender: 'Mba Umi (Gudang)',
        role: 'inventory',
        content: 'Ada potongan sisa 5.5 meter di kardus terpisah, tolong diinput ke stok pecahan roll ya min.',
        createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
      },
      {
        id: 'msg-302',
        sender: 'Daniel (Admin)',
        role: 'admin',
        content: 'Sudah diupdate ke stok pecahan: 5.5 Meter. Roll utama tetap 15 Roll.',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      },
      {
        id: 'msg-303',
        sender: 'System Log',
        role: 'system',
        isSystem: true,
        content: 'Isu diselesaikan oleh Daniel (Admin). Stok pecahan disinkronkan menjadi 5.5 Meter.',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ]
  }
];

// WhatsApp-style Notification Audio Chime Synthesizer via Web Audio API
export const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Dual-tone chime (G5 -> C6 -> E6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, now); // G5
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08); // C6
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.09); // E6
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.28, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.35);
  } catch (e) {
    console.debug('Audio chime playback omitted:', e);
  }
};

// Calculate unread count for a ticket based on current user role
export const getTicketUnreadCount = (ticket, userRole) => {
  if (!ticket || !Array.isArray(ticket.messages)) return 0;
  const isAdmin = ['admin', 'superadmin', 'owner'].includes(String(userRole || '').toLowerCase());
  return ticket.messages.filter(m => {
    if (m.isSystem) return false;
    if (isAdmin) {
      return m.readByAdmin === false;
    } else {
      return m.readByGudang === false;
    }
  }).length;
};

export const InventoryCommsProvider = ({ children }) => {
  const { user } = useAuth();
  const { inventory, updateStock } = useInventory();

  // Load persisted tickets from localStorage or use initial mock data
  const [tickets, setTickets] = useState(() => {
    try {
      const saved = localStorage.getItem('gallardo_stock_discrepancies');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load discrepancies from localStorage:', e);
    }
    return INITIAL_DISCREPANCY_TICKETS;
  });

  const [activeTicketId, setActiveTicketId] = useState(tickets[0]?.id || null);

  // Sync tickets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gallardo_stock_discrepancies', JSON.stringify(tickets));
    } catch (e) {
      console.warn('Failed to save discrepancies to localStorage:', e);
    }
  }, [tickets]);

  // Cross-tab real-time sync with localStorage + WhatsApp-style incoming notification
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'gallardo_stock_discrepancies' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            const isAdmin = ['admin', 'superadmin', 'owner'].includes(String(user?.role || '').toLowerCase());
            
            // Detect if a new incoming message arrived from the other party
            parsed.forEach(newTicket => {
              const prevTicket = tickets.find(t => t.id === newTicket.id);
              const prevMsgCount = prevTicket ? prevTicket.messages.length : 0;
              if (newTicket.messages && newTicket.messages.length > prevMsgCount) {
                const latestMsg = newTicket.messages[newTicket.messages.length - 1];
                const isFromOther = isAdmin ? latestMsg.role === 'inventory' : (latestMsg.role === 'admin' || latestMsg.role === 'superadmin');
                
                if (isFromOther) {
                  // 1. Play WhatsApp chime
                  playNotificationSound();

                  // 2. Show WhatsApp-style rich notification banner
                  toast(
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%' }}>
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0, boxShadow: '0 2px 5px rgba(16, 185, 129, 0.4)' }}>
                        💬
                      </div>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{latestMsg.sender}</strong>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>Baru saja</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{newTicket.itemName} ({newTicket.id})</div>
                        <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          "{latestMsg.content}"
                        </div>
                      </div>
                    </div>,
                    {
                      duration: 4500,
                      position: 'top-right'
                    }
                  );
                }
              }
            });

            setTickets(parsed);
          }
        } catch (err) {
          console.error('Failed to parse synchronized tickets:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [tickets, user]);

  // Mark all messages in a specific ticket as read for the current user
  const markTicketAsRead = (ticketId) => {
    if (!ticketId) return;
    const isAdmin = ['admin', 'superadmin', 'owner'].includes(String(user?.role || '').toLowerCase());
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const hasUnread = t.messages.some(m => !m.isSystem && (isAdmin ? m.readByAdmin === false : m.readByGudang === false));
        if (!hasUnread) return t;
        return {
          ...t,
          messages: t.messages.map(m => {
            if (m.isSystem) return m;
            return {
              ...m,
              [isAdmin ? 'readByAdmin' : 'readByGudang']: true
            };
          })
        };
      }
      return t;
    }));
  };

  // Total unread count for current user
  const totalUnreadCount = tickets.reduce((sum, t) => sum + getTicketUnreadCount(t, user?.role), 0);

  // Create new discrepancy ticket
  const createTicket = ({
    inventoryId,
    physicalStock,
    priority = 'MEDIUM',
    initialMessage = ''
  }) => {
    const invItem = inventory.find(i => i.id === inventoryId);
    if (!invItem) {
      toast.error('Item inventaris tidak ditemukan');
      return null;
    }

    const currentSystemStock = Number(invItem.stokUtama || 0);
    const parsedPhysical = Number(physicalStock || 0);
    const diff = parsedPhysical - currentSystemStock;

    const newTicketId = `DISC-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`;
    const isAdmin = ['admin', 'superadmin', 'owner'].includes(String(user?.role || '').toLowerCase());
    let authorName = user?.name || (isAdmin ? 'Daniel (Admin)' : 'Mba Umi (Gudang)');
    if (user?.name && !user.name.includes('(')) {
      authorName = `${user.name} (${isAdmin ? 'Admin' : 'Gudang'})`;
    }
    const authorRole = isAdmin ? 'admin' : (user?.role || 'inventory');

    const newTicket = {
      id: newTicketId,
      inventoryId: invItem.id,
      itemName: `${invItem.brand} ${invItem.varian}`.trim(),
      category: invItem.kategori,
      systemStock: currentSystemStock,
      physicalStock: parsedPhysical,
      discrepancy: diff,
      unit: invItem.satuan || 'Pcs',
      status: 'OPEN',
      priority: priority,
      reportedBy: authorName,
      reportedAt: new Date().toISOString(),
      resolvedBy: null,
      resolvedAt: null,
      resolutionNote: '',
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: authorName,
          role: authorRole,
          content: initialMessage || `Laporan selisih: Fisik tercatat ${parsedPhysical} ${invItem.satuan}, di sistem tertera ${currentSystemStock} ${invItem.satuan} (Selisih: ${diff > 0 ? '+' : ''}${diff} ${invItem.satuan}). Mohon verifikasi.`,
          createdAt: new Date().toISOString(),
          readByAdmin: isAdmin,
          readByGudang: !isAdmin
        }
      ]
    };

    setTickets(prev => [newTicket, ...prev]);
    setActiveTicketId(newTicketId);
    toast.success(`Tiket Laporan #${newTicketId} berhasil diterbitkan`);
    return newTicket;
  };

  // Add message to ticket thread
  const addMessage = (ticketId, content) => {
    if (!content || !content.trim()) return;

    const isAdmin = ['admin', 'superadmin', 'owner'].includes(String(user?.role || '').toLowerCase());
    let senderName = user?.name || (isAdmin ? 'Daniel (Admin)' : 'Mba Umi (Gudang)');
    if (user?.name && !user.name.includes('(')) {
      senderName = `${user.name} (${isAdmin ? 'Admin' : 'Gudang'})`;
    }
    const senderRole = isAdmin ? 'admin' : (user?.role || 'inventory');

    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: senderName,
      role: senderRole,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      readByAdmin: isAdmin,
      readByGudang: !isAdmin
    };

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          messages: [...t.messages, newMsg]
        };
      }
      return t;
    }));
  };

  // Update ticket status (OPEN, IN_PROGRESS, RESOLVED)
  const updateTicketStatus = (ticketId, newStatus, note = '') => {
    const responderName = user?.name || (user?.role === 'admin' ? 'Daniel (Admin)' : 'Petugas Gudang');
    
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        const isResolving = newStatus === 'RESOLVED';
        const systemMessage = {
          id: `msg-${Date.now()}`,
          sender: 'System Log',
          role: 'system',
          isSystem: true,
          content: isResolving
            ? `Tiket ditandai SELESAI oleh ${responderName}. ${note ? `Catatan: "${note}"` : ''}`
            : `Status tiket diubah menjadi "${newStatus}" oleh ${responderName}.`,
          createdAt: new Date().toISOString()
        };

        return {
          ...t,
          status: newStatus,
          resolvedBy: isResolving ? responderName : t.resolvedBy,
          resolvedAt: isResolving ? new Date().toISOString() : t.resolvedAt,
          resolutionNote: note || t.resolutionNote,
          messages: [...t.messages, systemMessage]
        };
      }
      return t;
    }));

    toast.info(`Status tiket #${ticketId} diubah menjadi ${newStatus}`);
  };

  // Resolve issue AND synchronize system stock immediately!
  const resolveWithStockAdjustment = async (ticketId, note) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    try {
      // Execute adjustment on master inventory state
      const targetInv = inventory.find(i => i.id === ticket.inventoryId);
      if (targetInv && typeof updateStock === 'function') {
        await updateStock(targetInv.id, {
          stokUtama: ticket.physicalStock,
          keterangan: `Stok opname via tiket ${ticket.id}: Disinkronkan ke fisik ${ticket.physicalStock} ${ticket.unit}`
        });
      }

      updateTicketStatus(
        ticketId,
        'RESOLVED',
        note || `Stok sistem otomatis disinkronkan ke kuantitas fisik (${ticket.physicalStock} ${ticket.unit}).`
      );

      toast.success(`Tiket #${ticketId} selesai & stok sistem telah diperbarui ke ${ticket.physicalStock} ${ticket.unit}!`);
    } catch (err) {
      console.error('Failed to auto-adjust stock on resolve:', err);
      toast.error('Gagal memperbarui stok master');
    }
  };

  // Computed summary counts
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;

  return (
    <InventoryCommsContext.Provider
      value={{
        tickets,
        activeTicketId,
        setActiveTicketId,
        createTicket,
        addMessage,
        updateTicketStatus,
        resolveWithStockAdjustment,
        openCount,
        inProgressCount,
        resolvedCount,
        markTicketAsRead,
        totalUnreadCount,
        getTicketUnreadCount
      }}
    >
      {children}
    </InventoryCommsContext.Provider>
  );
};
