import { useState, useEffect, useMemo, useRef } from 'react';
import { Download, Filter, Share2, Activity } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line
} from 'recharts';
import html2pdf from 'html2pdf.js';
import { formatCurrency } from '../../data/mockData';
import { useOrders } from '../../context/OrderContext';
import { subMonths, format, parseISO, isSameMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import './FinanceReports.css';

const PIE_COLORS = ['#111827', '#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="recharts-custom-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const FinanceReports = () => {
  const { flatOrders: orders} = useOrders();
  const reportRef = useRef(null);

  // States for Toggles
  const [barTimeframe, setBarTimeframe] = useState('Bulanan'); // Bulanan, Kuartalan, Tahunan
  const [lineMetric, setLineMetric] = useState('Semua Metrik'); // Semua Metrik, Pemasukan, Pengeluaran, Laba
  
  // Pie Chart Hover State
  const [hoveredCategory, setHoveredCategory] = useState(null);

  // Pie Chart Filter State
  const [pieFilter, setPieFilter] = useState('Latest');
  const [aggregatedData, setAggregatedData] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  useEffect(() => {
    // 1. Generate last 7 months skeleton
    const today = new Date();
    const monthsSkeleton = Array.from({ length: 7 }).map((_, i) => {
      const d = subMonths(today, 6 - i);
      return {
        dateObj: d,
        monthStr: format(d, 'MMM', { locale: id }),
        fullMonthStr: format(d, 'MMMM yyyy', { locale: id }),
        Pemasukan: 0,
        Pengeluaran: 0,
        Laba: 0
      };
    });

    // 2. Calculate Income from completed orders
    const completedOrders = orders.filter(o => o.status === 'Selesai');
    
    // 3. Calculate Expenses from archivedBudgets
    const archivedData = JSON.parse(localStorage.getItem('archivedBudgets')) || [];
    
    // Aggregate Data
    monthsSkeleton.forEach(monthItem => {
      // Income mapping
      const monthOrders = completedOrders.filter(o => {
        const orderDate = typeof o.date === 'string' ? parseISO(o.date) : o.date;
        return isSameMonth(orderDate, monthItem.dateObj);
      });
      const monthIncome = monthOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
      
      // Expense mapping (matching by period string like "Juli 2026")
      const archiveMatch = archivedData.find(a => a.period.toLowerCase() === monthItem.fullMonthStr.toLowerCase());
      const monthExpense = archiveMatch ? archiveMatch.totalSpent : 0;

      // Ensure mock data isn't just 0 if no real data exists for display purposes (Optional, but user requested real data. 
      // If the user hasn't made orders 7 months back, it'll just be 0. We will inject a bit of mock data to ensure the UI looks good if real data is 0)
      
      const injectedIncome = monthIncome > 0 ? monthIncome : Math.floor(Math.random() * 20000000) + 15000000;
      const injectedExpense = monthExpense > 0 ? monthExpense : Math.floor(Math.random() * 15000000) + 5000000;
      
      monthItem.Pemasukan = monthIncome > 0 ? monthIncome : injectedIncome; // Fallback to dummy if empty to fulfill "Sediakan dummy data... agar visual indah"
      monthItem.Pengeluaran = monthExpense > 0 ? monthExpense : injectedExpense;
      monthItem.Laba = monthItem.Pemasukan - monthItem.Pengeluaran;
    });

    setAggregatedData(monthsSkeleton);

    // 4. Calculate Category Breakdown for the Pie Chart based on Filter
    let latestBreakdown = [];
    
    // Find the relevant archive
    let targetArchive = null;
    if (pieFilter === 'Latest' && archivedData.length > 0) {
      targetArchive = archivedData[0]; // newest
    } else if (pieFilter !== 'Latest') {
      targetArchive = archivedData.find(a => a.period.toLowerCase() === pieFilter.toLowerCase());
    }

    if (targetArchive) {
      latestBreakdown = targetArchive.budgetsSnapshot
        .filter(b => b.spent > 0)
        .map(b => ({ name: b.category, value: b.spent }))
        .sort((a, b) => b.value - a.value);
    } else {
      // Mock category if no archive found for that month
      latestBreakdown = [
        { name: 'Bahan Baku', value: 14000000 },
        { name: 'Operasional', value: 4500000 },
        { name: 'Gaji/Upah', value: 8000000 },
        { name: 'Lainnya', value: 1000000 }
      ];
    }
    setCategoryBreakdown(latestBreakdown);
    
  }, [orders, pieFilter]);

  // Calculate Bar Chart Data based on Toggle
  const displayBarData = useMemo(() => {
    if (barTimeframe === 'Bulanan') {
      return aggregatedData; // Show all 7 months
    } else if (barTimeframe === 'Kuartalan') {
      const quarters = {};
      aggregatedData.forEach(d => {
        const date = d.dateObj;
        const q = Math.ceil((date.getMonth() + 1) / 3);
        const year = date.getFullYear();
        const key = `Q${q} ${year}`;
        if (!quarters[key]) {
          quarters[key] = { monthStr: key, Pemasukan: 0, Pengeluaran: 0 };
        }
        quarters[key].Pemasukan += d.Pemasukan;
        quarters[key].Pengeluaran += d.Pengeluaran;
      });
      return Object.values(quarters);
    } else if (barTimeframe === 'Tahunan') {
      const years = {};
      aggregatedData.forEach(d => {
        const year = d.dateObj.getFullYear().toString();
        if (!years[year]) {
          years[year] = { monthStr: year, Pemasukan: 0, Pengeluaran: 0 };
        }
        years[year].Pemasukan += d.Pemasukan;
        years[year].Pengeluaran += d.Pengeluaran;
      });
      return Object.values(years);
    }
    return aggregatedData;
  }, [aggregatedData, barTimeframe]);

  const handleExportPDF = () => {
    const element = reportRef.current;
    if (!element) return;
    
    const opt = {
      margin:       [10, 10, 10, 10],
      filename:     `Laporan_Keuangan_Dashboard.pdf`,
      image:        { type: 'jpeg', quality: 1.0 },
      html2canvas:  { scale: 2, useCORS: true, windowWidth: 1440 },
      jsPDF:        { unit: 'mm', format: 'a3', orientation: 'landscape' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="reports-container" ref={reportRef}>
      {/* Top Action Bar */}
      <div className="reports-header">
        <div className="badge-overview">
          <Activity size={16} />
          Ringkasan
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="filter-select"
            value={pieFilter}
            onChange={(e) => setPieFilter(e.target.value)}
          >
            <option value="Latest">Bulan Terakhir</option>
            {aggregatedData.map((d, i) => (
              <option key={i} value={d.fullMonthStr}>{d.fullMonthStr}</option>
            ))}
          </select>
          <button className="btn-outline-action" onClick={handleExportPDF}>
            <Download size={16} /> Ekspor PDF
          </button>
        </div>
      </div>

      <div className="quadrant-grid">
        
        {/* Quad 1: Bar Chart (Pemasukan vs Pengeluaran) */}
        <div className="glass-panel">
          <div className="chart-header-flex">
            <div>
              <h2 className="chart-title">Pemasukan vs Pengeluaran</h2>
              <p className="chart-subtitle">Perbandingan kas masuk dan keluar</p>
            </div>
            <div className="pill-toggle">
              {['Bulanan', 'Kuartalan', 'Tahunan'].map(tf => (
                <button 
                  key={tf}
                  className={`pill-toggle-btn ${barTimeframe === tf ? 'active' : ''}`}
                  onClick={() => setBarTimeframe(tf)}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayBarData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="monthStr" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6b7280', fontSize: 12}}
                  tickFormatter={(val) => `Rp ${val / 1000000}M`}
                />
                <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar isAnimationActive={false} dataKey="Pemasukan" fill="#111827" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar isAnimationActive={false} dataKey="Pengeluaran" fill="#d1d5db" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quad 2: Donut Chart (Kategori Pengeluaran) */}
        <div className="glass-panel">
          <div className="chart-header-flex">
            <div>
              <h2 className="chart-title">Kategori Pengeluaran</h2>
              <p className="chart-subtitle">Rincian pengeluaran operasional bulan terakhir</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <div className="donut-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                    onMouseEnter={(_, index) => setHoveredCategory(categoryBreakdown[index])}
                    onMouseLeave={() => setHoveredCategory(null)}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Text on Hover */}
              <div className="donut-center-label">
                {hoveredCategory ? (
                  <>
                    <div className="donut-center-title">{hoveredCategory.name}</div>
                    <div className="donut-center-value">{formatCurrency(hoveredCategory.value)}</div>
                  </>
                ) : (
                  <div className="donut-center-title">Total<br/>Pengeluaran</div>
                )}
              </div>
            </div>
            {/* Custom Legend for Donut */}
            <div className="donut-legend">
              {categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="donut-legend-item">
                  <div className="donut-legend-color" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                  {cat.name}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quad 3: Area Chart (Pertumbuhan Laba Bersih) */}
        <div className="glass-panel">
          <div className="chart-header-flex">
            <div>
              <h2 className="chart-title">Pertumbuhan Laba Bersih</h2>
              <p className="chart-subtitle">Akumulasi keuntungan (Pemasukan dikurangi Pengeluaran)</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={aggregatedData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLaba" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="monthStr" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6b7280', fontSize: 12}}
                  tickFormatter={(val) => `Rp ${val / 1000000}M`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Area isAnimationActive={false} type="monotone" dataKey="Laba" stroke="#111827" strokeWidth={3} fillOpacity={1} fill="url(#colorLaba)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quad 4: Line Chart (Tren Keuangan) */}
        <div className="glass-panel">
          <div className="chart-header-flex">
            <div>
              <h2 className="chart-title">Tren Keuangan</h2>
              <p className="chart-subtitle">Analisis pola finansial</p>
            </div>
            <div className="pill-toggle">
              {['Semua Metrik', 'Pemasukan', 'Pengeluaran', 'Laba'].map(metric => (
                <button 
                  key={metric}
                  className={`pill-toggle-btn ${lineMetric === metric ? 'active' : ''}`}
                  onClick={() => setLineMetric(metric)}
                >
                  {metric}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aggregatedData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="monthStr" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#6b7280', fontSize: 12}}
                  tickFormatter={(val) => `Rp ${val / 1000000}M`}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                
                {(lineMetric === 'Semua Metrik' || lineMetric === 'Pemasukan') && (
                  <Line isAnimationActive={false} type="monotone" dataKey="Pemasukan" stroke="#111827" strokeWidth={3} dot={{r: 4, fill: '#111827'}} activeDot={{r: 6}} />
                )}
                
                {(lineMetric === 'Semua Metrik' || lineMetric === 'Pengeluaran') && (
                  <Line isAnimationActive={false} type="monotone" dataKey="Pengeluaran" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={{r: 4, fill: '#9ca3af'}} activeDot={{r: 6}} />
                )}
                
                {(lineMetric === 'Semua Metrik' || lineMetric === 'Laba') && (
                  <Line isAnimationActive={false} type="monotone" dataKey="Laba" stroke="#4b5563" strokeWidth={2} dot={{r: 4, fill: '#4b5563'}} activeDot={{r: 6}} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default FinanceReports;
