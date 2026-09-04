import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { ChevronRight, Wrench, X, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
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
        <div style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
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
        const res = await fetch(window.API_URL + '/api/analytics/dashboard', {
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

  const [maintenanceConfig, setMaintenanceConfig] = useState({
    isActive: false,
    message: '',
    estimatedEnd: ''
  });
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);

  const fetchMaintenance = async () => {
    try {
      const res = await fetch((window.API_URL || '') + '/api/system/maintenance', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMaintenanceConfig(json.data);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  const handleSaveMaintenance = async (e) => {
    e.preventDefault();
    setIsSavingMaintenance(true);
    try {
      const res = await fetch((window.API_URL || '') + '/api/system/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(maintenanceConfig)
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Status maintenance berhasil diperbarui');
        setMaintenanceConfig(json.data);
        setIsMaintenanceModalOpen(false);
      } else {
        toast.error(json.message || 'Gagal menyimpan status maintenance');
      }
    } catch (err) {
      toast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setIsSavingMaintenance(false);
    }
  };

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

  const lowStockCount = inventory.filter(item => {
    if (!item) return false;
    if (item.kategori === 'Tools & Equipment') {
      return item.stokUtama <= 2;
    }
    return item.stokUtama < 1;
  }).length;

  const displayName = userName || 'Admin';

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Halo, {displayName} 👋</h1>
          <p className="page-subtitle">Admin Workspace - Pusat kendali operasional, order masuk, dan penugasan</p>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setIsMaintenanceModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              border: maintenanceConfig.isActive ? '1.5px solid #ef4444' : '1px solid #d1d5db',
              backgroundColor: maintenanceConfig.isActive ? '#fef2f2' : '#ffffff',
              color: maintenanceConfig.isActive ? '#dc2626' : '#374151',
              boxShadow: maintenanceConfig.isActive ? '0 0 10px rgba(239, 68, 68, 0.25)' : '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: maintenanceConfig.isActive ? '#ef4444' : '#10b981',
              boxShadow: maintenanceConfig.isActive ? '0 0 8px #ef4444' : 'none'
            }} />
            <Wrench size={15} />
            <span>{maintenanceConfig.isActive ? 'Mode Maintenance: ON' : 'Mode Maintenance: OFF'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mt-6">

        <div className="metric-card lg:col-span-2">
          <div className="metric-card-left">
            <h3 className="metric-card-title">Total Customer <ChevronRight size={14} /></h3>
            <span className="metric-card-value">{uniqueCustomers.toLocaleString('id-ID')}</span>
            <span className="metric-card-sub">Berdasarkan data unik HP</span>
          </div>
          <div className="metric-card-right">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <Line type="monotone" dataKey="newCustomers" stroke="#4F46E5" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card lg:col-span-2">
          <div className="metric-card-left">
            <h3 className="metric-card-title">Total Order <ChevronRight size={14} /></h3>
            <span className="metric-card-value">{totalOrders}</span>
            <span className="metric-card-sub">{pendingOrders} Pending, {selesaiOrders} Selesai</span>
          </div>
          <div className="metric-card-right">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <Line type="monotone" dataKey="orders" stroke="#4F46E5" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card lg:col-span-2">
          <div className="metric-card-left">
            <h3 className="metric-card-title">Working Bay <ChevronRight size={14} /></h3>
            <span className="metric-card-value">{activeTodayCount}/5</span>
            <span className="metric-card-sub" style={{ color: activeTodayCount >= 4 ? '#ef4444' : '#6b7280' }}>
              {activeTodayCount >= 4 ? 'Kapasitas Penuh' : 'Tersedia'}
            </span>
          </div>
          <div className="metric-card-right">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: activeTodayCount }, { value: 5 - activeTodayCount }]} dataKey="value" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} stroke="none">
                  <Cell fill={activeTodayCount >= 4 ? '#ef4444' : '#4F46E5'} />
                  <Cell fill="#f3f4f6" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card lg:col-span-3">
          <div className="metric-card-left">
            <h3 className="metric-card-title">Omzet Toko <ChevronRight size={14} /></h3>
            <span className="metric-card-value" style={{ fontSize: '1.25rem' }}>Rp {totalOmzet.toLocaleString('id-ID')}</span>
            <span className="metric-card-sub">{percentage}% dari Target</span>
          </div>
          <div className="metric-card-right">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={[{ value: percentage }, { value: 100 - percentage }]} dataKey="value" innerRadius={18} outerRadius={26} startAngle={90} endAngle={-270} stroke="none">
                  <Cell fill="#4F46E5" />
                  <Cell fill="#f3f4f6" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="metric-card lg:col-span-3">
          <div className="metric-card-left" style={{ maxWidth: '100%' }}>
            <h3 className="metric-card-title">Status Stok <ChevronRight size={14} /></h3>
            {lowStockCount > 0 ? (
              <span className="metric-card-value" style={{ color: '#ef4444' }}>
                {lowStockCount} Menipis
              </span>
            ) : (
              <span className="metric-card-value" style={{ color: '#10b981' }}>Aman</span>
            )}
            <span className="metric-card-sub">
              {lowStockCount > 0 ? 'Segera lakukan restock material' : 'Semua ketersediaan stok material aman'}
            </span>
          </div>
        </div>

      </div>

      <div className="charts-grid mt-6">

        <div className="chart-card premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <h3 className="font-sans font-semibold text-gray-800" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>Omzet per Produk & Brand <ChevronRight size={16} color="#6b7280" /></h3>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={omzetData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}Jt`} />
                <Tooltip cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
            <h3 className="font-sans font-semibold text-gray-800" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>Grafik Order Mingguan <ChevronRight size={16} color="#6b7280" /></h3>
          </div>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Area type="monotone" dataKey="orders" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorOrders)" name="Total Orders" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modal Pengaturan Maintenance */}
      {isMaintenanceModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '18px 24px',
              borderBottom: '1px solid #f3f4f6',
              backgroundColor: maintenanceConfig.isActive ? '#fef2f2' : '#f9fafb'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: maintenanceConfig.isActive ? '#fee2e2' : '#e0e7ff',
                  color: maintenanceConfig.isActive ? '#dc2626' : '#4f46e5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#111827' }}>
                    Kontrol Mode Maintenance
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#6b7280' }}>
                    Atur status banner peringatan sistem secara global
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMaintenanceModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveMaintenance} style={{ padding: '24px' }}>
              {/* Toggle Switch */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
                backgroundColor: maintenanceConfig.isActive ? '#fef2f2' : '#f8fafc',
                border: maintenanceConfig.isActive ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                borderRadius: '10px',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.95rem', color: maintenanceConfig.isActive ? '#b91c1c' : '#1e293b' }}>
                    Status Banner: {maintenanceConfig.isActive ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    {maintenanceConfig.isActive 
                      ? 'Banner merah akan tampil di bagian atas layar semua user'
                      : 'Sistem beroperasi normal tanpa banner peringatan'}
                  </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={maintenanceConfig.isActive}
                    onChange={(e) => setMaintenanceConfig(prev => ({ ...prev, isActive: e.target.checked }))}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: maintenanceConfig.isActive ? '#dc2626' : '#cbd5e1',
                    borderRadius: '26px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      height: '20px',
                      width: '20px',
                      left: maintenanceConfig.isActive ? '25px' : '3px',
                      bottom: '3px',
                      backgroundColor: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }} />
                  </span>
                </label>
              </div>

              {/* Input Pesan */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Pesan Peringatan untuk User:
                </label>
                <textarea
                  rows={3}
                  value={maintenanceConfig.message || ''}
                  onChange={(e) => setMaintenanceConfig(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Contoh: Sistem POS sedang dalam pemeliharaan database. Mohon simpan transaksi Anda."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Input Estimasi Waktu */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                  Estimasi Selesai (Opsional):
                </label>
                <input
                  type="text"
                  value={maintenanceConfig.estimatedEnd || ''}
                  onChange={(e) => setMaintenanceConfig(prev => ({ ...prev, estimatedEnd: e.target.value }))}
                  placeholder="Contoh: Hari ini pukul 18:00 WIB"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsMaintenanceModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    border: '1px solid #d1d5db',
                    backgroundColor: '#ffffff',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingMaintenance}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: maintenanceConfig.isActive ? '#dc2626' : '#111827',
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSavingMaintenance ? 'Menyimpan...' : (
                    <>
                      <Check size={16} />
                      <span>Simpan & Terapkan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
