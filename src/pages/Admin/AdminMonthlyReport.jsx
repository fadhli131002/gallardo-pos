import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Package, ShoppingBag, FileText, Printer, Search, Download, Loader2, CreditCard, TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';
import { formatTransactionId } from '../../utils/formatId';
import DashboardDetailsModal from '../../components/DashboardDetailsModal';

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
    <div className="h-full flex flex-col p-6 space-y-6 bg-gray-50/50">
      <div className="flex flex-col gap-5 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Bulanan</h1>
          <p className="text-sm font-medium text-gray-500 mt-1">Pantau performa penjualan, omset, dan mutasi stok.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handlePrintPDF(false)}
              disabled={isExporting}
              className={`flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all text-sm ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      </div>

      <div className="flex space-x-1 p-1 bg-gray-100/80 rounded-xl max-w-fit">
        {[
          { id: 'omset', label: 'Omset Bersih', icon: DollarSign },
          { id: 'produk', label: 'Penjualan Produk', icon: ShoppingBag },
          { id: 'stok', label: 'Mutasi Stok', icon: Package },
          { id: 'invoice', label: 'Daftar Transaksi', icon: FileText },
          { id: 'komplain', label: 'Data Komplain', icon: FileText }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Memuat data laporan...</p>
          </div>
        ) : error ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="text-red-500 text-5xl mb-3">⚠️</div>
            <p className="text-xl font-bold text-gray-900 mb-1">Gagal Memuat Data</p>
            <p className="text-gray-500 text-sm max-w-md">{error}</p>
            <button 
              onClick={fetchData}
              className="mt-6 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="p-6 h-full overflow-y-auto">
            
            {/* TAB OMSET */}
            {activeTab === 'omset' && (
              netRevenue ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Kas Masuk Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleCardClick('kas-masuk')}
                    className="bg-white rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md border border-gray-100 p-5 flex flex-col transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-4 right-4 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <DollarSign className="w-20 h-20 text-green-600" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Kas Masuk</h3>
                      <div className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                        {formatCurrency(netRevenue.totalKasMasuk)}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                          <DollarSign className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-green-700 flex items-center">
                            <TrendingUp size={12} className="mr-1" /> Stabil
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Bulan Terpilih</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Piutang Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    onClick={() => handleCardClick('piutang')}
                    className="bg-white rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md border border-gray-100 p-5 flex flex-col transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-4 right-4 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <CreditCard className="w-20 h-20 text-orange-600" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Piutang</h3>
                      <div className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                        {formatCurrency(netRevenue.totalPiutang)}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center border border-orange-100">
                          <CreditCard className="w-4 h-4 text-orange-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-orange-700 flex items-center">
                            Belum Lunas
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Total Akumulasi</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Omset Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    onClick={() => handleCardClick('omset')}
                    className="bg-white rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md border border-gray-100 p-5 flex flex-col transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-4 right-4 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <FileText className="w-20 h-20 text-blue-600" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Total Omset</h3>
                      <div className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                        {formatCurrency(netRevenue.totalOmset)}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-blue-700 flex items-center">
                            Sales Gross
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Bulan Terpilih</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Omset Bersih Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => handleCardClick('kas-masuk')}
                    className="bg-white rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md border border-gray-100 p-5 flex flex-col transition-all group relative overflow-hidden cursor-pointer"
                  >
                    <div className="absolute top-4 right-4 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <DollarSign className="w-20 h-20 text-emerald-600" />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Omset Bersih</h3>
                      <div className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">
                        {formatCurrency((netRevenue.totalKasMasuk || 0) - (netRevenue.totalKomisi || 0))}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-emerald-700 flex items-center">
                            Net Revenue
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide">Kas Masuk - Komisi</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ) : (
                <div className="py-10 text-center text-gray-500">
                  Data omset tidak tersedia.
                </div>
              )
            )}

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
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-y border-gray-200">
                        <th className="py-3 px-4 font-semibold text-gray-600">Order ID & Tgl</th>
                        <th className="py-3 px-4 font-semibold text-gray-600">Pelanggan</th>
                        <th className="py-3 px-4 font-semibold text-gray-600">Kendaraan</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-right">Total Belanja</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-center">Status</th>
                        <th className="py-3 px-4 font-semibold text-gray-600 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoices.length === 0 ? (
                        <tr><td colSpan="6" className="py-8 text-center text-gray-500">Tidak ada transaksi ditemukan.</td></tr>
                      ) : (
                        invoices.map((inv) => (
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
                            <td className="py-3 px-4 text-right font-bold text-gray-900">
                              {formatCurrency(inv.total_amount)}
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
                        ))
                      )}
                    </tbody>
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

            {/* HIDDEN PRINT LAYOUTS FOR ALL TABS */}
            
            <div id="laporan-omset-pdf" className="hidden pdf-table-container">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>LAPORAN KEUANGAN</h1>
                <h2 style={{ fontSize: '14px', margin: '4px 0 0 0', fontWeight: 'bold' }}>Bulan: {monthFilter}</h2>
              </div>
              {netRevenue && (
                <table>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'center' }}>Kas Masuk</th>
                      <th style={{ textAlign: 'center' }}>Piutang</th>
                      <th style={{ textAlign: 'center' }}>Total Omset</th>
                      <th style={{ textAlign: 'center' }}>Omset Bersih</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#166534' }}>{formatCurrency(netRevenue.totalKasMasuk)}</td>
                      <td style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#9a3412' }}>{formatCurrency(netRevenue.totalPiutang)}</td>
                      <td style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#1e40af' }}>{formatCurrency(netRevenue.totalOmset)}</td>
                      <td style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#059669' }}>{formatCurrency((netRevenue.totalKasMasuk || 0) - (netRevenue.totalKomisi || 0))}</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <div id="laporan-produk-pdf" className="hidden pdf-table-container">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>LAPORAN PENJUALAN PRODUK {productBrandFilter !== 'Semua' ? `- ${productBrandFilter}` : ''}</h1>
                <h2 style={{ fontSize: '14px', margin: '4px 0 0 0', fontWeight: 'bold' }}>Bulan: {monthFilter}</h2>
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
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>LAPORAN MUTASI STOK</h1>
                <h2 style={{ fontSize: '14px', margin: '4px 0 0 0', fontWeight: 'bold' }}>Bulan: {monthFilter}</h2>
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
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>DAFTAR INVOICE & TRANSAKSI</h1>
                <h2 style={{ fontSize: '14px', margin: '4px 0 0 0', fontWeight: 'bold' }}>Bulan: {monthFilter} | Status: {statusFilter}</h2>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Order ID & Tgl</th>
                    <th>Pelanggan</th>
                    <th>Kendaraan</th>
                    <th>Total Belanja</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv, idx) => (
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
                      <td style={{ textAlign: 'right' }}>{formatCurrency(inv.total_amount)}</td>
                      <td style={{ textAlign: 'center' }}>{inv.status_pembayaran}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div id="laporan-komplain-pdf" className="hidden pdf-table-container">
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0', textTransform: 'uppercase' }}>LAPORAN DATA KOMPLAIN</h1>
                <h2 style={{ fontSize: '14px', margin: '4px 0 0 0', fontWeight: 'bold' }}>Bulan: {monthFilter}</h2>
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
