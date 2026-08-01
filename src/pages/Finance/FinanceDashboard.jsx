import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CreditCard, TrendingUp, TrendingDown, FileText, PieChart, Download, Calendar as CalendarIcon, Loader2, Package, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import DashboardDetailsModal from '../../components/DashboardDetailsModal';

const FinanceDashboard = () => {
  const [summary, setSummary] = useState({
    totalKasMasuk: 0,
    totalPiutang: 0,
    labaRugi: 0,
    totalOmset: 0,
    totalHpp: 0
  });
  const [dateFilter, setDateFilter] = useState('Hari Ini');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', category: 'Operational', amount: '', date: '' });
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPOForm] = useState({ supplier: '', totalAmount: '', status: 'Received', date: '' });


  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // PDF State
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (dateFilter === 'Custom' && (!customStartDate || !customEndDate)) return;
    fetchDashboardData();
  }, [dateFilter, customStartDate, customEndDate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      let query = '';
      const now = new Date();
      let startDate = '';
      let endDate = '';
    
      if (dateFilter === 'Hari Ini') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      } else if (dateFilter === 'Bulan Ini') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      } else if (dateFilter === 'Tahun Ini') {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
      } else if (dateFilter === 'Custom' && customStartDate && customEndDate) {
        let start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
        let end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        endDate = end.toISOString();
      }
    
      if (dateFilter !== 'Semua Waktu') {
        query = `?startDate=${startDate}&endDate=${endDate}`;
      }

      const url = window.API_URL ? `${window.API_URL}/api/finance/dashboard${query}` : `/api/finance/dashboard${query}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengambil data dashboard keuangan');
      const data = await res.json();
      setSummary(data);
      // Fetch Expenses & PO
      try {
        const expRes = await fetch(window.API_URL ? `${window.API_URL}/api/owner/expenses${query}` : `/api/owner/expenses${query}`, { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('token') } });
        if (expRes.ok) {
          const expJson = await expRes.json();
          if (expJson.success) setExpenses(expJson.data);
        }

        const poRes = await fetch(window.API_URL ? `${window.API_URL}/api/owner/purchase-orders${query}` : `/api/owner/purchase-orders${query}`, { headers: { 'Authorization': 'Bearer ' + sessionStorage.getItem('token') } });
        if (poRes.ok) {
          const poJson = await poRes.json();
          if (poJson.success) setPurchaseOrders(poJson.data);
        }
      } catch (e) {
        console.error('Error fetching expenses/PO:', e);
      }

    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  
  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${window.API_URL}/api/owner/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(expenseForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pengeluaran berhasil dicatat');
        setShowExpenseModal(false);
        setExpenseForm({ title: '', category: 'Operational', amount: '', date: '' });
        fetchDashboardData();
      } else {
        toast.error(data.message || 'Gagal menyimpan');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan server');
    }
  };

  const handleAddPO = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${window.API_URL}/api/owner/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(poForm)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Pembelian barang berhasil dicatat');
        setShowPOModal(false);
        setPOForm({ supplier: '', totalAmount: '', status: 'Received', date: '' });
        fetchDashboardData();
      } else {
        toast.error(data.message || 'Gagal menyimpan');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan server');
    }
  };
  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  const handleCardClick = async (type) => {
    setModalType(type);
    setIsModalOpen(true);
    setModalLoading(true);
    setModalData(null);
    try {
      let query = '';
      const now = new Date();
      let startDate = '';
      let endDate = '';
      
      if (dateFilter === 'Hari Ini') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      } else if (dateFilter === 'Bulan Ini') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      } else if (dateFilter === 'Tahun Ini') {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
      } else if (dateFilter === 'Custom' && customStartDate && customEndDate) {
        let start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
        let end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        endDate = end.toISOString();
      }
      
      if (dateFilter !== 'Semua Waktu') {
        query = `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const url = window.API_URL 
        ? `${window.API_URL}/api/finance/dashboard/details?type=${type}${query}` 
        : `/api/finance/dashboard/details?type=${type}${query}`;
        
      const res = await fetch(url);
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

  const generatePDFReport = async () => {
    setIsGeneratingPdf(true);
    try {
      let query = '';
      const now = new Date();
      let startDate = '';
      let endDate = '';
      
      if (dateFilter === 'Hari Ini') {
        startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString();
        endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString();
      } else if (dateFilter === 'Bulan Ini') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      } else if (dateFilter === 'Tahun Ini') {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString();
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
      } else if (dateFilter === 'Custom' && customStartDate && customEndDate) {
        let start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        startDate = start.toISOString();
        let end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        endDate = end.toISOString();
      }
      
      if (dateFilter !== 'Semua Waktu') {
        query = `?startDate=${startDate}&endDate=${endDate}`;
      } else {
        query = '?';
      }

      const baseUrl = window.API_URL ? `${window.API_URL}/api/finance/dashboard/details` : '/api/finance/dashboard/details';
      
      // Fetch all details simultaneously
      const [resKas, resPiutang, resLaba] = await Promise.all([
        fetch(`${baseUrl}${query}&type=kas-masuk`),
        fetch(`${baseUrl}${query}&type=piutang`),
        fetch(`${baseUrl}${query}&type=laba-rugi`)
      ]);

      if (!resKas.ok || !resPiutang.ok || !resLaba.ok) {
        throw new Error('Gagal mengambil data untuk laporan PDF');
      }

      const dataKas = await resKas.json();
      const dataPiutang = await resPiutang.json();
      const dataLaba = await resLaba.json();

      const getFormattedPeriod = () => {
        const d = new Date();
        if (dateFilter === 'Hari Ini') return format(d, 'dd MMMM yyyy', { locale: id });
        if (dateFilter === 'Bulan Ini') return format(d, 'MMMM yyyy', { locale: id });
        if (dateFilter === 'Tahun Ini') return `Tahun ${format(d, 'yyyy')}`;
        if (dateFilter === 'Custom' && customStartDate && customEndDate) {
          return `${format(new Date(customStartDate), 'dd MMM yyyy', { locale: id })} - ${format(new Date(customEndDate), 'dd MMM yyyy', { locale: id })}`;
        }
        return 'Seluruh Periode';
      };

      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Laporan Keuangan', 14, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Gallardo Autosport', 14, 28);
      doc.text(`Periode: ${getFormattedPeriod()}`, 14, 34);
      doc.text(`Dicetak pada: ${format(new Date(), 'dd MMM yyyy, HH:mm', { locale: id })}`, 14, 40);

      // Summary Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Ringkasan', 14, 52);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Kas Masuk: ${formatRupiah(summary.totalKasMasuk)}`, 14, 60);
      doc.text(`Total Piutang: ${formatRupiah(summary.totalPiutang)}`, 14, 66);
      doc.text(`Total Omset: ${formatRupiah(summary.totalOmset)}`, 14, 72);
      doc.text(`Laba Bersih: ${formatRupiah(summary.labaRugi)}`, 14, 78);

      let currentY = 90;

      // 1. Kas Masuk Table
      if (dataKas && dataKas.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Rincian Kas Masuk', 14, currentY);
        
        const tableData = dataKas.map(item => [
          format(new Date(item.date), 'dd MMM yyyy, HH:mm', { locale: id }),
          item.description,
          formatRupiah(item.amount)
        ]);

        autoTable(doc, {
          startY: currentY + 4,
          head: [['Tanggal', 'Keterangan', 'Nominal']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185] }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      // 2. Piutang Table
      if (dataPiutang && dataPiutang.length > 0) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Daftar Piutang Belum Lunas', 14, currentY);
        
        const tableData = dataPiutang.map(item => [
          item.customer_name || 'Tanpa Nama',
          format(new Date(item.created_at), 'dd MMM yyyy', { locale: id }),
          item.status_pembayaran,
          formatRupiah(item.total_amount),
          formatRupiah(item.sisa_tagihan)
        ]);

        autoTable(doc, {
          startY: currentY + 4,
          head: [['Pelanggan', 'Tanggal', 'Status', 'Total Transaksi', 'Sisa Piutang']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [211, 84, 0] }
        });
        currentY = doc.lastAutoTable.finalY + 15;
      }

      // 3. Omset / Laba Rugi Table
      if (dataLaba && dataLaba.length > 0) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Rincian Transaksi (Laba Rugi & Omset)', 14, currentY);
        
        const tableData = dataLaba.map(item => [
          item.customer_name || 'Tanpa Nama',
          format(new Date(item.created_at), 'dd MMM yyyy', { locale: id }),
          formatRupiah(item.total_amount),
          formatRupiah(item.hpp),
          formatRupiah(item.komisi || 0),
          formatRupiah(item.labaBersih)
        ]);

        autoTable(doc, {
          startY: currentY + 4,
          head: [['Pelanggan', 'Tanggal', 'Nilai Omset', 'HPP Modal', 'Potongan Komisi', 'Laba Bersih']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [39, 174, 96] }
        });
      }

      doc.save(`Laporan_Keuangan_Gallardo_${dateFilter.replace(/ /g, '_')}.pdf`);
      toast.success('Laporan PDF berhasil diunduh');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Keuangan</h1>
          <p className="text-sm text-gray-500 mt-1">Pantau performa kas, piutang, dan laba rugi bisnis Anda secara real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm appearance-none cursor-pointer min-w-[140px]"
            >
              <option value="Hari Ini">Hari Ini</option>
              <option value="Bulan Ini">Bulan Ini</option>
              <option value="Tahun Ini">Tahun Ini</option>
              <option value="Semua Waktu">Semua Waktu</option>
              <option value="Custom">Pilih Tanggal (Custom)</option>
            </select>
          </div>
          
          {dateFilter === 'Custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              />
              <span className="text-gray-500">-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
              />
            </div>
          )}

          <button  
            onClick={generatePDFReport}
            disabled={isGeneratingPdf}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isGeneratingPdf ? 'Memproses PDF...' : 'Unduh Laporan PDF'}
          </button>
        </div>
      </div>

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
              {formatRupiah(summary.totalKasMasuk)}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center border border-green-100">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-green-700 flex items-center">
                  <TrendingUp size={12} className="mr-1" /> Stabil
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Periode Terpilih</span>
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
              {formatRupiah(summary.totalPiutang)}
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
              {formatRupiah(summary.totalOmset)}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-blue-700 flex items-center">
                  Sales Gross
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Periode Terpilih</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Laba/Rugi Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => handleCardClick('laba-rugi')}
          className="bg-white rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] hover:shadow-md border border-gray-100 p-5 flex flex-col transition-all group relative overflow-hidden cursor-pointer"
        >
          <div className="absolute top-4 right-4 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <PieChart className={`w-20 h-20 ${summary.labaRugi >= 0 ? 'text-indigo-600' : 'text-red-600'}`} />
          </div>
          <div className="relative z-10">
            <h3 className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">Laba / Rugi</h3>
            <div className={`text-2xl font-bold mb-4 tracking-tight ${summary.labaRugi >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
              {summary.labaRugi < 0 ? '-' : ''}{formatRupiah(Math.abs(summary.labaRugi))}
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${summary.labaRugi >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-red-50 border-red-100'}`}>
                {summary.labaRugi >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="flex flex-col">
                <span className={`text-xs font-semibold flex items-center ${summary.labaRugi >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                  {summary.labaRugi >= 0 ? 'Profit' : 'Loss'}
                </span>
                <span className="text-[10px] text-gray-400 uppercase tracking-wide">Standar (Omset - HPP)</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      
      {/* TABLES: Expenses & PO */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PO Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Package size={20} className="text-indigo-600" /> Laporan Pembelian
            </h2>
            <button onClick={() => setShowPOModal(true)} className="flex items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Plus size={16} /> Catat Pembelian
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Supplier / Item</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total Biaya</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-400">Belum ada data pembelian.</td>
                  </tr>
                ) : purchaseOrders.map(po => (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(po.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{po.supplier}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${po.status === 'Received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatRupiah(po.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border border-gray-100 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FileText size={20} className="text-rose-600" /> Beban Operasional
            </h2>
            <button onClick={() => setShowExpenseModal(true)} className="flex items-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              <Plus size={16} /> Input Expense
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Keterangan</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-400">Belum ada data pengeluaran.</td>
                  </tr>
                ) : expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{exp.title}</td>
                    <td className="px-4 py-3 text-gray-500">{exp.category}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">{formatRupiah(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODALS for Expense and PO */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Catat Pengeluaran Baru</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Keterangan / Judul</label>
                <input required type="text" value={expenseForm.title} onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Misal: Gaji Bulan Juli" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kategori</label>
                <select value={expenseForm.category} onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                  <option value="Operational">Operasional (Umum)</option>
                  <option value="Salary">Gaji Karyawan</option>
                  <option value="Utility">Listrik & Internet</option>
                  <option value="Other">Lain-lain</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nominal (Rp)</label>
                <input required type="text" value={expenseForm.amount ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(expenseForm.amount) : ''} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setExpenseForm({ ...expenseForm, amount: val ? Number(val) : '' }) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Rp 0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Pengeluaran</label>
                <input required type="date" value={expenseForm.date} onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">Simpan Pengeluaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPOModal && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Catat Pembelian Stok</h3>
            <form onSubmit={handleAddPO} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Supplier / Deskripsi</label>
                <input required type="text" value={poForm.supplier} onChange={e => setPOForm({ ...poForm, supplier: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Misal: PT Global (Kaca Film)" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Status Penerimaan</label>
                <select value={poForm.status} onChange={e => setPOForm({ ...poForm, status: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                  <option value="Received">Barang Diterima & Lunas</option>
                  <option value="Pending">Pending / Belum Lunas</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Total Biaya (Rp)</label>
                <input required type="text" value={poForm.totalAmount ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(poForm.totalAmount) : ''} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setPOForm({ ...poForm, totalAmount: val ? Number(val) : '' }) }} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="Rp 0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tanggal Pembelian</label>
                <input required type="date" value={poForm.date} onChange={e => setPOForm({ ...poForm, date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowPOModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm">Simpan Pembelian</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default FinanceDashboard;
