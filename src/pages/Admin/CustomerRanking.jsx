import { useState, useEffect, useRef } from 'react';
import { Download, FileText, Search, Trophy, Medal, Award, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';
import { format } from 'date-fns';
import { useOrders } from '../../context/OrderContext';
import { useAuth } from '../../context/AuthContext';
import './CustomerRanking.css';

const CustomerRanking = () => {
  const { token } = useAuth();
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('Semua Transaksi');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const tableRef = useRef(null);
  const { orders } = useOrders();

  const getCustomerHistory = (customerName) => {
    return orders.filter(o => {
      const matchName = (o.customerName || '').toLowerCase() === customerName.toLowerCase();
      let matchYear = true;
      if (yearFilter) {
        const orderYear = new Date(o.date).getFullYear().toString();
        matchYear = orderYear === yearFilter;
      }
      let matchType = true;
      if (transactionTypeFilter !== 'Semua Transaksi') {
        if (transactionTypeFilter === 'Jasa (Workshop)') {
          matchType = o.type === 'WORKSHOP';
        } else if (transactionTypeFilter === 'Retail (Grosir)') {
          matchType = o.type === 'RETAIL';
        }
      }
      return matchName && matchYear && matchType;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const fetchRankings = async () => {
    if (!token) {
      setRankings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (yearFilter) params.append('year', yearFilter);
      if (transactionTypeFilter !== 'Semua Transaksi') params.append('type', transactionTypeFilter);

      const url = `http://31.97.51.101/api/analytics/customer-ranking?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} (Mungkin server belum direstart)`);
      }

      const res = await response.json();
      if (res.success) {
        setRankings(res.data);
      } else {
        toast.error('Gagal mengambil data peringkat customer');
      }
    } catch (error) {
      console.error('Error fetching customer ranking:', error);
      toast.error(`Terjadi kesalahan koneksi server: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [yearFilter, transactionTypeFilter, token]);

  const filteredRankings = rankings.filter(r =>
    r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customerPhone.includes(searchQuery)
  );

  const handleExportExcel = () => {
    if (rankings.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const exportData = filteredRankings.map(r => ({
      'Peringkat': r.rank,
      'Nama Customer / Reseller': r.customerName,
      'No. WhatsApp': r.customerPhone,
      'Total Kuantitas (Roll)': r.totalRoll,
      'Total Pembelian (Omzet)': r.totalOmzet,
      'Jumlah Transaksi': r.transactionCount
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leaderboard');
    XLSX.writeFile(wb, `Customer_Ranking_${yearFilter || 'All_Time'}.xlsx`);
    toast.success('Berhasil mengekspor ke Excel');
  };

  const handleExportPDF = () => {
    if (rankings.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const element = tableRef.current;
    const opt = {
      margin: 1,
      filename: `Customer_Ranking_${yearFilter || 'All_Time'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      toast.success('Berhasil mengekspor ke PDF');
    });
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy color="#facc15" size={24} />; // yellow-400
      case 2: return <Medal color="#9ca3af" size={24} />; // gray-400
      case 3: return <Award color="#d97706" size={24} />; // amber-600
      default: return <span className="rank-text">#{rank}</span>;
    }
  };

  return (
    <div className="ranking-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Leaderboard & Rekap Pembelian</h1>
          <p className="page-subtitle">Peringkat customer berdasarkan total nilai transaksi dan kuantitas produk.</p>
        </div>
        <div className="ranking-actions">
          <button onClick={handleExportExcel} className="btn-primary">
            <Download size={18} /> Export Excel
          </button>
          <button onClick={handleExportPDF} className="btn-secondary">
            <FileText size={18} /> Export PDF
          </button>
        </div>
      </div>

      <div className="ranking-card">
        <div className="ranking-toolbar">
          <div className="search-box">
            <Search size={18} color="#9ca3af" style={{ marginRight: '8px' }} />
            <input
              type="text"
              placeholder="Cari nama atau nomor WA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-box" style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label>Jenis Transaksi:</label>
              <select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
              >
                <option value="Semua Transaksi">Semua Transaksi</option>
                <option value="Jasa (Workshop)">Jasa (Workshop)</option>
                <option value="Retail (Grosir)">Retail (Grosir)</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label>Tahun:</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="">Semua Waktu (All Time)</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>
          </div>
        </div>

        <div className="ranking-table-wrapper" ref={tableRef}>
          {loading ? (
            <div className="empty-state">Memuat data peringkat...</div>
          ) : (
            <table className="ranking-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'center', width: '80px' }}>Peringkat</th>
                  <th>Nama Customer</th>
                  <th>No. WhatsApp</th>
                  <th style={{ textAlign: 'center' }}>Total Roll</th>
                  <th style={{ textAlign: 'right' }}>Total Pembelian</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredRankings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      Belum ada data transaksi yang sesuai filter.
                    </td>
                  </tr>
                ) : (
                  filteredRankings.map((r, idx) => (
                    <tr key={idx}>
                      <td className="rank-badge">
                        {getRankIcon(r.rank)}
                      </td>
                      <td className="customer-info">
                        <div
                          className="name"
                          style={{ cursor: 'pointer', color: '#2563eb', textDecoration: 'underline' }}
                          onClick={() => { setSelectedCustomer(r); setShowHistoryModal(true); }}
                        >
                          {r.customerName}
                        </div>
                        <div className="tx-count">{r.transactionCount} Transaksi</div>
                      </td>
                      <td className="phone-text">
                        {r.customerPhone}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="roll-badge">
                          {r.totalRoll}
                        </span>
                      </td>
                      <td className="omzet-text">
                        {r.totalOmzet.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => { setSelectedCustomer(r); setShowHistoryModal(true); }}
                          className="btn-detail"
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={14} /> Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showHistoryModal && selectedCustomer && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content" style={{ backgroundColor: '#ffffff', color: '#1f2937', maxWidth: '700px', width: '100%', borderRadius: '12px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Riwayat Transaksi: {selectedCustomer.customerName}</h3>
              <button
                onClick={() => { setShowHistoryModal(false); setSelectedCustomer(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '14px', color: '#4b5563' }}>
              <div><strong>No. WhatsApp:</strong> {selectedCustomer.customerPhone}</div>
              <div><strong>Total Pembelian:</strong> {selectedCustomer.totalOmzet.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}</div>
              <div><strong>Total Kuantitas:</strong> {selectedCustomer.totalRoll} Roll ({selectedCustomer.transactionCount} Transaksi)</div>
            </div>

            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '10px 12px' }}>No. Invoice</th>
                    <th style={{ padding: '10px 12px' }}>Tanggal</th>
                    <th style={{ padding: '10px 12px' }}>Daftar Produk (Qty)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {getCustomerHistory(selectedCustomer.customerName).length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                        Tidak ada riwayat transaksi yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    getCustomerHistory(selectedCustomer.customerName).map((trx, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '10px 12px', fontWeight: '600', color: '#2563eb' }}>{trx.id}</td>
                        <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                          {format(new Date(trx.date), 'dd/MM/yyyy')}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {trx.items && trx.items.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {trx.items.map((item, itemIdx) => (
                                <div key={itemIdx}>
                                  • {item.name} (x{item.qty})
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span>{trx.service}</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>
                          {trx.totalPrice.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
              <button
                onClick={() => { setShowHistoryModal(false); setSelectedCustomer(null); }}
                className="btn-excel"
                style={{ padding: '8px 16px', backgroundColor: '#4b5563', color: '#ffffff', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRanking;
