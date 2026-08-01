import { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
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

  const handleExportPDF = () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Laporan_Keuangan_Gallardo_${month ? month + '_' : ''}${year}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1280 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['avoid-all', 'css'] }
    };

    toast.info('Menyiapkan file PDF...');
    html2pdf().set(opt).from(element).save().then(() => {
      toast.success('Laporan berhasil diexport ke PDF!');
    }).catch((err) => {
      console.error(err);
      toast.error('Gagal export PDF');
    });
  };

  return (
    <div className={`owner-dashboard ${isDarkMode ? 'dark-theme' : ''}`}>

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Halo, {userName} 👋</h1>
          <p className="page-subtitle">Executive Dashboard - Ringkasan kinerja bisnis, pendapatan, dan efisiensi operasional</p>
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
                <div className="metric-card">
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
                <div className="metric-card">
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
                <div className="metric-card">
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
                  <div className="ops-summary-row">
                    <span className="ops-summary-label">Selesai / Lunas</span>
                    <span className="ops-summary-value">{summaryData.orderStats?.lunas || 0}</span>
                  </div>
                  <div className="ops-summary-row">
                    <span className="ops-summary-label">Proses / Pending</span>
                    <span className="ops-summary-value">{summaryData.orderStats?.pending || 0}</span>
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
                      <div key={index} className="list-item">
                        <div className="list-item-left">
                          <div className={`rank-badge ${index === 0 ? 'rank-1' : 'rank-other'}`}>
                            {index + 1}
                          </div>
                          <span className="list-item-name">{sales.name}</span>
                        </div>
                        <span className="list-item-val">{formatCurrency(sales.omset)}</span>
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
                        <span className="list-item-name">{cust.name}</span>
                        <span className="list-item-val">{formatCurrency(cust.omset)}</span>
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
                    <p className="empty-state-text">Belum ada data retail/grosir.</p>
                  ) : (
                    summaryData.topRetail.map((retail, index) => (
                      <div key={index} className="list-item">
                        <span className="list-item-name">{retail.name}</span>
                        <span className="list-item-val">{formatCurrency(retail.omset)}</span>
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

    </div>
  );
}
