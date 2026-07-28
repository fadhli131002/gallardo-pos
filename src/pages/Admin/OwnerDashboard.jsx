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

export default function OwnerDashboard() {
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
  const [expenses, setExpenses] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ title: '', category: 'Operational', amount: '', date: '' });
  
  const [showPOModal, setShowPOModal] = useState(false);
  const [poForm, setPOForm] = useState({ supplier: '', totalAmount: '', status: 'Received', date: '' });
  
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
      const sumRes = await fetch(`http://localhost:5000/api/owner/dashboard-summary?${queryParams}`, { headers });
      const sumJson = await sumRes.json();
      
      if (sumJson.success) {
        setSummaryData(sumJson.data);
      } else {
        toast.error(`Gagal load summary: ${sumJson.error || sumJson.message || 'Unknown Error'}`);
      }

      // Fetch Chart
      const chartRes = await fetch(`http://localhost:5000/api/owner/profit-loss?year=${year}`, { headers });
      const chartJson = await chartRes.json();
      if (chartJson.success) {
        setChartData(chartJson.data);
      }

      // Fetch Expenses
      const expRes = await fetch(`http://localhost:5000/api/owner/expenses?${queryParams}`, { headers });
      const expJson = await expRes.json();
      if (expJson.success) setExpenses(expJson.data);

      // Fetch Purchase Orders
      const poRes = await fetch(`http://localhost:5000/api/owner/purchase-orders?${queryParams}`, { headers });
      const poJson = await poRes.json();
      if (poJson.success) setPurchaseOrders(poJson.data);
      
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

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/owner/expenses`, {
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
      const res = await fetch(`http://localhost:5000/api/owner/purchase-orders`, {
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

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);
  };

  const handleExportPDF = () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;
    
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Laporan_Keuangan_Gallardo_${month ? month + '_' : ''}${year}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, windowWidth: 1280 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak:    { mode: ['avoid-all', 'css'] }
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
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Ringkasan kinerja bisnis, pendapatan, dan efisiensi operasional</p>
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
            {Array.from({length: 12}, (_, i) => (
              <option key={i+1} value={i+1}>{new Date(2000, i, 1).toLocaleString('id-ID', {month: 'long'})}</option>
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
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#9ca3af' : '#64748b', fontSize: 12}} dy={10} />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: isDarkMode ? '#9ca3af' : '#64748b', fontSize: 12}}
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

                {/* TABLES */}
                <div className="tables-grid">
                  
                  {/* PO */}
                  <div className="table-card">
                    <div className="table-header">
                      <h2 className="table-title">
                        <Package size={20} color="#64748b" /> Laporan Pembelian
                      </h2>
                      <button onClick={() => setShowPOModal(true)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        <Plus size={14} /> Catat Pembelian
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Tanggal</th>
                            <th>Supplier / Item</th>
                            <th>Status</th>
                            <th>Total Biaya</th>
                          </tr>
                        </thead>
                        <tbody>
                          {purchaseOrders.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>Belum ada data pembelian.</td>
                            </tr>
                          ) : purchaseOrders.map(po => (
                            <tr key={po.id}>
                              <td>{new Date(po.date).toLocaleDateString('id-ID')}</td>
                              <td style={{ fontWeight: '500' }}>{po.supplier}</td>
                              <td>
                                <span className={`status-badge ${po.status === 'Received' ? 'status-received' : 'status-pending'}`}>
                                  {po.status}
                                </span>
                              </td>
                              <td>{formatCurrency(po.totalAmount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expenses */}
                  <div className="table-card">
                    <div className="table-header">
                      <h2 className="table-title">
                        <FileText size={20} color="#64748b" /> Beban Operasional
                      </h2>
                      <button onClick={() => setShowExpenseModal(true)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
                        <Plus size={14} /> Input Expense
                      </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Tanggal</th>
                            <th>Keterangan</th>
                            <th>Kategori</th>
                            <th>Nominal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>Belum ada data pengeluaran.</td>
                            </tr>
                          ) : expenses.map(exp => (
                            <tr key={exp.id}>
                              <td>{new Date(exp.date).toLocaleDateString('id-ID')}</td>
                              <td style={{ fontWeight: '500' }}>{exp.title}</td>
                              <td style={{ color: '#64748b' }}>{exp.category}</td>
                              <td>{formatCurrency(exp.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </>
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

      {/* MODALS */}
      {showExpenseModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Catat Pengeluaran Baru</h3>
            <form onSubmit={handleAddExpense}>
              <div className="form-group">
                <label className="form-label">Keterangan / Judul</label>
                <input required type="text" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} className="form-input" placeholder="Misal: Gaji Bulan Juli" />
              </div>
              <div className="form-group">
                <label className="form-label">Kategori</label>
                <select value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})} className="form-input">
                  <option value="Operational">Operasional (Umum)</option>
                  <option value="Salary">Gaji Karyawan</option>
                  <option value="Utility">Listrik & Internet</option>
                  <option value="Other">Lain-lain</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nominal (Rp)</label>
                <input required type="text" value={expenseForm.amount ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(expenseForm.amount) : ''} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setExpenseForm({...expenseForm, amount: val ? Number(val) : ''}) }} className="form-input" placeholder="Rp 0" />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Pengeluaran</label>
                <input required type="date" value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="btn-outline">Batal</button>
                <button type="submit" className="btn-primary">Simpan Pengeluaran</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPOModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Catat Pembelian Stok</h3>
            <form onSubmit={handleAddPO}>
              <div className="form-group">
                <label className="form-label">Nama Supplier / Deskripsi</label>
                <input required type="text" value={poForm.supplier} onChange={e => setPOForm({...poForm, supplier: e.target.value})} className="form-input" placeholder="Misal: PT Global (Kaca Film)" />
              </div>
              <div className="form-group">
                <label className="form-label">Status Penerimaan</label>
                <select value={poForm.status} onChange={e => setPOForm({...poForm, status: e.target.value})} className="form-input">
                  <option value="Received">Barang Diterima & Lunas</option>
                  <option value="Pending">Pending / Belum Lunas</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Total Biaya (Rp)</label>
                <input required type="text" value={poForm.totalAmount ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(poForm.totalAmount) : ''} onChange={e => { const val = e.target.value.replace(/\D/g, ''); setPOForm({...poForm, totalAmount: val ? Number(val) : ''}) }} className="form-input" placeholder="Rp 0" />
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Pembelian</label>
                <input required type="date" value={poForm.date} onChange={e => setPOForm({...poForm, date: e.target.value})} className="form-input" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowPOModal(false)} className="btn-outline">Batal</button>
                <button type="submit" className="btn-primary">Simpan Pembelian</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
