import { Trophy, Download } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import '../Dashboard/Dashboard.css';

const AdminSalesPerformance = () => {
  const { flatOrders: orders} = useOrders();

  const getBrandInfo = (order) => {
    if (order.serviceType === 'Kaca Film') {
      let brandStr = order.filmBrand;
      let typeStr = ((order.filmDarkness || '') + (order.filmVariation ? ` (${order.filmVariation})` : '')).trim();
      
      // Fallback: ekstrak dari nama produk jika belum ada di state order
      if (!brandStr || brandStr === '-') {
         const pName = (order.service || '').toUpperCase();
         if (pName.includes('PERFORMANTE')) brandStr = 'Performante';
         else if (pName.includes('DELUXE')) brandStr = 'Deluxe';
         else brandStr = '-';
      }

      return {
        brand: brandStr || '-',
        type: typeStr || '-'
      };
    } else if (order.serviceType === 'Coating') {
      return {
        brand: order.coatingSeries || order.service?.includes('Rantiz') ? 'Rantiz' : '-',
        type: '-'
      };
    } else if (order.serviceType === 'PPF') {
      return {
        brand: order.ppfSeries || order.service?.includes('Vansgard') ? 'Vansgard' : '-',
        type: '-'
      };
    }
    return { brand: '-', type: '-' };
  };
  
  const calculateSummaries = () => {
    const salesData = {};
    const locationData = {};

    orders.forEach(order => {
      // 1. Sales Data
      const pic = order.spgName || 'Internal Sales';
      if (!salesData[pic]) {
        salesData[pic] = { count: 0, revenue: 0, services: new Set() };
      }
      salesData[pic].count += 1;
      salesData[pic].revenue += (order.totalPrice || 0);
      
      const brandInfo = getBrandInfo(order);
      let serviceBrand = order.serviceType;
      if (brandInfo.brand !== '-') {
        serviceBrand += ` (${brandInfo.brand})`;
      }
      salesData[pic].services.add(serviceBrand);

      // 2. Location Data
      const loc = order.location || 'Gallardo';
      if (!locationData[loc]) {
        locationData[loc] = { count: 0, revenue: 0 };
      }
      locationData[loc].count += 1;
      locationData[loc].revenue += (order.totalPrice || 0);
    });

    const sortedSales = Object.entries(salesData).map(([name, data]) => ({
      name,
      ...data,
      services: Array.from(data.services).join(', ')
    })).sort((a, b) => b.count - a.count || b.revenue - a.revenue);

    const sortedLocations = Object.entries(locationData).map(([name, data]) => ({
      name,
      ...data
    })).sort((a, b) => b.count - a.count || b.revenue - a.revenue);

    return {
      totalCount: orders.length,
      sales: sortedSales,
      locations: sortedLocations
    };
  };

  const summary = calculateSummaries();
  
  const handleExportPDF = () => {
    const element = document.getElementById('pdf-sales-report');
    if (!element) return;
    
    element.style.display = 'block';

    const timestamp = format(new Date(), 'HHmmss');
    const opt = {
      margin:       10,
      filename:     `Laporan_Performa_Sales_${format(new Date(), 'dd_MM_yyyy')}_${timestamp}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
    });
  };

  return (
    <div className="dashboard-container animate-fade-in" style={{ fontFamily: '"Montserrat", sans-serif' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Performa & Target Sales (Closing)</h1>
          <p className="page-subtitle">Pantau pencapaian omset, komisi, dan target SPG / Sales harian.</p>
        </div>
        <button 
          onClick={handleExportPDF}
          className="btn-primary" 
          style={{ backgroundColor: '#111', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: '"Montserrat", sans-serif' }}
        >
          <Download size={18} />
          <span className="text-sm font-semibold">Export PDF</span>
        </button>
      </div>

      <div className="chart-card premium-card" style={{ padding: '24px 32px' }}>
        <div className="flex items-center gap-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Trophy size={20} className="text-primary" />
          <h3 className="font-semibold" style={{ fontFamily: '"Montserrat", sans-serif' }}>Laporan Performa Penjualan Sales</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Top Closing Sales</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Kategori Penjualan</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Layanan & Brand</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Lokasi / Cabang</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Nilai transaksi</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const brandInfo = getBrandInfo(order);
                const layananBrand = `${order.serviceType}${brandInfo.brand !== '-' ? ` (${brandInfo.brand})` : ''}`;
                const hasCustomPrice = order.items && order.items.some(i => i.isCustomPrice);
                return (
                <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px 20px', fontWeight: '600' }}>{order.spgName || 'Internal Sales'}</td>
                  <td style={{ padding: '16px 20px' }}>{order.billType || 'Walk-In (Workshop)'}</td>
                  <td style={{ padding: '16px 20px' }}>{layananBrand}</td>
                  <td style={{ padding: '16px 20px' }}>{order.location || 'Gallardo'}</td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      backgroundColor: order.status === 'Selesai' ? '#dcfce7' : order.status === 'Aktif' ? '#dbeafe' : '#fef3c7', 
                      color: order.status === 'Selesai' ? '#15803d' : order.status === 'Aktif' ? '#1d4ed8' : '#d97706', 
                      borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' 
                    }}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '600' }}>
                    Rp {(order.totalPrice || 0).toLocaleString('id-ID')}
                    {hasCustomPrice && <div style={{ fontSize: '10px', color: '#ea580c', marginTop: '2px', fontWeight: 'bold' }}>*Harga Custom</div>}
                  </td>
                </tr>
                );
              })}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>Belum ada data closing sales.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SUMMARY TABLES */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '32px' }}>
        
        {/* Table 1: Top Closing Sales */}
        <div className="chart-card premium-card" style={{ padding: '24px 32px' }}>
          <h3 className="font-bold text-lg text-black mb-4" style={{ fontFamily: '"Montserrat", sans-serif', borderBottom: '2px solid #f3f4f6', paddingBottom: '12px' }}>
            Top Closing Sales
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', width: '50px' }}>No</th>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Nama Sales</th>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', textAlign: 'center' }}>Jumlah Closing</th>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Layanan & Brand</th>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Nilai Transaksi Akumulasi</th>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Kontribusi (%)</th>
                </tr>
              </thead>
              <tbody>
                {summary.sales.map((item, idx) => {
                  const percent = summary.totalCount > 0 ? Math.round((item.count / summary.totalCount) * 100) : 0;
                  return (
                    <tr key={item.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '16px 20px', fontWeight: '600', color: '#111' }}>{idx + 1}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 'bold', color: '#111' }}>{item.name}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '600' }}>{item.count}</td>
                      <td style={{ padding: '16px 20px', color: '#4b5563', maxWidth: '300px', lineHeight: '1.4' }}>{item.services}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 'bold' }}>Rp {item.revenue.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '600', color: '#111' }}>{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Top Lokasi / Cabang */}
        <div className="chart-card premium-card" style={{ padding: '24px 32px' }}>
          <h3 className="font-bold text-lg text-black mb-4" style={{ fontFamily: '"Montserrat", sans-serif', borderBottom: '2px solid #f3f4f6', paddingBottom: '12px' }}>
            Top Lokasi / Cabang
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', width: '50px' }}>No</th>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Lokasi / Cabang</th>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', textAlign: 'center' }}>Total Pengerjaan</th>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Total Omzet Lokasi</th>
                  <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Kontribusi (%)</th>
                </tr>
              </thead>
              <tbody>
                {summary.locations.map((item, idx) => {
                  const percent = summary.totalCount > 0 ? Math.round((item.count / summary.totalCount) * 100) : 0;
                  return (
                    <tr key={item.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '16px 20px', fontWeight: '600', color: '#111' }}>{idx + 1}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 'bold', color: '#111' }}>{item.name}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '600' }}>{item.count}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 'bold' }}>Rp {item.revenue.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: '600', color: '#111' }}>{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Hidden Print Layout for PDF Export */}
      <div id="pdf-sales-report" style={{ display: 'none', padding: '40px', backgroundColor: '#fff', color: '#000', fontFamily: '"Montserrat", sans-serif' }}>
        <div style={{ borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '2px' }}>Laporan Performa Penjualan Sales</h1>
          <p style={{ margin: 0, color: '#4b5563', fontSize: '14px' }}>Dicetak pada: {format(new Date(), "dd MMMM yyyy HH:mm")}</p>
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left', marginBottom: '40px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Top Closing Sales</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Kategori Penjualan</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Layanan & Brand</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Lokasi / Cabang</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Status</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold', textAlign: 'right' }}>Nilai transaksi</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => {
              const brandInfo = getBrandInfo(order);
              const layananBrand = `${order.serviceType}${brandInfo.brand !== '-' ? ` (${brandInfo.brand})` : ''}`;
              return (
              <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>{order.spgName || 'Internal Sales'}</td>
                <td style={{ padding: '8px 4px' }}>{order.billType || 'Walk-In (Workshop)'}</td>
                <td style={{ padding: '8px 4px' }}>{layananBrand}</td>
                <td style={{ padding: '8px 4px' }}>{order.location || 'Gallardo'}</td>
                <td style={{ padding: '8px 4px' }}>{order.status}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>Rp {(order.totalPrice || 0).toLocaleString('id-ID')}</td>
              </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>Belum ada data closing sales.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* PDF SUMMARY TABLES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', pageBreakInside: 'avoid' }}>
          
          <div>
            <h4 style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 12px 0', borderBottom: '1px solid #000', paddingBottom: '8px', textTransform: 'uppercase' }}>Top Closing Sales</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold', width: '30px' }}>No</th>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold' }}>Nama Sales</th>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold', textAlign: 'center' }}>Jumlah Closing</th>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold' }}>Layanan & Brand</th>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold', textAlign: 'right' }}>Nilai Transaksi</th>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold', textAlign: 'right' }}>Kontribusi</th>
                </tr>
              </thead>
              <tbody>
                {summary.sales.map((item, idx) => {
                  const percent = summary.totalCount > 0 ? Math.round((item.count / summary.totalCount) * 100) : 0;
                  return (
                    <tr key={item.name} style={{ borderBottom: '1px solid #ccc' }}>
                      <td style={{ padding: '6px 4px' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 4px', fontWeight: 'bold' }}>{item.name}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.count}</td>
                      <td style={{ padding: '6px 4px' }}>{item.services}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>Rp {item.revenue.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right' }}>{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <h4 style={{ fontWeight: 'bold', fontSize: '14px', margin: '0 0 12px 0', borderBottom: '1px solid #000', paddingBottom: '8px', textTransform: 'uppercase' }}>Top Lokasi / Cabang</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold', width: '30px' }}>No</th>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold' }}>Lokasi / Cabang</th>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold', textAlign: 'center' }}>Total Pengerjaan</th>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold', textAlign: 'right' }}>Total Omzet</th>
                  <th style={{ padding: '6px 4px', fontWeight: 'bold', textAlign: 'right' }}>Kontribusi</th>
                </tr>
              </thead>
              <tbody>
                {summary.locations.map((item, idx) => {
                  const percent = summary.totalCount > 0 ? Math.round((item.count / summary.totalCount) * 100) : 0;
                  return (
                    <tr key={item.name} style={{ borderBottom: '1px solid #ccc' }}>
                      <td style={{ padding: '6px 4px' }}>{idx + 1}</td>
                      <td style={{ padding: '6px 4px', fontWeight: 'bold' }}>{item.name}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'center' }}>{item.count}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right', fontWeight: 'bold' }}>Rp {item.revenue.toLocaleString('id-ID')}</td>
                      <td style={{ padding: '6px 4px', textAlign: 'right' }}>{percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSalesPerformance;
