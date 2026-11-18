import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, CreditCard, TrendingUp, TrendingDown, FileText, PieChart, Download, Calendar as CalendarIcon, Loader2, Package, Plus, ArrowUpRight, ArrowDownRight, Minus, ChevronRight, Wallet } from '@/icons/itshover';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import DashboardDetailsModal from '../../components/DashboardDetailsModal';
import DueAlertBanner from '../../components/DueAlertBanner';
import MegaphoneButton from '../../components/MegaphoneButton';

const cardBaseStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '18px 20px',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '12px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  transition: 'all 0.18s ease'
};

const iconBoxBaseStyle = {
  width: '40px',
  height: '40px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

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
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
        <Minus className="w-2.5 h-2.5" />
        Data Awal
      </span>
    );
  }
  if (pct > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
        <ArrowUpRight className="w-2.5 h-2.5" />
        +{pct}%
      </span>
    );
  }
  if (pct < 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
        <ArrowDownRight className="w-2.5 h-2.5" />
        {pct}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
      <Minus className="w-2.5 h-2.5" />
      0%
    </span>
  );
};

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
    // ── Validasi Mandatory Beban Operasional ─────────────────────────────────
    try {
      const currentMonthStr = new Date().toISOString().slice(0, 7);
      const token = sessionStorage.getItem('token');
      const base = window.API_URL || '';
      const chk = await fetch(`${base}/api/reports/validate-beban?month=${currentMonthStr}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (chk.ok) {
        const chkData = await chk.json();
        if (chkData.isValid === false) {
          toast.error(`Beban Operasional bulan ${currentMonthStr} belum diisi (Rp 0). Laporan tidak dapat digenerate karena akan menghasilkan Laba Bersih yang tidak akurat. Isi beban terlebih dahulu di menu Beban Operasional.`);
          return;
        }
      }
    } catch (_) {
      // jika gagal fetch validasi, lanjutkan
    }
    // ────────────────────────────────────────────────────────────────────────

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
    <div className="dashboard-container animate-fade-in">
      {/* Page Header seragam dengan Admin & Inventory */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Dashboard Keuangan</h1>
          <p className="page-subtitle">Pantau performa kas, piutang, dan laba rugi bisnis secara real-time</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <MegaphoneButton showLabel={true} />
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <CalendarIcon size={15} style={{ position: 'absolute', left: '12px', color: '#6b7280', pointerEvents: 'none' }} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                paddingLeft: '34px',
                paddingRight: '28px',
                paddingTop: '8px',
                paddingBottom: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#111827',
                cursor: 'pointer',
                minWidth: '140px'
              }}
            >
              <option value="Hari Ini">Hari Ini</option>
              <option value="Bulan Ini">Bulan Ini</option>
              <option value="Tahun Ini">Tahun Ini</option>
              <option value="Semua Waktu">Semua Waktu</option>
              <option value="Custom">Pilih Tanggal (Custom)</option>
            </select>
          </div>

          {dateFilter === 'Custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                style={{
                  padding: '7px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              />
              <span style={{ color: '#6b7280' }}>-</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                style={{
                  padding: '7px 12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              />
            </div>
          )}

          <button
            type="button"
            onClick={generatePDFReport}
            disabled={isGeneratingPdf}
            className="btn-primary"
            style={{
              gap: '8px',
              backgroundColor: '#111827',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 600,
              opacity: isGeneratingPdf ? 0.7 : 1
            }}
          >
            {isGeneratingPdf ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span>{isGeneratingPdf ? 'Memproses PDF...' : 'Unduh Laporan PDF'}</span>
          </button>
        </div>
      </div>

      {/* Due Alert Banner */}
      <DueAlertBanner />

      {(() => {
        const kasMasukVal = Number(summary.cashflow?.kasMasuk ?? summary.totalKasMasuk ?? 0);
        const pelunasanLamaVal = Number(summary.cashflow?.pelunasanPiutangLama ?? summary.pelunasanPiutangLama ?? 0);
        const netCashflowVal = Number(summary.cashflow?.netCashflow ?? 0);
        const totalPiutangVal = Number(summary.receivables?.totalPiutang ?? summary.totalPiutang ?? 0);
        const piutangPeriodeVal = Number(summary.receivables?.totalPiutangPeriode ?? summary.totalPiutangPeriode ?? 0);

        const totalOmsetVal = Number(summary.pl?.totalOmset ?? summary.totalOmset ?? 0);
        const totalHppVal = Number(summary.pl?.totalHpp ?? summary.totalHpp ?? 0);
        const totalBebanVal = Number(summary.pl?.totalBeban ?? summary.totalExpense ?? 0);
        const totalKomisiVal = Number(summary.pl?.totalKomisi ?? summary.totalKomisi ?? 0);
        const totalOutflowPl = totalHppVal + totalBebanVal + totalKomisiVal;
        const labaKotorVal = Number(summary.pl?.labaKotor ?? summary.labaKotor ?? (totalOmsetVal - totalHppVal));
        const labaBersihVal = Number(
          summary.pl?.labaBersih ?? (totalOmsetVal - totalHppVal - totalBebanVal - totalKomisiVal)
        );
        const marginPct = totalOmsetVal > 0 ? Math.round((labaKotorVal / totalOmsetVal) * 100) : 0;

        const maxChartVal = Math.max(
          totalOmsetVal,
          kasMasukVal,
          Math.abs(labaKotorVal),
          totalOutflowPl,
          Math.abs(labaBersihVal),
          totalPiutangVal,
          1
        );

        const chartBars = [
          { label: 'Omset', val: totalOmsetVal, color: '#4f46e5', bg: '#eef2ff' },
          { label: 'Kas Masuk', val: kasMasukVal, color: '#059669', bg: '#ecfdf5' },
          { label: 'Laba Kotor', val: Math.max(0, labaKotorVal), color: '#10b981', bg: '#d1fae5' },
          { label: 'HPP+Beban', val: totalOutflowPl, color: '#e11d48', bg: '#ffe4e6' },
          { label: 'Laba Bersih', val: Math.abs(labaBersihVal), color: labaBersihVal >= 0 ? '#0d9488' : '#dc2626', bg: '#f0fdfa' },
          { label: 'Piutang', val: totalPiutangVal, color: '#d97706', bg: '#fef3c7' }
        ];

        const totalPOAmount = purchaseOrders.reduce((acc, po) => acc + Number(po.totalAmount || 0), 0);
        const totalExpenseListAmount = expenses.reduce((acc, ex) => acc + Number(ex.amount || 0), 0);

        return (
          <>
            {/* ── TOP BENTO GRID (3 ZONES: HERO CASHFLOW | 2x2 P&L MATRIX | VISUAL P&L BARS) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-5">
              {/* ZONE 1 (LEFT 5 COLS): 1. ARUS KAS RIIL (HERO CARD + SUB-WALLETS) */}
              <div
                className="lg:col-span-5"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div>
                  {/* Top Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                        1. Arus Kas Riil (Cashflow)
                      </span>
                      <span style={{ fontSize: '11.5px', color: '#6b7280' }}>
                        Net Cashflow (Kas Masuk - Kas Keluar)
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#1d4ed8',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        padding: '2px 9px',
                        borderRadius: '999px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      Bulan: {new Date().toISOString().slice(0, 7)}
                    </span>
                  </div>

                  {/* Hero Net Cashflow Amount */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                    <span
                      style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        color: netCashflowVal >= 0 ? '#111827' : '#dc2626',
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1
                      }}
                    >
                      {netCashflowVal < 0 ? '-' : ''}{formatRupiah(Math.abs(netCashflowVal))}
                    </span>
                    <MoMBadge pct={summary.momComparison?.cashflow?.pct} />
                  </div>

                  {/* Pill Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setShowPOModal(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '999px',
                        backgroundColor: '#111827',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Plus size={14} />
                      <span>Catat Pembelian</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowExpenseModal(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '7px 12px',
                        borderRadius: '999px',
                        backgroundColor: '#f3f4f6',
                        color: '#111827',
                        border: '1px solid #e5e7eb',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Plus size={14} />
                      <span>Input Expense</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Wallets Container (3 Cashflow Breakdown Tiles) */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '10px',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                      Komponen Arus Kas
                    </span>
                    <span style={{ fontSize: '10.5px', color: '#6b7280' }}>
                      Klik kartu untuk rincian
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Sub-card 1: Kas Masuk Riil */}
                    <div
                      onClick={() => handleCardClick('kas-masuk')}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        padding: '9px 10px',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <DollarSign size={13} />
                        </div>
                        <ChevronRight size={12} style={{ color: '#9ca3af' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#6b7280' }}>
                          Kas Masuk Riil
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', wordBreak: 'break-word' }}>
                          {formatRupiah(kasMasukVal)}
                        </div>
                      </div>
                      <div>
                        <MoMBadge pct={summary.momComparison?.kas?.pct} />
                      </div>
                    </div>

                    {/* Sub-card 2: Pelunasan Piutang Lama */}
                    <div
                      onClick={() => handleCardClick('piutang-lama')}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        padding: '9px 10px',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CreditCard size={13} />
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#0f766e', backgroundColor: '#f0fdfa', padding: '1px 5px', borderRadius: '999px' }}>
                          Termin
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#6b7280' }}>
                          Pelunasan Lama
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#111827', wordBreak: 'break-word' }}>
                          {formatRupiah(pelunasanLamaVal)}
                        </div>
                      </div>
                      <div style={{ fontSize: '10px', color: '#0d9488', fontWeight: 600 }}>
                        Bagian Kas Masuk
                      </div>
                    </div>

                    {/* Sub-card 3: Sisa Piutang Berjalan */}
                    <div
                      onClick={() => handleCardClick('piutang')}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '10px',
                        padding: '9px 10px',
                        border: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Wallet size={13} />
                        </div>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#b45309', backgroundColor: '#fef3c7', padding: '1px 5px', borderRadius: '999px' }}>
                          Piutang
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#6b7280' }}>
                          Sisa Piutang
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#d97706', wordBreak: 'break-word' }}>
                          {formatRupiah(totalPiutangVal)}
                        </div>
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Bln ini: {formatRupiah(piutangPeriodeVal)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ZONE 2 (MIDDLE 4 COLS): 2x2 BENTO MATRIX FOR SOP LABA RUGI AKRUAL */}
              <div
                className="lg:col-span-4"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                      2. Laporan SOP (Laba Rugi Akrual)
                    </span>
                    <span style={{ fontSize: '11.5px', color: '#6b7280' }}>
                      Omset dikurangi HPP, Beban &amp; Komisi
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                  {/* Tile 1 (Featured Highlight Tile): Laba Bersih */}
                  <div
                    onClick={() => handleCardClick('laba-rugi')}
                    style={{
                      backgroundColor: '#111827',
                      color: '#ffffff',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#9ca3af' }}>
                        Laba Bersih
                      </span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '999px',
                          backgroundColor: labaBersihVal >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: labaBersihVal >= 0 ? '#34d399' : '#f87171'
                        }}
                      >
                        {labaBersihVal >= 0 ? 'Surplus' : 'Defisit'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '16.5px', fontWeight: 800, color: '#ffffff', lineHeight: 1.15, wordBreak: 'break-word' }}>
                        {labaBersihVal < 0 ? '-' : ''}{formatRupiah(Math.abs(labaBersihVal))}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <MoMBadge pct={summary.momComparison?.laba?.pct} />
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af' }}>
                      Omset - HPP - Beban - Komisi
                    </div>
                  </div>

                  {/* Tile 2: Total Omset */}
                  <div
                    onClick={() => handleCardClick('omset')}
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      border: '1px solid #f1f5f9',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#4b5563' }}>
                        Total Omset
                      </span>
                      <div style={{ width: '24px', height: '24px', borderRadius: '7px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileText size={13} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '16.5px', fontWeight: 800, color: '#111827', lineHeight: 1.15, wordBreak: 'break-word' }}>
                        {formatRupiah(totalOmsetVal)}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <MoMBadge pct={summary.momComparison?.omset?.pct} />
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      Basis Akrual (Klik rincian)
                    </div>
                  </div>

                  {/* Tile 3: Laba Kotor */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      border: '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#4b5563' }}>
                        Laba Kotor
                      </span>
                      <div style={{ width: '24px', height: '24px', borderRadius: '7px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={13} />
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '16.5px', fontWeight: 800, color: '#059669', lineHeight: 1.15, wordBreak: 'break-word' }}>
                        {formatRupiah(labaKotorVal)}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#059669', backgroundColor: '#ecfdf5', padding: '1px 6px', borderRadius: '999px' }}>
                          {marginPct}% Margin
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>
                      Omset dikurangi HPP
                    </div>
                  </div>

                  {/* Tile 4: HPP + Beban + Komisi */}
                  <div
                    style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      border: '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#4b5563' }}>
                        HPP + Beban
                      </span>
                      <div style={{ width: '24px', height: '24px', borderRadius: '7px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingDown size={13} />
                      </div>
                    </div>
                    <div style={{ fontSize: '16.5px', fontWeight: 800, color: '#dc2626', lineHeight: 1.15, wordBreak: 'break-word' }}>
                      {formatRupiah(totalOutflowPl)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                      <span>HPP: <strong style={{ color: '#374151' }}>{formatRupiah(totalHppVal)}</strong></span>
                      <span>Beban: <strong style={{ color: '#374151' }}>{formatRupiah(totalBebanVal)}</strong></span>
                      <span>Komisi: <strong style={{ color: '#374151' }}>{formatRupiah(totalKomisiVal)}</strong></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ZONE 3 (RIGHT 3 COLS): VISUAL PROFIT & LOSS PILLAR CHART */}
              <div
                className="lg:col-span-3"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e5e7eb',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 1px 4px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Profit &amp; Loss
                      </h3>
                      <p style={{ fontSize: '11px', color: '#6b7280', margin: '1px 0 0 0' }}>
                        Proporsi metrik keuangan
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCardClick('laba-rugi')}
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: '#4338ca',
                        backgroundColor: '#eef2ff',
                        border: '1px solid #c7d2fe',
                        padding: '3px 9px',
                        borderRadius: '999px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span>Analisis</span>
                      <ChevronRight size={11} />
                    </button>
                  </div>
                </div>

                {/* Vertical Pillar Bars */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    padding: '12px 10px 8px',
                    border: '1px solid #f1f5f9',
                    margin: '8px 0'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '104px', gap: '6px', paddingBottom: '6px', borderBottom: '1px dashed #e2e8f0' }}>
                    {chartBars.map((bar, idx) => {
                      const heightPct = Math.max(12, Math.round((bar.val / maxChartVal) * 100));
                      return (
                        <div
                          key={idx}
                          style={{
                            flex: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={`${bar.label}: ${formatRupiah(bar.val)}`}
                        >
                          <div
                            style={{
                              width: '100%',
                              maxWidth: '22px',
                              height: `${heightPct}%`,
                              backgroundColor: bar.color,
                              borderRadius: '6px 6px 3px 3px',
                              transition: 'height 0.4s ease'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', marginTop: '6px' }}>
                    {chartBars.map((bar, idx) => (
                      <div key={idx} style={{ flex: 1, textAlign: 'center', fontSize: '9px', fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {bar.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Ratio Summary Strip */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>Rasio Beban + HPP</span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>
                      {totalOmsetVal > 0 ? `${Math.min(100, Math.round((totalOutflowPl / totalOmsetVal) * 100))}% dari Omset` : '0%'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${totalOmsetVal > 0 ? Math.min(100, Math.round((totalOutflowPl / totalOmsetVal) * 100)) : 0}%`,
                        height: '100%',
                        backgroundColor: '#e11d48',
                        borderRadius: '999px',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── BOTTOM BENTO ROW: SPENDING PROGRESS + TABLES (PO & EXPENSES) ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
              {/* LEFT 6 COLS: Laporan Pembelian (PO) Bento Card */}
              <div
                className="lg:col-span-6"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e5e7eb',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#eef2ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={19} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Laporan Pembelian
                      </h2>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                        Total PO: <strong style={{ color: '#111827' }}>{formatRupiah(totalPOAmount)}</strong> ({purchaseOrders.length} transaksi)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPOModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#111827',
                      color: '#ffffff',
                      padding: '8px 14px',
                      borderRadius: '999px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={15} />
                    <span>Catat Pembelian</span>
                  </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '14px' }}>
                  <table className="w-full text-sm text-left">
                    <thead style={{ backgroundColor: '#f8fafc', color: '#6b7280', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <tr>
                        <th className="px-4 py-3 font-semibold">Tanggal</th>
                        <th className="px-4 py-3 font-semibold">Supplier / Item</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold text-right">Total Biaya</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {purchaseOrders.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-gray-400 text-xs">
                            Belum ada data pembelian pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        purchaseOrders.map(po => (
                          <tr key={po.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(po.date).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{po.supplier}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider ${po.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatRupiah(po.totalAmount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* RIGHT 6 COLS: Beban Operasional (Expenses) Bento Card */}
              <div
                className="lg:col-span-6"
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #e5e7eb',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 10px rgba(15, 23, 42, 0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#fff1f2', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={19} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#111827', margin: 0 }}>
                        Beban Operasional
                      </h2>
                      <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                        Total Beban: <strong style={{ color: '#e11d48' }}>{formatRupiah(totalExpenseListAmount)}</strong> ({expenses.length} catatan)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowExpenseModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      backgroundColor: '#fff1f2',
                      color: '#be123c',
                      border: '1px solid #fecdd3',
                      padding: '8px 14px',
                      borderRadius: '999px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={15} />
                    <span>Input Expense</span>
                  </button>
                </div>

                <div style={{ overflowX: 'auto', border: '1px solid #f1f5f9', borderRadius: '14px' }}>
                  <table className="w-full text-sm text-left">
                    <thead style={{ backgroundColor: '#f8fafc', color: '#6b7280', fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <tr>
                        <th className="px-4 py-3 font-semibold">Tanggal</th>
                        <th className="px-4 py-3 font-semibold">Keterangan</th>
                        <th className="px-4 py-3 font-semibold">Kategori</th>
                        <th className="px-4 py-3 font-semibold text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {expenses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-gray-400 text-xs">
                            Belum ada data pengeluaran pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                            <td className="px-4 py-3 font-semibold text-gray-800">{exp.title}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                                {exp.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">{formatRupiah(exp.amount)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        );
      })()}

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
