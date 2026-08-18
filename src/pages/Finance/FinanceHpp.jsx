import { useState, useEffect } from 'react';
import { ShieldCheck, Search, Loader2, Check, Save, TrendingUp, Package, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useInventory } from '../../context/InventoryContext';

const FinanceHpp = () => {
  const { inventory, updateHargaModal, refreshInventoryFromApi } = useInventory();
  const [hppValues, setHppValues] = useState({});
  const [savingHppId, setSavingHppId] = useState(null);
  const [savedSuccessId, setSavedSuccessId] = useState(null);
  const [invSearch, setInvSearch] = useState('');
  const [invCategoryFilter, setInvCategoryFilter] = useState('Semua');

  useEffect(() => {
    if (typeof refreshInventoryFromApi === 'function') {
      refreshInventoryFromApi();
    }
  }, []);

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(number || 0);
  };

  const handleSaveHpp = async (item) => {
    const newVal = hppValues[item.id] !== undefined ? hppValues[item.id] : (item.harga_modal || 0);
    setSavingHppId(item.id);
    try {
      const success = await updateHargaModal(item.id, newVal);
      if (success) {
        toast.success(`Harga Modal (HPP) untuk ${item.brand} ${item.varian} berhasil disimpan`);
        setSavedSuccessId(item.id);
        // Hapus draft edit dari state agar kembali membaca item.harga_modal yang sudah tersimpan di database
        setHppValues(prev => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
        setTimeout(() => setSavedSuccessId(null), 2500);
      } else {
        toast.error('Gagal memperbarui harga modal');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan server saat menyimpan harga modal');
    } finally {
      setSavingHppId(null);
    }
  };

  const filteredInventory = (inventory || []).filter(item => {
    const matchCategory = invCategoryFilter === 'Semua' || item.kategori === invCategoryFilter;
    const matchSearch = `${item.id} ${item.brand} ${item.varian} ${item.kegelapan || ''}`.toLowerCase().includes(invSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Calculate Quick Stats
  const totalItems = inventory?.length || 0;
  const itemsWithHpp = inventory?.filter(i => (i.harga_modal || 0) > 0).length || 0;
  const itemsWithPrice = inventory?.filter(i => (i.harga_jual || 0) > 0).length || 0;

  return (
    <div className="w-full space-y-6 animate-fade-in text-slate-800">
      {/* A. Top Page Header (Left-Aligned Structure) */}
      <div className="flex flex-col text-left">
        <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2.5">
          <ShieldCheck size={26} className="text-emerald-600 flex-shrink-0" />
          Atur Harga Modal (HPP Material)
        </h1>
        <p className="text-sm text-slate-500 mt-1 font-normal">
          Kelola harga pokok penjualan (HPP) setiap material untuk penghitungan laba/rugi dan analisis margin keuntungan bisnis
        </p>
      </div>

      {/* B. Top Metric Cards (3-Column Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Total Material */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:border-slate-300">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <Package size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Material</span>
            <span className="text-2xl font-bold text-[#0F172A] mt-0.5 leading-tight">{totalItems} Item</span>
            <span className="text-xs text-slate-500 mt-0.5">{itemsWithPrice} telah diatur harga jual</span>
          </div>
        </div>

        {/* Card 2: Status Input HPP */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:border-slate-300">
          <div className="w-12 h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
            <DollarSign size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Status Input HPP</span>
            <span className="text-2xl font-bold text-[#0F172A] mt-0.5 leading-tight">{itemsWithHpp} / {totalItems}</span>
            <span className="text-xs text-slate-500 mt-0.5">{totalItems - itemsWithHpp} material belum diisi HPP</span>
          </div>
        </div>

        {/* Card 3: Otomasi Finansial */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 transition-all hover:border-slate-300">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Otomasi Finansial</span>
            <span className="text-2xl font-bold text-blue-600 mt-0.5 leading-tight">Aktif</span>
            <span className="text-xs text-slate-500 mt-0.5">HPP otomatis memotong laba bersih</span>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
        {/* C. Unified Filter & Search Toolbar (Single Row Flexbox, Left & Right Aligned) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full mb-4">
          {/* Left: Category Segmented Pill Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {['Semua', 'Kaca Film', 'PPF', 'Coating', 'Tools & Equipment'].map((cat) => (
              <button
                key={cat}
                onClick={() => setInvCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  invCategoryFilter === cat
                    ? 'bg-[#0F172A] text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Right: Search Bar */}
          <div className="relative w-full md:w-80 flex-shrink-0">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari ID, brand, varian..."
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* D. Material HPP Data Table */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-5 py-3.5">ID & Kategori</th>
                <th className="px-5 py-3.5">Brand & Varian Material</th>
                <th className="px-5 py-3.5">Harga Jual (Super Admin)</th>
                <th className="px-5 py-3.5 w-64">Harga Modal HPP (Finance)</th>
                <th className="px-5 py-3.5">Est. Keuntungan / Margin</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(!inventory || inventory.length === 0) ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-emerald-600" />
                    Memuat data material inventaris...
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">
                    Tidak ada material yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredInventory.map(item => {
                  const currentModal = hppValues[item.id] !== undefined ? hppValues[item.id] : (item.harga_modal || 0);
                  const hargaJual = item.harga_jual || 0;
                  const profit = hargaJual > 0 ? (hargaJual - currentModal) : 0;
                  const marginPct = hargaJual > 0 ? Math.round((profit / hargaJual) * 100) : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID & Kategori */}
                      <td className="px-5 py-4 align-middle">
                        <div className="font-bold text-[#0F172A]">{item.id}</div>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-semibold border border-slate-200/60">
                          {item.kategori}
                        </span>
                      </td>

                      {/* Brand & Varian */}
                      <td className="px-5 py-4 align-middle">
                        <div className="font-bold text-[#0F172A] text-[14px]">{item.brand || '-'}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {item.varian || '-'}
                          {item.kategori === 'Kaca Film' && item.kegelapan ? ` (${item.kegelapan})` : ''}
                        </div>
                      </td>

                      {/* Harga Jual (Clean high-contrast text) */}
                      <td className="px-5 py-4 align-middle">
                        {hargaJual > 0 ? (
                          <div className="font-bold text-[#0F172A] text-sm tracking-tight">
                            {formatRupiah(hargaJual)}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum diatur Super Admin</span>
                        )}
                      </td>

                      {/* Harga Modal HPP (Input Box with Rp format) */}
                      <td className="px-5 py-4 align-middle">
                        <div className="relative">
                          <input
                            type="text"
                            value={currentModal ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentModal) : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setHppValues(prev => ({ ...prev, [item.id]: val ? Number(val) : 0 }));
                            }}
                            placeholder="Rp 0"
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#0F172A] placeholder-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                          />
                        </div>
                      </td>

                      {/* Est. Keuntungan / Margin */}
                      <td className="px-5 py-4 align-middle">
                        {hargaJual > 0 ? (
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {profit >= 0 ? '+' : ''}{formatRupiah(profit)}
                            </span>
                            <div className="mt-1">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                marginPct >= 0 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70' 
                                  : 'bg-rose-50 text-rose-700 border-rose-200/70'
                              }`}>
                                Margin: {marginPct}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* Aksi (Simpan Button) */}
                      <td className="px-5 py-4 align-middle text-center">
                        <button
                          onClick={() => handleSaveHpp(item)}
                          disabled={savingHppId === item.id}
                          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold shadow-sm transition-all min-w-[96px] cursor-pointer ${
                            savedSuccessId === item.id
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-[#10B981] hover:bg-[#059669] text-white active:scale-95 disabled:opacity-50'
                          }`}
                        >
                          {savingHppId === item.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : savedSuccessId === item.id ? (
                            <Check size={14} className="text-emerald-700" />
                          ) : (
                            <Save size={14} />
                          )}
                          <span>
                            {savingHppId === item.id ? 'Menyimpan...' : savedSuccessId === item.id ? 'Tersimpan!' : 'Simpan'}
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinanceHpp;
