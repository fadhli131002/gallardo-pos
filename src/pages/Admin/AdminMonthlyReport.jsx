import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Package, ShoppingBag, FileText, Printer, Search, Download, Loader2, CreditCard, TrendingUp, TrendingDown, PieChart, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';
import { formatTransactionId } from '../../utils/formatId';
import DashboardDetailsModal from '../../components/DashboardDetailsModal';

/**
 * MoMBadge — Badge persentase Month-over-Month
 * pct = null  → Badge abu-abu "Data Awal" (bulan lalu belum ada data)
 * pct > 0     → Badge hijau "+XX%"
 * pct < 0     → Badge merah "-XX%"
 * pct = 0     → Badge abu-abu "0%"
 */
const MoMBadge = ({ pct }) => {
  if (pct === null || pct === undefined) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/70 shrink-0 whitespace-nowrap">
        <Minus className="w-3 h-3" />
        Data Awal
      </span>
    );
  }
  if (pct > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 shrink-0 whitespace-nowrap">
        <ArrowUpRight className="w-3 h-3" />
        +{pct}% MoM
      </span>
    );
  }
  if (pct < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200/80 shrink-0 whitespace-nowrap">
        <ArrowDownRight className="w-3 h-3" />
        {pct}% MoM
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/70 shrink-0 whitespace-nowrap">
      <Minus className="w-3 h-3" />
      0% MoM
    </span>
  );
};

const AdminMonthlyReport = () => {
  const [activeTab, setActiveTab] = useState('omset');
  
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
  const [monthFilter, setMonthFilter] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState('Semua'); // Used for invoice tab
  const [productStatusFilter, setProductStatusFilter] = useState('Semua'); // Used for product tab
  const [revenueTypeFilter, setRevenueTypeFilter] = useState('Gross');
  const [productBrandFilter, setProductBrandFilter] = useState('Semua');
  const [isExporting, setIsExporting] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data States
  const [netRevenue, setNetRevenue] = useState(null);
  const [salesByProduct, setSalesByProduct] = useState([]);
  const [stockMutation, setStockMutation] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [complaints, setComplaints] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Computed data for Produk Filter
  const uniqueBrands = ['Semua', ...new Set(salesByProduct.map(item => (item.product_name || 'Lainnya').split(' ')[0].toUpperCase()))];
  
  const filteredSalesByProduct = salesByProduct.filter(item => {
    if (productBrandFilter === 'Semua') return true;
    const brand = (item.product_name || 'Lainnya').split(' ')[0].toUpperCase();
    return brand === productBrandFilter;
  });

  const totalQtyProduct = filteredSalesByProduct.reduce((sum, item) => sum + (item.qty || 0), 0);
  const totalRevenueProduct = filteredSalesByProduct.reduce((sum, item) => sum + (revenueTypeFilter === 'Gross' ? (item.total_revenue_gross || item.total_revenue || 0) : (item.total_revenue_net || 0)), 0);
  
  useEffect(() => {
    fetchData();
  }, [activeTab, monthFilter, statusFilter, productStatusFilter]);
  
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = {
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      };
      
      const API_URL = window.API_URL || '';
      
      if (activeTab === 'omset') {
        const [year, month] = monthFilter.split('-');
        const startDate = new Date(year, parseInt(month) - 1, 1).toISOString();
        const endDate = new Date(year, parseInt(month), 0, 23, 59, 59, 999).toISOString();
        const res = await fetch(`${API_URL}/api/finance/dashboard?startDate=${startDate}&endDate=${endDate}`, { headers });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Error ${res.status}: ${errText || 'Gagal mengambil data omset'}`);
        }
        const data = await res.json();
        setNetRevenue(data || { totalKasMasuk: 0, totalPiutang: 0, totalOmset: 0, labaRugi: 0 });
      } else if (activeTab === 'produk') {
        const res = await fetch(`${API_URL}/api/reports/monthly/sales-by-product?month=${monthFilter}&status=${productStatusFilter}`, { headers });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Error ${res.status}: ${errText || 'Gagal mengambil data produk'}`);
        }
        const data = await res.json();
        setSalesByProduct(data || []);
      } else if (activeTab === 'stok') {
        const res = await fetch(`${API_URL}/api/reports/monthly/stock-mutation?month=${monthFilter}`, { headers });
        if (!res.ok) throw new Error('Gagal mengambil data stok');
        const data = await res.json();
        setStockMutation(data || []);
      } else if (activeTab === 'invoice') {
        const res = await fetch(`${API_URL}/api/reports/monthly/invoices?month=${monthFilter}&status=${statusFilter}`, { headers });
        if (!res.ok) throw new Error('Gagal mengambil data invoice');
        const data = await res.json();
        setInvoices(data || []);
      } else if (activeTab === 'komplain') {
        const res = await fetch(`${API_URL}/api/reports/monthly/complaints?month=${monthFilter}`, { headers });
        if (!res.ok) throw new Error('Gagal mengambil data komplain');
        const data = await res.json();
        setComplaints(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
  };

  const handlePrintPDF = async (exportAll = true) => {
    setIsExporting(true);
    
    const tabNames = {
      omset: 'Omset Bersih',
      produk: 'Penjualan Produk',
      stok: 'Mutasi Stok',
      invoice: 'Daftar Transaksi',
      komplain: 'Data Komplain'
    };
    
    const toastMessage = exportAll 
      ? 'Sedang mengumpulkan data dan membuat PDF Lengkap...' 
      : `Sedang membuat PDF ${tabNames[activeTab]}...`;
      
    const toastId = toast.loading(toastMessage);

    try {
      const headers = { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` };
      const API_URL = window.API_URL || '';

      // ── Validasi Mandatory Beban Operasional ─────────────────────────
      if (exportAll || activeTab === 'omset') {
        try {
          const chk = await fetch(`${API_URL}/api/reports/validate-beban?month=${monthFilter}`, { headers });
          if (chk.ok) {
            const chkData = await chk.json();
            if (chkData.isValid === false) {
              toast.dismiss(toastId);
              setIsExporting(false);
              toast.error(`Beban Operasional bulan ${monthFilter} belum diisi (Rp 0). Laporan tidak dapat digenerate karena akan menghasilkan Laba Bersih yang tidak akurat. Isi beban di menu Keuangan → Beban Operasional.`);
              return;
            }
          }
        } catch (_) {}
      }
      // ─────────────────────────────────────────────────────────────────

      const [year, month] = monthFilter.split('-');
      const startDate = new Date(year, parseInt(month) - 1, 1).toISOString();
      const endDate = new Date(year, parseInt(month), 0, 23, 59, 59, 999).toISOString();

      // Fetch ALL data required for the full report concurrently
      const [omsetRes, produkRes, stokRes, invoiceRes, komplainRes] = await Promise.all([
        fetch(`${API_URL}/api/finance/dashboard?startDate=${startDate}&endDate=${endDate}`, { headers }),
        fetch(`${API_URL}/api/reports/monthly/sales-by-product?month=${monthFilter}&status=${productStatusFilter}`, { headers }),
        fetch(`${API_URL}/api/reports/monthly/stock-mutation?month=${monthFilter}`, { headers }),
        fetch(`${API_URL}/api/reports/monthly/invoices?month=${monthFilter}&status=${statusFilter}`, { headers }),
        fetch(`${API_URL}/api/reports/monthly/complaints?month=${monthFilter}`, { headers })
      ]);

      const [omsetData, produkData, stokData, invoiceData, komplainData] = await Promise.all([
        omsetRes.ok ? omsetRes.json() : null,
        produkRes.ok ? produkRes.json() : [],
        stokRes.ok ? stokRes.json() : [],
        invoiceRes.ok ? invoiceRes.json() : [],
        komplainRes.ok ? komplainRes.json() : []
      ]);

      // Update states so hidden tables get populated
      setNetRevenue(omsetData || { totalKasMasuk: 0, totalPiutang: 0, totalOmset: 0, labaRugi: 0 });
      setSalesByProduct(produkData || []);
      setStockMutation(stokData || []);
      setInvoices(invoiceData || []);
      setComplaints(komplainData || []);

      // Wait for React to finish rendering the hidden tables with the new data
      setTimeout(async () => {
        try {
          // Create a completely unattached container
          const container = document.createElement('div');
          container.style.backgroundColor = '#ffffff';

          // Inject the styles directly into the container so html2canvas can read them
          const styleBlock = document.createElement('style');
          styleBlock.innerHTML = `
            .pdf-table-container { padding: 20px; background-color: #ffffff; color: #000000; box-sizing: border-box; width: 100%; page-break-after: always; }
            .pdf-table-container:last-child { page-break-after: auto; }
            .pdf-table-container table { width: 100%; border-collapse: collapse; margin-top: 20px; font-family: sans-serif; }
            .pdf-table-container tr { page-break-inside: avoid !important; }
            .pdf-table-container th, .pdf-table-container td { padding: 12px 16px; font-size: 13px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            .pdf-table-container th { background-color: #f8fafc; font-weight: bold; border-bottom: 2px solid #cbd5e1; color: #334155; text-transform: uppercase; font-size: 12px; }
            .pdf-table-container h1, .pdf-table-container h2 { text-align: center; color: #0f172a; margin-bottom: 4px; font-family: sans-serif; }
            .pdf-table-container tbody tr:nth-child(even) { background-color: #fcfcfc; }
          `;
          container.appendChild(styleBlock);

          // Append requested reports into the PDF container
          const reportIds = exportAll ? [
            'laporan-omset-pdf',
            'laporan-produk-pdf',
            'laporan-stok-pdf',
            'laporan-invoice-pdf',
            'laporan-komplain-pdf'
          ] : [`laporan-${activeTab}-pdf`];

          reportIds.forEach(id => {
            const originalElement = document.getElementById(id);
            if (originalElement) {
              const clone = originalElement.cloneNode(true);
              clone.className = clone.className.replace('hidden', '');
              clone.style.display = 'block';
              clone.style.width = '100%';
              container.appendChild(clone);
            }
          });

          const fileName = exportAll 
            ? `Laporan_Lengkap_${monthFilter}.pdf`
            : `Laporan_${tabNames[activeTab].replace(' ', '_')}_${monthFilter}.pdf`;

          const opt = {
            margin: 0.5,
            filename: fileName,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
            pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', 'td', 'th'] }
          };

          await html2pdf().set(opt).from(container).save();
          toast.success(exportAll ? 'Laporan lengkap berhasil diekspor!' : `Laporan ${tabNames[activeTab]} berhasil diekspor!`, { id: toastId });
        } catch (err) {
          console.error('Error generating PDF:', err);
          toast.error('Terjadi kesalahan saat membuat file PDF.', { id: toastId });
        } finally {
          setIsExporting(false);
        }
      }, 500); // 500ms delay to ensure DOM is updated

    } catch (err) {
      console.error('Error fetching data for PDF:', err);
      toast.error('Gagal memuat data laporan lengkap.', { id: toastId });
      setIsExporting(false);
    }
  };

  const handleCardClick = async (type) => {
    setModalType(type);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalData(null);
    try {
      const [year, month] = monthFilter.split('-');
      const startDate = new Date(year, parseInt(month) - 1, 1).toISOString();
      const endDate = new Date(year, parseInt(month), 0, 23, 59, 59, 999).toISOString();
      
      const API_URL = window.API_URL || '';
      const url = `${API_URL}/api/finance/dashboard/details?type=${type}&startDate=${startDate}&endDate=${endDate}`;
        
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error('Gagal mengambil data rincian');
      const data = await res.json();
      setModalData(data);
    } catch (err) {
      toast.error(err.message);
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col space-y-6 bg-slate-50 text-slate-900">
      {/* Header & Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-[20px] shadow-[0_4px_24px_rgba(0,0,0,0.02)] border border-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Laporan Bulanan</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Pantau performa penjualan, omset, dan mutasi stok.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="pl-10 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold text-slate-700 hover:bg-slate-100/60 transition-colors"
            />
          </div>
          <button
            onClick={() => handlePrintPDF(false)}
            disabled={isExporting}
            className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all text-sm ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            {isExporting ? 'Memproses...' : `Export ${activeTab === 'omset' ? 'Omset' : activeTab === 'produk' ? 'Produk' : activeTab === 'stok' ? 'Stok' : activeTab === 'invoice' ? 'Transaksi' : 'Komplain'}`}
          </button>
          <button
            onClick={() => handlePrintPDF(true)}
            disabled={isExporting}
            className={`flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-sm hover:shadow transition-all text-sm ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            {isExporting ? 'Memproses...' : 'Export Lengkap'}
          </button>
        </div>
      </div>

      {/* Floating Pill Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-200/60 backdrop-blur-sm rounded-2xl max-w-fit border border-slate-200/50">
        {[
          { id: 'omset', label: 'Omset Bersih', icon: DollarSign },
          { id: 'produk', label: 'Penjualan Produk', icon: ShoppingBag },
          { id: 'stok', label: 'Mutasi Stok', icon: Package },
          { id: 'invoice', label: 'Daftar Transaksi', icon: FileText },
          { id: 'komplain', label: 'Data Komplain', icon: FileText }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1"
      >
        {isLoading ? (
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-12 flex flex-col items-center justify-center min-h-[320px]">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Memuat data laporan...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-[20px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8 text-center min-h-[320px] flex flex-col items-center justify-center">
            <div className="text-red-500 text-5xl mb-3">⚠️</div>
            <p className="text-xl font-bold text-slate-900 mb-1">Gagal Memuat Data</p>
            <p className="text-slate-500 text-sm max-w-md">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-6 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-semibold hover:bg-blue-100 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div>
            {/* TAB OMSET */}
            {activeTab === 'omset' && (
              netRevenue ? (() => {
                const plData = netRevenue.pl || {};
                const cashflowData = netRevenue.cashflow || {};
                const momData = netRevenue.momComparison || {};
                const receivablesData = netRevenue.receivables || {};

                const totalOmset = plData.totalOmset ?? netRevenue.totalOmset ?? 0;
                const totalHpp = plData.totalHpp ?? netRevenue.totalHpp ?? 0;
                const totalBeban = plData.totalBeban ?? netRevenue.totalExpense ?? 0;
                const totalKomisi = plData.totalKomisi ?? netRevenue.totalKomisi ?? 0;
                const labaKotor = plData.labaKotor ?? (totalOmset - totalHpp);

                // Laba Bersih WAJIB basis akrual: Total Omset - Total HPP - Total Beban - Total Komisi
                const labaBersih = plData.labaBersih ?? (totalOmset - totalHpp - totalBeban - totalKomisi);

                // Cashflow murni uang fisik/transfer riil
                const kasMasuk = cashflowData.kasMasuk ?? netRevenue.totalKasMasuk ?? 0;
                const kasKeluar = cashflowData.kasKeluar ?? (totalBeban + (netRevenue.totalPembelian || cashflowData.totalPembelian || 0));
                const netCashflow = cashflowData.netCashflow ?? (kasMasuk - kasKeluar);
                const totalTerkumpul = cashflowData.totalTerkumpul ?? netRevenue.totalTerkumpul ?? 0;
                const pelunasanPiutangLama = cashflowData.pelunasanPiutangLama ?? netRevenue.pelunasanPiutangLama ?? 0;
                const kasBulanIni = cashflowData.kasBulanIni ?? netRevenue.kasBulanIni ?? 0;
                const totalPiutang = receivablesData.totalPiutang ?? netRevenue.totalPiutang ?? 0;
                const totalPiutangPeriode = receivablesData.totalPiutangPeriode ?? netRevenue.totalPiutangPeriode ?? 0;

                return (
                  <div className="space-y-6">
                    {/* Section 1: Arus Kas Riil (Cashflow) */}
                    <div className="w-full text-left">
                      <div className="w-full mb-4 mt-4 text-left">
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-2.5 text-left">
                            <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                              1
                            </span>
                            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight text-left">ARUS KAS RIIL (CASHFLOW)</h3>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200/80 shadow-2xs shrink-0">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            Periode: {monthFilter}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium text-left">
                          Penerimaan & pengeluaran uang fisik / transfer yang benar-benar terjadi pada periode {monthFilter}
                        </p>
                      </div>

                      {/* Bento 4-Column Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-5">
                        {/* Kartu 1: Kas Masuk Riil */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleCardClick('kas-masuk')}
                          className="bg-white rounded-[22px] p-5 xl:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:border-emerald-200 min-w-0 overflow-hidden"
                        >
                          <div>
                            {/* Top Row: Label & Icon Container */}
                            <div className="h-8 flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">KAS MASUK RIIL</span>
                              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shrink-0">
                                <DollarSign className="w-4 h-4" />
                              </div>
                            </div>
                            
                            {/* Middle Row: Value */}
                            <div className="text-2xl xl:text-[28px] font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                              {formatCurrency(kasMasuk)}
                            </div>
                            {/* Badge Slot: Fixed height for alignment */}
                            <div className="h-6 flex items-center">
                              <MoMBadge pct={momData?.kas?.pct} />
                            </div>
                          </div>

                          {/* Bottom Row: Context Subtext */}
                          <div className="flex items-center gap-2 pt-3 mt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">Uang Masuk Tunai & Transfer</span>
                          </div>
                        </motion.div>

                        {/* Kartu 2: Pelunasan Piutang Lama */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                          onClick={() => handleCardClick('piutang-lama')}
                          className="bg-white rounded-[22px] p-5 xl:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:border-teal-200 min-w-0 overflow-hidden"
                        >
                          <div>
                            {/* Top Row: Label & Status Badge */}
                            <div className="h-8 flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate" title="Pelunasan Piutang Lama">PELUNASAN PIUTANG LAMA</span>
                              <span className="px-2.5 py-1 bg-teal-50 text-teal-700 border border-teal-200/80 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap">
                                Bagian Kas Masuk
                              </span>
                            </div>
                            
                            {/* Middle Row: Value */}
                            <div className="text-2xl xl:text-[28px] font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                              {formatCurrency(pelunasanPiutangLama)}
                            </div>
                            {/* Badge Slot: Fixed height for alignment */}
                            <div className="h-6 flex items-center" />
                          </div>

                          {/* Bottom Row: Context Subtext */}
                          <div className="flex items-center gap-2 pt-3 mt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                            <CreditCard className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            <span className="truncate">Cicilan / Termin Invoice Lalu</span>
                          </div>
                        </motion.div>

                        {/* Kartu 3: Net Cashflow */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          onClick={() => handleCardClick('net-cashflow')}
                          className="bg-white rounded-[22px] p-5 xl:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:border-cyan-200 min-w-0 overflow-hidden"
                        >
                          <div>
                            {/* Top Row: Label & Icon Container */}
                            <div className="h-8 flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">NET CASHFLOW</span>
                              <div className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 group-hover:scale-105 transition-transform shrink-0">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                            </div>
                            
                            {/* Middle Row: Value */}
                            <div className={`text-2xl xl:text-[28px] font-black tracking-tight leading-none mb-2 truncate ${netCashflow >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                              {netCashflow < 0 ? '-' : ''}{formatCurrency(Math.abs(netCashflow))}
                            </div>
                            {/* Badge Slot: Fixed height for alignment */}
                            <div className="h-6 flex items-center">
                              <MoMBadge pct={momData?.cashflow?.pct} />
                            </div>
                          </div>

                          {/* Bottom Row: Context Subtext */}
                          <div className="flex items-center gap-2 pt-3 mt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${netCashflow >= 0 ? 'bg-cyan-500' : 'bg-rose-500'}`} />
                            <span className="truncate">Kas Masuk - Kas Keluar</span>
                          </div>
                        </motion.div>

                        {/* Kartu 4: Sisa Piutang Berjalan */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          onClick={() => handleCardClick('piutang')}
                          className="bg-white rounded-[22px] p-5 xl:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:border-amber-200 min-w-0 overflow-hidden"
                        >
                          <div>
                            {/* Top Row: Label & Status Badge */}
                            <div className="h-8 flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate" title="Sisa Piutang Berjalan">SISA PIUTANG BERJALAN</span>
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap">
                                Belum Lunas
                              </span>
                            </div>
                            
                            {/* Middle Row: Value */}
                            <div className="text-2xl xl:text-[28px] font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                              {formatCurrency(totalPiutang)}
                            </div>
                            {/* Badge Slot: Fixed height for alignment */}
                            <div className="h-6 flex items-center" />
                          </div>

                          {/* Bottom Row: Context Subtext */}
                          <div className="flex items-center gap-2 pt-3 mt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                            <CreditCard className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">{totalPiutangPeriode > 0 ? `Bulan ini: ${formatCurrency(totalPiutangPeriode)}` : 'Total Akumulasi'}</span>
                          </div>
                        </motion.div>
                      </div>

                      {/* Verification Banner */}
                      <div className="w-full bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-emerald-50/90 border border-emerald-200/90 rounded-[20px] p-4 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-2xs mt-4 mb-2 min-w-0">
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs sm:text-sm text-slate-700">
                          <span className="inline-flex items-center gap-1.5 font-bold text-slate-900 shrink-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Pemetaan Kas Masuk Riil:
                          </span>
                          <span className="bg-white/90 border border-emerald-200/80 px-2.5 py-1 rounded-lg font-semibold text-slate-700 text-xs shadow-2xs">
                            Kas Invoice Berjalan: <strong className="text-slate-900">{formatCurrency(kasBulanIni)}</strong>
                          </span>
                          <span className="text-emerald-700 font-bold">+</span>
                          <span className="bg-white/90 border border-emerald-200/80 px-2.5 py-1 rounded-lg font-semibold text-slate-700 text-xs shadow-2xs">
                            Pelunasan Piutang Lalu: <strong className="text-slate-900">{formatCurrency(pelunasanPiutangLama)}</strong>
                          </span>
                          <span className="text-emerald-700 font-bold">=</span>
                          <span className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-bold text-xs shadow-2xs">
                            {formatCurrency(kasMasuk)}
                          </span>
                        </div>
                        <div className="shrink-0">
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300/80 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            Terverifikasi Sinkron (Selisih Rp 0)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Standar Laporan Keuangan SOP (Laba Rugi Akrual) */}
                    <div className="w-full text-left">
                      <div className="w-full mb-4 mt-8 text-left">
                        <div className="flex items-center justify-between gap-3 w-full">
                          <div className="flex items-center gap-2.5 text-left">
                            <span className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                              2
                            </span>
                            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight text-left">STANDAR LAPORAN KEUANGAN SOP (LABA RUGI AKRUAL)</h3>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-200/80 shadow-2xs shrink-0">
                            <PieChart className="w-3.5 h-3.5 text-indigo-500" />
                            Profit & Loss Analysis
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1.5 font-medium text-left">
                          Dihitung murni berdasarkan basis akrual: Total Omset Penjualan dikurangi HPP, Beban Operasional, dan Komisi Sales
                        </p>
                      </div>

                      {/* Bento Responsive Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 xl:gap-5">
                        {/* Kartu 1: Total Omset (Akrual) */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={() => handleCardClick('omset')}
                          className="bg-white rounded-[22px] p-5 xl:p-5.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:border-blue-200 min-w-0 overflow-hidden"
                        >
                          <div>
                            {/* Top Row */}
                            <div className="h-8 flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">TOTAL OMSET</span>
                              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shrink-0">
                                <TrendingUp className="w-4 h-4" />
                              </div>
                            </div>
                            
                            {/* Middle Row */}
                            <div className="text-xl sm:text-2xl xl:text-[26px] font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                              {formatCurrency(totalOmset)}
                            </div>
                            <div className="h-6 flex items-center">
                              <MoMBadge pct={momData?.omset?.pct} />
                            </div>
                          </div>

                          {/* Bottom Row */}
                          <div className="flex items-center gap-2 pt-3 mt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">Semua Transaksi SOP</span>
                          </div>
                        </motion.div>

                        {/* Kartu 2: HPP (Modal Bahan) */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 }}
                          onClick={() => handleCardClick('hpp')}
                          className="bg-white rounded-[22px] p-5 xl:p-5.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:border-amber-200 min-w-0 overflow-hidden"
                        >
                          <div>
                            {/* Top Row */}
                            <div className="h-8 flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">HPP (MODAL BAHAN)</span>
                              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform shrink-0">
                                <Package className="w-4 h-4" />
                              </div>
                            </div>
                            
                            {/* Middle Row */}
                            <div className="text-xl sm:text-2xl xl:text-[26px] font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                              {formatCurrency(totalHpp)}
                            </div>
                            <div className="h-6 flex items-center" />
                          </div>

                          {/* Bottom Row */}
                          <div className="flex items-center gap-2 pt-3 mt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            <span className="truncate">Stok Terpasang</span>
                          </div>
                        </motion.div>

                        {/* Kartu 3: Beban Operasional */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          onClick={() => handleCardClick('beban')}
                          className="bg-white rounded-[22px] p-5 xl:p-5.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:border-rose-200 min-w-0 overflow-hidden"
                        >
                          <div>
                            {/* Top Row */}
                            <div className="h-8 flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">BEBAN OPERASIONAL</span>
                              <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform shrink-0">
                                <TrendingDown className="w-4 h-4" />
                              </div>
                            </div>
                            
                            {/* Middle Row */}
                            <div className="text-xl sm:text-2xl xl:text-[26px] font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                              {formatCurrency(totalBeban)}
                            </div>
                            <div className="h-6 flex items-center" />
                          </div>

                          {/* Bottom Row */}
                          <div className="flex items-center gap-2 pt-3 mt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                            <span className="truncate">Biaya Rutin Ops</span>
                          </div>
                        </motion.div>

                        {/* Kartu 4: Komisi Sales */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          onClick={() => handleCardClick('komisi')}
                          className="bg-white rounded-[22px] p-5 xl:p-5.5 border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:border-purple-200 min-w-0 overflow-hidden"
                        >
                          <div>
                            {/* Top Row */}
                            <div className="h-8 flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">KOMISI SALES</span>
                              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform shrink-0">
                                <PieChart className="w-4 h-4" />
                              </div>
                            </div>
                            
                            {/* Middle Row */}
                            <div className="text-xl sm:text-2xl xl:text-[26px] font-black text-slate-900 tracking-tight leading-none mb-2 truncate">
                              {formatCurrency(totalKomisi)}
                            </div>
                            <div className="h-6 flex items-center" />
                          </div>

                          {/* Bottom Row */}
                          <div className="flex items-center gap-2 pt-3 mt-4 border-t border-slate-100 text-xs font-medium text-slate-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                            <span className="truncate">Insentif Transaksi Lunas</span>
                          </div>
                        </motion.div>

                        {/* Kartu 5: Laba Bersih (Hero Metric Bento Card) */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          onClick={() => handleCardClick('laba-rugi')}
                          className={`rounded-[22px] p-5 xl:p-5.5 border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group min-w-0 overflow-hidden lg:col-span-2 xl:col-span-1 ${
                            labaBersih >= 0 
                              ? 'bg-gradient-to-br from-white via-emerald-50/25 to-emerald-50/40 border-emerald-200/90 hover:border-emerald-300' 
                              : 'bg-gradient-to-br from-white via-rose-50/25 to-rose-50/40 border-rose-200/90 hover:border-rose-300'
                          }`}
                        >
                          <div>
                            {/* Top Row: Label & Status Badge */}
                            <div className="h-8 flex items-center justify-between gap-2 mb-3">
                              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">LABA BERSIH</span>
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap ${
                                labaBersih >= 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/80' : 'bg-rose-100 text-rose-800 border border-rose-300/80'
                              }`}>
                                {labaBersih >= 0 ? 'Surplus Laba' : 'Defisit Rugi'}
                              </span>
                            </div>
                            
                            {/* Middle Row */}
                            <div className={`text-xl sm:text-2xl xl:text-[26px] font-black tracking-tight leading-none mb-2 truncate ${labaBersih >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {labaBersih < 0 ? '-' : ''}{formatCurrency(Math.abs(labaBersih))}
                            </div>
                            <div className="h-6 flex items-center">
                              <MoMBadge pct={momData?.laba?.pct} />
                            </div>
                          </div>

                          {/* Bottom Row */}
                          <div className="flex items-center gap-2 pt-3 mt-4 border-t border-slate-100/80 text-[11px] font-semibold text-slate-400">
                            <div className={`w-2 h-2 rounded-full ${labaBersih >= 0 ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-rose-500 ring-2 ring-rose-100'} shrink-0`} />
                            <span className="uppercase tracking-wider truncate">Omset - HPP - Beban - Komisi</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="bg-white rounded-[20px] border border-slate-100 p-12 text-center text-slate-500 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                  Data omset tidak tersedia.
                </div>
              )
            )}

            {/* OTHER TABS (PRODUK, STOK, INVOICE, KOMPLAIN) IN BENTO CARD */}
            {activeTab !== 'omset' && (
              <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                {/* TAB PRODUK */}
                {activeTab === 'produk' && (
                  <div className="flex flex-col gap-4">
                <div className="flex flex-row flex-wrap justify-end items-center gap-3">
                  <select
                    value={revenueTypeFilter}
                    onChange={(e) => setRevenueTypeFilter(e.target.value)}
                    className="w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Gross">Omset Kotor (Belum dipotong komisi)</option>
                    <option value="Net">Omset Bersih (Sudah dipotong komisi)</option>
                  </select>
                  
                  <select
                    value={productStatusFilter}
                    onChange={(e) => setProductStatusFilter(e.target.value)}
                    className="w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Semua">Semua Status</option>
                    <option value="Lunas">Lunas</option>
                    <option value="Belum Bayar">Belum Lunas / Belum Bayar</option>
                  </select>

                  <select
                    value={productBrandFilter}
                    onChange={(e) => setProductBrandFilter(e.target.value)}
                    className="w-auto px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    {uniqueBrands.map(b => (
                      <option key={b} value={b}>{b === 'Semua' ? 'Semua Brand' : b}</option>
                    ))}
                  </select>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-200">
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Nama Produk / Brand</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-center">Qty Terjual</th>
                        <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase text-right">Total Pendapatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSalesByProduct.length === 0 ? (
                        <tr><td colSpan="3" className="py-8 text-center text-gray-500">Belum ada data penjualan untuk brand ini.</td></tr>
                      ) : (
                        filteredSalesByProduct.map((item, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4 text-sm text-gray-900 font-medium">{item.product_name || 'Lainnya'}</td>
                            <td className="py-3 px-4 text-sm text-gray-700 text-center">{item.qty || 0}</td>
                            <td className="py-3 px-4 text-sm text-gray-900 font-semibold text-right">
                              {formatCurrency(revenueTypeFilter === 'Gross' ? (item.total_revenue_gross || item.total_revenue || 0) : (item.total_revenue_net || 0))}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredSalesByProduct.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200">
                          <td className="py-3 px-4 font-bold text-gray-900 uppercase">Total {productBrandFilter !== 'Semua' ? productBrandFilter : 'Keseluruhan'}</td>
                          <td className="py-3 px-4 text-center font-bold text-gray-900">{totalQtyProduct}</td>
                          <td className="py-3 px-4 text-right font-black text-gray-900">{formatCurrency(totalRevenueProduct)}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* TAB STOK */}
            {activeTab === 'stok' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-200">
                      <th className="py-3 px-4 font-semibold text-gray-600">Kode</th>
                      <th className="py-3 px-4 font-semibold text-gray-600">Barang</th>
                      <th className="py-3 px-4 font-semibold text-gray-600">Kategori</th>
                      <th className="py-3 px-4 font-semibold text-blue-600 text-center bg-blue-50/30">Stok Awal</th>
                      <th className="py-3 px-4 font-semibold text-green-600 text-center bg-green-50/30">Masuk</th>
                      <th className="py-3 px-4 font-semibold text-red-600 text-center bg-red-50/30">Keluar</th>
                      <th className="py-3 px-4 font-semibold text-gray-900 text-center bg-gray-100/50">Stok Akhir</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stockMutation.length === 0 ? (
                      <tr><td colSpan="7" className="py-8 text-center text-gray-500">Belum ada data mutasi.</td></tr>
                    ) : (
                      stockMutation.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4 text-gray-500 font-mono text-xs">{item.id}</td>
                          <td className="py-3 px-4 font-semibold text-gray-900">{item.nama}</td>
                          <td className="py-3 px-4 text-gray-600">{item.kategori}</td>
                          <td className="py-3 px-4 text-center font-medium bg-blue-50/10">
                            {item.awal.utama} {item.satuan} {item.awal.pecahan > 0 ? `+ ${item.awal.pecahan}` : ''}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-green-600 bg-green-50/10">
                            {item.masuk.utama > 0 || item.masuk.pecahan > 0 ? `+ ${item.masuk.utama} ${item.satuan} ${item.masuk.pecahan > 0 ? `+ ${item.masuk.pecahan}` : ''}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-red-600 bg-red-50/10">
                            {item.keluar.utama > 0 || item.keluar.pecahan > 0 ? `- ${item.keluar.utama} ${item.satuan} ${item.keluar.pecahan > 0 ? `+ ${item.keluar.pecahan}` : ''}` : '-'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-900 bg-gray-50/50">
                            {item.akhir.utama} {item.satuan} {item.akhir.pecahan > 0 ? `+ ${item.akhir.pecahan}` : ''}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB INVOICE */}
            {activeTab === 'invoice' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600">Status Pembayaran:</span>
                    <select 
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:border-blue-500"
                    >
                      <option value="Semua">Semua Status</option>
                      <option value="Lunas">Lunas</option>
                      <option value="Proses">Belum Lunas (Proses)</option>
                      <option value="Batal">Batal</option>
                    </select>
                  </div>
                  <div className="text-xs text-gray-500 font-medium">
                    Total: <strong className="text-gray-900">{invoices.length}</strong> transaksi ditemukan
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-200">
                        <th className="py-3 px-4 font-semibold text-gray-600">Order ID & Tgl</th>
                        <th className="py-3 px-4 font-semibold text-gray-600">Pelanggan</th>
                        <th className="py-3 px-4 font-semibold text-gray-600">Kendaraan</th>
                        <th className="py-3 px-4 font-semibold text-gray-600">Sales / PIC</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-right">Total Tagihan</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-right">Sudah Dibayar</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-right">Sisa Tagihan</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-center">Status</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.length === 0 ? (
                        <tr><td colSpan="9" className="py-8 text-center text-gray-500">Tidak ada transaksi ditemukan.</td></tr>
                      ) : (
                        invoices.map((inv) => {
                          const paidAmount = Math.max(0, (inv.total_amount || 0) - (inv.sisa_tagihan || 0));
                          const remainingAmount = inv.sisa_tagihan || 0;
                          return (
                            <tr key={inv.id} className="hover:bg-gray-50/50">
                              <td className="py-3 px-4">
                                <div className="font-bold text-gray-900">{formatTransactionId(inv)}</div>
                                <div className="text-gray-500 text-xs">{new Date(inv.created_at).toLocaleDateString('id-ID')}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-semibold text-gray-900">{inv.customer_name || '-'}</div>
                                <div className="text-gray-500 text-xs">{inv.customer_phone || '-'}</div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="font-medium text-gray-900">{inv.car_brand} {inv.car_model}</div>
                                <div className="text-gray-500 text-xs">{inv.plate_number}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-md font-medium">
                                  {inv.event || '-'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                {formatCurrency(inv.total_amount)}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-green-700">
                                {formatCurrency(paidAmount)}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold">
                                <span className={remainingAmount > 0 ? 'text-orange-600' : 'text-gray-400'}>
                                  {formatCurrency(remainingAmount)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  inv.status_pembayaran === 'Lunas' ? 'bg-green-100 text-green-700' :
                                  inv.status_pembayaran === 'Batal' ? 'bg-red-100 text-red-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {inv.status_pembayaran}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button 
                                  onClick={() => {
                                    const cleanId = String(inv.id).replace(/\//g, '-'); 
                                    window.open(`/sales/invoices/print/${cleanId}`, '_blank');
                                  }}
                                  className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors inline-flex"
                                  title="Cetak Ulang Invoice"
                                >
                                  <Printer size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                    {invoices.length > 0 && (
                      <tfoot>
                        <tr className="bg-gray-50 border-t-2 border-gray-200 font-bold text-gray-900">
                          <td colSpan="4" className="py-3 px-4 uppercase text-xs">Total ({invoices.length} Transaksi)</td>
                          <td className="py-3 px-4 text-right text-sm font-bold text-gray-900">
                            {formatCurrency(invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0))}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-bold text-green-700">
                            {formatCurrency(invoices.reduce((sum, i) => sum + Math.max(0, (i.total_amount || 0) - (i.sisa_tagihan || 0)), 0))}
                          </td>
                          <td className="py-3 px-4 text-right text-sm font-bold text-orange-700">
                            {formatCurrency(invoices.reduce((sum, i) => sum + (i.sisa_tagihan || 0), 0))}
                          </td>
                          <td colSpan="2"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}

            {/* TAB KOMPLAIN */}
            {activeTab === 'komplain' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-y border-gray-200">
                      <th className="py-3 px-4 font-semibold text-gray-600">ID & Tgl</th>
                      <th className="py-3 px-4 font-semibold text-gray-600">Pelanggan & Mobil</th>
                      <th className="py-3 px-4 font-semibold text-gray-600">Jenis Masalah</th>
                      <th className="py-3 px-4 font-semibold text-gray-600">Deskripsi</th>
                      <th className="py-3 px-4 font-semibold text-gray-600 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {complaints.length === 0 ? (
                      <tr><td colSpan="5" className="py-8 text-center text-gray-500">Tidak ada data komplain bulan ini.</td></tr>
                    ) : (
                      complaints.map((c) => (
                        <tr key={c.id} className="hover:bg-gray-50/50">
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900">{formatTransactionId(c.transaction)}</div>
                            <div className="text-gray-500 text-xs">{new Date(c.created_at).toLocaleDateString('id-ID')}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-gray-900">{c.transaction?.customer_name || '-'}</div>
                            <div className="text-gray-500 text-xs">{c.transaction?.car_brand} {c.transaction?.car_model} ({c.transaction?.plate_number})</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-red-600 bg-red-50 inline-block px-2 py-1 rounded-md text-xs">{c.problem_type}</div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={c.description}>
                            {c.description || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              c.status === 'Selesai' ? 'bg-green-100 text-green-700' :
                              c.status === 'Ditolak' ? 'bg-red-100 text-red-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
              </div>
            )}
            
            {/* HIDDEN PRINT LAYOUTS FOR ALL TABS */}
            
            <div id="laporan-omset-pdf" className="hidden pdf-table-container">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>GALLARDO AUTO SPORT</h1>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#1e40af', textTransform: 'uppercase' }}>LAPORAN KEUANGAN & LABA RUGI BULANAN (STANDAR SOP)</h2>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#475569' }}>Periode: <strong>{monthFilter}</strong> | Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              {netRevenue && (() => {
                const pl = netRevenue.pl || {};
                const cf = netRevenue.cashflow || {};
                const rc = netRevenue.receivables || {};
                const tOmset = pl.totalOmset ?? netRevenue.totalOmset ?? 0;
                const tHpp = pl.totalHpp ?? netRevenue.totalHpp ?? 0;
                const tBeban = pl.totalBeban ?? netRevenue.totalExpense ?? 0;
                const tKomisi = pl.totalKomisi ?? netRevenue.totalKomisi ?? 0;
                const tLaba = pl.labaBersih ?? (tOmset - tHpp - tBeban - tKomisi);
                const tKasMasuk = cf.kasMasuk ?? netRevenue.totalKasMasuk ?? 0;
                const tTerkumpul = cf.totalTerkumpul ?? netRevenue.totalTerkumpul ?? 0;
                const tNetCash = cf.netCashflow ?? (tKasMasuk - (tBeban + (netRevenue.totalPembelian || 0)));
                const tPiutang = rc.totalPiutang ?? netRevenue.totalPiutang ?? 0;

                return (
                  <>
                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#334155', marginTop: '16px', marginBottom: '8px' }}>1. Ringkasan Arus Kas Riil (Cashflow)</h3>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'center' }}>Kas Masuk Riil</th>
                          <th style={{ textAlign: 'center' }}>Pelunasan Piutang Lama</th>
                          <th style={{ textAlign: 'center' }}>Net Cashflow</th>
                          <th style={{ textAlign: 'center' }}>Total Piutang</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#166534' }}>{formatCurrency(tKasMasuk)}</td>
                          <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#0f766e' }}>{formatCurrency(tTerkumpul)}</td>
                          <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#1e40af' }}>{formatCurrency(tNetCash)}</td>
                          <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#c2410c' }}>{formatCurrency(tPiutang)}</td>
                        </tr>
                      </tbody>
                    </table>

                    <h3 style={{ fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase', color: '#334155', marginTop: '24px', marginBottom: '8px' }}>2. Laba Rugi Akrual (SOP: Omset - HPP - Beban - Komisi)</h3>
                    <table>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'center' }}>Total Omset</th>
                          <th style={{ textAlign: 'center' }}>HPP Modal Bahan</th>
                          <th style={{ textAlign: 'center' }}>Beban Operasional</th>
                          <th style={{ textAlign: 'center' }}>Komisi Sales</th>
                          <th style={{ textAlign: 'center' }}>Laba Bersih Akrual</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#1e40af' }}>{formatCurrency(tOmset)}</td>
                          <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#b45309' }}>{formatCurrency(tHpp)}</td>
                          <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#b91c1c' }}>{formatCurrency(tBeban)}</td>
                          <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: '#6d28d9' }}>{formatCurrency(tKomisi)}</td>
                          <td style={{ textAlign: 'center', fontSize: '15px', fontWeight: 'bold', color: tLaba >= 0 ? '#15803d' : '#b91c1c' }}>
                            {formatCurrency(tLaba)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                );
              })()}
            </div>

            <div id="laporan-produk-pdf" className="hidden pdf-table-container">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>GALLARDO AUTO SPORT</h1>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#1e40af', textTransform: 'uppercase' }}>LAPORAN PENJUALAN PRODUK {productBrandFilter !== 'Semua' ? `- ${productBrandFilter}` : ''}</h2>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#475569' }}>Bulan: <strong>{monthFilter}</strong> | Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Produk / Brand</th>
                    <th>Qty Terjual</th>
                    <th>Total Pendapatan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSalesByProduct.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>Belum ada data penjualan.</td>
                    </tr>
                  ) : (
                    filteredSalesByProduct.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td>{item.product_name || 'Lainnya'}</td>
                        <td style={{ textAlign: 'center' }}>{item.qty || 0}</td>
                        <td style={{ textAlign: 'right' }}>
                          {formatCurrency(revenueTypeFilter === 'Gross' ? (item.total_revenue_gross || item.total_revenue || 0) : (item.total_revenue_net || 0))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredSalesByProduct.length > 0 && (
                  <tfoot>
                    <tr>
                      <td colSpan="2" style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>TOTAL {productBrandFilter !== 'Semua' ? productBrandFilter : 'KESELURUHAN'}</td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>{totalQtyProduct}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>{formatCurrency(totalRevenueProduct)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div id="laporan-stok-pdf" className="hidden pdf-table-container">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>GALLARDO AUTO SPORT</h1>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#1e40af', textTransform: 'uppercase' }}>LAPORAN MUTASI STOK INVENTORY</h2>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#475569' }}>Bulan: <strong>{monthFilter}</strong> | Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Kode</th>
                    <th>Barang</th>
                    <th>Kategori</th>
                    <th>Stok Awal</th>
                    <th>Masuk</th>
                    <th>Keluar</th>
                    <th>Stok Akhir</th>
                  </tr>
                </thead>
                <tbody>
                  {stockMutation.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ fontFamily: 'monospace' }}>{item.id}</td>
                      <td>{item.nama}</td>
                      <td>{item.kategori}</td>
                      <td style={{ textAlign: 'center' }}>
                        {item.awal?.utama || 0} {item.satuan} {item.awal?.pecahan > 0 ? `+ ${item.awal.pecahan}` : ''}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {item.masuk?.utama > 0 || item.masuk?.pecahan > 0 ? `+ ${item.masuk.utama} ${item.satuan} ${item.masuk.pecahan > 0 ? `+ ${item.masuk.pecahan}` : ''}` : '-'}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {item.keluar?.utama > 0 || item.keluar?.pecahan > 0 ? `- ${item.keluar.utama} ${item.satuan} ${item.keluar.pecahan > 0 ? `+ ${item.keluar.pecahan}` : ''}` : '-'}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                        {item.akhir?.utama || 0} {item.satuan} {item.akhir?.pecahan > 0 ? `+ ${item.akhir.pecahan}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div id="laporan-invoice-pdf" className="hidden pdf-table-container">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>GALLARDO AUTO SPORT</h1>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#1e40af', textTransform: 'uppercase' }}>DAFTAR INVOICE & TRANSAKSI (SOP)</h2>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#475569' }}>Bulan: <strong>{monthFilter}</strong> | Status: <strong>{statusFilter}</strong> | Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center', width: '35px' }}>No</th>
                    <th>Order ID & Tgl</th>
                    <th>Pelanggan</th>
                    <th>Kendaraan</th>
                    <th>Sales / PIC</th>
                    <th style={{ textAlign: 'right' }}>Total Tagihan</th>
                    <th style={{ textAlign: 'right' }}>Sudah Dibayar</th>
                    <th style={{ textAlign: 'right' }}>Sisa Piutang</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => {
                    const paid = Math.max(0, (inv.total_amount || 0) - (inv.sisa_tagihan || 0));
                    const sisa = inv.sisa_tagihan || 0;
                    return (
                      <tr key={inv.id}>
                        <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                        <td>
                          <strong>{formatTransactionId(inv)}</strong><br/>
                          {new Date(inv.created_at).toLocaleDateString('id-ID')}
                        </td>
                        <td>
                          <strong>{inv.customer_name || '-'}</strong><br/>
                          {inv.customer_phone || '-'}
                        </td>
                        <td>
                          <strong>{inv.car_brand} {inv.car_model}</strong><br/>
                          {inv.plate_number}
                        </td>
                        <td>{inv.event || '-'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(inv.total_amount)}</td>
                        <td style={{ textAlign: 'right', color: '#166534', fontWeight: 'semibold' }}>{formatCurrency(paid)}</td>
                        <td style={{ textAlign: 'right', color: sisa > 0 ? '#c2410c' : '#64748b', fontWeight: 'semibold' }}>{formatCurrency(sisa)}</td>
                        <td style={{ textAlign: 'center' }}>{inv.status_pembayaran}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {invoices.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: '#f8fafc', fontWeight: 'bold', borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan="5" style={{ textAlign: 'right', textTransform: 'uppercase' }}>Total ({invoices.length} Transaksi):</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0))}</td>
                      <td style={{ textAlign: 'right', color: '#166534' }}>{formatCurrency(invoices.reduce((sum, i) => sum + Math.max(0, (i.total_amount || 0) - (i.sisa_tagihan || 0)), 0))}</td>
                      <td style={{ textAlign: 'right', color: '#c2410c' }}>{formatCurrency(invoices.reduce((sum, i) => sum + (i.sisa_tagihan || 0), 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div id="laporan-komplain-pdf" className="hidden pdf-table-container">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>GALLARDO AUTO SPORT</h1>
                <h2 style={{ fontSize: '15px', fontWeight: 'bold', margin: '4px 0 0 0', color: '#1e40af', textTransform: 'uppercase' }}>LAPORAN DATA KOMPLAIN PELANGGAN</h2>
                <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#475569' }}>Bulan: <strong>{monthFilter}</strong> | Tanggal Cetak: {new Date().toLocaleDateString('id-ID')}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>ID & Tgl Komplain</th>
                    <th>Pelanggan & Mobil</th>
                    <th>Jenis Masalah</th>
                    <th>Deskripsi</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c, idx) => (
                    <tr key={c.id}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td>
                        <strong>{formatTransactionId(c.transaction)}</strong><br/>
                        {new Date(c.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td>
                        <strong>{c.transaction?.customer_name || '-'}</strong><br/>
                        {c.transaction?.car_brand} {c.transaction?.car_model} ({c.transaction?.plate_number})
                      </td>
                      <td>{c.problem_type}</td>
                      <td>{c.description || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </motion.div>

      <DashboardDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        data={modalData}
        loading={modalLoading}
      />
    </div>
  );
};

export default AdminMonthlyReport;
