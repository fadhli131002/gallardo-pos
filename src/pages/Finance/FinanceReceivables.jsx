import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  Search, Eye, X, Image as ImageIcon, Download, ChevronLeft, ChevronRight, 
  Filter, Plus, Printer, MoreHorizontal, Shield, Calendar, AlertTriangle, 
  Clock, CheckCircle2, AlertCircle, TrendingUp, RotateCcw
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatRupiah';
import { formatTransactionId } from '../../utils/formatId';
import { exportToCSV } from '../../utils/exportCSV';
import PrintWarrantyHandler, { hasWarranty } from '../../components/PrintWarrantyHandler';
import DueAlertBanner from '../../components/DueAlertBanner';

/**
 * Helper: Parse termin_schedule yang bisa berupa JSON string atau date string biasa
 */
const parseTerminDate = (terminStr) => {
  if (!terminStr) return null;
  try {
    const parsed = JSON.parse(terminStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const dates = parsed.map(t => new Date(t.date)).filter(d => !isNaN(d));
      if (dates.length > 0) return dates[dates.length - 1];
    }
    if (typeof parsed === 'string') {
      const d = new Date(parsed);
      if (!isNaN(d)) return d;
    }
  } catch (_) {
    const d = new Date(terminStr);
    if (!isNaN(d)) return d;
  }
  return null;
};

/**
 * Helper: Hitung kategori aging berdasarkan termin_schedule
 * Acuan: tanggal termin_schedule (jatuh tempo), BUKAN created_at
 */
const calculateAging = (terminStr) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const terminDate = parseTerminDate(terminStr);
  
  if (!terminDate) {
    return { category: 'current', daysOverdue: 0, terminDate: null };
  }
  
  const daysOverdue = Math.floor((now - terminDate) / (1000 * 60 * 60 * 24));
  if (daysOverdue <= 0)  return { category: 'current', daysOverdue: 0, terminDate };
  if (daysOverdue <= 30) return { category: '1-30', daysOverdue, terminDate };
  if (daysOverdue <= 60) return { category: '31-60', daysOverdue, terminDate };
  return { category: 'bad_debt', daysOverdue, terminDate };
};

const FinanceReceivables = () => {
  const [receivables, setReceivables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [agingFilter, setAgingFilter] = useState('Semua'); // 'Semua' | 'current' | '1-30' | '31-60' | 'bad_debt'
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedPrintWarranty, setSelectedPrintWarranty] = useState(null);
  const [isPrintWarrantyOpen, setIsPrintWarrantyOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReceivables();
  }, []);

  const fetchReceivables = async () => {
    try {
      setLoading(true);
      const base = window.API_URL || '';
      let rawData = [];
      
      try {
        const res = await fetch(`${base}/api/finance/receivables-aging`);
        if (res.ok) {
          const json = await res.json();
          rawData = json.data || (Array.isArray(json) ? json : []);
        } else {
          throw new Error('Endpoint aging belum aktif');
        }
      } catch (_) {
        const fallbackRes = await fetch(`${base}/api/finance/receivables`);
        if (!fallbackRes.ok) throw new Error('Gagal memuat daftar piutang');
        rawData = await fallbackRes.json();
      }

      // Pastikan setiap transaksi memiliki data aging yang seragam
      const enriched = (Array.isArray(rawData) ? rawData : []).map(r => {
        if (r.aging_category && r.days_overdue !== undefined) {
          return {
            ...r,
            termin_date_obj: r.termin_date ? new Date(r.termin_date) : parseTerminDate(r.termin_schedule)
          };
        }
        const { category, daysOverdue, terminDate } = calculateAging(r.termin_schedule);
        return {
          ...r,
          aging_category: category,
          days_overdue: daysOverdue,
          termin_date_obj: terminDate
        };
      });

      setReceivables(enriched);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Kalkulasi statistik aging schedule
  const agingStats = useMemo(() => {
    const stats = {
      total: 0,
      current: { count: 0, amount: 0 },
      '1-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      bad_debt: { count: 0, amount: 0 }
    };

    receivables.forEach(r => {
      const sisa = Number(r.sisa_tagihan) || 0;
      stats.total += sisa;
      const cat = r.aging_category || 'current';
      if (stats[cat]) {
        stats[cat].count += 1;
        stats[cat].amount += sisa;
      }
    });

    return stats;
  }, [receivables]);

  // Filter gabungan (Search + Status + Aging)
  const filteredReceivables = receivables.filter(r => {
    const formattedId = formatTransactionId(r).toLowerCase();
    const matchesSearch = 
      (r.customer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      formattedId.includes(searchTerm.toLowerCase()) ||
      (r.plate_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'Semua' || 
      r.status_pembayaran.toLowerCase() === statusFilter.toLowerCase();
    
    const matchesAging = 
      agingFilter === 'Semua' || 
      r.aging_category === agingFilter;

    return matchesSearch && matchesStatus && matchesAging;
  });

  const totalPages = Math.ceil(filteredReceivables.length / itemsPerPage);
  const paginatedData = filteredReceivables.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatTanggal = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d)) return null;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getAgingLabel = (cat) => {
    switch (cat) {
      case 'current': return 'Belum Jatuh Tempo';
      case '1-30': return '1-30 Hari';
      case '31-60': return '31-60 Hari';
      case 'bad_debt': return 'Macet (>60 Hari)';
      default: return cat;
    }
  };

  const handleExport = () => {
    const headers = ['ID TRX', 'Pelanggan', 'Mobil / Plat', 'Total Transaksi', 'Sisa Tagihan', 'Jatuh Tempo (Termin)', 'Kategori Aging', 'Hari Menunggak', 'Status Pembayaran'];
    const data = filteredReceivables.map(tx => [
      formatTransactionId(tx),
      tx.customer_name || 'Tanpa Nama',
      `${tx.car_brand || ''} ${tx.car_model || ''} (${tx.plate_number || '-'})`.trim(),
      tx.total_amount,
      tx.sisa_tagihan,
      tx.termin_date_obj ? formatTanggal(tx.termin_date_obj) : 'Tanpa Termin',
      getAgingLabel(tx.aging_category),
      tx.days_overdue || 0,
      tx.status_pembayaran
    ]);
    exportToCSV(data, headers, `Laporan_Aging_Piutang_${new Date().getTime()}`);
  };

  return (
    <div className="h-full flex flex-col space-y-5">
      {/* Page Header */}
      <div className="text-left">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Piutang & Aging Schedule</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pantau sisa tagihan pelanggan berdasarkan umur piutang sesuai kesepakatan tanggal jatuh tempo (termin).
        </p>
      </div>

      {/* Due Alert Banner (H-3 Termin Alert) */}
      <DueAlertBanner />

      {/* ── AGING SCHEDULE PANEL ────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Aging Schedule Piutang</h2>
              <p className="text-xs text-gray-500">
                Total Piutang Berjalan: <span className="font-semibold text-gray-900">{formatRupiah(agingStats.total)}</span>
              </p>
            </div>
          </div>
          {agingFilter !== 'Semua' && (
            <button
              onClick={() => setAgingFilter('Semua')}
              className="self-start sm:self-auto flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filter Aging ({getAgingLabel(agingFilter)})
            </button>
          )}
        </div>

        {/* 4 Aging Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Belum Jatuh Tempo (Current) */}
          <div
            onClick={() => setAgingFilter(agingFilter === 'current' ? 'Semua' : 'current')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              agingFilter === 'current'
                ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-sm'
                : 'bg-gray-50/70 hover:bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Belum Jatuh Tempo
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {agingStats.current.count} trx
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 tracking-tight">
              {formatRupiah(agingStats.current.amount)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Sesuai kesepakatan termin</p>
          </div>

          {/* 2. 1–30 Hari */}
          <div
            onClick={() => setAgingFilter(agingFilter === '1-30' ? 'Semua' : '1-30')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              agingFilter === '1-30'
                ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 shadow-sm'
                : 'bg-gray-50/70 hover:bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                Menunggak 1–30 Hari
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {agingStats['1-30'].count} trx
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 tracking-tight">
              {formatRupiah(agingStats['1-30'].amount)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Keterlambatan ringan</p>
          </div>

          {/* 3. 31–60 Hari */}
          <div
            onClick={() => setAgingFilter(agingFilter === '31-60' ? 'Semua' : '31-60')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              agingFilter === '31-60'
                ? 'bg-orange-50/80 border-orange-400 ring-2 ring-orange-500/20 shadow-sm'
                : 'bg-gray-50/70 hover:bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-orange-800 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Menunggak 31–60 Hari
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                {agingStats['31-60'].count} trx
              </span>
            </div>
            <div className="text-lg font-bold text-gray-900 tracking-tight">
              {formatRupiah(agingStats['31-60'].amount)}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">Perlu peringatan resmi</p>
          </div>

          {/* 4. Macet / Bad Debt (>60 Hari) */}
          <div
            onClick={() => setAgingFilter(agingFilter === 'bad_debt' ? 'Semua' : 'bad_debt')}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              agingFilter === 'bad_debt'
                ? 'bg-rose-50/90 border-rose-400 ring-2 ring-rose-500/20 shadow-sm'
                : 'bg-gray-50/70 hover:bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Macet (&gt;60 Hari)
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                {agingStats.bad_debt.count} trx
              </span>
            </div>
            <div className="text-lg font-bold text-rose-700 tracking-tight">
              {formatRupiah(agingStats.bad_debt.amount)}
            </div>
            <p className="text-[11px] text-rose-600 font-medium mt-1">Kritis · Potensi Bad Debt</p>
          </div>
        </div>

        {/* Visual Distribution Bar */}
        {agingStats.total > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center text-xs text-gray-500 mb-1.5">
              <span>Distribusi Risiko Portofolio Piutang</span>
              <span>
                {((agingStats.current.amount / agingStats.total) * 100).toFixed(0)}% Lancar ·{' '}
                {(((agingStats['1-30'].amount + agingStats['31-60'].amount + agingStats.bad_debt.amount) / agingStats.total) * 100).toFixed(0)}% Menunggak
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(agingStats.current.amount / agingStats.total) * 100}%` }}
                className="bg-emerald-500 hover:opacity-90 transition-all"
                title={`Belum Jatuh Tempo: ${formatRupiah(agingStats.current.amount)}`}
              />
              <div
                style={{ width: `${(agingStats['1-30'].amount / agingStats.total) * 100}%` }}
                className="bg-amber-400 hover:opacity-90 transition-all"
                title={`1-30 Hari: ${formatRupiah(agingStats['1-30'].amount)}`}
              />
              <div
                style={{ width: `${(agingStats['31-60'].amount / agingStats.total) * 100}%` }}
                className="bg-orange-500 hover:opacity-90 transition-all"
                title={`31-60 Hari: ${formatRupiah(agingStats['31-60'].amount)}`}
              />
              <div
                style={{ width: `${(agingStats.bad_debt.amount / agingStats.total) * 100}%` }}
                className="bg-rose-600 hover:opacity-90 transition-all"
                title={`Macet >60 Hari: ${formatRupiah(agingStats.bad_debt.amount)}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── TOOLBAR & FILTERS ───────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari Pelanggan, Plat Nomor, atau ID TRX..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm outline-none transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="relative w-full sm:w-44 flex-shrink-0">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-500 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Semua">Semua Status</option>
              <option value="Belum Bayar">Belum Lunas</option>
              <option value="DP">DP / Sebagian</option>
            </select>
          </div>

          {/* Aging Filter Dropdown */}
          <div className="relative w-full sm:w-52 flex-shrink-0">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500 w-4 h-4" />
            <select
              value={agingFilter}
              onChange={(e) => setAgingFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Semua">Semua Aging</option>
              <option value="current">Belum Jatuh Tempo</option>
              <option value="1-30">Menunggak 1–30 Hari</option>
              <option value="31-60">Menunggak 31–60 Hari</option>
              <option value="bad_debt">Macet (&gt;60 Hari)</option>
            </select>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button 
            onClick={handleExport}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm relative group"
            title="Unduh Data Piutang & Aging Schedule (CSV)"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── TABLE PIUTANG & AGING ───────────────────────────────────────── */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">ID TRX</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Pelanggan</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Total Transaksi</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Sisa Tagihan</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Jatuh Tempo</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Umur Piutang</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="py-3.5 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">Memuat data piutang & aging schedule...</td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500">
                    Tidak ada data piutang yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedData.map((tx) => {
                  const isBadDebt = tx.aging_category === 'bad_debt';
                  const isOverdue3160 = tx.aging_category === '31-60';
                  const isOverdue130 = tx.aging_category === '1-30';

                  const rowClass = isBadDebt
                    ? 'bg-rose-50/30 hover:bg-rose-50/70 border-l-4 border-l-rose-500'
                    : isOverdue3160
                    ? 'bg-orange-50/20 hover:bg-orange-50/60 border-l-4 border-l-orange-400'
                    : isOverdue130
                    ? 'hover:bg-amber-50/30 border-l-4 border-l-amber-400'
                    : 'hover:bg-gray-50/80 border-l-4 border-l-emerald-400';

                  return (
                    <tr key={tx.id} className={`${rowClass} transition-colors group`}>
                      {/* ID TRX */}
                      <td className="py-3 px-5 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatTransactionId(tx)}
                      </td>

                      {/* Pelanggan */}
                      <td className="py-3 px-5 text-sm text-gray-700">
                        <div className="font-medium text-gray-900">{tx.customer_name || 'Tanpa Nama'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {tx.car_brand} {tx.car_model} {tx.plate_number ? `· ${tx.plate_number}` : ''}
                        </div>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-5 text-sm text-gray-700 whitespace-nowrap">
                        {formatRupiah(tx.total_amount)}
                      </td>

                      {/* Sisa Tagihan */}
                      <td className="py-3 px-5 text-sm font-bold text-red-700 whitespace-nowrap">
                        {formatRupiah(tx.sisa_tagihan)}
                      </td>

                      {/* Jatuh Tempo (termin_schedule) */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        {tx.termin_date_obj ? (
                          <div className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatTanggal(tx.termin_date_obj)}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Tanpa Termin</span>
                        )}
                      </td>

                      {/* Umur Piutang (Aging Status) */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        {isBadDebt && (
                          <span className="px-2.5 py-1 inline-flex items-center gap-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Macet (+{tx.days_overdue} hr)
                          </span>
                        )}
                        {isOverdue3160 && (
                          <span className="px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                            <Clock className="w-3 h-3 text-orange-600" />
                            Lewat {tx.days_overdue} hari
                          </span>
                        )}
                        {isOverdue130 && (
                          <span className="px-2.5 py-1 inline-flex items-center gap-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Lewat {tx.days_overdue} hari
                          </span>
                        )}
                        {!isBadDebt && !isOverdue3160 && !isOverdue130 && (
                          <span className="px-2.5 py-1 inline-flex items-center gap-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Belum Jatuh Tempo
                          </span>
                        )}
                      </td>

                      {/* Status Pembayaran */}
                      <td className="py-3 px-5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${
                          tx.status_pembayaran.toLowerCase().includes('dp') || tx.status_pembayaran.toLowerCase().includes('sebagian')
                            ? 'bg-amber-100 text-amber-800 border-amber-200' 
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {tx.status_pembayaran}
                        </span>
                      </td>

                      {/* Aksi */}
                      <td className="py-3 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            onClick={() => setSelectedTransaction(tx)}
                            title="Lihat Bukti"
                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { const cleanId = String(tx.id).replace(/\//g, '-'); window.open(`/sales/invoices/print/${cleanId}`, '_blank'); }}
                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            title="Cetak Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {hasWarranty(tx) && (
                            <button
                              onClick={() => { setSelectedPrintWarranty(tx); setIsPrintWarrantyOpen(true); }}
                              title="Cetak Garansi"
                              className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                            >
                              <Shield className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            title="Lainnya"
                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {!loading && filteredReceivables.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
            <span className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-gray-900">{Math.min(currentPage * itemsPerPage, filteredReceivables.length)}</span> of <span className="font-medium text-gray-900">{filteredReceivables.length}</span> items
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-gray-700 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Proof Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bukti Pembayaran</h3>
                <p className="text-sm text-gray-500">{formatTransactionId(selectedTransaction)} - {selectedTransaction.customer_name}</p>
              </div>
              <button onClick={() => setSelectedTransaction(null)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {(!selectedTransaction.payments || selectedTransaction.payments.length === 0) ? (
                <div className="text-center py-8 text-gray-500">Belum ada riwayat pembayaran.</div>
              ) : (
                <div className="space-y-6">
                  {selectedTransaction.payments.map((payment, idx) => (
                    <div key={payment.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">Termin {idx + 1}: {formatRupiah(payment.amount)}</p>
                          <p className="text-xs text-gray-500">{new Date(payment.payment_date).toLocaleString('id-ID')} - {payment.method}</p>
                        </div>
                        {payment.notes && <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">{payment.notes}</span>}
                      </div>
                      <div className="p-4 flex justify-center bg-gray-100 dark:bg-gray-800">
                        {payment.payment_proof ? (
                          <img src={payment.payment_proof} alt={`Bukti Pembayaran Termin ${idx + 1}`} className="max-w-full h-auto max-h-64 object-contain rounded" />
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                            <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                            <p className="text-sm">Tidak ada foto bukti</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button onClick={() => setSelectedTransaction(null)} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition-colors">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handlers */}
      <PrintWarrantyHandler
        isOpen={isPrintWarrantyOpen}
        onClose={() => setIsPrintWarrantyOpen(false)}
        transaction={selectedPrintWarranty}
      />
    </div>
  );
};

export default FinanceReceivables;
