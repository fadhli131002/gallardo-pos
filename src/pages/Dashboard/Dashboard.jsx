import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Users, ShoppingBag, CheckCircle, Clock } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { format } from 'date-fns';
import './Dashboard.css';

import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  const { flatOrders: orders } = useOrders();
  const { userBranch } = useOutletContext() || { userBranch: 'Gallardo' };
  const { user, token, loading: authLoading } = useAuth();

  // ── Loading gate: block rendering until auth verification is complete ──
  if (authLoading || !user) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: '#6b7280', fontFamily: 'sans-serif', fontSize: '14px' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #e5e7eb', borderTop: '3px solid #111827', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          Memuat data dashboard...
        </div>
      </div>
    );
  }
  
  const userName = user.name ?? null;
  const userRole = user.role ?? null;
  const isSales = userRole === 'sales';

  const [adminStats, setAdminStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    lunasOrders: 0,
    prosesOrders: 0,
    weeklyData: [
      { week: 'Minggu 1', revenue: 0 },
      { week: 'Minggu 2', revenue: 0 },
      { week: 'Minggu 3', revenue: 0 },
      { week: 'Minggu 4', revenue: 0 }
    ],
    topProducts: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  // Admins get stats from the backend API
  useEffect(() => {
    if (isSales !== null && isSales) { setLoading(false); return; }
    if (!userRole) return; // still auth-loading, wait
    const fetchAdminStats = async () => {
      try {
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/analytics/dashboard', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) setAdminStats(json.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminStats();
  }, [token, isSales]);

  // Normalise name: "Femy Sales" → "femy", "Femmy" → "femy"
  const normName = (str) =>
    (str || '')
      .toLowerCase()
      .replace(/\b(sales|team|internal|admin)\b/gi, '')
      .replace(/(.)\1+/g, '$1')
      .trim();

  // ── Sales: Use all orders since backend already filters them by sales_id OR event ──
  const salesOrders = isSales ? orders : orders;

  // When admin → use backend stats; when sales → compute from local orders
  const totalCustomers   = isSales ? new Set(salesOrders.map(o => o.customerName)).size : adminStats.totalCustomers;
  const totalOrders      = isSales ? salesOrders.length : adminStats.totalOrders;
  const lunasOrders      = isSales ? salesOrders.filter(o => (o.paymentType||'').toLowerCase()==='lunas' || o.remainingAmount<=0).length : adminStats.lunasOrders;
  const prosesOrders     = isSales ? Math.max(0, totalOrders - lunasOrders) : adminStats.prosesOrders;

  // Weekly dynamics
  const computedWeekly = [1,2,3,4].map(w => ({ week: `Minggu ${w}`, revenue: 0 }));
  if (isSales) {
    salesOrders.forEach(o => {
      const d = new Date(o.date);
      let wi = Math.floor((d.getDate() - 1) / 7);
      if (wi > 3) wi = 3;
      computedWeekly[wi].revenue += (o.totalPrice || 0);
    });
  }
  const weeklyData = isSales ? computedWeekly : (adminStats?.weeklyData || []);

  // Top products
  const productMap = {};
  if (isSales) {
    salesOrders.forEach(o => {
      (o.items || []).forEach(item => {
        const pName = item.name || item.product_name || 'Service Workshop';
        productMap[pName] = (productMap[pName] || 0) + (item.qty || item.quantity || 1);
      });
    });
  }
  const liveTop = Object.entries(productMap).map(([name, s]) => ({ name, sales: s })).sort((a,b)=>b.sales-a.sales).slice(0,5);
  const topProducts = isSales
    ? (liveTop.length > 0 ? liveTop : [{ name: 'Kaca Film', sales: 0 }, { name: 'Coating', sales: 0 }, { name: 'PPF', sales: 0 }])
    : (adminStats?.topProducts && adminStats.topProducts.length > 0 ? adminStats.topProducts : [{ name: 'Kaca Film', sales: 0 }, { name: 'Coating', sales: 0 }, { name: 'PPF', sales: 0 }]);

  const recentOrders = isSales ? salesOrders.slice(0, 5) : (adminStats?.recentOrders || []);


  return (
    <div className="dashboard-container animate-fade-in kreosis-layout">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Operasional</h1>
          <p className="page-subtitle">Ringkasan aktivitas dan performa bengkel hari ini</p>
        </div>
        
        {/* Right side actions - simulating Hostinger Top Nav */}
        <div className="flex items-center gap-4 hidden sm:flex">
          <button className="btn-secondary rounded-full flex items-center gap-2 px-4">
            <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">✨</span>
            Tanya AI
          </button>
          <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center cursor-pointer">
            <Users size={18} className="text-gray-600" />
          </div>
        </div>
      </div>

      <div className="kreosis-grid">
        {/* KOLOM KIRI (70%) */}
        <div className="kreosis-left">
          
          {/* Grafik Utama (Line Chart) */}
          <div className="premium-card kreosis-main-chart">
            <h3 className="font-sans font-semibold mb-4 text-primary">Dynamics of Sales</h3>
            <div style={{ height: '260px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="week" padding={{ left: 30, right: 30 }} tick={{ fontFamily: 'var(--font-sans)', fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontFamily: 'var(--font-sans)', fontSize: 12, fill: '#6b7280' }} width={80} axisLine={false} tickLine={false} tickFormatter={(value) => `Rp ${(value / 1000000)}M`} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4 Blok Statistik */}
          <div className="kreosis-stats-grid mt-6">
            <div className="metric-card">
              <div className="metric-card-left" style={{ maxWidth: '100%' }}>
                <h3 className="metric-card-title">Total Customer</h3>
                <span className="metric-card-value">{totalCustomers}</span>
              </div>
            </div>
            
            <div className="metric-card">
              <div className="metric-card-left" style={{ maxWidth: '100%' }}>
                <h3 className="metric-card-title">Total Order</h3>
                <span className="metric-card-value">{totalOrders}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card-left" style={{ maxWidth: '100%' }}>
                <h3 className="metric-card-title">Transaksi Lunas</h3>
                <span className="metric-card-value" style={{ color: '#10b981' }}>{lunasOrders}</span>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-card-left" style={{ maxWidth: '100%' }}>
                <h3 className="metric-card-title">Transaksi Proses</h3>
                <span className="metric-card-value">{prosesOrders}</span>
              </div>
            </div>
          </div>

          {/* Tabel Customer Terbaru */}
          <div className="premium-card mt-6">
            <div className="customer-table-header">
              <h3 className="font-sans font-semibold text-primary">Daftar Customer Terbaru</h3>
            </div>
            <div className="table-responsive">
              <table className="kreosis-table">
                <thead>
                  <tr>
                    <th>Nama Customer</th>
                    <th>Total Belanja (Amount)</th>
                    <th>Tanggal (Date)</th>
                    <th>Status</th>
                    <th>ID Transaksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const statusVal = (order.paymentStatus || order.status || '').toUpperCase();
                    const isSuccess = statusVal === 'SELESAI' || statusVal === 'LUNAS';
                    
                    return (
                      <tr key={order.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="avatar-placeholder">
                              {order.customerName ? order.customerName.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                              <div className="font-bold text-black">{order.customerName}</div>
                              <div className="text-xs text-gray-500">{order.serviceType || 'Service'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="font-mono-num font-bold">
                          Rp {order.totalPrice ? order.totalPrice.toLocaleString('id-ID') : 0}
                        </td>
                        <td>
                          <div className="font-sans text-sm text-black">
                            {order.date ? format(new Date(order.date), 'MMM dd, yyyy') : '-'}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.date ? format(new Date(order.date), 'hh:mm a') : '-'}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${isSuccess ? 'success' : 'process'}`}>
                            {isSuccess ? 'Lunas / Selesai' : 'Proses'}
                          </span>
                        </td>
                        <td className="text-gray-500 font-mono-ui text-sm">
                          {order.id}
                        </td>
                      </tr>
                    );
                  })}
                  {recentOrders.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-gray-500 text-sm">Belum ada transaksi</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (30%) */}
        <div className="kreosis-right">
          
          <div className="premium-card kreosis-analytics-card h-full flex flex-col">
            <h3 className="font-sans font-semibold mb-4 text-primary">Produk Terlaris</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} margin={{ top: 20, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="name" tick={{fontFamily: 'var(--font-sans)', fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{fontFamily: 'var(--font-sans)', fontSize: 11, fill: '#6b7280'}} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip cursor={{fill: '#F3F4F6'}} formatter={(value) => [`${value} Unit`, 'Total Terjual']} />
                  <Bar dataKey="sales" fill="var(--accent-color)" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
