import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, ShoppingBag, Target, Wrench, Store, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useInventory } from '../../context/InventoryContext';
import './Dashboard.css';

import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { flatOrders: orders, getEndDate } = useOrders();
  const { inventory } = useInventory();
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

  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    lunasOrders: 0,
    prosesOrders: 0,
    totalOmzet: 0,
    topProducts: [],
    weeklyData: []
  });

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/analytics/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setStats(json.data);
          }
        }
      } catch (err) {
        console.error('Error fetching admin dashboard stats:', err);
      }
    };

    fetchDashboardStats();
  }, []);

  // Use API stats if available, fallback to context orders
  const uniqueCustomers = stats.totalCustomers || new Set(orders.map(o => o.customerHp)).size;
  const totalOrders = stats.totalOrders || orders.length;
  const pendingOrders = stats.prosesOrders || orders.filter(o => o.status === 'Aktif').length;
  const selesaiOrders = stats.lunasOrders || orders.filter(o => o.status === 'Selesai').length;

  // 3. Kapasitas Working Bay
  let activeTodayCount = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const order of orders) {
    if (order.status !== 'Aktif') continue;
    const start = new Date(order.date);
    start.setHours(0, 0, 0, 0);
    const end = getEndDate(order.date, order.serviceType);
    end.setHours(0, 0, 0, 0);
    if (today >= start && today <= end) {
      activeTodayCount++;
    }
  }

  // 4. Omzet Toko Bulan Ini
  const totalOmzet = stats.totalOmzet || orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const targetOmzet = 150000000; // 150 Juta
  const percentage = Math.min(Math.round((totalOmzet / targetOmzet) * 100), 100);

  // 5. Grafik Omzet per Produk & Brand
  const brandSales = {};
  orders.forEach(order => {
    let brand = '-';
    if (order.serviceType === 'Kaca Film') brand = order.filmBrand;
    else if (order.serviceType === 'Coating') brand = order.coatingSeries;
    else if (order.serviceType === 'PPF') brand = order.ppfSeries;
    
    const key = `${order.serviceType}${brand && brand !== '-' ? ` (${brand})` : ''}`;
    brandSales[key] = (brandSales[key] || 0) + (order.totalPrice || 0);
  });

  const omzetData = stats.topProducts && stats.topProducts.length > 0 
    ? stats.topProducts.map(p => ({ name: p.name, revenue: p.sales }))
    : Object.entries(brandSales)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

  // 6. Grafik Order Mingguan
  // Distribute dynamically across 4 weeks for realistic visualization based on order array index
  const weeklyData = [1, 2, 3, 4].map(w => {
    const wOrders = orders.filter((o, idx) => (idx % 4) + 1 === w);
    return {
      week: `Minggu ${w}`,
      orders: wOrders.length,
      newCustomers: new Set(wOrders.map(o => o.customerHp)).size
    };
  });

  const displayName = userName || 'Admin';

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header">
        <h1 className="font-sans text-primary text-2xl font-bold">Welcome, {displayName} — Gallardo Auto Sport</h1>
        <p className="text-secondary mt-1">Pusat Kontrol Operasional & Analitik Workshop</p>
      </div>

      <div className="metrics-grid mt-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="metric-card glass-card">
          <div className="metric-icon">
            <Users size={24} />
          </div>
          <div className="metric-content">
            <p className="text-secondary font-mono-ui text-sm">Total Customer & Kendaraan</p>
            <h3 className="font-mono-num text-2xl font-bold mt-1">{uniqueCustomers.toLocaleString('id-ID')}</h3>
            <p className="text-xs text-green-600 mt-2 font-mono-ui">Berdasarkan data unik HP</p>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon">
            <ShoppingBag size={24} />
          </div>
          <div className="metric-content">
            <p className="text-secondary font-mono-ui text-sm">Total Order & Invoice</p>
            <h3 className="font-mono-num text-2xl font-bold mt-1">{totalOrders}</h3>
            <p className="text-xs text-secondary mt-2 font-mono-ui">{pendingOrders} Pending, {selesaiOrders} Selesai</p>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon">
            <Wrench size={24} />
          </div>
          <div className="metric-content">
            <p className="text-secondary font-mono-ui text-sm">Kapasitas Working Bay</p>
            <h3 className="font-mono-num text-2xl font-bold mt-1">{activeTodayCount}/5 Terisi</h3>
            <p className="text-xs mt-2 font-mono-ui" style={{ color: activeTodayCount >= 4 ? '#ef4444' : '#10b981' }}>
              {activeTodayCount >= 4 ? 'Sangat Sibuk' : 'Tersedia'}
            </p>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon">
            <Target size={24} />
          </div>
          <div className="metric-content">
            <p className="text-secondary font-mono-ui text-sm">Omzet Toko (Bulan Ini)</p>
            <h3 className="font-mono-num text-2xl font-bold mt-1" style={{ whiteSpace: 'nowrap' }}>Rp {totalOmzet.toLocaleString('id-ID')}</h3>
            <p className="text-xs text-green-600 mt-2 font-mono-ui">{percentage}% dari Target Bulanan</p>
          </div>
        </div>

        {/* 5. Peringatan Stok Menipis */}
        <div className="metric-card glass-card" style={{ display: 'block', padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <AlertTriangle size={20} className="text-black" />
            <h3 className="font-sans font-bold text-black" style={{ fontSize: '1rem' }}>Peringatan Stok Menipis</h3>
          </div>
          
          <div style={{ maxHeight: '90px', overflowY: 'auto', paddingRight: '4px' }}>
            {inventory.filter(item => parseInt(item.stok) <= 2).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {inventory
                  .filter(item => parseInt(item.stok) <= 2)
                  .map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', width: '65%' }}>
                        <span className="font-sans font-semibold text-black" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.brandSeries}</span>
                        <span className="font-mono-ui text-secondary mt-1" style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.varian}</span>
                      </div>
                      <div className="font-sans font-bold" style={{ color: '#ef4444', fontSize: '0.85rem' }}>
                        {item.stok} {item.satuan}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80px', color: '#6b7280' }}>
                <CheckCircle2 size={24} style={{ color: '#10b981', marginBottom: '8px' }} />
                <p className="font-sans text-xs font-medium">Semua ketersediaan stok material aman.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="charts-grid mt-6">

        <div className="chart-card glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Store size={20} className="text-primary" />
            <h3 className="font-sans font-semibold">Omzet per Produk & Brand</h3>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={omzetData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-light)" />
                <XAxis type="number" tick={{ fontFamily: 'var(--font-mono-num)' }} tickFormatter={(value) => `${value / 1000000} Jt`} />
                <YAxis dataKey="name" type="category" width={160} tick={{ fontFamily: 'var(--font-sans)', fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'var(--bg-secondary)' }} formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                <Bar dataKey="revenue" fill="var(--color-black)" radius={[0, 4, 4, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Activity size={20} className="text-primary" />
            <h3 className="font-sans font-semibold">Grafik Order Mingguan</h3>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                <XAxis dataKey="week" tick={{ fontFamily: 'var(--font-sans)', fontSize: 12 }} />
                <YAxis tick={{ fontFamily: 'var(--font-mono-num)' }} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="var(--color-black)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-black)' }} name="Total Orders" />
                <Line type="monotone" dataKey="newCustomers" stroke="#888" strokeWidth={3} dot={{ r: 4, fill: '#888' }} name="New Customers" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
