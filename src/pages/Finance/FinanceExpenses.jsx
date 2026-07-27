import { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Paperclip, Filter, X, Wallet, TrendingUp, AlertTriangle, CalendarDays, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../data/mockData';
import { format } from 'date-fns';
import './FinanceExpenses.css';

const INITIAL_BUDGETS = [
  { id: 'B-1', category: 'Bahan Baku', budgeted: 15000000 },
  { id: 'B-2', category: 'Operasional', budgeted: 5000000 },
  { id: 'B-3', category: 'Gaji/Upah', budgeted: 25000000 },
  { id: 'B-4', category: 'Transportasi', budgeted: 2000000 },
  { id: 'B-5', category: 'Lainnya', budgeted: 1500000 },
];

const INITIAL_EXPENSES = [
  { id: 'EXP-001', date: new Date().toISOString(), location: 'Gallardo', category: 'Bahan Baku', description: 'Beli 2 Roll Kaca Film 40% (Jet Black)', amount: 3500000, hasAttachment: true },
  { id: 'EXP-002', date: new Date(Date.now() - 86400000 * 2).toISOString(), location: 'New Ratu', category: 'Operasional', description: 'Bayar Listrik & Air', amount: 1250000, hasAttachment: true },
  { id: 'EXP-003', date: new Date(Date.now() - 86400000 * 5).toISOString(), location: 'Gallardo', category: 'Gaji/Upah', description: 'Uang Makan Teknisi (Minggu 1)', amount: 750000, hasAttachment: false },
  { id: 'EXP-004', date: new Date(Date.now() - 86400000 * 10).toISOString(), location: 'New Ratu', category: 'Lainnya', description: 'Perbaikan Kompresor Angin', amount: 450000, hasAttachment: true },
  { id: 'EXP-005', date: new Date(Date.now() - 86400000 * 12).toISOString(), location: 'Gallardo', category: 'Transportasi', description: 'Bensin Operasional', amount: 300000, hasAttachment: false }
];

const formatRupiahInput = (value) => {
  const rawValue = value.replace(/[^0-9]/g, '');
  return rawValue ? `Rp ${rawValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}` : '';
};

const FinanceExpenses = () => {
  const [activeTab, setActiveTab] = useState('kategori'); // 'kategori', 'transaksi', 'kalender'
  
  const [budgets, setBudgets] = useState(INITIAL_BUDGETS);
  const [expenses, setExpenses] = useState(INITIAL_EXPENSES);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategoryTerm, setSearchCategoryTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('Semua');
  const [filterCategory, setFilterCategory] = useState('Semua');

  // Modals state
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isCloseBookModalOpen, setIsCloseBookModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedDateObj, setSelectedDateObj] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Forms state
  const [newExpense, setNewExpense] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    location: '',
    category: '',
    description: '',
    amount: '',
    file: null
  });

  const [newCategory, setNewCategory] = useState({
    category: '',
    budgeted: ''
  });

  const handleExpenseInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense(prev => ({ ...prev, [name]: value }));
  };

  const handleExpenseAmountChange = (e) => {
    setNewExpense(prev => ({ ...prev, amount: formatRupiahInput(e.target.value) }));
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryAmountChange = (e) => {
    setNewCategory(prev => ({ ...prev, budgeted: formatRupiahInput(e.target.value) }));
  };

  const handleOpenAddCategory = () => {
    setEditingCategoryId(null);
    setNewCategory({ category: '', budgeted: '' });
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (b) => {
    setEditingCategoryId(b.id);
    setNewCategory({ category: b.category, budgeted: formatRupiahInput(b.budgeted.toString()) });
    setIsCategoryModalOpen(true);
  };

  const handleDeleteCategoryConfirm = () => {
    if (categoryToDelete) {
      setBudgets(prev => prev.filter(b => b.id !== categoryToDelete.id));
      setCategoryToDelete(null);
    }
  };

  const handleSaveExpense = (e) => {
    e.preventDefault();
    const expenseRecord = {
      id: `EXP-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      date: new Date(newExpense.date).toISOString(),
      location: newExpense.location,
      category: newExpense.category,
      description: newExpense.description,
      amount: Number(newExpense.amount.replace(/[^0-9]/g, '')), // Sanitasi Data
      hasAttachment: !!newExpense.file
    };

    setExpenses(prev => [expenseRecord, ...prev]);
    setIsExpenseModalOpen(false);
    setNewExpense({ date: format(new Date(), 'yyyy-MM-dd'), location: '', category: '', description: '', amount: '', file: null });
  };

  const handleSaveCategory = (e) => {
    e.preventDefault();
    
    if (editingCategoryId) {
      // Update
      setBudgets(prev => prev.map(b => b.id === editingCategoryId ? {
        ...b,
        category: newCategory.category,
        budgeted: Number(newCategory.budgeted.replace(/[^0-9]/g, ''))
      } : b));
    } else {
      // Create
      const catRecord = {
        id: `B-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        category: newCategory.category,
        budgeted: Number(newCategory.budgeted.replace(/[^0-9]/g, ''))
      };
      setBudgets(prev => [...prev, catRecord]);
    }

    setIsCategoryModalOpen(false);
    setNewCategory({ category: '', budgeted: '' });
    setEditingCategoryId(null);
  };

  const handleCloseBook = () => {
    // 1. Archiving Logic
    const archiveData = {
      id: `ARCH-${Date.now()}`,
      period: format(new Date(), 'MMMM yyyy'),
      totalBudget: summary.totalBudget,
      totalSpent: summary.totalSpent,
      remaining: summary.remaining,
      expenses: [...expenses],
      budgetsSnapshot: [...dynamicBudgets]
    };

    // Simulate Global State / Mock Database via localStorage
    const existingArchives = JSON.parse(localStorage.getItem('archivedBudgets')) || [];
    localStorage.setItem('archivedBudgets', JSON.stringify([archiveData, ...existingArchives]));

    // 2. Execution Reset (Post-Backup)
    setExpenses([]); // Automatically resets "Terpakai" to 0 via dynamic derivation
    setIsCloseBookModalOpen(false);
  };

  // Derive dynamic budget metrics combining initial budgets + actual expenses
  const dynamicBudgets = useMemo(() => {
    return budgets.map(b => {
      const spent = expenses
        .filter(exp => exp.category === b.category)
        .reduce((sum, exp) => sum + exp.amount, 0);
      return { ...b, spent };
    });
  }, [budgets, expenses]);

  // Summary Metrics
  const summary = useMemo(() => {
    const totalBudget = dynamicBudgets.reduce((sum, b) => sum + b.budgeted, 0);
    const totalSpent = dynamicBudgets.reduce((sum, b) => sum + b.spent, 0);
    const remaining = totalBudget - totalSpent;
    const progress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const isOver = totalSpent > totalBudget;

    return { totalBudget, totalSpent, remaining, progress, isOver };
  }, [dynamicBudgets]);

  // Kategori Filters
  const filteredBudgets = useMemo(() => {
    return dynamicBudgets.filter(b => b.category.toLowerCase().includes(searchCategoryTerm.toLowerCase()));
  }, [dynamicBudgets, searchCategoryTerm]);

  // Transaksi Filters
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchBranch = filterBranch === 'Semua' || exp.location === filterBranch;
      const matchCategory = filterCategory === 'Semua' || exp.category === filterCategory;
      return matchSearch && matchBranch && matchCategory;
    });
  }, [expenses, searchTerm, filterBranch, filterCategory]);

  const renderSummaryCards = () => (
    <div className="budget-summary-grid">
      <div className="summary-card glass-effect">
        <div className="card-header">
          <Wallet className="icon-muted" size={20} />
          <span>Total Anggaran</span>
        </div>
        <div className="card-amount">{formatCurrency(summary.totalBudget)}</div>
        <div className="card-subtext">Akumulasi seluruh kategori</div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill bg-dark" style={{ width: '0%' }}></div>
        </div>
      </div>
      
      <div className="summary-card glass-effect">
        <div className="card-header">
          <TrendingUp className="icon-muted" size={20} />
          <span>Total Terpakai</span>
        </div>
        <div className="card-amount">{formatCurrency(summary.totalSpent)}</div>
        <div className="card-subtext">{summary.progress.toFixed(1)}% dari total anggaran</div>
        <div className="progress-bar-container">
          <div className={`progress-bar-fill ${summary.isOver ? 'bg-red' : 'bg-dark'}`} style={{ width: `${Math.min(summary.progress, 100)}%` }}></div>
        </div>
      </div>

      <div className="summary-card glass-effect">
        <div className="card-header">
          <CalendarDays className="icon-muted" size={20} />
          <span>Sisa Anggaran</span>
        </div>
        <div className={`card-amount ${summary.remaining < 0 ? 'text-red' : ''}`}>{formatCurrency(summary.remaining)}</div>
        <div className="card-subtext">Tersedia untuk digunakan</div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill bg-dark" style={{ width: '100%' }}></div>
        </div>
      </div>

      <div className="summary-card glass-effect">
        <div className="card-header">
          <AlertTriangle className="icon-muted" size={20} />
          <span>Kesehatan Anggaran</span>
        </div>
        <div className={`card-amount ${summary.isOver ? 'text-red' : 'text-dark'}`}>
          {summary.isOver ? 'Memburuk' : 'Normal'}
        </div>
        <div className="card-subtext">Berdasarkan tingkat pemakaian</div>
        <div className="progress-bar-container">
          <div className={`progress-bar-fill ${summary.isOver ? 'bg-red' : 'bg-dark'}`} style={{ width: summary.isOver ? '100%' : '50%' }}></div>
        </div>
      </div>
    </div>
  );

  const renderKategoriTab = () => (
    <div className="table-glass mt-6">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <div className="search-box border-light">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari kategori..." 
            value={searchCategoryTerm}
            onChange={(e) => setSearchCategoryTerm(e.target.value)}
            className="text-dark" 
          />
        </div>
        <button className="btn-solid-dark text-sm py-2 px-4" onClick={handleOpenAddCategory}>
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="expenses-table">
          <thead>
            <tr>
              <th>Kategori</th>
              <th className="text-right">Anggaran</th>
              <th className="text-right">Terpakai</th>
              <th className="text-right">Sisa</th>
              <th className="text-center w-1/4">Progress</th>
              <th className="text-center w-24"></th>
            </tr>
          </thead>
          <tbody>
            {filteredBudgets.length > 0 ? (
              filteredBudgets.map(b => {
                const isExceeded = b.spent > b.budgeted;
                const progressPct = b.budgeted > 0 ? Math.min((b.spent / b.budgeted) * 100, 100) : (b.spent > 0 ? 100 : 0);
                return (
                  <tr key={b.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isExceeded ? 'bg-red-500' : 'bg-gray-800'}`}></div>
                        <span className="font-medium text-dark">{b.category}</span>
                        {isExceeded && <span className="badge-exceeded ml-2">Melebihi Batas</span>}
                      </div>
                    </td>
                    <td className="text-right font-mono-ui font-medium text-gray-600">{formatCurrency(b.budgeted)}</td>
                    <td className="text-right font-mono-ui font-medium text-dark">{formatCurrency(b.spent)}</td>
                    <td className={`text-right font-mono-ui font-medium ${isExceeded ? 'text-red' : 'text-gray-600'}`}>
                      {formatCurrency(b.budgeted - b.spent)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-center">
                        <div className="progress-bar-container flex-1">
                          <div 
                            className={`progress-bar-fill ${isExceeded ? 'bg-red' : 'bg-dark'}`} 
                            style={{ width: `${progressPct}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-500 w-10">{b.budgeted > 0 ? ((b.spent / b.budgeted) * 100).toFixed(0) : '0'}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="action-btn" onClick={() => handleEditCategory(b)} title="Edit Kategori">
                          <Pencil size={18} />
                        </button>
                        <button className="action-btn action-btn-danger" onClick={() => setCategoryToDelete(b)} title="Hapus Kategori">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-8 text-gray-400">Kategori tidak ditemukan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTransaksiTab = () => (
    <>
      <div className="mb-6 mt-6">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'nowrap' }}>
          <div className="search-box border-light" style={{ flex: 1, minWidth: '0' }}>
            <Search size={20} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari keterangan transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-dark"
              style={{ width: '100%' }}
            />
          </div>
          <div className="filter-group border-light" style={{ whiteSpace: 'nowrap' }}>
            <Filter size={18} className="text-gray-400" />
            <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} className="text-dark">
              <option value="Semua">Semua Cabang</option>
              <option value="Gallardo">Gallardo</option>
              <option value="New Ratu">New Ratu</option>
            </select>
          </div>
          <div className="filter-group border-light" style={{ whiteSpace: 'nowrap' }}>
            <Filter size={18} className="text-gray-400" />
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-dark">
              <option value="Semua">Semua Kategori</option>
              {budgets.map(b => (
                <option key={b.id} value={b.category}>{b.category}</option>
              ))}
            </select>
          </div>
          <button className="btn-solid-dark whitespace-nowrap" onClick={() => setIsExpenseModalOpen(true)} style={{ marginLeft: 'auto' }}>
            <Plus size={18} /> Catat Pengeluaran
          </button>
        </div>
      </div>

      <div className="table-glass">
        <div className="overflow-x-auto">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Cabang</th>
                <th>Kategori</th>
                <th>Keterangan</th>
                <th className="text-right">Nominal</th>
                <th className="text-center">Lampiran</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td className="whitespace-nowrap text-gray-600">{format(new Date(exp.date), 'dd MMM yyyy')}</td>
                    <td><span className="text-dark font-medium">{exp.location}</span></td>
                    <td><span className="text-gray-600">{exp.category}</span></td>
                    <td className="max-w-md truncate text-dark">{exp.description}</td>
                    <td className="text-right font-mono-ui font-medium text-dark">{formatCurrency(exp.amount)}</td>
                    <td className="text-center">
                      {exp.hasAttachment ? <Paperclip size={18} className="text-gray-400 mx-auto" /> : <span className="text-gray-400 text-xs">-</span>}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">Tidak ada data transaksi.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderKalenderTab = () => {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="calendar-container mt-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-dark">Kalender Pengeluaran</h3>
            <p className="text-sm text-gray-500">Pantau pola pengeluaran harian Anda.</p>
          </div>
          <div className="text-dark font-medium px-4 py-2 bg-gray-100 rounded-lg">{format(new Date(), 'MMMM yyyy')}</div>
        </div>

        <div className="calendar-grid">
          {weekDays.map(day => (
            <div key={day} className="calendar-header-cell">{day}</div>
          ))}
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="calendar-cell empty"></div>;
            
            // Logic to scatter expenses across days
            let amount = 0;
            let count = 0;
            expenses.forEach(exp => {
              if (new Date(exp.date).getDate() === day) {
                amount += exp.amount;
                count++;
              }
            });

            let tagClass = 'tag-low';
            if (amount > 5000000) tagClass = 'tag-high';
            else if (amount > 1000000) tagClass = 'tag-normal';

            const cellDate = new Date(year, month, day);
            const isClickable = count > 0;
            const handleClick = () => {
              if (isClickable) {
                const dayExpenses = expenses.filter(exp => {
                  const d = new Date(exp.date);
                  return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                });
                setSelectedDateObj({ date: cellDate, expenses: dayExpenses, total: amount });
              }
            };

            return (
              <div 
                key={day} 
                className={`calendar-cell ${isClickable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                onClick={handleClick}
              >
                <div className="cell-top">
                  <span className="day-number">{day}</span>
                  {count > 0 && <span className="tx-count">{count} tx</span>}
                </div>
                {amount > 0 && (
                  <div className={`cell-tag ${tagClass}`}>
                    {formatCurrency(amount).replace('Rp', '')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="calendar-legend mt-4 flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 opacity-80"></div> Tinggi</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-800"></div> Normal</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-gray-300"></div> Rendah</div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isExpenseModalOpen) setIsExpenseModalOpen(false);
        else if (isCategoryModalOpen) setIsCategoryModalOpen(false);
        else if (isCloseBookModalOpen) setIsCloseBookModalOpen(false);
        else if (selectedExpense) setSelectedExpense(null);
        else if (selectedDateObj) setSelectedDateObj(null);
        else if (categoryToDelete) setCategoryToDelete(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpenseModalOpen, isCategoryModalOpen, isCloseBookModalOpen, selectedExpense, selectedDateObj, categoryToDelete]);

  return (
    <div className="expenses-container">
      <div className="expenses-header">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-2 text-dark">Manajemen Anggaran</h1>
          <p className="text-gray-500 mb-6">Lacak dan kelola anggaran pengeluaran operasional.</p>
        </div>
        <button 
          className="btn-cancel-light flex items-center gap-2 border border-gray-300"
          onClick={() => setIsCloseBookModalOpen(true)}
        >
          <RefreshCw size={18} />
          Tutup Buku Bulan Ini
        </button>
      </div>

      {renderSummaryCards()}

      <div className="tabs-navigation mt-8">
        <button 
          className={`tab-btn ${activeTab === 'kategori' ? 'active' : ''}`}
          onClick={() => setActiveTab('kategori')}
        >
          Kategori Anggaran
        </button>
        <button 
          className={`tab-btn ${activeTab === 'transaksi' ? 'active' : ''}`}
          onClick={() => setActiveTab('transaksi')}
        >
          Transaksi
        </button>
        <button 
          className={`tab-btn ${activeTab === 'kalender' ? 'active' : ''}`}
          onClick={() => setActiveTab('kalender')}
        >
          Kalender
        </button>
      </div>

      {activeTab === 'kategori' && renderKategoriTab()}
      {activeTab === 'transaksi' && renderTransaksiTab()}
      {activeTab === 'kalender' && renderKalenderTab()}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-effect">
            <div className="modal-header border-b border-gray-200 pb-4 mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-dark">Catat Pengeluaran Baru</h2>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-gray-400 hover:text-dark transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveExpense}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="form-group">
                  <label className="text-gray-700">Tanggal <span className="text-red-500">*</span></label>
                  <input type="date" name="date" value={newExpense.date} onChange={handleExpenseInputChange} className="input-light text-dark" required />
                </div>
                <div className="form-group">
                  <label className="text-gray-700">Cabang <span className="text-red-500">*</span></label>
                  <select name="location" value={newExpense.location} onChange={handleExpenseInputChange} className="input-light text-dark" required>
                    <option value="" disabled>Pilih Cabang</option>
                    <option value="Gallardo">Gallardo</option>
                    <option value="New Ratu">New Ratu</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-gray-700">Kategori <span className="text-red-500">*</span></label>
                  <select name="category" value={newExpense.category} onChange={handleExpenseInputChange} className="input-light text-dark" required>
                    <option value="" disabled>Pilih Kategori</option>
                    {budgets.map(b => (
                      <option key={b.id} value={b.category}>{b.category}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="text-gray-700">Nominal <span className="text-red-500">*</span></label>
                  <input type="text" name="amount" placeholder="Contoh: Rp 150.000" value={newExpense.amount} onChange={handleExpenseAmountChange} className="input-light text-dark font-mono-ui" required />
                </div>
              </div>
              <div className="form-group mb-4">
                <label className="text-gray-700">Keterangan <span className="text-red-500">*</span></label>
                <textarea name="description" placeholder="Detail barang atau layanan..." rows="3" value={newExpense.description} onChange={handleExpenseInputChange} className="input-light text-dark" required></textarea>
              </div>
              <div className="form-group mb-6">
                <label className="text-gray-700">Bukti Struk/Bon <span className="text-gray-400 font-normal ml-1">(Opsional)</span></label>
                <input type="file" name="file" onChange={(e) => setNewExpense(prev => ({...prev, file: e.target.files[0]}))} className="file-input-light" accept="image/*,.pdf" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" className="btn-cancel-light" onClick={() => setIsExpenseModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-solid-dark py-2 px-6">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-effect" style={{ maxWidth: '400px' }}>
            <div className="modal-header border-b border-gray-200 pb-4 mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-dark">{editingCategoryId ? 'Ubah Kategori Anggaran' : 'Tambah Kategori Anggaran'}</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-dark transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveCategory}>
              <div className="form-group mb-4">
                <label className="text-gray-700">Nama Kategori <span className="text-red-500">*</span></label>
                <input type="text" name="category" placeholder="Contoh: Pemasaran" value={newCategory.category} onChange={handleCategoryInputChange} className="input-light text-dark" required />
              </div>
              <div className="form-group mb-6">
                <label className="text-gray-700">Nominal Anggaran <span className="text-red-500">*</span></label>
                <input type="text" name="budgeted" placeholder="Contoh: Rp 5.000.000" value={newCategory.budgeted} onChange={handleCategoryAmountChange} className="input-light text-dark font-mono-ui" required />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" className="btn-cancel-light" onClick={() => setIsCategoryModalOpen(false)}>Batal</button>
                <button type="submit" className="btn-solid-dark py-2 px-6">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <div className="modal-overlay">
          <div className="modal-content glass-effect" style={{ maxWidth: '400px' }}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <h2 className="text-xl font-bold text-dark mb-2">Hapus Kategori?</h2>
              <p className="text-gray-500 text-sm">Apakah Anda yakin ingin menghapus kategori <strong>{categoryToDelete.category}</strong>? Tindakan ini akan menghilangkan anggaran tersebut dari dasbor.</p>
            </div>
            <div className="flex justify-center gap-3">
              <button type="button" className="btn-cancel-light border border-gray-200 w-full" onClick={() => setCategoryToDelete(null)}>Batal</button>
              <button type="button" className="btn-solid-dark w-full bg-red" style={{ backgroundColor: '#dc2626' }} onClick={handleDeleteCategoryConfirm}>Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Close Book Confirmation Modal */}
      {isCloseBookModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-effect" style={{ maxWidth: '400px' }}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="text-red-500" size={24} />
              </div>
              <h2 className="text-xl font-bold text-dark mb-2">Tutup Pembukuan Bulan Ini?</h2>
              <p className="text-gray-500 text-sm">Apakah Anda yakin ingin menutup pembukuan bulan ini? Data akan diarsipkan secara permanen untuk keperluan laporan audit.</p>
            </div>
            <div className="flex justify-center gap-3">
              <button type="button" className="btn-cancel-light border border-gray-200 w-full" onClick={() => setIsCloseBookModalOpen(false)}>Batal</button>
              <button type="button" className="btn-solid-dark w-full bg-red" style={{ backgroundColor: '#dc2626' }} onClick={handleCloseBook}>Ya, Tutup Buku</button>
            </div>
          </div>
        </div>
      )}

      {/* Daily Expense Detail Modal */}
      {selectedDateObj && (
        <div className="modal-overlay" onClick={() => setSelectedDateObj(null)}>
          <div className="modal-content glass-effect" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
            <div className="mb-4">
              <h3 className="text-xl font-bold text-dark">Rincian Pengeluaran</h3>
              <p className="text-sm text-gray-500">{format(selectedDateObj.date, 'd MMMM yyyy')}</p>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto pr-2 mt-4">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-2 text-sm font-semibold text-gray-500">Kategori</th>
                    <th className="py-2 text-sm font-semibold text-gray-500">Keterangan</th>
                    <th className="py-2 text-sm font-semibold text-gray-500 text-right">Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDateObj.expenses.map((exp, idx) => (
                    <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="py-3 text-sm text-dark font-medium">{exp.category}</td>
                      <td className="py-3 text-sm text-gray-600 max-w-[150px] truncate" title={exp.note}>{exp.note}</td>
                      <td className="py-3 text-sm text-dark text-right whitespace-nowrap">{formatCurrency(exp.amount)}</td>
                    </tr>
                  ))}
                  {selectedDateObj.expenses.length === 0 && (
                    <tr>
                      <td colSpan="3" className="py-4 text-center text-gray-500 text-sm">Tidak ada transaksi.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
              <span className="font-semibold text-gray-600">Total Hari Ini</span>
              <span className="font-bold text-dark text-lg">{formatCurrency(selectedDateObj.total)}</span>
            </div>

            <div className="mt-6">
              <button className="btn-solid-dark w-full py-2.5" onClick={() => setSelectedDateObj(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceExpenses;
