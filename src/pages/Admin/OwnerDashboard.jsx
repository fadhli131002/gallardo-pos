import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import DashboardDetailsModal from '../../components/DashboardDetailsModal';
import {
  TrendingUp,
  Wallet,
  Receipt,
  ShieldAlert,
  Download,
  Plus,
  FileText,
  Package,
  Users,
  Award,
  Activity,
  ShoppingCart,
  ExternalLink,
  Calendar,
  MoreVertical,
  Sun,
  Moon
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { toast } from 'sonner';
import './OwnerDashboard.css';
import { useAuth } from '../../context/AuthContext';
import OwnerInventory from '../../components/OwnerInventory';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const userName = user?.name || 'Owner';
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState('');

  const [summaryData, setSummaryData] = useState({
    totalOmset: 0,
    totalHPP: 0,
    totalExpense: 0,
    labaBersih: 0,
    totalKerugianKomplain: 0,
    netCashFlow: 0,
    cashIn: 0,
    cashOut: 0,
    topSales: [],
    topCustomers: [],
    topRetail: [],
    orderStats: { lunas: 0, pending: 0 },
    complaintStats: { total: 0, resolved: 0, pending: 0 }
  });

  
  const [chartData, setChartData] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  const fetchDetails = async (type) => {
    setIsModalOpen(true);
    setModalType(type);
    setModalLoading(true);
    setModalData([]);

    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const queryParams = new URLSearchParams({ type, year });
      if (month) queryParams.append('month', month);

      const res = await fetch(`${window.API_URL}/api/owner/dashboard-details?${queryParams}`, { headers });
      const json = await res.json();
      
      if (json.success) {
        setModalData(json.data);
      } else {
        toast.error('Gagal mengambil rincian data');
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan server');
      setIsModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  };


  const [activeTab, setActiveTab] = useState('finance');
  const [isLoading, setIsLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('owner-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('owner-theme', newMode ? 'dark' : 'light');
    window.dispatchEvent(new Event('themeChanged'));
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      const queryParams = new URLSearchParams({ year });
      if (month) queryParams.append('month', month);

      // Fetch Summary
      const sumRes = await fetch(`${window.API_URL}/api/owner/dashboard-summary?${queryParams}`, { headers });
      const sumJson = await sumRes.json();

      if (sumJson.success) {
        setSummaryData(sumJson.data);
      } else {
        toast.error(`Gagal load summary: ${sumJson.error || sumJson.message || 'Unknown Error'}`);
      }

      // Fetch Chart
      const chartRes = await fetch(`${window.API_URL}/api/owner/profit-loss?year=${year}`, { headers });
      const chartJson = await chartRes.json();
      if (chartJson.success) {
        setChartData(chartJson.data);
      }

    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [year, month]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
  };

  const handleExportPDF = async () => {
    try {
      toast.info('Menyiapkan file PDF...');
      const token = sessionStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const queryParams = new URLSearchParams({ year });
      if (month) queryParams.append('month', month);

      // Fetch required data for PDF
      const [arusRes, bebanRes, labaRes] = await Promise.all([
        fetch(`${window.API_URL}/api/owner/dashboard-details?${queryParams}&type=arus-kas`, { headers }),
        fetch(`${window.API_URL}/api/owner/dashboard-details?${queryParams}&type=beban`, { headers }),
        fetch(`${window.API_URL}/api/owner/dashboard-details?${queryParams}&type=laba-rugi`, { headers })
      ]);

      const arusJson = await arusRes.json();
      const bebanJson = await bebanRes.json();
      const labaJson = await labaRes.json();

      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(16);
      doc.text('Laporan Eksekutif Keuangan', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Periode: ${month ? month + '/' : ''}${year}`, pageWidth / 2, 26, { align: 'center' });
      doc.text('Dicetak pada: ' + new Date().toLocaleString('id-ID'), pageWidth / 2, 32, { align: 'center' });

      // Executive Summary
      doc.setFontSize(12);
      doc.text('Ringkasan', 14, 45);
      
      autoTable(doc, {
        startY: 50,
        head: [['Metrik', 'Nilai (Rp)']],
        body: [
          ['Total Omset', formatCurrency(summaryData.totalOmset)],
          ['Total HPP (Modal)', formatCurrency(summaryData.totalHPP)],
          ['Laba Bersih', formatCurrency(summaryData.labaBersih)],
          ['Arus Kas Bersih', formatCurrency(summaryData.netCashFlow)],
          ['Total Kas Keluar', formatCurrency(summaryData.cashOut)],
          ['Kerugian Komplain', formatCurrency(summaryData.totalKerugianKomplain)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
      });

      // Arus Kas List
      if (arusJson.success && arusJson.data.length > 0) {
        doc.text('Rincian Arus Kas', 14, doc.lastAutoTable.finalY + 15);
        const arusBody = arusJson.data.map(item => [
          new Date(item.date).toLocaleDateString('id-ID'),
          item.referenceId || '-',
          item.type === 'IN' ? 'Masuk' : 'Keluar',
          item.description,
          formatCurrency(item.amount)
        ]);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Tanggal', 'Referensi', 'Tipe', 'Deskripsi', 'Nominal']],
          body: arusBody,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] }
        });
      }

      // Beban Operasional List
      if (bebanJson.success && bebanJson.data.length > 0) {
        doc.text('Rincian Beban Operasional', 14, doc.lastAutoTable.finalY + 15);
        const bebanBody = bebanJson.data.map(item => [
          new Date(item.date).toLocaleDateString('id-ID'),
          item.category,
          item.title,
          formatCurrency(item.amount)
        ]);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [['Tanggal', 'Kategori', 'Keterangan', 'Nominal']],
          body: bebanBody,
          theme: 'striped',
          headStyles: { fillColor: [79, 70, 229] }
        });
      }

      doc.save(`Laporan_Eksekutif_${month ? month + '_' : ''}${year}.pdf`);
      toast.success('Laporan PDF berhasil diunduh!');

    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat PDF');
    }
  };

  return (
    <div className={`owner-dashboard ${isDarkMode ? 'dark-theme' : ''}`}>

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title font-bold text-slate-900" style={{ color: '#0F172A', fontWeight: 'bold' }}>Halo, {userName} 👋</h1>
          <p className="page-subtitle text-slate-500" style={{ marginTop: '4px' }}>Executive Dashboard - Ringkasan kinerja bisnis, pendapatan, dan efisiensi operasional</p>
        </div>
        <div className="header-actions">
          <button onClick={toggleTheme} className="btn-icon theme-toggle-btn" title="Toggle Theme">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="filter-select"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
            <option value="2027">2027</option>
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="filter-select"
          >
            <option value="">Semua Bulan</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString('id-ID', { month: 'long' })}</option>
            ))}
          </select>
          <button onClick={handleExportPDF} className="btn-outline">
            <Download size={16} /> Export Laporan
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="tab-nav">
        <button
          onClick={() => setActiveTab('finance')}
          className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`}
        >
          <Wallet size={16} /> Laporan Keuangan
        </button>
        <button
          onClick={() => setActiveTab('operational')}
          className={`tab-btn ${activeTab === 'operational' ? 'active' : ''}`}
        >
          <Activity size={16} /> Performa & Operasional
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
        >
          <Package size={16} /> Stok & Inventaris
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Memuat data dashboard...</div>
      ) : (
        <div id="dashboard-content">

          {activeTab === 'finance' && (
            <>
              {/* METRICS GRID */}
              <div className="metric-grid">

                {/* LABA BERSIH */}
                <div className="metric-card cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-indigo-100 relative group" onClick={() => fetchDetails('laba-rugi')}>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={16} className="text-indigo-400" />
                  </div>
                  <div className="metric-header">
                    <h3 className="metric-title">Laba Bersih</h3>
                    <div className="metric-icon-wrap icon-emerald">
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div className="metric-value-container">
                    <p className="metric-value">{formatCurrency(summaryData.labaBersih)}</p>
                  </div>
                  <div className="metric-footer">
                    <div className="metric-footer-row">
                      <span>Total Omset</span>
                      <span className="metric-footer-value">{formatCurrency(summaryData.totalOmset)}</span>
                    </div>
                    <div className="metric-footer-row">
                      <span>Total HPP</span>
                      <span className="metric-footer-value text-rose">- {formatCurrency(summaryData.totalHPP)}</span>
                    </div>
                  </div>
                </div>

                {/* ARUS KAS BERSIH */}
                <div className="metric-card cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-blue-100 relative group" onClick={() => fetchDetails('arus-kas')}>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={16} className="text-blue-400" />
                  </div>
                  <div className="metric-header">
                    <h3 className="metric-title">Arus Kas Bersih</h3>
                    <div className="metric-icon-wrap icon-blue">
                      <Wallet size={20} />
                    </div>
                  </div>
                  <div className="metric-value-container">
                    <p className="metric-value">{formatCurrency(summaryData.netCashFlow)}</p>
                  </div>
                  <div className="metric-footer">
                    <div className="metric-footer-row">
                      <span>Kas Masuk</span>
                      <span className="metric-footer-value">{formatCurrency(summaryData.cashIn)}</span>
                    </div>
                    <div className="metric-footer-row">
                      <span>Kas Keluar</span>
                      <span className="metric-footer-value">{formatCurrency(summaryData.cashOut)}</span>
                    </div>
                  </div>
                </div>

                {/* TOTAL BEBAN */}
                <div className="metric-card cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-purple-100 relative group" onClick={() => fetchDetails('beban')}>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink size={16} className="text-purple-400" />
                  </div>
                  <div className="metric-header">
                    <h3 className="metric-title">Total Beban & Operasional</h3>
                    <div className="metric-icon-wrap icon-purple">
                      <Receipt size={20} />
                    </div>
                  </div>
                  <div className="metric-value-container">
                    <p className="metric-value">{formatCurrency(summaryData.totalExpense)}</p>
                  </div>
                  <div className="metric-footer">
                    <p className="metric-desc">Seluruh pengeluaran di luar HPP (gaji, sewa, listrik, utilitas, dll).</p>
                  </div>
                </div>

                {/* KERUGIAN KOMPLAIN */}
                <div className="metric-card">
                  <div className="metric-header">
                    <h3 className="metric-title">Kerugian Komplain / Garansi</h3>
                    <div className="metric-icon-wrap icon-rose">
                      <ShieldAlert size={20} />
                    </div>
                  </div>
                  <div className="metric-value-container">
                    <p className="metric-value">{formatCurrency(summaryData.totalKerugianKomplain)}</p>
                  </div>
                  <div className="metric-footer">
                    <p className="metric-desc">Nilai finansial (modal barang) yang keluar akibat klaim gratis.</p>
                  </div>
                </div>

              </div>

              {/* CHART */}
              <div className="chart-card">
                <h2 className="chart-header">Grafik Laba Rugi {year}</h2>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLaba" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDarkMode ? '#9ca3af' : '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: isDarkMode ? '#9ca3af' : '#64748b', fontSize: 12 }}
                        tickFormatter={(val) => `Rp ${val / 1000000}Jt`}
                        dx={-10}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '12px', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`, backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', color: isDarkMode ? '#f9fafb' : '#0f172a', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Area type="monotone" dataKey="labaBersih" name="Laba Bersih" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLaba)" />
                      <Line type="monotone" dataKey="expense" name="Total Beban" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="hpp" name="Total HPP" stroke="#cbd5e1" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      <Line type="monotone" dataKey="omset" name="Total Omset" stroke={isDarkMode ? '#f9fafb' : '#334155'} strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

          {activeTab === 'inventory' && (
            <OwnerInventory isDarkMode={isDarkMode} />
          )}

          {activeTab === 'operational' && (
            <div className="ops-grid">

              {/* ORDER & COMPLAINTS */}
              <div className="table-card ops-summary-container">
                <div className="ops-summary-card">
                  <h3 className="ops-summary-title">
                    <Package size={16} /> Status Order / Transaksi
                  </h3>
                  <div className="ops-summary-row items-center">
                    <span className="ops-summary-label">Selesai / Lunas</span>
                    <span className="badge-emerald">{summaryData.orderStats?.lunas || 0}</span>
                  </div>
                  <div className="ops-summary-row items-center mt-2">
                    <span className="ops-summary-label">Proses / Pending</span>
                    <span className="badge-amber">{summaryData.orderStats?.pending || 0}</span>
                  </div>
                  {summaryData.orderStats?.pendingIds && summaryData.orderStats.pendingIds.length > 0 && (
                    <div className="ops-summary-pending-ids">
                      ID: {summaryData.orderStats.pendingIds.join(', ')}
                    </div>
                  )}
                </div>

                <div className="ops-summary-card">
                  <h3 className="ops-summary-title">
                    <ShieldAlert size={16} /> Statistik Komplain
                  </h3>
                  <div className="ops-summary-row">
                    <span className="ops-summary-label">Total Komplain</span>
                    <span className="ops-summary-value">{summaryData.complaintStats?.total || 0}</span>
                  </div>
                  <div className="ops-summary-row">
                    <span className="ops-summary-label">Terselesaikan</span>
                    <span className="ops-summary-value text-emerald">{summaryData.complaintStats?.resolved || 0}</span>
                  </div>
                  <div className="ops-summary-row">
                    <span className="ops-summary-label">Sedang Proses</span>
                    <span className="ops-summary-value text-rose">{summaryData.complaintStats?.pending || 0}</span>
                  </div>
                </div>
              </div>

              {/* SALES */}
              <div className="table-card">
                <h2 className="table-title mb-20">
                  <Award size={20} className="icon-muted" /> Leaderboard Sales Terbaik
                </h2>
                <div>
                  {(!summaryData.topSales || summaryData.topSales.length === 0) ? (
                    <p className="empty-state-text">Belum ada data sales.</p>
                  ) : (
                    summaryData.topSales.map((sales, index) => (
                      <div key={index} className={`list-item ${index === 0 ? 'rank-1-row' : ''}`}>
                        <div className="list-item-left">
                          <div className={`rank-badge ${index === 0 ? 'rank-1' : 'rank-other'}`}>
                            {index + 1}
                          </div>
                          <span className="list-item-name font-semibold">{sales.name}</span>
                        </div>
                        <span className="list-item-val font-bold text-slate-900">{formatCurrency(sales.omset)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* CUSTOMERS */}
              <div className="table-card">
                <h2 className="table-title mb-20">
                  <Users size={20} className="icon-muted" /> Top Customer (Workshop)
                </h2>
                <div>
                  {(!summaryData.topCustomers || summaryData.topCustomers.length === 0) ? (
                    <p className="empty-state-text">Belum ada data customer.</p>
                  ) : (
                    summaryData.topCustomers.map((cust, index) => (
                      <div key={index} className="list-item">
                        <span className="list-item-name font-medium">{cust.name}</span>
                        <span className="list-item-val font-semibold">{formatCurrency(cust.omset)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* RETAIL */}
              <div className="table-card">
                <h2 className="table-title mb-20">
                  <ShoppingCart size={20} className="icon-muted" /> Top Retail / Grosir
                </h2>
                <div>
                  {(!summaryData.topRetail || summaryData.topRetail.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <ShoppingCart size={40} className="text-slate-200 mb-3" />
                      <p className="empty-state-text m-0">Belum ada data retail/grosir untuk periode ini.</p>
                    </div>
                  ) : (
                    summaryData.topRetail.map((ret, index) => (
                      <div key={index} className="list-item">
                        <span className="list-item-name font-medium">{ret.name}</span>
                        <span className="list-item-val font-semibold">{formatCurrency(ret.omset)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Banner Removed per user request */}

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
}
