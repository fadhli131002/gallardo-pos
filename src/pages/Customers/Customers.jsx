import { useState, useMemo, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { format, addYears } from 'date-fns';
import { X, Search, FileText, Download, Printer, Loader2, Shield, ShieldAlert, MessageCircle, FileSpreadsheet, CheckCircle } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import SharedInvoice from '../../components/SharedInvoice';
import * as XLSX from 'xlsx';
import logoGallardo from '../../assets/logo-gallardo.png';
import logoNewRatu from '../../assets/logo-new-ratu.png';
import { formatCurrency } from '../../data/mockData';
import PrintWarrantyHandler, { hasWarranty } from '../../components/PrintWarrantyHandler';
import './Customers.css';

const Customers = () => {
  const { orders } = useOrders();
  const { userBranch } = useOutletContext() || { userBranch: 'Gallardo' };
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState(''); // YYYY-MM-DD
  const [filterWarranty, setFilterWarranty] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('Semua Pembayaran');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPrintingInvoice, setIsPrintingInvoice] = useState(false);

  const monthOptions = []; // No longer needed as we use date picker

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.location && userBranch && order.location !== userBranch) return false;
      
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        order.customerName.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        (order.plateNumber && order.plateNumber.toLowerCase().includes(query)) ||
        (order.carBrand && order.carBrand.toLowerCase().includes(query)) ||
        (order.customerHp && order.customerHp.includes(query)) ||
        (order.engineNumber && order.engineNumber.toLowerCase().includes(query));
      
      if (!matchesSearch) return false;

      if (filterDate) {
        const orderDate = format(new Date(order.date), 'yyyy-MM-dd');
        if (orderDate !== filterDate) return false;
      }

      if (filterWarranty !== 'All') {
        const warrantyActive = hasWarranty(order);
        if (filterWarranty === 'Aktif' && !warrantyActive) return false;
        if (filterWarranty === 'Kedaluwarsa' && warrantyActive) return false;
      }

      if (paymentFilter !== 'Semua Pembayaran') {
        const isPenawaran = order.billType === 'Penawaran' || order.salesCategory === 'Penawaran' || order.paymentMethod === 'Penawaran' || order.method === 'Penawaran';
        
        let pStatus = (order.paymentType || order.paymentStatus || order.type || 'BELUM BAYAR').toUpperCase();
        if (isPenawaran) {
          pStatus = 'PENAWARAN';
        }
        
        if (paymentFilter === 'Penawaran' && pStatus !== 'PENAWARAN') return false;
        if (paymentFilter === 'Lunas' && pStatus !== 'LUNAS') return false;
        if (paymentFilter === 'Belum Bayar' && pStatus !== 'BELUM BAYAR') return false;
        if (paymentFilter === 'DP / Sebagian' && !(pStatus.includes('DP') || pStatus.includes('SEBAGIAN'))) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders, userBranch, searchQuery, filterDate, filterWarranty, paymentFilter]);

  const handleExportExcel = () => {
    const headers = [
      'Nama Pelanggan', 'No. WhatsApp', 'Alamat', 
      'Plat Nomor', 'Ukuran Kendaraan', 'Nomor Mesin', 'Merek/Brand', 'Model Kendaraan', 'Warna', 'Tahun',
      'Jenis Layanan/Paket', 'Tgl Transaksi', 'Status Garansi'
    ];
    
    const excelData = filteredOrders.map(o => {
      const isWarrantyActive = hasWarranty(o);
      const warrantyStatus = isWarrantyActive ? 'Aktif' : 'Tidak Tersedia';
      
      return {
        'Nama Pelanggan': o.customerName || '-',
        'No. WhatsApp': o.customerHp || '-',
        'Alamat': o.customerAddress || '-',
        'Plat Nomor': o.plateNumber || '-',
        'Ukuran Kendaraan': o.carSize || '-',
        'Nomor Mesin': o.engineNumber || '-',
        'Merek/Brand': o.carBrand || '-',
        'Model Kendaraan': o.carModel || '-',
        'Warna': o.carColor || '-',
        'Tahun': o.carYear || '-',
        'Jenis Layanan/Paket': o.service || '-',
        'Tgl Transaksi': format(new Date(o.date), 'dd MMM yyyy'),
        'Status Garansi': warrantyStatus
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData, { header: headers });
    
    // Auto-size columns for better readability
    const columnWidths = headers.map(header => ({
      wch: Math.max(
        header.length,
        ...excelData.map(row => (row[header] ? row[header].toString().length : 0))
      ) + 2
    }));
    worksheet['!cols'] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Database Customer");
    
    XLSX.writeFile(workbook, `Data_Customer_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
  };

  const handleExportTablePDF = async () => {
    const element = document.getElementById('customer-table-export');
    if (!element) return;
    
    setIsGeneratingPDF(true);
    const opt = {
      margin: 10,
      filename: `Data_Customer_${format(new Date(), 'dd_MM_yyyy')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 1.5, 
        useCORS: true, 
        windowWidth: element.scrollWidth + 50,
        ignoreElements: (el) => el.classList && el.classList.contains('no-print') 
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation failed", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleShareWA = async (order) => {
    setIsGeneratingPDF(true);
    const text = `*GALLARDO AUTO SPORT - INVOICE*\n-----------------------------------\nHalo ${order.customerName},\nBerikut adalah rincian tagihan Anda:\nLayanan: ${order.service}\nKendaraan: ${order.carBrand} ${order.carModel} (${order.plateNumber})\nTotal: ${formatCurrency(order.totalPrice)}\n-----------------------------------\nTerima kasih atas kepercayaannya!`;
    
    const waUrl = `https://wa.me/${(order.customerHp || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
    const element = document.getElementById('invoice-content-to-print');

    if (!element) {
      window.open(waUrl, '_blank');
      setIsGeneratingPDF(false);
      return;
    }

    const safeCustomerName = (order.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const dynamicFileName = `Invoice_${order.id}_${safeCustomerName}.pdf`;

    const opt = {
      margin: 0,
      filename: dynamicFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        ignoreElements: (el) => el.classList && el.classList.contains('no-print')
      },
      jsPDF: { 
        unit: 'px', 
        format: [794, 1123], 
        orientation: 'portrait' 
      }
    };

    try {
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const file = new File([pdfBlob], dynamicFileName, { type: 'application/pdf' });
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Invoice ${order.id}`,
          text: text
        });
      } else {
        alert("Dokumen PDF akan diunduh otomatis. Silakan lampirkan file tersebut di WhatsApp.");
        html2pdf().set(opt).from(element).save();
        setTimeout(() => {
          window.open(waUrl, '_blank');
        }, 1500);
      }
    } catch (error) {
      console.error("PDF generation failed", error);
      window.open(waUrl, '_blank');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintPDF = async () => {
    const element = document.getElementById('invoice-content-to-print');
    if (!element) return;
    
    setIsPrintingInvoice(true);

    const order = invoiceOrder;
    const safeCustomerName = (order?.customerName || 'Customer').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const dynamicFileName = `Invoice_${order?.id || 'Doc'}_${safeCustomerName}.pdf`;

    const opt = {
      margin: 0,
      filename: dynamicFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        ignoreElements: (el) => el.classList && el.classList.contains('no-print')
      },
      jsPDF: { 
        unit: 'px', 
        format: [794, 1123], 
        orientation: 'portrait' 
      }
    };
    
    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Print failed", error);
    } finally {
      setIsPrintingInvoice(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (invoiceOrder) setInvoiceOrder(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [invoiceOrder]);

  return (
    <div className="customers-page animate-fade-in">
      <div className="page-header no-print">
        <div>
          <h1 className="page-title">Daftar Customer</h1>
          <p className="page-subtitle">Kelola data pelanggan dan riwayat transaksi</p>
        </div>
        <div className="flex gap-3" style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleExportExcel} 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              backgroundColor: '#111827', color: '#ffffff', 
              border: '1px solid #111827', borderRadius: '8px', 
              padding: '8px 16px', fontSize: '0.875rem', fontWeight: '600',
              cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <FileSpreadsheet size={16} /> Export Excel
          </button>
        </div>
      </div>

      <div className="customers-list premium-card no-print">
        <div className="table-toolbar flex flex-col md:flex-row gap-4 mb-6" style={{ padding: '1.5rem 1.5rem 0 1.5rem' }}>
          <div className="search-box flex-1" style={{ maxWidth: '100%' }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Cari nama, no WhatsApp, plat, atau no mesin..." 
              className="input-field search-input w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-4" style={{ display: 'flex', gap: '16px' }}>
            <div className="input-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', minHeight: '42px', width: 'auto' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#6b7280' }}>Tgl:</span>
              <input 
                type="date"
                value={filterDate} 
                onChange={e => setFilterDate(e.target.value)}
                style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.875rem', color: '#111827' }}
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={14} color="#ef4444" />
                </button>
              )}
            </div>
            <select 
              className="input-field" 
              style={{ minHeight: '42px', padding: '0 36px 0 16px', minWidth: '220px', width: 'auto', cursor: 'pointer' }}
              value={filterWarranty} 
              onChange={e => setFilterWarranty(e.target.value)}
            >
              <option value="All">Semua Status Garansi</option>
              <option value="Aktif">Garansi Aktif</option>
              <option value="Kedaluwarsa">Kedaluwarsa / Tdk Ada</option>
            </select>
            <select 
              className="input-field" 
              style={{ minHeight: '42px', padding: '0 36px 0 16px', minWidth: '220px', width: 'auto', cursor: 'pointer' }}
              value={paymentFilter} 
              onChange={e => setPaymentFilter(e.target.value)}
            >
              <option value="Semua Pembayaran">Semua Pembayaran</option>
              <option value="Lunas">Lunas</option>
              <option value="Belum Bayar">Belum Bayar</option>
              <option value="DP / Sebagian">DP / Sebagian</option>
              <option value="Penawaran">Penawaran</option>
            </select>
          </div>
        </div>
        
        <div className="table-responsive w-full overflow-auto shadow-[inset_-15px_0_15px_-15px_rgba(0,0,0,0.1)]" id="customer-table-export" style={{ maxHeight: '65vh' }}>
          <table className="customers-table w-full text-left border-collapse" style={{ backgroundColor: 'white', minWidth: '1200px' }}>
            <thead className="sticky top-0 z-10 bg-[#f9fafb] shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Nama Pelanggan</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">No. WhatsApp</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Alamat</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Plat Nomor</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Ukuran Kendaraan</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Nomor Mesin</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Merek/Brand</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Model Kendaraan</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Warna</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Tahun</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Jenis Layanan/Paket</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap">Tgl Transaksi</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold whitespace-nowrap text-center">Status Garansi</th>
                <th className="font-sans py-3 px-4 text-sm text-gray-600 font-semibold text-center no-print whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center text-tertiary py-8">Belum ada data customer</td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const warrantyYears = getWarrantyYears(order);
                  const isWarrantyActive = hasWarranty(order);

                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-black whitespace-nowrap">
                        <div className="font-semibold">{order.customerName}</div>
                        <div className="text-xs text-gray-500 font-mono-ui">{order.id}</div>
                      </td>
                      <td className="py-3 px-4 text-sm text-black font-mono-ui whitespace-nowrap">{order.customerHp || '-'}</td>
                      <td className="py-3 px-4 text-sm text-black whitespace-nowrap">{order.customerAddress || '-'}</td>
                      <td className="py-3 px-4 text-sm text-black font-mono-ui whitespace-nowrap">{order.plateNumber || '-'}</td>
                      <td className="py-3 px-4 text-sm text-black whitespace-nowrap">{order.carSize || '-'}</td>
                      <td className="py-3 px-4 text-sm text-black font-mono-ui whitespace-nowrap">{order.engineNumber || '-'}</td>
                      <td className="py-3 px-4 text-sm text-black font-medium whitespace-nowrap">{order.type === 'RETAIL' ? '-' : (order.carBrand || '-')}</td>
                      <td className="py-3 px-4 text-sm text-black whitespace-nowrap">{order.type === 'RETAIL' ? 'Pembelian Grosir / Non-Kendaraan' : (order.carModel || '-')}</td>
                      <td className="py-3 px-4 text-sm text-black whitespace-nowrap">{order.carColor || '-'}</td>
                      <td className="py-3 px-4 text-sm text-black whitespace-nowrap font-mono-ui">{order.carYear || '-'}</td>
                      <td className="py-3 px-4 text-sm font-medium text-black whitespace-nowrap">{order.service}</td>
                      <td className="py-3 px-4 text-sm text-black whitespace-nowrap">{format(new Date(order.date), 'dd MMM yyyy')}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isWarrantyActive && warrantyYears > 0 ? (
                          <span 
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full cursor-pointer hover:bg-green-200 transition-colors whitespace-nowrap" 
                            onClick={() => setSelectedOrder(order)}
                            title="Lihat Sertifikat"
                          >
                            <Shield size={12} /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-500 rounded-full whitespace-nowrap">
                            <ShieldAlert size={12} /> Tdk Tersedia
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center no-print whitespace-nowrap">
                        <button 
                          className="inline-flex items-center justify-center p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors border border-gray-200" 
                          title="Cetak Invoice" 
                          onClick={() => setInvoiceOrder(order)}
                        >
                          <Printer size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {invoiceOrder && (
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setInvoiceOrder(null)}>
          <div className="w-[95vw] max-w-5xl bg-white rounded-lg shadow-lg overflow-hidden flex flex-col relative" style={{ maxHeight: '90vh', minWidth: 0, minHeight: 0 }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close no-print absolute top-4 right-4 z-50 bg-white hover:bg-gray-100 rounded-full w-10 h-10 flex items-center justify-center text-gray-600 shadow-md transition-colors" onClick={() => setInvoiceOrder(null)}><X size={24} /></button>
            <div className="flex-1 p-4 md:p-8 print:!overflow-visible" style={{ backgroundColor: '#e5e7eb', overflowY: 'auto', overflowX: 'auto', minWidth: 0, minHeight: 0 }}>
              <div className="invoice-preview-wrapper" style={{ width: 'max-content', margin: '0 auto' }}>
                <SharedInvoice order={invoiceOrder} />
              </div>
            </div>
            
            <div className="invoice-actions no-print mt-4 flex flex-wrap justify-center gap-4 pt-4">
              <button 
                className="flex justify-center items-center gap-2 bg-black hover:bg-gray-800 text-white px-8 py-3 rounded-lg font-bold transition-colors shadow-lg" 
                onClick={() => handlePrintPDF()}
                disabled={isPrintingInvoice}
              >
                {isPrintingInvoice ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />} 
                {isPrintingInvoice ? 'Mencetak...' : 'Cetak Invoice PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Modal */}
      {selectedOrder && (
        <PrintWarrantyHandler isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} transaction={selectedOrder} />
      )}
    </div>
  );
};

export default Customers;
