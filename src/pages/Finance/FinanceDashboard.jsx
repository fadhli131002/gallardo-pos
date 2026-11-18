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

      {/* ── SECTION 1: ARUS KAS RIIL (CASHFLOW) ───────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px',
          marginTop: '8px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>
            1. Arus Kas Riil (Cashflow)
          </h2>
          <p style={{ fontSize: '12.5px', color: '#6b7280', margin: '2px 0 0 0' }}>
            Uang fisik/transfer yang benar-benar diterima &amp; dikeluarkan dalam periode ini
          </p>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#1d4ed8',
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            padding: '4px 12px',
            borderRadius: '999px'
          }}
        >
          Bulan: {new Date().toISOString().slice(0, 7)}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}
      >
        {/* 1. Kas Masuk Riil */}
        <div
          onClick={() => handleCardClick('kas-masuk')}
          style={{ ...cardBaseStyle, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Kas Masuk Riil
              <ChevronRight size={14} />
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
                {formatRupiah(summary.cashflow?.kasMasuk ?? summary.totalKasMasuk)}
              </span>
              <MoMBadge pct={summary.momComparison?.kas?.pct} />
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Penerimaan kas &amp; transfer masuk
            </span>
          </div>
          <div style={{ ...iconBoxBaseStyle, backgroundColor: '#ecfdf5', color: '#059669' }}>
            <DollarSign size={20} />
          </div>
        </div>

        {/* 2. Pelunasan Piutang Lama */}
        <div
          onClick={() => handleCardClick('piutang-lama')}
          style={{ ...cardBaseStyle, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>Pelunasan Piutang Lama</span>
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#0f766e', backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', padding: '1px 7px', borderRadius: '999px' }}>
                Bagian Kas Masuk
              </span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
                {formatRupiah(summary.cashflow?.pelunasanPiutangLama ?? summary.pelunasanPiutangLama ?? 0)}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Cicilan / termin dari transaksi lalu
            </span>
          </div>
          <div style={{ ...iconBoxBaseStyle, backgroundColor: '#f0fdfa', color: '#0d9488' }}>
            <CreditCard size={20} />
          </div>
        </div>

        {/* 3. Net Cashflow */}
        <div style={cardBaseStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
              Net Cashflow
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: (summary.cashflow?.netCashflow ?? 0) >= 0 ? '#111827' : '#dc2626',
                  lineHeight: 1.1
                }}
              >
                {(summary.cashflow?.netCashflow ?? 0) < 0 ? '-' : ''}
                {formatRupiah(Math.abs(summary.cashflow?.netCashflow ?? 0))}
              </span>
              <MoMBadge pct={summary.momComparison?.cashflow?.pct} />
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Selisih kas masuk dikurangi kas keluar
            </span>
          </div>
          <div style={{ ...iconBoxBaseStyle, backgroundColor: '#eff6ff', color: '#2563eb' }}>
            <TrendingUp size={20} />
          </div>
        </div>

        {/* 4. Sisa Piutang Berjalan */}
        <div
          onClick={() => handleCardClick('piutang')}
          style={{ ...cardBaseStyle, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span>Sisa Piutang Berjalan</span>
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#b45309', backgroundColor: '#fef3c7', border: '1px solid #fde68a', padding: '1px 7px', borderRadius: '999px' }}>
                Belum Lunas
              </span>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#d97706', lineHeight: 1.1 }}>
                {formatRupiah(summary.receivables?.totalPiutang ?? summary.totalPiutang)}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Bulan ini: {formatRupiah(summary.receivables?.totalPiutangPeriode ?? summary.totalPiutangPeriode)}
            </span>
          </div>
          <div style={{ ...iconBoxBaseStyle, backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Wallet size={20} />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: LAPORAN LABA RUGI AKRUAL (P&L) ─────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '14px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0 }}>
            2. Standar Laporan Keuangan SOP (Laba Rugi Akrual)
          </h2>
          <p style={{ fontSize: '12.5px', color: '#6b7280', margin: '2px 0 0 0' }}>
            Dihitung berdasarkan basis akrual: Total Omset dikurangi HPP, Beban Operasional, dan Komisi
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleCardClick('laba-rugi')}
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: '#4338ca',
            backgroundColor: '#eef2ff',
            border: '1px solid #c7d2fe',
            padding: '5px 12px',
            borderRadius: '999px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>Profit &amp; Loss Analysis</span>
          <ChevronRight size={13} />
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: '16px'
        }}
      >
        {/* 1. Total Omset */}
        <div
          onClick={() => handleCardClick('omset')}
          style={{ ...cardBaseStyle, cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              Total Omset
              <ChevronRight size={14} />
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#111827', lineHeight: 1.1 }}>
                {formatRupiah(summary.pl?.totalOmset ?? summary.totalOmset)}
              </span>
              <MoMBadge pct={summary.momComparison?.omset?.pct} />
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Pendapatan kotor basis akrual
            </span>
          </div>
          <div style={{ ...iconBoxBaseStyle, backgroundColor: '#eef2ff', color: '#4f46e5' }}>
            <FileText size={20} />
          </div>
        </div>

        {/* 2. HPP + Beban */}
        <div style={cardBaseStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px' }}>
              HPP + Beban + Komisi
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#dc2626', lineHeight: 1.1 }}>
                {formatRupiah((summary.pl?.totalHpp ?? summary.totalHpp ?? 0) + (summary.pl?.totalBeban ?? summary.totalExpense ?? 0) + (summary.pl?.totalKomisi ?? summary.totalKomisi ?? 0))}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11.5px', color: '#6b7280' }}>
              <span>HPP: <strong style={{ color: '#374151' }}>{formatRupiah(summary.pl?.totalHpp ?? summary.totalHpp)}</strong></span>
              <span>Beban: <strong style={{ color: '#374151' }}>{formatRupiah(summary.pl?.totalBeban ?? summary.totalExpense ?? 0)}</strong> &bull; Komisi: <strong style={{ color: '#374151' }}>{formatRupiah(summary.pl?.totalKomisi ?? summary.totalKomisi ?? 0)}</strong></span>
            </div>
          </div>
          <div style={{ ...iconBoxBaseStyle, backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <TrendingDown size={20} />
          </div>
        </div>

        {/* 3. Laba Kotor */}
        <div style={cardBaseStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span>Laba Kotor</span>
              {summary.pl?.totalOmset > 0 && (
                <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '1px 7px', borderRadius: '999px' }}>
                  {Math.round((summary.pl?.labaKotor / summary.pl?.totalOmset) * 100)}% margin
                </span>
              )}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <span style={{ fontSize: '22px', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                {formatRupiah(summary.pl?.labaKotor ?? summary.labaKotor)}
              </span>
            </div>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Total Omset dikurangi HPP
            </span>
          </div>
          <div style={{ ...iconBoxBaseStyle, backgroundColor: '#ecfdf5', color: '#059669' }}>
            <TrendingUp size={20} />
          </div>
        </div>

        {/* 4. Laba Bersih */}
        {(() => {
          const labaBersihVal = summary.pl?.labaBersih ?? ((summary.pl?.totalOmset ?? summary.totalOmset ?? 0) - (summary.pl?.totalHpp ?? summary.totalHpp ?? 0) - (summary.pl?.totalBeban ?? summary.totalExpense ?? 0) - (summary.pl?.totalKomisi ?? summary.totalKomisi ?? 0));
          return (
            <div
              onClick={() => handleCardClick('laba-rugi')}
              style={{ ...cardBaseStyle, cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span>Laba Bersih</span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: labaBersihVal >= 0 ? '#059669' : '#dc2626',
                      backgroundColor: labaBersihVal >= 0 ? '#ecfdf5' : '#fef2f2',
                      border: `1px solid ${labaBersihVal >= 0 ? '#a7f3d0' : '#fecaca'}`,
                      padding: '1px 7px',
                      borderRadius: '999px'
                    }}
                  >
                    {labaBersihVal >= 0 ? 'Surplus Laba' : 'Defisit Rugi'}
                  </span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: labaBersihVal >= 0 ? '#059669' : '#dc2626', lineHeight: 1.1 }}>
                    {labaBersihVal < 0 ? '-' : ''}{formatRupiah(Math.abs(labaBersihVal))}
                  </span>
                  <MoMBadge pct={summary.momComparison?.laba?.pct} />
                </div>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Omset - HPP - Beban - Komisi
                </span>
              </div>
              <div
                style={{
                  ...iconBoxBaseStyle,
                  backgroundColor: labaBersihVal >= 0 ? '#ecfdf5' : '#fef2f2',
                  color: labaBersihVal >= 0 ? '#059669' : '#dc2626'
                }}
              >
                <PieChart size={20} />
              </div>
            </div>
          );
        })()}
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
