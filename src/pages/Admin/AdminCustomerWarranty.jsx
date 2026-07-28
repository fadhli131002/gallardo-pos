import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { format, addYears } from 'date-fns';
import { Shield, ShieldAlert, X, Search, Printer, MessageCircle, Loader2, MoreVertical, FileText, Wrench, Download, CreditCard, Upload, CheckCircle, UserPen, FileCheck, Trash2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import logoGallardo from '../../assets/logo-gallardo.png';
import logoNewRatu from '../../assets/logo-new-ratu.png';
import { formatCurrency } from '../../data/mockData';
import SharedInvoice from '../../components/SharedInvoice';
import WarrantyModal, { hasWarranty } from '../../components/WarrantyModal';
import ComplaintModal from '../../components/ComplaintModal';
import { useInventory } from '../../context/InventoryContext';
import '../Customers/Customers.css';

import { useAuth } from '../../context/AuthContext';

const AdminCustomerWarranty = () => {
  const { user, token } = useAuth();
  const userRole = user?.role ?? null;
  const userName = user?.name ?? null;

  const normName = (str) =>
    (str || '')
      .toLowerCase()
      .replace(/\b(sales|team|internal|admin)\b/gi, '')
      .replace(/(.)\1+/g, '$1')
      .trim();

  const { inventory, deductStock, deductRetailStock, processInventoryDeduction } = useInventory();
  const { orders, settlePayment, completeOrder, updateOrderOperational, deleteOrder } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyOrder, setHistoryOrder] = useState(null);
  const [showHistoryPaymentModal, setShowHistoryPaymentModal] = useState(false);
  const [historyPaymentOrder, setHistoryPaymentOrder] = useState(null);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState(false);
  const [manualPaymentOrder, setManualPaymentOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [settlementOrder, setSettlementOrder] = useState(null);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editCustomerData, setEditCustomerData] = useState(null);

  const [showDeleteRetailModal, setShowDeleteRetailModal] = useState(false);
  const [deleteRetailOrder, setDeleteRetailOrder] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintOrderData, setComplaintOrderData] = useState(null);

  const [filterStatus, setFilterStatus] = useState('Semua Status');
  const [filterTransactionType, setFilterTransactionType] = useState('Semua Transaksi');
  const [paymentFilter, setPaymentFilter] = useState('Semua Pembayaran');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);

  const [expandedRows, setExpandedRows] = useState([]);
  const toggleExpand = (id) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  const filteredOrders = orders.filter(order => {
    const isRetail = order.type === 'RETAIL';

    // 0. Strict Sales Isolation Filter
    if (userRole === 'sales') {
      if (isRetail) return false;

      if (!userName) return false; // user not loaded yet — show nothing
      const nu = normName(userName);
      const ns = normName(order.spgName || order.event || '');
      const isMyOrder = nu && ns && (ns.includes(nu) || nu.includes(ns));
      if (!isMyOrder) return false;
    }

    // 1. Search Filter
    const query = searchQuery.toLowerCase();
    const matchSearch = query === '' || (
      order.customerName.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query) ||
      (order.plateNumber && order.plateNumber.toLowerCase().includes(query)) ||
      (order.carBrand && order.carBrand.toLowerCase().includes(query)) ||
      (order.customerHp && order.customerHp.includes(query)) ||
      (order.chassisNumber && order.chassisNumber !== '-' && order.chassisNumber.toLowerCase().includes(query))
    );

    // 2. Transaction Type Filter
    if (filterTransactionType === 'Retail (Grosir)' && !isRetail) return false;
    if (filterTransactionType === 'Jasa (Workshop)' && isRetail) return false;

    // 3. Status Filter
    let orderStatus = isRetail ? 'Selesai' : order.status;
    const activeMaintenance = (order.historyMaintenance || []).find(h => h.workStatus === 'Proses' || h.workStatus === 'Aktif');
    if (activeMaintenance && !isRetail) {
      orderStatus = 'Proses';
    } else if (order.status !== 'Selesai' && !isRetail) {
      orderStatus = 'Proses';
    }

    if (order.billType === 'Penawaran' || order.salesCategory === 'Penawaran') {
      orderStatus = 'Penawaran';
    }

    const matchStatus = filterStatus === 'Semua Status' || filterStatus === orderStatus;

    // 3. Date Filter
    let matchDate = true;
    if (startDate || endDate) {
      const orderDateStr = order.date;
      const orderDate = new Date(orderDateStr);
      orderDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) matchDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        if (orderDate > end) matchDate = false;
      }
    }

    // 4. Payment Status Filter
    let matchPayment = true;
    if (paymentFilter !== 'Semua Pembayaran') {
      const isPenawaran = order.billType === 'Penawaran' || order.salesCategory === 'Penawaran' || order.paymentMethod === 'Penawaran' || order.method === 'Penawaran';

      let pStatus = (order.paymentType || order.paymentStatus || order.type || 'BELUM BAYAR').toUpperCase();
      if (isPenawaran) {
        pStatus = 'PENAWARAN';
      }

      if (paymentFilter === 'Penawaran' && pStatus !== 'PENAWARAN') matchPayment = false;
      if (paymentFilter === 'Lunas' && pStatus !== 'LUNAS') matchPayment = false;
      if (paymentFilter === 'Belum Bayar' && pStatus !== 'BELUM BAYAR') matchPayment = false;
      if (paymentFilter === 'DP / Sebagian' && !(pStatus.includes('DP') || pStatus.includes('SEBAGIAN'))) matchPayment = false;
    }

    return matchSearch && matchStatus && matchDate && matchPayment;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const getDynamicFileName = (order) => {
    if (!order) return 'Invoice_Tanpa_Nama';

    let rawName = 'Tanpa_Nama';
    if (order.type === 'RETAIL') {
      rawName = order.supplierName || 'Tanpa_Nama';
    } else {
      rawName = order.customerName || (order.customer && order.customer.name) || 'Tanpa_Nama';
    }

    if (rawName.trim() === '') rawName = 'Tanpa_Nama';
    const cleanName = rawName.replace(/\s+/g, '_');

    let orderId = order.id || 'Tanpa_ID';
    if (orderId.startsWith('ORD-')) {
      orderId = orderId.replace('ORD-', 'WRK/300260700');
    }
    const cleanId = orderId.replace(/\//g, '-');

    return `Invoice_${cleanId}_${cleanName}`;
  };

  const handleDownloadInvoiceClick = async () => {
    const element = document.getElementById('invoice-content-to-print');
    if (!element || !invoiceOrder) {
      setIsGeneratingPDF(false);
      return;
    }

    const dynamicFileName = getDynamicFileName(invoiceOrder) + '.pdf';

    // Print Title Hack for standard print dialog if used elsewhere
    const originalTitle = document.title;
    document.title = getDynamicFileName(invoiceOrder);

    const opt = {
      margin: 0,
      filename: dynamicFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1024, ignoreElements: (el) => el.classList && el.classList.contains('no-print') },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Print failed", error);
    } finally {
      document.title = originalTitle; // Restore original title
      setIsGeneratingPDF(false);
      setInvoiceOrder(null);
    }
  };


  const handleExportBulkExcel = () => {
    let ordersToExport = filteredOrders.filter(o => o.type === 'RETAIL');
    if (selectedRows.length > 0) {
      ordersToExport = ordersToExport.filter(o => selectedRows.includes(o.id));
    }

    if (ordersToExport.length === 0) {
      toast.error('Tidak ada data Retail untuk diekspor!');
      return;
    }

    try {
      const excelData = ordersToExport.map(order => {
        let historyText = '-';
        const totalPaidHistory = (order.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0);
        const remaining = Math.max(0, order.totalPrice - totalPaidHistory);

        if (order.paymentHistory && order.paymentHistory.length > 0) {
          const lines = order.paymentHistory.map((h, index) => {
            const numLabels = ['pertama', 'kedua', 'ketiga', 'keempat', 'kelima', 'keenam', 'ketujuh', 'kedelapan', 'kesembilan', 'kesepuluh'];
            const label = index < 10 ? numLabels[index] : `ke-${index + 1}`;
            const dateStr = format(new Date(h.date), 'dd/MM/yyyy');
            const noteStr = h.notes ? `, Ket: ${h.notes}` : '';
            return `Pembayaran ${label}: Rp ${h.amount.toLocaleString('id-ID')} (Tgl: ${dateStr}${noteStr})`;
          });
          historyText = 'History Pembayaran:\n' + lines.join('\n');
        }

        return {
          'Nomor Invoice': order.id,
          'Tanggal Transaksi': format(new Date(order.date), 'dd/MM/yyyy'),
          'Nama Customer': order.customerName || order.supplierName || '-',
          'No. HP': order.customerHp || '-',
          'Alamat Lengkap': order.customerAddress || '-',
          'Total Tagihan': `Rp ${order.totalPrice.toLocaleString('id-ID')}`,
          'Sisa Tagihan': `Rp ${remaining.toLocaleString('id-ID')}`,
          'Status Pembayaran': order.paymentType || 'Belum Bayar',
          'Histori Pembayaran': historyText,
          'Keterangan (Notes)': order.notes || '-'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      worksheet['!cols'] = [
        { wch: 20 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 40 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 60 },
        { wch: 30 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Retail Bulk");

      for (const cellAddress in worksheet) {
        if (cellAddress[0] === '!') continue;
        const cell = worksheet[cellAddress];
        if (cell.v && typeof cell.v === 'string' && cell.v.includes('\n')) {
          if (!cell.s) cell.s = {};
          if (!cell.s.alignment) cell.s.alignment = {};
          cell.s.alignment.wrapText = true;
        }
      }

      XLSX.writeFile(workbook, `Bulk_Export_Retail_${format(new Date(), 'dd-MM-yyyy')}.xlsx`, { cellStyles: true });
      toast.success(`${ordersToExport.length} data Retail berhasil diekspor!`);
      setSelectedRows([]);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengekspor data ke Excel.');
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (selectedOrder) setSelectedOrder(null);
        else if (showHistoryModal) setShowHistoryModal(false);
        else if (showHistoryPaymentModal) setShowHistoryPaymentModal(false);
        else if (showManualPaymentModal) setShowManualPaymentModal(false);
        else if (invoiceOrder) setInvoiceOrder(null);
        else if (settlementOrder) setSettlementOrder(null);
        else if (showEditCustomerModal) setShowEditCustomerModal(false);
        else if (showDeleteRetailModal && !isDeleting) setShowDeleteRetailModal(false);
        else if (showComplaintModal) setShowComplaintModal(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedOrder, showHistoryModal, showHistoryPaymentModal, invoiceOrder, settlementOrder, showEditCustomerModal, showComplaintModal]);

  return (
    <>
      {isGeneratingPDF && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}>
          <Loader2 className="animate-spin" size={48} color="#2563eb" style={{ marginBottom: '16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>Sedang Memproses PDF...</h2>
          <p style={{ color: '#6b7280' }}>Mohon tunggu sebentar, dokumen sedang disiapkan.</p>
        </div>
      )}
      <div className="customers-page animate-fade-in print:hidden">      <div className="page-header">
        <div>
          <h1 className="page-title">Customer & Garansi</h1>
          <p className="page-subtitle">Kelola data pelanggan dan riwayat klaim garansi produk/layanan</p>
        </div>

        <div className="print:hidden" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span className="font-sans text-sm font-medium text-gray-600">Total: <strong className="text-black font-bold">{filteredOrders.length}</strong> Kendaraan</span>
          {filterTransactionType === 'Retail (Grosir)' && (
            <button
              onClick={handleExportBulkExcel}
              className="btn-secondary flex items-center gap-2 px-4 py-2 rounded"
            >
              <Download size={16} />
              <span className="font-sans text-sm font-bold tracking-wide">
                {selectedRows.length > 0 ? `EXPORT SELECTED (${selectedRows.length}) EXCEL` : 'EXPORT ALL EXCEL'}
              </span>
            </button>
          )}
          <button
            onClick={handleExportPDF}
            className="btn-primary flex items-center gap-2 px-4 py-2 rounded"
          >
            <Download size={16} />
            <span className="font-sans text-sm font-bold tracking-wide">
              EXPORT PDF
            </span>
          </button>
        </div>
      </div>

        <div className="customers-list premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '1.5rem 1.5rem 0 1.5rem', flexWrap: 'nowrap' }} className="print:hidden">
            {/* Sisi Kiri: Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '0' }}>
              <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Cari nama, plat mobil, no rangka..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', height: '42px', padding: '0 16px 0 44px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
                className="focus:border-black focus:ring-1 focus:ring-black transition-all"
              />
            </div>

            {/* Sisi Kanan: Status & Date Picker Group */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
              {userRole === 'admin' && (
                <select
                  value={filterTransactionType}
                  onChange={(e) => setFilterTransactionType(e.target.value)}
                  style={{ padding: '0 16px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box', cursor: 'pointer' }}
                  className="focus:border-black focus:ring-1 focus:ring-black transition-colors"
                >
                  <option value="Semua Transaksi">Semua Transaksi</option>
                  <option value="Jasa (Workshop)">Jasa (Workshop)</option>
                  <option value="Retail (Grosir)">Retail (Grosir)</option>
                </select>
              )}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '0 16px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box', cursor: 'pointer' }}
                className="focus:border-black focus:ring-1 focus:ring-black transition-colors"
              >
                <option value="Semua Status">Semua Status</option>
                <option value="Penawaran">Penawaran</option>
                <option value="Proses">Proses</option>
                <option value="Selesai">Selesai</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                style={{ padding: '0 16px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box', cursor: 'pointer' }}
                className="focus:border-black focus:ring-1 focus:ring-black transition-colors"
              >
                <option value="Semua Pembayaran">Semua Pembayaran</option>
                <option value="Lunas">Lunas</option>
                <option value="Belum Bayar">Belum Bayar</option>
                <option value="DP / Sebagian">DP / Sebagian</option>
                <option value="Penawaran">Penawaran</option>
              </select>

              <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 4px' }}></div>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '0 16px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
                title="Tanggal Mulai"
                className="focus:border-black focus:ring-1 focus:ring-black transition-colors cursor-pointer"
              />
              <span style={{ color: '#d1d5db', fontFamily: 'var(--font-sans)', fontSize: '1.125rem', fontWeight: '300' }}>-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ padding: '0 16px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
                title="Tanggal Akhir"
                className="focus:border-black focus:ring-1 focus:ring-black transition-colors cursor-pointer"
              />
            </div>
          </div>
          <div className="table-responsive" style={{ overflow: 'visible' }}>
            <table className="customers-table" onClick={() => setActiveDropdown(null)}>
              <thead>
                <tr>
                  {filterTransactionType === 'Retail (Grosir)' && (
                    <th className="font-sans" style={{ width: '40px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRows(filteredOrders.filter(o => o.type === 'RETAIL').map(o => o.id));
                          } else {
                            setSelectedRows([]);
                          }
                        }}
                        checked={selectedRows.length > 0 && selectedRows.length === filteredOrders.filter(o => o.type === 'RETAIL').length}
                        style={{ cursor: 'pointer' }}
                      />
                    </th>
                  )}
                  <th className="font-sans">POS No & Tgl</th>
                  <th className="font-sans">Produk</th>
                  <th className="font-sans">Total</th>
                  <th className="font-sans">Mobil</th>
                  <th className="font-sans">Customer</th>
                  <th className="font-sans text-center print:hidden">Act</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={filterTransactionType === 'Retail (Grosir)' ? "7" : "6"} className="text-center text-tertiary py-4">Belum ada data customer</td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isRetailOrder = order.type === 'RETAIL';
                    const activeMaintenance = (order.historyMaintenance || []).find(h => h.workStatus === 'Proses' || h.workStatus === 'Aktif');
                    const isPenawaran = order.billType === 'Penawaran' || order.salesCategory === 'Penawaran';

                    const displayStatus = isPenawaran ? 'Penawaran' : (isRetailOrder ? 'Selesai' : (activeMaintenance ? 'Maintenance (Proses)' : (order.status === 'Selesai' ? 'Selesai' : 'Proses')));
                    const statusBg = isPenawaran ? '#f97316' : (isRetailOrder ? '#d1fae5' : (activeMaintenance ? '#fef3c7' : (order.status === 'Selesai' ? '#d1fae5' : '#f3f4f6')));
                    const statusColor = isPenawaran ? '#ffffff' : (isRetailOrder ? '#059669' : (activeMaintenance ? '#d97706' : (order.status === 'Selesai' ? '#059669' : '#4b5563')));
                    const statusBorder = isPenawaran ? '#f97316' : (isRetailOrder ? '#34d399' : (activeMaintenance ? '#fcd34d' : (order.status === 'Selesai' ? '#34d399' : '#e5e7eb')));
                    const remaining = order.remainingAmount !== undefined ? order.remainingAmount : (order.totalPrice - (order.paidAmount || order.dpAmount || 0));

                    return (
                      <tr key={order.id} style={{ verticalAlign: 'top', backgroundColor: selectedRows.includes(order.id) ? '#f0fdf4' : 'transparent' }}>
                        {filterTransactionType === 'Retail (Grosir)' && (
                          <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                            {isRetailOrder && (
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(order.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRows(prev => [...prev, order.id]);
                                  } else {
                                    setSelectedRows(prev => prev.filter(id => id !== order.id));
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                            )}
                          </td>
                        )}
                        {/* POS NO & TGL */}
                        <td style={{ minWidth: '160px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span className="badge inline-block self-start" style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              alignSelf: 'flex-start',
                              fontWeight: 'bold',
                              backgroundColor: order.paymentType === 'Lunas' ? '#10b981' : (order.paymentType === 'DP 50%' || order.paidAmount > 0) ? '#f59e0b' : '#ef4444',
                              color: 'white',
                              border: 'none'
                            }}>
                              {order.paymentType === 'Lunas' ? 'LUNAS' : (order.paymentType === 'DP 50%' || order.paidAmount > 0) ? 'DP / SEBAGIAN' : 'BELUM BAYAR'}
                            </span>
                            <div className="text-xs text-secondary font-mono-ui">{format(new Date(order.date), 'dd-MM-yyyy')}</div>
                            <div className="text-xs font-semibold text-tertiary" style={{ textTransform: 'uppercase' }}>{order.location || 'GALLARDO'}</div>
                            <div className="text-sm font-bold text-primary mt-1">{order.id.replace('ORD-', 'WRK/300260700')}</div>
                            <span className="badge inline-block mt-1" style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              backgroundColor: statusBg,
                              color: statusColor,
                              border: '1px solid',
                              borderColor: statusBorder,
                              alignSelf: 'flex-start',
                              fontWeight: 'bold'
                            }}>
                              {displayStatus}
                            </span>
                          </div>
                        </td>

                        {/* PRODUK */}
                        <td style={{ minWidth: '220px' }}>
                          {order.items && order.items.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {(expandedRows.includes(order.id) ? order.items : order.items.slice(0, 1)).map((item, idx) => (
                                <div key={idx} style={{ marginBottom: expandedRows.includes(order.id) ? '8px' : '0' }}>
                                  <div className="text-sm font-bold leading-tight text-primary">{item.name} (x{item.qty || 1})</div>
                                  <div className="text-xs text-secondary font-mono-ui mt-1" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span>@{formatCurrency(item.originalPrice || item.finalPrice || item.price || 0)}</span>
                                    {(item.originalPrice && item.finalPrice && item.originalPrice !== item.finalPrice) ? (
                                      <span>- Disc {formatCurrency(item.originalPrice - item.finalPrice)}</span>
                                    ) : null}
                                    <span style={{ borderTop: '1px dashed #d1d5db', paddingTop: '2px', marginTop: '2px' }}>= {formatCurrency((item.finalPrice || item.price || 0) * (item.qty || 1))}</span>
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 1 && (
                                <button
                                  onClick={() => toggleExpand(order.id)}
                                  style={{ fontSize: '11px', color: '#2563eb', fontWeight: '500', marginTop: '4px', textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
                                >
                                  {expandedRows.includes(order.id) ? 'Lebih sedikit..' : 'Selengkapnya..'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div className="text-sm font-bold leading-tight text-primary">{order.service}</div>
                              <div className="text-xs text-secondary font-mono-ui mt-1" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>@{(order.totalPrice * 1.3).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                                <span>- Disc {(order.totalPrice * 0.3).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</span>
                                <span style={{ borderTop: '1px dashed #d1d5db', paddingTop: '2px', marginTop: '2px' }}>= {formatCurrency(order.totalPrice)}</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* TOTAL */}
                        <td style={{ minWidth: '180px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span className="text-secondary">Subtotal</span>
                              <span style={{ fontWeight: '500' }}>{formatCurrency(order.totalPrice)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span className="text-secondary">PPN</span>
                              <span style={{ fontWeight: '500' }}>Rp 0</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span className="text-secondary">Pembulatan</span>
                              <span style={{ fontWeight: '500' }}>Rp 0</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #e5e7eb' }}>
                              <span className="font-bold text-primary">Grandtotal</span>
                              <span className="font-bold text-primary">{formatCurrency(order.totalPrice)}</span>
                            </div>
                            {isRetailOrder && (
                              (() => {
                                const isLunas = (order.paymentType || order.paymentStatus || '').toUpperCase() === 'LUNAS';
                                const sisaTagihan = isLunas
                                  ? 0
                                  : (order.remainingAmount !== undefined
                                    ? order.remainingAmount
                                    : Math.max(0, order.totalPrice - ((order.paymentHistory || []).reduce((sum, p) => sum + p.amount, 0) || order.paidAmount || 0)));

                                return (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #e5e7eb' }}>
                                    <span className="font-bold" style={{ color: sisaTagihan > 0 ? '#ef4444' : '#10b981' }}>Sisa Tagihan</span>
                                    <span className="font-bold" style={{ color: sisaTagihan > 0 ? '#ef4444' : '#10b981' }}>{formatCurrency(sisaTagihan)}</span>
                                  </div>
                                );
                              })()
                            )}
                            <span className="badge inline-block mt-2" style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe', alignSelf: 'flex-start' }}>
                              {order.billType || 'Tagihan Individu'}
                            </span>
                          </div>
                        </td>

                        {/* MOBIL */}
                        <td style={{ minWidth: '200px' }}>
                          {isRetailOrder ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span className="badge inline-block" style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #d8b4fe', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', alignSelf: 'flex-start' }}>Transaksi Retail / B2B</span>
                              <div className="text-sm font-semibold text-primary">Pembelian Grosir / Non-Kendaraan</div>
                              {order.notes && (
                                <div className="text-xs text-secondary mt-1" style={{ fontStyle: 'italic' }}>{order.notes}</div>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div className="text-sm font-semibold text-primary">{order.carBrand} {order.carModel}</div>
                              <div className="text-xs font-mono-ui inline-block" style={{ padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb', alignSelf: 'flex-start' }}>
                                {order.plateNumber}
                              </div>
                              <div className="text-sm font-bold text-black mt-1">{order.chassisNumber !== '-' ? order.chassisNumber : 'N/A'}</div>
                              <div className="text-xs text-secondary mt-1">
                                Event : <span style={{ fontWeight: '500' }}>{order.spgName || 'SALES INTERNAL'}</span>
                              </div>
                              <div className="text-xs mt-1">
                                Status Pasang : <span style={{
                                  fontWeight: 'bold',
                                  backgroundColor: (() => {
                                    const activeMaintenance = (order.historyMaintenance || []).find(h => h.status === 'Aktif' || h.status === 'OPEN' || h.status === 'Proses');
                                    const displayStatus = activeMaintenance ? 'OPEN' : (order.status === 'Aktif' ? 'OPEN' : order.status);
                                    return displayStatus === 'Selesai' ? '#ecfdf5' : '#eff6ff';
                                  })(),
                                  color: (() => {
                                    const activeMaintenance = (order.historyMaintenance || []).find(h => h.status === 'Aktif' || h.status === 'OPEN' || h.status === 'Proses');
                                    const displayStatus = activeMaintenance ? 'OPEN' : (order.status === 'Aktif' ? 'OPEN' : order.status);
                                    return displayStatus === 'Selesai' ? '#059669' : '#1d4ed8';
                                  })(),
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid',
                                  borderColor: (() => {
                                    const activeMaintenance = (order.historyMaintenance || []).find(h => h.status === 'Aktif' || h.status === 'OPEN' || h.status === 'Proses');
                                    const displayStatus = activeMaintenance ? 'OPEN' : (order.status === 'Aktif' ? 'OPEN' : order.status);
                                    return displayStatus === 'Selesai' ? '#d1fae5' : '#bfdbfe';
                                  })()
                                }}>{(() => {
                                  const activeMaintenance = (order.historyMaintenance || []).find(h => h.status === 'Aktif' || h.status === 'OPEN' || h.status === 'Proses');
                                  if (activeMaintenance) return 'Maintenance (OPEN)';
                                  return order.status === 'Aktif' ? 'OPEN' : order.status;
                                })()}</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* CUSTOMER & ACT */}
                        <td style={{ minWidth: '160px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div className="font-bold text-sm text-primary">{isRetailOrder ? (order.customerName || order.supplierName) : order.customerName}</div>
                            <div className="text-xs text-secondary font-mono-ui flex items-center gap-1" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#25D366' }}></span>
                              {order.customerHp || '-'}
                            </div>
                            {isRetailOrder && order.customerAddress && (
                              <div className="text-xs text-secondary mt-1 max-w-[200px]" style={{ lineHeight: '1.4', wordBreak: 'break-word' }}>
                                {order.customerAddress}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="text-center print:hidden" style={{ position: 'relative', verticalAlign: 'middle' }}>
                          <button
                            className="btn-icon mx-auto"
                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(prev => prev === order.id ? null : order.id); }}
                            style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {activeDropdown === order.id && (
                            <div className="dropdown-menu premium-card animate-fade-in" style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', minWidth: '220px', zIndex: 50, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', borderRadius: '12px', marginRight: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>
                              <button onClick={() => { setActiveDropdown(null); setIsGeneratingPDF(true); setInvoiceOrder(order); setTimeout(() => handleDownloadInvoiceClick(), 500); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#374151', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <Printer size={16} color="#4b5563" /> Cetak Invoice
                              </button>

                              <button onClick={() => {
                                setActiveDropdown(null);
                                setEditCustomerData({
                                  id: order.id,
                                  customerName: order.customerName || '',
                                  customerHp: order.customerHp || '',
                                  customerEmail: order.customerEmail || '',
                                  customerAddress: order.customerAddress || '',
                                  customerCity: order.customerCity || '',
                                  customerProvince: order.customerProvince || '',
                                  customerZip: order.customerZip || '',
                                  carColor: order.carColor || '',
                                  plateNumber: order.plateNumber || '',
                                  chassisNumber: order.chassisNumber || '',
                                  engineNumber: order.engineNumber || '',
                                  installationDate: order.installationDate || '',
                                  installationTime: order.installationTime || '',
                                  notes: order.notes || ''
                                });
                                setShowEditCustomerModal(true);
                              }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#374151', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <UserPen size={16} color="#4b5563" /> Edit Data Customer
                              </button>

                              <button onClick={() => {
                                setActiveDropdown(null);
                                setComplaintOrderData(order);
                                setShowComplaintModal(true);
                              }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#374151', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                <ShieldAlert size={16} color="#4b5563" /> Catat Komplain
                              </button>

                              {!isPenawaran && (
                                <>
                                  {!isRetailOrder && (
                                    <button
                                      onClick={() => {
                                        if (order.paymentType !== 'Lunas') {
                                          toast.error('Tidak dapat membuka garansi. Customer belum melakukan pelunasan.');
                                          return;
                                        }
                                        setActiveDropdown(null);
                                        setSelectedOrder(order);
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: order.paymentType !== 'Lunas' ? 'not-allowed' : 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#374151', transition: 'all 0.2s', opacity: order.paymentType !== 'Lunas' ? 0.5 : 1 }}
                                      onMouseOver={e => { if (order.paymentType === 'Lunas') e.currentTarget.style.backgroundColor = '#f3f4f6' }}
                                      onMouseOut={e => { if (order.paymentType === 'Lunas') e.currentTarget.style.backgroundColor = 'transparent' }}
                                    >
                                      <Shield size={16} color={order.paymentType !== 'Lunas' ? "#9ca3af" : "#10b981"} /> Download Garansi
                                    </button>
                                  )}

                                  {!isRetailOrder && (
                                    <button onClick={() => { setActiveDropdown(null); setHistoryOrder(order); setShowHistoryModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#374151', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                      <Wrench size={16} color="#4b5563" /> History Maintenance
                                    </button>
                                  )}

                                  {(order.status !== 'Selesai' || activeMaintenance) && !isRetailOrder && (
                                    <button onClick={() => {
                                      setActiveDropdown(null);

                                      const orderToComplete = activeMaintenance || order;
                                      const deductResult = processInventoryDeduction(orderToComplete);

                                      if (!deductResult.success) {
                                        toast.error(deductResult.message);
                                        return; // Prevent completion
                                      }

                                      if (deductResult.alerts && deductResult.alerts.length > 0) {
                                        deductResult.alerts.forEach(msg => toast.warning(msg));
                                      }

                                      completeOrder(orderToComplete.id);
                                      toast.success('Pengerjaan selesai dan log inventaris diperbarui.');

                                      // Note: The hardcoded maintenance chemical deduction is now handled 
                                      // dynamically via processInventoryDeduction if the serviceType is Coating.
                                    }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#059669', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#d1fae5'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                      <CheckCircle size={16} color="#059669" /> Selesaikan Pengerjaan
                                    </button>
                                  )}

                                  {remaining > 0 && (userRole === 'sales' || userRole === 'sales_team' || isRetailOrder) && (
                                    <button onClick={() => { setActiveDropdown(null); setSettlementOrder({ ...order, computedRemaining: remaining }); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#f59e0b', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#fef3c7'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                      <CreditCard size={16} color="#f59e0b" /> Pelunasan Pembayaran
                                    </button>
                                  )}

                                  {order.paymentHistory && order.paymentHistory.length > 0 && (
                                    <button onClick={() => { setActiveDropdown(null); setHistoryPaymentOrder(order); setShowHistoryPaymentModal(true); }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#6366f1', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e0e7ff'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                      <FileText size={16} color="#6366f1" /> Lihat History Pembayaran
                                    </button>
                                  )}
                                </>
                              )}

                              {(!isPenawaran) && (userRole === 'owner' || userRole === 'superadmin') && (
                                <>
                                  <button onClick={() => {
                                    setActiveDropdown(null);
                                    setManualPaymentOrder(order);
                                    setShowManualPaymentModal(true);
                                  }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#10b981', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#ecfdf5'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <CreditCard size={16} color="#10b981" /> Ubah Status Pembayaran
                                  </button>
                                  <button onClick={() => {
                                    setActiveDropdown(null);
                                    setDeleteRetailOrder(order);
                                    setDeleteConfirmText('');
                                    setShowDeleteRetailModal(true);
                                  }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#ef4444', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <Trash2 size={16} color="#ef4444" /> Hapus Data Transaksi
                                  </button>
                                </>
                              )}

                              {isPenawaran && (
                                <>
                                  <button onClick={() => {
                                    setActiveDropdown(null);
                                    updateOrderOperational(order.id, { billType: 'Walk-In (Workshop)', salesCategory: 'Walk-In (Workshop)' });
                                    toast.success('Penawaran berhasil dikonversi ke Work Order (Deal)!');
                                  }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#2563eb', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#eff6ff'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <FileCheck size={16} color="#2563eb" /> Konversi ke Work Order
                                  </button>

                                  {(userRole === 'owner' || userRole === 'superadmin') && (
                                    <button onClick={() => {
                                      setActiveDropdown(null);
                                      if (window.confirm("Apakah Anda yakin ingin membatalkan penawaran ini?")) {
                                        deleteOrder(order.id);
                                        toast.success('Penawaran berhasil ditandai sebagai Closed Lost.');
                                      }
                                    }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#ef4444', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#fef2f2'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                      <Trash2 size={16} color="#ef4444" /> Tandai Closed Lost (Batal)
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Certificate Modal */}
      {selectedOrder && (
        <WarrantyModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}

      {/* Delete Retail Confirmation Modal */}
      {showDeleteRetailModal && deleteRetailOrder && (
        <div className="modal-overlay animate-fade-in" onClick={() => !isDeleting && setShowDeleteRetailModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(4px)' }}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', width: '95%', backgroundColor: '#ffffff', borderRadius: '16px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', borderTop: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldAlert size={32} color="#ef4444" />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>Hapus Transaksi?</h2>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
                Anda akan menghapus permanen data transaksi dari customer <strong>{deleteRetailOrder.customerName}</strong>. Tindakan ini tidak dapat dibatalkan.
              </p>

              <div style={{ width: '100%', textAlign: 'left', marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  Ketik nama "<span style={{ userSelect: 'none', color: '#ef4444' }}>{deleteRetailOrder.customerName}</span>" untuk konfirmasi:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Ketik nama customer..."
                  disabled={isDeleting}
                  style={{ width: '100%', padding: '10px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                <button
                  onClick={() => setShowDeleteRetailModal(false)}
                  disabled={isDeleting}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', color: '#374151', fontWeight: '600', cursor: isDeleting ? 'not-allowed' : 'pointer', fontSize: '14px' }}
                >
                  Batal
                </button>
                <button
                  onClick={async () => {
                    if (deleteConfirmText !== deleteRetailOrder.customerName) {
                      toast.error('Nama konfirmasi tidak cocok!');
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      // Jika data berasal dari DB (RTL-DB-xx)
                      if (String(deleteRetailOrder.id).startsWith('RTL-DB-')) {
                        const dbId = deleteRetailOrder.id.replace('RTL-DB-', '');
                        // token is already obtained from useAuth() at component level
                        const response = await fetch(`http://31.97.51.101/api/transactions/${dbId}`, {
                          method: 'DELETE',
                          headers: {
                            'Authorization': `Bearer ${token}`
                          }
                        });
                        if (!response.ok) {
                          throw new Error('Gagal menghapus dari database');
                        }
                      }

                      deleteOrder(deleteRetailOrder.id);
                      toast.success('Data transaksi retail berhasil dihapus permanen.');
                      setShowDeleteRetailModal(false);
                    } catch (error) {
                      console.error('Delete error:', error);
                      toast.error('Terjadi kesalahan saat menghapus data.');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting || deleteConfirmText !== deleteRetailOrder.customerName}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#ef4444', color: '#ffffff', fontWeight: '600', cursor: (isDeleting || deleteConfirmText !== deleteRetailOrder.customerName) ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: (isDeleting || deleteConfirmText !== deleteRetailOrder.customerName) ? 0.5 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                >
                  {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Maintenance Modal */}
      {showHistoryModal && historyOrder && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowHistoryModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(2px)' }}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', width: '95%', backgroundColor: '#ffffff', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6', paddingBottom: '24px', marginBottom: '32px' }}>
              <div>
                <h3 className="font-sans" style={{ color: '#111', fontSize: '24px', fontWeight: 'bold', margin: '0 0 12px 0' }}>Riwayat Servis, Maintenance & Klaim</h3>
                <p style={{ color: '#4b5563', fontSize: '15px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ backgroundColor: '#f3f4f6', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontWeight: 'bold', color: '#111' }}>VIN: {historyOrder.chassisNumber !== '-' ? historyOrder.chassisNumber : 'N/A'}</span>
                  <span style={{ color: '#9ca3af' }}>|</span>
                  <span style={{ fontWeight: '500', color: '#374151' }}>Plat: {historyOrder.plateNumber}</span>
                </p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#111'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.color = '#4b5563'; }}>
                <X size={24} />
              </button>
            </div>

            <div className="history-list" style={{ overflowY: 'auto', paddingRight: '16px', flex: 1, minHeight: 0 }}>
              {historyOrder ? (
                <div style={{ position: 'relative', paddingLeft: '24px', marginLeft: '8px', borderLeft: '2px solid #f3f4f6' }}>
                  {(() => {
                    // Always get fresh data from context
                    const freshOrder = orders.find(o => o.id === historyOrder.id) || historyOrder;
                    console.log('Data Transaksi & Complaints:', freshOrder);

                    const allTransactions = [freshOrder, ...(freshOrder.historyMaintenance || [])];
                    const complaintsList = allTransactions.flatMap(t => t.complaints || []).map(c => ({
                      ...c,
                      id: `comp-${c.id}`,
                      service: `Kendala: ${c.problem_type}`,
                      isComplaint: true,
                      location: 'Gallardo',
                      spgName: 'Sistem'
                    }));

                    return [
                      { ...freshOrder, isRoot: true },
                      ...(freshOrder.historyMaintenance || []),
                      ...complaintsList
                    ]
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((historyItem, idx) => (
                        <div key={historyItem.id} style={{ position: 'relative', padding: '16px', backgroundColor: historyItem.isRoot ? '#f8fafc' : (historyItem.isComplaint ? '#fff1f2' : '#ffffff'), borderRadius: '12px', border: '1px solid', borderColor: historyItem.isRoot ? '#e2e8f0' : (historyItem.isComplaint ? '#ffe4e6' : '#f3f4f6'), marginBottom: '16px', transition: 'transform 0.2s, box-shadow 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>

                          {/* Timeline Dot */}
                          <div style={{ position: 'absolute', left: '-31px', top: '24px', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: historyItem.isRoot ? '#10b981' : (historyItem.isComplaint ? '#e11d48' : '#3b82f6'), border: '2px solid #ffffff', boxShadow: '0 0 0 1px #e5e7eb', zIndex: 2 }}></div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <h4 style={{ fontWeight: 'bold', fontSize: '15px', color: '#111', margin: 0 }}>{historyItem.service}</h4>
                              {historyItem.isRoot && (
                                <span style={{ fontSize: '10px', backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', alignSelf: 'flex-start' }}>PEMASANGAN AWAL</span>
                              )}
                              {historyItem.isComplaint && (
                                <span style={{ fontSize: '10px', backgroundColor: '#ffe4e6', color: '#be123c', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', alignSelf: 'flex-start' }}>KLAIM GARANSI</span>
                              )}
                            </div>
                            <span style={{ fontSize: '12px', color: historyItem.isRoot ? '#047857' : (historyItem.isComplaint ? '#be123c' : '#4b5563'), fontFamily: 'monospace', backgroundColor: historyItem.isRoot ? '#d1fae5' : (historyItem.isComplaint ? '#ffe4e6' : '#f3f4f6'), padding: '4px 8px', borderRadius: '6px', fontWeight: '500' }}>
                              {format(new Date(historyItem.date), 'dd MMM yyyy')}
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: historyItem.location === 'Gallardo' ? '#ef4444' : '#3b82f6' }}></span>
                              {historyItem.location} <span style={{ color: '#d1d5db' }}>|</span> Kasir: {historyItem.spgName || 'Sistem'}
                            </p>
                            <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px', backgroundColor: historyItem.status === 'Selesai' ? '#ecfdf5' : '#fffbeb', color: historyItem.status === 'Selesai' ? '#059669' : '#d97706', fontWeight: 'bold', border: '1px solid', borderColor: historyItem.status === 'Selesai' ? '#d1fae5' : '#fef3c7' }}>
                              {historyItem.status}
                            </span>
                          </div>

                          {historyItem.isComplaint && (
                            <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #ffe4e6' }}>
                              <p style={{ fontSize: '13px', color: '#881337', margin: '0 0 8px 0' }}><strong>Keterangan:</strong> {historyItem.description || '-'}</p>
                              {historyItem.proof_photo && (
                                <img
                                  src={historyItem.proof_photo.startsWith('http') ? historyItem.proof_photo : `http://31.97.51.101${historyItem.proof_photo}`}
                                  alt="Bukti Komplain"
                                  style={{ maxWidth: '80px', borderRadius: '6px', cursor: 'pointer', border: '1px solid #fecaca', display: 'block' }}
                                  onClick={() => window.open(historyItem.proof_photo.startsWith('http') ? historyItem.proof_photo : `http://31.97.51.101${historyItem.proof_photo}`, '_blank')}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      ));
                  })()}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                  <Wrench size={32} style={{ margin: '0 auto 12px auto', opacity: 0.3, color: '#4b5563' }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>Tidak ada riwayat servis untuk kendaraan ini.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Pembayaran Modal */}
      {showHistoryPaymentModal && historyPaymentOrder && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowHistoryPaymentModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(2px)' }}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '95%', backgroundColor: '#ffffff', borderRadius: '24px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f3f4f6', paddingBottom: '20px', marginBottom: '24px' }}>
              <div>
                <h3 className="font-sans" style={{ color: '#111', fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>History Pembayaran / Termin</h3>
                <p style={{ color: '#4b5563', fontSize: '14px', margin: 0 }}>
                  <span style={{ fontWeight: '600', color: '#111' }}>{historyPaymentOrder.id}</span> • {historyPaymentOrder.customerName || historyPaymentOrder.supplierName}
                </p>
              </div>
              <button onClick={() => setShowHistoryPaymentModal(false)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#111'; }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#f9fafb'; e.currentTarget.style.color = '#4b5563'; }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {historyPaymentOrder.paymentHistory && historyPaymentOrder.paymentHistory.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 'bold' }}>Tanggal</th>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 'bold' }}>Nominal</th>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 'bold' }}>Metode</th>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 'bold' }}>Catatan</th>
                      <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #e5e7eb', color: '#374151', fontWeight: 'bold' }}>Bukti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyPaymentOrder.paymentHistory.map((hist, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px', color: '#4b5563' }}>Tgl: {format(new Date(hist.date), 'dd/MM/yyyy')}, Jam: {format(new Date(hist.date), 'HH:mm')}</td>
                        <td style={{ padding: '12px', fontWeight: 'bold', color: '#111' }}>{formatCurrency(hist.amount)}</td>
                        <td style={{ padding: '12px', color: '#4b5563' }}>{hist.method}</td>
                        <td style={{ padding: '12px', color: '#4b5563', fontStyle: 'italic' }}>{hist.notes || '-'}</td>
                        <td style={{ padding: '12px' }}>
                          {hist.paymentProof ? (
                            <button onClick={() => {
                              try {
                                const arr = hist.paymentProof.split(',');
                                const mime = arr[0].match(/:(.*?);/)[1];
                                const bstr = atob(arr[1]);
                                let n = bstr.length;
                                const u8arr = new Uint8Array(n);
                                while (n--) {
                                  u8arr[n] = bstr.charCodeAt(n);
                                }
                                const blob = new Blob([u8arr], { type: mime });
                                const url = URL.createObjectURL(blob);
                                window.open(url, '_blank');
                                setTimeout(() => URL.revokeObjectURL(url), 60000); // cleanup
                              } catch (e) {
                                console.error('Failed to open proof:', e);
                                alert('Gagal membuka bukti pembayaran. File mungkin corrupt.');
                              }
                            }} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6366f1', textDecoration: 'none', fontWeight: '500', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }} onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'} onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}>
                              <FileText size={14} /> Lihat Bukti
                            </button>
                          ) : (
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 16px', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px dashed #d1d5db' }}>
                  <p style={{ margin: 0, fontSize: '14px' }}>Belum ada history pembayaran tercatat.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ubah Status Pembayaran Manual Modal */}
      {showManualPaymentModal && manualPaymentOrder && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowManualPaymentModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(2px)' }}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '95%', backgroundColor: '#ffffff', borderRadius: '24px', padding: '0', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#f8fafc' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Ubah Status Pembayaran</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>POS No: {manualPaymentOrder.id}</p>
              </div>
              <button onClick={() => setShowManualPaymentModal(false)} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#4b5563' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const paymentType = formData.get('payment_type');
              const sisaRaw = formData.get('sisa_tagihan') || '0';
              const cleanSisa = Number(sisaRaw.toString().replace(/\D/g, ''));

              try {
                const response = await fetch(`${API_URL}/api/transactions/${manualPaymentOrder.id}/payment-status-manual`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({
                    payment_type: paymentType,
                    sisa_tagihan: cleanSisa
                  })
                });

                const result = await response.json();
                if (response.ok && result.success) {
                  toast.success('Status pembayaran berhasil diubah manual.');
                  setShowManualPaymentModal(false);
                  fetchOrders();
                } else {
                  throw new Error(result.error || 'Gagal mengubah status');
                }
              } catch (error) {
                console.error("Error updating manual payment status:", error);
                toast.error(error.message);
              }
            }} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Tipe Pembayaran</label>
                  <select
                    name="payment_type"
                    required
                    defaultValue={manualPaymentOrder.paymentType || 'DP'}
                    onChange={(e) => {
                      const sisaInput = document.getElementById('manual-sisa-tagihan');
                      if (e.target.value === 'Lunas') {
                        if (sisaInput) sisaInput.value = '0';
                      }
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', backgroundColor: '#f9fafb', color: '#111827' }}
                  >
                    <option value="Lunas">Lunas</option>
                    <option value="DP">DP</option>
                    <option value="Belum Lunas">Belum Lunas</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Sisa Tagihan (Rp)</label>
                  <input
                    id="manual-sisa-tagihan"
                    type="text"
                    name="sisa_tagihan"
                    required
                    defaultValue={manualPaymentOrder.sisaTagihan?.toLocaleString('id-ID') || '0'}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      e.target.value = raw ? Number(raw).toLocaleString('id-ID') : '';
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                  <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>Otomatis 0 jika pilih Lunas.</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowManualPaymentModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#374151', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} /> Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT ONLY LAYOUT */}
      <style>{`
        @media print {
          @page { size: landscape; }
        }
      `}</style>
      <div className="hidden print:block print:w-full print:bg-white print:text-black print:p-0">
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid black', paddingBottom: '10px' }}>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>LAPORAN CUSTOMER & TRANSAKSI</h1>
          <h2 style={{ fontSize: '14px', margin: '4px 0 0 0', fontWeight: 'bold' }}>PT GALLARDO UTAMA SENTOSA</h2>
          <p style={{ fontSize: '12px', color: '#333', margin: '8px 0 0 0' }}>
            Filter Status: <strong>{filterStatus}</strong> | Tanggal: <strong>{startDate ? format(new Date(startDate), 'dd-MM-yyyy') : 'Semua'} s.d {endDate ? format(new Date(endDate), 'dd-MM-yyyy') : 'Semua'}</strong> | Total: <strong>{filteredOrders.length} Kendaraan</strong>
          </p>
        </div>

        {(() => {
          const isRetailReport = filterTransactionType === 'Retail (Grosir)';
          return (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isRetailReport ? '10px' : '12px', fontFamily: 'sans-serif' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: isRetailReport ? '3%' : '5%' }}>No.</th>
                  <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', width: isRetailReport ? '10%' : '15%' }}>POS No & Tgl</th>
                  <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', width: isRetailReport ? '15%' : '15%' }}>Customer</th>
                  <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', width: isRetailReport ? '12%' : '20%' }}>Kendaraan</th>
                  <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', width: isRetailReport ? '12%' : '20%' }}>Produk / Layanan</th>
                  <th style={{ border: '1px solid black', padding: '8px', textAlign: 'right', width: isRetailReport ? '10%' : '15%' }}>Total Pembayaran</th>
                  {isRetailReport && (
                    <th style={{ border: '1px solid black', padding: '8px', textAlign: 'left', width: '30%' }}>History Pembayaran</th>
                  )}
                  <th style={{ border: '1px solid black', padding: '8px', textAlign: 'center', width: isRetailReport ? '8%' : '10%' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={isRetailReport ? "8" : "7"} style={{ border: '1px solid black', padding: '16px', textAlign: 'center' }}>Tidak ada data</td>
                  </tr>
                ) : (
                  filteredOrders.map((order, idx) => {
                    const activeMaintenance = (order.historyMaintenance || []).find(h => h.workStatus === 'Proses' || h.workStatus === 'Aktif');
                    const displayStatus = activeMaintenance ? 'Maintenance (Proses)' : (order.status === 'Selesai' ? 'Selesai' : 'Proses');
                    const isLunas = order.paymentType === 'Lunas';

                    return (
                      <tr key={order.id} style={{ pageBreakInside: 'avoid' }}>
                        <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center', verticalAlign: 'top' }}>{idx + 1}</td>
                        <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 'bold' }}>{order.id}</div>
                          <div>{format(new Date(order.date), 'dd-MM-yyyy')}</div>
                        </td>
                        <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 'bold' }}>{order.customerName || order.supplierName || '-'}</div>
                          <div>{order.customerHp || '-'}</div>
                          {order.customerAddress && (
                            <div style={{ marginTop: '2px', wordBreak: 'break-word' }}>{order.customerAddress}</div>
                          )}
                        </td>
                        <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 'bold' }}>{order.carBrand} {order.carModel}</div>
                          <div>Plat: {order.plateNumber}</div>
                          <div style={{ fontSize: '10px' }}>VIN: {order.chassisNumber || '-'}</div>
                        </td>
                        <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                          {order.service}
                        </td>
                        <td style={{ border: '1px solid black', padding: '6px', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>
                          <div style={{ marginBottom: '4px' }}>{formatCurrency(order.totalPrice)}</div>
                          {isRetailReport && (
                            (() => {
                              const sisaTagihan = order.remainingAmount !== undefined ? order.remainingAmount : Math.max(0, order.totalPrice - (order.paidAmount || 0));
                              return (
                                <div style={{ borderTop: '1px dashed black', paddingTop: '4px', marginTop: '4px', color: sisaTagihan > 0 ? '#ef4444' : 'inherit' }}>
                                  <div style={{ fontSize: '10px' }}>Sisa Tagihan:</div>
                                  <div>{formatCurrency(sisaTagihan)}</div>
                                </div>
                              );
                            })()
                          )}
                        </td>
                        {isRetailReport && (
                          <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                            {order.paymentHistory && order.paymentHistory.length > 0 ? (
                              order.paymentHistory.map((h, i) => {
                                const dateStr = format(new Date(h.date), 'dd/MM/yyyy');
                                const timeStr = format(new Date(h.date), 'HH:mm');
                                return (
                                  <div key={i} style={{ marginBottom: i === order.paymentHistory.length - 1 ? '0' : '4px' }}>
                                    Tgl: {dateStr}, Jam: {timeStr}, Bayar: {formatCurrency(h.amount)}, Ket: {h.notes || `Termin ${i + 1}`}
                                  </div>
                                );
                              })
                            ) : (
                              '-'
                            )}
                          </td>
                        )}
                        <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center', verticalAlign: 'top' }}>
                          <div>{displayStatus}</div>
                          <div style={{ fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>
                            {isLunas ? 'LUNAS' : (order.paymentType === 'DP 50%' || order.paidAmount > 0) ? 'DP/SEBAGIAN' : 'BELUM BAYAR'}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          );
        })()}
      </div>

      {/* Settlement Modal */}
      {settlementOrder && (
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <div className="modal-content premium-card" style={{ width: '90%', maxWidth: '500px', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', backgroundColor: '#fef3c7', borderRadius: '10px', color: '#d97706' }}>
                  <CreditCard size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>Pelunasan Pembayaran</h3>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>POS No: {settlementOrder.id}</p>
                </div>
              </div>
              <button onClick={() => setSettlementOrder(null)} className="icon-btn" style={{ padding: '8px', borderRadius: '50%', backgroundColor: '#f3f4f6', color: '#6b7280', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const amountRaw = formData.get('amount_text') || '0';
              const cleanAmount = Number(amountRaw.toString().replace(/\D/g, ''));
              const amount = cleanAmount;
              if (amount > settlementOrder.computedRemaining) {
                alert(`Nominal pelunasan tidak boleh melebihi sisa tagihan (Rp ${settlementOrder.computedRemaining.toLocaleString('id-ID')})`);
                return;
              }

              let base64Proof = null;
              const fileInput = e.target.querySelector('input[type="file"]');
              if (fileInput && fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                if (file.size > 5 * 1024 * 1024) {
                  alert("Ukuran file tidak boleh lebih dari 5MB!");
                  return;
                }
                base64Proof = await new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => resolve(reader.result);
                  reader.readAsDataURL(file);
                });
              }

              await settlePayment(settlementOrder.id, amount, formData.get('paymentMethod'), formData.get('notes'), base64Proof);

              // Only deduct stock if this settlement fully pays off the remaining balance
              if (amount === settlementOrder.computedRemaining) {
                const orderToDeduct = orders.find(o => o.id === settlementOrder.id) || settlementOrder;
                if (orderToDeduct && orderToDeduct.items) {
                  const isRetail = orderToDeduct.billType === 'Retail (Grosir)' || orderToDeduct.type === 'RETAIL';

                  orderToDeduct.items.forEach(item => {
                    if (item.trackInventory) {
                      if (isRetail) {
                        deductRetailStock(item.id_barang, item.qty);
                      } else {
                        let deductionAmount = 1;
                        if (item.category === 'PPF' || item.product_name?.toUpperCase().includes('VANSGARD') || item.product_name?.toUpperCase().includes('PPF')) {
                          if (orderToDeduct.carSize === 'Small' || orderToDeduct.carSize === 'Medium') deductionAmount = 15;
                          else if (orderToDeduct.carSize === 'Large') deductionAmount = 17;
                          else if (orderToDeduct.carSize === 'Extra Large / Supercar' || orderToDeduct.carSize === 'XL/Luxury') deductionAmount = 18;
                          else deductionAmount = 15;
                        } else if (item.category === 'Coating & Chemical' || item.product_name?.toUpperCase().includes('COATING') || item.product_name?.toUpperCase().includes('RANTIZ')) {
                          deductionAmount = 17;
                        } else if (item.category === 'Kaca Film' || item.product_name?.toUpperCase().includes('KACA FILM') || item.product_name?.toUpperCase().includes('PERFORMANTE') || item.product_name?.toUpperCase().includes('DELUXE')) {
                          deductionAmount = 4;
                        }

                        deductStock(item.id_barang || item.inventory_id || item.id, deductionAmount * (item.qty || item.quantity || 1));
                      }
                    }
                  });
                }
              }

              toast.success('Pelunasan pembayaran berhasil dicatat.');
              setSettlementOrder(null);
            }} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '12px', border: '1px solid #fde68a' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#b45309', fontWeight: '600' }}>Sisa Tagihan / Balance Due</p>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#92400e' }}>
                    {formatCurrency(settlementOrder.computedRemaining)}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Nominal Pelunasan</label>
                  <input
                    type="text"
                    name="amount_text"
                    required
                    defaultValue={settlementOrder.computedRemaining.toLocaleString('id-ID')}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      e.target.value = raw ? Number(raw).toLocaleString('id-ID') : '';
                    }}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Catatan Pelunasan / Termin</label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="Contoh: Pembayaran Termin 1, DP Tambahan"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Metode Pembayaran</label>
                  <select
                    name="paymentMethod"
                    required
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', backgroundColor: 'white' }}
                  >
                    <option value="Tunai / Cash">Tunai / Cash</option>
                    <option value="Transfer BCA">Transfer BCA</option>
                    <option value="Transfer Mandiri">Transfer Mandiri</option>
                    <option value="QRIS">QRIS</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    Bukti Pembayaran
                    {(settlementOrder.billType === 'Retail (Grosir)' || settlementOrder.type === 'RETAIL') ? ' (Wajib)' : ' (Opsional)'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px dashed #d1d5db', borderRadius: '8px', backgroundColor: '#f9fafb' }}>
                    <Upload size={20} color="#6b7280" />
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      required={settlementOrder.billType === 'Retail (Grosir)' || settlementOrder.type === 'RETAIL'}
                      style={{ fontSize: '14px', color: '#4b5563', width: '100%' }}
                    />
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#9ca3af' }}>Format yang didukung: JPG, PNG, PDF (Maks. 5MB)</p>
                </div>

              </div>

              <div style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setSettlementOrder(null)} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#374151', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', cursor: 'pointer' }}>
                  Batal
                </button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: 'white', backgroundColor: '#10b981', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={18} /> Konfirmasi Lunas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Invoice Template for PDF Generation */}
      {invoiceOrder && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '794px' }}>
          <SharedInvoice order={invoiceOrder} />
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditCustomerModal && editCustomerData && (
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="modal-content" style={{ width: '650px', maxWidth: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#ffffff', color: '#111827', borderRadius: '16px', padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <button onClick={() => setShowEditCustomerModal(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', cursor: 'pointer', zIndex: 100, transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e5e7eb'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}>
              <X size={20} />
            </button>
            <div className="text-center mb-8">
              <UserPen size={40} color="#10b981" className="mx-auto mb-3" style={{ marginBottom: '12px' }} />
              <h2 className="font-sans text-2xl font-bold" style={{ color: '#111827', margin: '0' }}>Edit Data Customer</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1.25rem' }}>
              <div className="form-group" style={{ gridColumn: 'span 6' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Nama Lengkap <span className="text-red-500">*</span></label>
                <input type="text" value={editCustomerData.customerName} onChange={e => setEditCustomerData({ ...editCustomerData, customerName: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Nomor Telepon <span className="text-red-500">*</span></label>
                <input type="tel" value={editCustomerData.customerHp} onChange={e => setEditCustomerData({ ...editCustomerData, customerHp: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Email</label>
                <input type="email" value={editCustomerData.customerEmail} onChange={e => setEditCustomerData({ ...editCustomerData, customerEmail: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 6' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Alamat Lengkap <span className="text-red-500">*</span></label>
                <textarea value={editCustomerData.customerAddress} onChange={e => setEditCustomerData({ ...editCustomerData, customerAddress: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none', resize: 'vertical' }} rows="3" onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'}></textarea>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Kota</label>
                <input type="text" value={editCustomerData.customerCity} onChange={e => setEditCustomerData({ ...editCustomerData, customerCity: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Provinsi</label>
                <input type="text" value={editCustomerData.customerProvince} onChange={e => setEditCustomerData({ ...editCustomerData, customerProvince: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Kode Pos</label>
                <input type="text" value={editCustomerData.customerZip} onChange={e => setEditCustomerData({ ...editCustomerData, customerZip: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>

              <div style={{ gridColumn: 'span 6', marginTop: '1rem', borderTop: '1px dashed #e5e7eb', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', margin: '0', letterSpacing: '0.05em' }}>INFORMASI KENDARAAN</h3>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Warna Kendaraan</label>
                <input type="text" value={editCustomerData.carColor} onChange={e => setEditCustomerData({ ...editCustomerData, carColor: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Nomor Polisi</label>
                <input type="text" value={editCustomerData.plateNumber} onChange={e => setEditCustomerData({ ...editCustomerData, plateNumber: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none', textTransform: 'uppercase' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>No. Rangka (VIN)</label>
                <input type="text" value={editCustomerData.chassisNumber} onChange={e => setEditCustomerData({ ...editCustomerData, chassisNumber: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none', textTransform: 'uppercase' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Nomor Mesin</label>
                <input type="text" value={editCustomerData.engineNumber} onChange={e => setEditCustomerData({ ...editCustomerData, engineNumber: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none', textTransform: 'uppercase' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Estimasi Tanggal</label>
                <input type="date" value={editCustomerData.installationDate} onChange={e => setEditCustomerData({ ...editCustomerData, installationDate: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Estimasi Waktu</label>
                <input type="time" value={editCustomerData.installationTime} onChange={e => setEditCustomerData({ ...editCustomerData, installationTime: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none' }} onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 6' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px', fontFamily: 'var(--font-mono-ui)' }}>Keterangan</label>
                <textarea value={editCustomerData.notes} onChange={e => setEditCustomerData({ ...editCustomerData, notes: e.target.value })} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#111827', fontSize: '14px', outline: 'none', resize: 'vertical' }} rows="3" onFocus={e => e.target.style.borderColor = '#10b981'} onBlur={e => e.target.style.borderColor = '#d1d5db'}></textarea>
              </div>
            </div>

            <button
              style={{ width: '100%', marginTop: '2rem', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s', letterSpacing: '0.05em' }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = '#059669'}
              onMouseOut={e => e.currentTarget.style.backgroundColor = '#10b981'}
              onClick={() => {
                if (!editCustomerData.customerName || !editCustomerData.customerHp || !editCustomerData.customerAddress) {
                  alert("Harap lengkapi Nama Lengkap, Nomor Telepon, dan Alamat Lengkap.");
                  return;
                }
                updateOrderOperational(editCustomerData.id, editCustomerData);
                setShowEditCustomerModal(false);
              }}
            >
              SIMPAN PERUBAHAN
            </button>
          </div>
        </div>
      )}

      <ComplaintModal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        transactionData={complaintOrderData}
        onSuccess={() => {
          // Additional logic if needed after saving complaint
        }}
      />
    </>
  );
};

export default AdminCustomerWarranty;
