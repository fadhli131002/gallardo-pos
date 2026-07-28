import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, Download, Eye, Printer, Filter, X, MoreVertical, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOrders } from '../../context/OrderContext';
import { formatCurrency } from '../../data/mockData';
import { format } from 'date-fns';
import html2pdf from 'html2pdf.js';
import SharedInvoice from '../../components/SharedInvoice';
import './FinanceInvoices.css';

const FinanceInvoices = () => {
  const { flatOrders: orders } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('Semua Cabang');
  const [statusFilter, setStatusFilter] = useState('Semua Status');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [detailOrder, setDetailOrder] = useState(null);

  const processedInvoices = useMemo(() => {
    return orders.map(order => {
      let paymentStatus = 'Belum Lunas';
      if (order.status === 'Selesai') paymentStatus = 'Lunas';
      else if (order.status === 'Aktif') paymentStatus = 'DP';
      
      // Handle fallback DP amount if missing in mock data
      let calculatedDp = order.dpAmount || 0;
      if (paymentStatus === 'DP' && calculatedDp === 0) {
        calculatedDp = Math.round((order.totalPrice * 0.3) / 10000) * 10000; // 30% fallback rounded to nearest 10k
      }
      
      // Generate a mock Invoice ID based on date and order ID to make it look professional
      const dateCode = format(new Date(order.date), 'yyyyMM');
      const invoiceId = `INV-${dateCode}-${order.id.toString().padStart(3, '0')}`;
      const computedRemaining = paymentStatus === 'Lunas' ? 0 : (order.totalPrice - calculatedDp);
      
      return {
        ...order,
        invoiceId,
        paymentStatus,
        dpAmount: calculatedDp,
        computedRemaining
      };
    }).filter(inv => {
      // Search Filter
      const matchSearch = inv.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.carBrand.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Branch Filter
      const matchBranch = branchFilter === 'Semua Cabang' || inv.location === branchFilter;
      
      // Status Filter
      const matchStatus = statusFilter === 'Semua Status' || inv.paymentStatus === statusFilter;

      return matchSearch && matchBranch && matchStatus;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders, searchTerm, branchFilter, statusFilter]);

  const handleExportPDF = () => {
    // Clone the table for PDF manipulation
    const tableNode = document.querySelector('.invoices-table');
    if (!tableNode) return;
    const originalTable = tableNode.cloneNode(true);
    
    // Add 'No' header
    const theadTr = originalTable.querySelector('thead tr');
    const noTh = document.createElement('th');
    noTh.innerText = 'No';
    theadTr.insertBefore(noTh, theadTr.firstChild);
    
    // Remove 'Action' header
    theadTr.removeChild(theadTr.lastElementChild);
    
    // Process rows
    const tbodyTrs = originalTable.querySelectorAll('tbody tr');
    tbodyTrs.forEach((tr, index) => {
      if(tr.children.length === 1) return; // Empty state row
      
      // Add 'No' cell
      const noTd = document.createElement('td');
      noTd.innerText = index + 1;
      noTd.style.fontWeight = 'bold';
      tr.insertBefore(noTd, tr.firstChild);
      
      // Remove 'Action' cell
      tr.removeChild(tr.lastElementChild);
    });

    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.fontFamily = 'sans-serif';
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#000000';
    
    const title = document.createElement('h2');
    title.innerText = 'LAPORAN INVOICES MANAGEMENT';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    title.style.fontSize = '24px';
    container.appendChild(title);
    
    // Inline styles for PDF compatibility
    originalTable.style.width = '100%';
    originalTable.style.borderCollapse = 'collapse';
    const ths = originalTable.querySelectorAll('th');
    const tds = originalTable.querySelectorAll('td');
    [...ths, ...tds].forEach(cell => {
      cell.style.border = '1px solid #ddd';
      cell.style.padding = '12px 8px';
      cell.style.textAlign = 'left';
    });
    
    container.appendChild(originalTable);
    
    const opt = {
      margin:       0.5,
      filename:     `Invoices_Report_${format(new Date(), 'yyyyMMdd')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(container).save();
  };

  const handlePrint = async (invoice) => {
    const element = document.getElementById('invoice-content-to-print');
    if (!element) return;

    const opt = {
      margin: 0,
      filename: `Invoice_${invoice.invoiceId || invoice.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        windowWidth: 1024
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
    setSelectedInvoice(null);
  };

  return (
    <div className="invoices-container animate-fade-in pb-10">
      {/* Header Section */}
      <div className="invoices-header">
        <div>
          <h1 className="font-sans text-2xl font-bold">Invoices Management</h1>
          <p className="font-mono-ui text-secondary text-sm">Manage and track all customer payments</p>
        </div>
        <button className="btn-export" onClick={handleExportPDF}>
          <Download size={16} />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className="invoices-filters glass-panel">
        <div className="search-box">
          <Search size={18} className="text-secondary" />
          <input 
            type="text" 
            placeholder="Search by Invoice ID or Customer Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input font-mono-ui"
          />
        </div>
        <div className="filter-dropdowns">
          <div className="dropdown-wrapper">
            <Filter size={16} className="dropdown-icon" />
            <select 
              className="modern-select font-mono-ui"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="Semua Cabang">Semua Cabang</option>
              <option value="Gallardo">Gallardo</option>
              <option value="New Ratu">New Ratu</option>
            </select>
          </div>
          <div className="dropdown-wrapper">
            <Filter size={16} className="dropdown-icon" />
            <select 
              className="modern-select font-mono-ui"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="Semua Status">Semua Status</option>
              <option value="Lunas">Lunas (Hijau)</option>
              <option value="DP">DP (Orange)</option>
              <option value="Belum Lunas">Belum Lunas (Merah)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table Section */}
      <div className="invoices-table-container glass-panel" id="invoices-table-export">
        <div className="table-responsive">
          <table className="invoices-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Tanggal</th>
                <th>Customer & Plat</th>
                <th>Cabang</th>
                <th className="text-right">Total Tagihan</th>
                <th className="text-right">Sisa Tagihan</th>
                <th className="text-center">Status</th>
                <th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {processedInvoices.length > 0 ? (
                processedInvoices.map((inv) => (
                  <tr key={inv.invoiceId}>
                    <td className="font-mono-ui font-bold text-sm">{inv.invoiceId}</td>
                    <td className="text-secondary text-sm">{format(new Date(inv.date), 'dd MMM yyyy')}</td>
                    <td>
                      <div className="customer-info">
                        <span className="customer-name font-medium">{inv.customerName}</span>
                        <span className="customer-plate font-mono-ui text-xs text-secondary">{inv.plateNumber}</span>
                      </div>
                    </td>
                    <td>
                      <span className="branch-text">{inv.location}</span>
                    </td>
                    <td className="text-right font-medium">{formatCurrency(inv.totalPrice)}</td>
                    <td className="text-right font-bold text-orange-600">{formatCurrency(inv.computedRemaining)}</td>
                    <td className="text-center">
                      <span className={`invoice-badge ${inv.paymentStatus === 'Lunas' ? 'badge-lunas' : inv.paymentStatus === 'DP' ? 'badge-dp' : 'badge-belum-lunas'}`}>
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="text-center" style={{ position: 'relative' }}>
                      <button 
                        className="action-btn"
                        onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === inv.invoiceId ? null : inv.invoiceId); }}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>

                      {activeDropdown === inv.invoiceId && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }} />
                          <div className="dropdown-menu premium-card animate-fade-in" style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', minWidth: 'max-content', zIndex: 50, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', borderRadius: '12px', marginRight: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); setSelectedInvoice(inv); setTimeout(() => handlePrint(inv), 100); }}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', fontSize: '13.5px', fontWeight: '500', color: '#374151', textAlign: 'left', whiteSpace: 'nowrap' }} 
                              onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'} 
                              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Printer size={16} color="#4b5563" style={{ flexShrink: 0 }} />
                              <span>Cetak / Print</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); setDetailOrder(inv); }}
                              style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', fontSize: '13.5px', fontWeight: '500', color: '#2563eb', textAlign: 'left', whiteSpace: 'nowrap' }} 
                              onMouseOver={e => e.currentTarget.style.backgroundColor = '#eff6ff'} 
                              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Eye size={16} color="#2563eb" style={{ flexShrink: 0 }} />
                              <span>Lihat Detail Transaksi</span>
                            </button>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-secondary font-mono-ui">
                    Tidak ada data invoice yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Invoice Template for PDF Generation */}
      {selectedInvoice && (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '794px' }}>
          <SharedInvoice order={selectedInvoice} />
        </div>
      )}

      {/* Modal Detail Transaksi (Read Only) */}
      {detailOrder && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center bg-black/50" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="animate-fade-in" style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '500px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <button onClick={() => setDetailOrder(null)} style={{ position: 'absolute', top: '16px', right: '16px', padding: '8px', color: '#9ca3af', backgroundColor: 'transparent', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>
              <X size={20}/>
            </button>
            
            <div style={{ paddingRight: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '4px', color: '#1f2937', marginTop: 0 }}>Detail Transaksi</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>ID: <strong style={{ color: '#1f2937' }}>{detailOrder.invoiceId}</strong></p>
            </div>

            <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1 }}>
              <div style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '2px', margin: 0 }}>Customer</p>
                <p style={{ fontWeight: 'bold', color: '#111827', margin: 0 }}>{detailOrder.customerName} - {detailOrder.plateNumber}</p>
              </div>

              <h4 style={{ fontWeight: 'bold', color: '#374151', fontSize: '14px', marginBottom: '8px', borderBottom: '1px solid #f3f4f6', paddingBottom: '4px' }}>Daftar Produk/Layanan</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {detailOrder.items && detailOrder.items.map((item, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                    <div>
                      <p style={{ fontWeight: '600', color: '#374151', fontSize: '13px', margin: 0 }}>{item.name}</p>
                      <p style={{ color: '#6b7280', fontSize: '12px', margin: 0 }}>Qty: {item.qty} x {formatCurrency(item.price)}</p>
                    </div>
                    <p style={{ fontWeight: 'bold', color: '#111827', fontSize: '13px', margin: 0 }}>{formatCurrency(item.qty * item.price)}</p>
                  </li>
                ))}
              </ul>

              <div style={{ backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '16px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#4b5563', fontSize: '13px' }}>Subtotal</span>
                  <span style={{ fontWeight: '500', color: '#111827', fontSize: '13px' }}>{formatCurrency(detailOrder.totalPrice + (detailOrder.discount || 0))}</span>
                </div>
                {detailOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#ef4444', fontSize: '13px' }}>Diskon</span>
                    <span style={{ fontWeight: '500', color: '#ef4444', fontSize: '13px' }}>-{formatCurrency(detailOrder.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #d1d5db', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px' }}>Total Tagihan</span>
                  <span style={{ fontWeight: 'bold', color: '#111827', fontSize: '14px' }}>{formatCurrency(detailOrder.totalPrice)}</span>
                </div>
                {detailOrder.dpAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#059669', fontSize: '13px' }}>Telah Dibayar (DP)</span>
                    <span style={{ fontWeight: '500', color: '#059669', fontSize: '13px' }}>{formatCurrency(detailOrder.dpAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: '#fef3c7', borderRadius: '6px', border: '1px solid #fde68a', marginTop: '12px' }}>
                  <span style={{ fontWeight: 'bold', color: '#b45309', fontSize: '14px' }}>Sisa Tagihan</span>
                  <span style={{ fontWeight: 'bold', color: '#92400e', fontSize: '16px' }}>{formatCurrency(detailOrder.computedRemaining)}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => setDetailOrder(null)} style={{ backgroundColor: '#111827', color: '#ffffff', padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Tutup</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default FinanceInvoices;
