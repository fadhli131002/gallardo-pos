import { useState, useRef, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, List, Tags, Users, X } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import DeleteConfirmModal from '../../components/DeleteConfirmModal';
import '../Dashboard/Dashboard.css';

const VehicleMaster = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ brand: '', model: '', size: 'Medium' });
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [duplicateError, setDuplicateError] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const brandInputRef = useRef(null);
  const modelInputRef = useRef(null);

  // Tab State
  const [activeTab, setActiveTab] = useState('master');
  
  const [deleteTarget, setDeleteTarget] = useState({ isOpen: false, type: null, id: null, title: '', message: '' });
  
  const openDeleteModal = (type, id, title, message) => {
    setDeleteTarget({ isOpen: true, type, id, title, message });
  };

  const handleConfirmDelete = () => {
    if (deleteTarget.type === 'vehicle') deleteVehicle(deleteTarget.id);
    else if (deleteTarget.type === 'category') removeCategory(deleteTarget.id);
    else if (deleteTarget.type === 'peruntukan') removePeruntukan(deleteTarget.id);
    else if (deleteTarget.type === 'sales') removeSales(deleteTarget.id);
    else if (deleteTarget.type === 'variant') {
      const { type, value } = deleteTarget.id;
      if (type === 'posisi') removePosisiPemasangan(value);
      else if (type === 'partial') removePosisiPartial(value);
    }
    
    setDeleteTarget(prev => ({ ...prev, isOpen: false }));
  };
  
  // Category State
  const { categories, addCategory, removeCategory, peruntukanItems, addPeruntukan, removePeruntukan, updatePeruntukan,
    posisiPemasangan, addPosisiPemasangan, removePosisiPemasangan,
    posisiPartial, addPosisiPartial, removePosisiPartial,
    salesItems, addSales, removeSales, updateSales,
    vehicles, addVehicle, updateVehicle, deleteVehicle
  } = useOrders();
  const [newCategory, setNewCategory] = useState('');

  // Variants State
  const [activeVariantType, setActiveVariantType] = useState('peruntukan'); // peruntukan, kegelapan, posisi, partial
  const [newVariantValue, setNewVariantValue] = useState('');

  const handleAddVariantItem = () => {
    if (!newVariantValue.trim()) return;
    if (activeVariantType === 'posisi') addPosisiPemasangan(newVariantValue.trim());
    else if (activeVariantType === 'partial') addPosisiPartial(newVariantValue.trim());
    setNewVariantValue('');
  };

  // Peruntukan State
  const [newPeruntukanName, setNewPeruntukanName] = useState('');
  const [newPeruntukanKat, setNewPeruntukanKat] = useState('PPF');
  const [editingPeruntukanId, setEditingPeruntukanId] = useState(null);
  const [editingPeruntukanName, setEditingPeruntukanName] = useState('');
  const [editingPeruntukanKat, setEditingPeruntukanKat] = useState('PPF');
  
  const [peruntukanSearchTerm, setPeruntukanSearchTerm] = useState('');
  const [peruntukanFilterKat, setPeruntukanFilterKat] = useState('Semua');
  const [isPeruntukanModalOpen, setIsPeruntukanModalOpen] = useState(false);

  const handleAddPeruntukan = () => {
    if (!newPeruntukanName.trim()) return;
    addPeruntukan({ id: Date.now(), nama: newPeruntukanName.trim(), kategori: newPeruntukanKat });
    setNewPeruntukanName('');
    setIsPeruntukanModalOpen(false);
  };

  const filteredPeruntukan = peruntukanItems.filter(p => {
    const matchSearch = p.nama.toLowerCase().includes(peruntukanSearchTerm.toLowerCase());
    const matchKat = peruntukanFilterKat === 'Semua' || p.kategori === peruntukanFilterKat;
    return matchSearch && matchKat;
  });

  const handleUpdatePeruntukan = (id) => {
    if (!editingPeruntukanName.trim()) return;
    updatePeruntukan(id, { nama: editingPeruntukanName.trim(), kategori: editingPeruntukanKat });
    setEditingPeruntukanId(null);
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await addCategory(newCategory.trim());
    setNewCategory('');
  };

  // Sales State
  const [newSalesName, setNewSalesName] = useState('');
  const [editingSalesId, setEditingSalesId] = useState(null);
  const [editingSalesName, setEditingSalesName] = useState('');
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);

  const handleAddSales = () => {
    if (!newSalesName.trim()) return;
    const newId = `#S${String(salesItems.length + 1).padStart(2, '0')}`;
    addSales({ id: newId, nama: newSalesName.trim() });
    setNewSalesName('');
    setIsSalesModalOpen(false);
  };

  const handleUpdateSales = (id) => {
    if (!editingSalesName.trim()) return;
    updateSales(id, { nama: editingSalesName.trim() });
    setEditingSalesId(null);
  };

  // Derived unique brands for autocomplete
  const uniqueBrands = Array.from(new Set(vehicles.map(v => v.brand)));
  const filteredBrands = uniqueBrands.filter(b => b.toLowerCase().includes(formData.brand.toLowerCase()));

  // Derived unique models for the currently entered brand
  const uniqueModelsForBrand = Array.from(new Set(
    vehicles
      .filter(v => v.brand.toLowerCase() === formData.brand.trim().toLowerCase())
      .map(v => v.model)
  ));
  const filteredModels = uniqueModelsForBrand.filter(m => m.toLowerCase().includes(formData.model.toLowerCase()));

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (brandInputRef.current && !brandInputRef.current.contains(e.target)) {
        setShowBrandDropdown(false);
      }
      if (modelInputRef.current && !modelInputRef.current.contains(e.target)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizeText = (text) => {
    if (!text) return '';
    return text.trim().split(' ').filter(w => w).join(' ');
  };

  const handleSaveVehicle = () => {
    if (!formData.brand || !formData.model) {
      alert("Mohon isi Brand dan Model kendaraan.");
      return;
    }

    const normalizedBrand = normalizeText(formData.brand);
    const normalizedModel = normalizeText(formData.model);

    // Anti-Duplikat Kombinasi (Unique Constraint)
    const isDuplicate = vehicles.some(v => 
      v.brand.toLowerCase() === normalizedBrand.toLowerCase() && 
      v.model.toLowerCase() === normalizedModel.toLowerCase() &&
      v.id !== editingVehicleId
    );

    if (isDuplicate) {
      setDuplicateError(true);
      return;
    }

    if (editingVehicleId) {
      updateVehicle(editingVehicleId, { brand: normalizedBrand, model: normalizedModel, size: formData.size });
    } else {
      addVehicle({ brand: normalizedBrand, model: normalizedModel, size: formData.size });
    }
    
    setFormData({ brand: '', model: '', size: 'Medium' });
    setEditingVehicleId(null);
    setDuplicateError(false);
    setIsModalOpen(false);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.brand.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-header mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="font-sans text-primary text-2xl font-bold">Data Master & Kategori</h1>
          <p className="text-secondary mt-1">Kelola data kendaraan dan sumber leads penjualan</p>
        </div>
        {activeTab === 'master' && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#111', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: '600' }} onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Tambah Kendaraan
          </button>
        )}
        {activeTab === 'sales' && (
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#111', color: '#fff', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: '600' }} onClick={() => setIsSalesModalOpen(true)}>
            <Plus size={18} /> Tambah Sales
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('master')}
          style={{ padding: '12px 16px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'master' ? '2px solid #111' : '2px solid transparent', color: activeTab === 'master' ? '#111' : '#6b7280', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <List size={18} /> Master Kendaraan
        </button>
        <button 
          className={`tab-btn ${activeTab === 'kategori' ? 'active' : ''}`}
          onClick={() => setActiveTab('kategori')}
          style={{ padding: '12px 16px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'kategori' ? '2px solid #111' : '2px solid transparent', color: activeTab === 'kategori' ? '#111' : '#6b7280', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <List size={18} /> Kategori Penjualan & Sumber Leads
        </button>
        <button 
          className={`tab-btn ${activeTab === 'peruntukan' ? 'active' : ''}`}
          onClick={() => setActiveTab('peruntukan')}
          style={{ padding: '12px 16px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'peruntukan' ? '2px solid #111' : '2px solid transparent', color: activeTab === 'peruntukan' ? '#111' : '#6b7280', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Tags size={18} /> Master Opsi & Varian Produk
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
          style={{ padding: '12px 16px', backgroundColor: 'transparent', border: 'none', borderBottom: activeTab === 'sales' ? '2px solid #111' : '2px solid transparent', color: activeTab === 'sales' ? '#111' : '#6b7280', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Users size={18} /> Master Data Sales
        </button>
      </div>

      {activeTab === 'master' && (
        <>

      <div className="glass-card mb-6" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <Search size={20} className="text-gray-400" />
        <input 
          type="text" 
          placeholder="Cari brand atau model kendaraan..." 
          style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit' }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>ID</th>
              <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>Brand</th>
              <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>Model Kendaraan</th>
              <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>Kategori Ukuran</th>
              <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '16px', color: '#6b7280', fontFamily: 'monospace' }}>#{vehicle.id.toString().padStart(3, '0')}</td>
                <td style={{ padding: '16px', fontWeight: '600', color: '#111' }}>{vehicle.brand}</td>
                <td style={{ padding: '16px' }}>{vehicle.model}</td>
                <td style={{ padding: '16px' }}>
                  <span style={{ padding: '4px 12px', backgroundColor: '#f3f4f6', color: '#111', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', border: '1px solid #e5e7eb' }}>
                    {vehicle.size}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button onClick={() => { setEditingVehicleId(vehicle.id); setFormData({ brand: vehicle.brand, model: vehicle.model, size: vehicle.size }); setIsModalOpen(true); }} style={{ padding: '6px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => openDeleteModal('vehicle', vehicle.id, 'Hapus Kendaraan?', 'Data kendaraan ini akan dihapus secara permanen dan tidak dapat dikembalikan.')} style={{ padding: '6px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }} title="Hapus">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredVehicles.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                  Data kendaraan tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </>
      )}

      {activeTab === 'kategori' && (
        <div>
          <div className="glass-card mb-6" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <input 
              type="text" 
              placeholder="Masukkan kategori baru (Contoh: GIIAS 2026, Ads Instagram)..." 
              style={{ flex: 1, border: '1px solid #d1d5db', padding: '10px 16px', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button 
              onClick={handleAddCategory}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#111', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: '600' }}
            >
              <Plus size={18} /> Tambah Kategori
            </button>
          </div>

          <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>No</th>
                  <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>Nama Kategori / Event</th>
                  <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={cat.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px', color: '#6b7280' }}>{index + 1}</td>
                    <td style={{ padding: '16px', fontWeight: '600', color: '#111' }}>{cat.name}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button onClick={() => openDeleteModal('category', cat.id, 'Hapus Kategori?', 'Data kategori ini akan dihapus secara permanen dan tidak dapat dikembalikan.')} style={{ padding: '6px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }} title="Hapus Kategori">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                      Belum ada kategori terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'peruntukan' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => setActiveVariantType('peruntukan')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeVariantType === 'peruntukan' ? '#111' : '#e5e7eb', color: activeVariantType === 'peruntukan' ? '#fff' : '#4b5563', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>Peruntukan Produk (Semua)</button>
            <button onClick={() => setActiveVariantType('posisi')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeVariantType === 'posisi' ? '#111' : '#e5e7eb', color: activeVariantType === 'posisi' ? '#fff' : '#4b5563', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>Posisi Pemasangan (Kaca Film)</button>
            <button onClick={() => setActiveVariantType('partial')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeVariantType === 'partial' ? '#111' : '#e5e7eb', color: activeVariantType === 'partial' ? '#fff' : '#4b5563', cursor: 'pointer', fontWeight: '600', fontSize: '0.875rem' }}>Posisi Partial (Kaca Film)</button>
          </div>

          {activeVariantType === 'peruntukan' ? (
            <>
              <div className="glass-card mb-6" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb', flexWrap: 'nowrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '0' }}>
                  <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    placeholder="Cari Nama Peruntukan / Bagian..." 
                    style={{ width: '100%', border: '1px solid #d1d5db', padding: '10px 16px 10px 40px', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                    value={peruntukanSearchTerm}
                    onChange={(e) => setPeruntukanSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  value={peruntukanFilterKat}
                  onChange={(e) => setPeruntukanFilterKat(e.target.value)}
                  style={{ border: '1px solid #d1d5db', padding: '10px 16px', borderRadius: '8px', outline: 'none', fontFamily: 'inherit', width: '200px', whiteSpace: 'nowrap' }}
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="PPF">PPF</option>
                  <option value="Coating">Coating</option>
                  <option value="Kaca Film">Kaca Film</option>
                </select>
                <button 
                  onClick={() => setIsPeruntukanModalOpen(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#111', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: '600', marginLeft: 'auto', whiteSpace: 'nowrap' }}
                >
                  <Plus size={18} /> Tambah
                </button>
              </div>

          <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>ID</th>
                  <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>Nama Peruntukan / Bagian</th>
                  <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>Kategori Produk</th>
                  <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredPeruntukan.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px', color: '#6b7280' }}>#{item.id.toString().slice(-4)}</td>
                    <td style={{ padding: '16px', fontWeight: '600', color: '#111' }}>
                      {editingPeruntukanId === item.id ? (
                        <input type="text" value={editingPeruntukanName} onChange={(e) => setEditingPeruntukanName(e.target.value)} style={{ border: '1px solid #d1d5db', padding: '6px', borderRadius: '4px' }} />
                      ) : item.nama}
                    </td>
                    <td style={{ padding: '16px', color: '#111' }}>
                      {editingPeruntukanId === item.id ? (
                        <select value={editingPeruntukanKat} onChange={(e) => setEditingPeruntukanKat(e.target.value)} style={{ border: '1px solid #d1d5db', padding: '6px', borderRadius: '4px' }}>
                          <option value="PPF">PPF</option>
                          <option value="Coating">Coating</option>
                          <option value="Kaca Film">Kaca Film</option>
                        </select>
                      ) : (
                        <span style={{ padding: '4px 12px', backgroundColor: '#eef2ff', color: '#4f46e5', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>{item.kategori}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {editingPeruntukanId === item.id ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleUpdatePeruntukan(item.id)} style={{ padding: '6px 12px', color: '#fff', backgroundColor: '#10b981', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem' }}>Simpan</button>
                          <button onClick={() => setEditingPeruntukanId(null)} style={{ padding: '6px 12px', color: '#374151', backgroundColor: '#e5e7eb', border: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.75rem' }}>Batal</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingPeruntukanId(item.id); setEditingPeruntukanName(item.nama); setEditingPeruntukanKat(item.kategori); }} style={{ padding: '6px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => openDeleteModal('peruntukan', item.id, 'Hapus Peruntukan?', 'Data peruntukan ini akan dihapus secara permanen dan tidak dapat dikembalikan.')} style={{ padding: '6px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }} title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredPeruntukan.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                      Belum ada Master Peruntukan terdaftar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          </>
          ) : (
            <>
              <div className="glass-card mb-6" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <input 
                  type="text" 
                  placeholder={`Tambahkan opsi ${activeVariantType}...`}
                  style={{ flex: 1, border: '1px solid #d1d5db', padding: '10px 16px', borderRadius: '8px', outline: 'none', fontFamily: 'inherit' }}
                  value={newVariantValue}
                  onChange={(e) => setNewVariantValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddVariantItem()}
                />
                <button 
                  onClick={handleAddVariantItem}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#111', color: '#fff', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: '600' }}
                >
                  <Plus size={18} /> Tambah
                </button>
              </div>

              <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>No</th>
                      <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>Nilai Opsi</th>
                      <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeVariantType === 'posisi' ? posisiPemasangan : posisiPartial).map((val, idx) => (
                      <tr key={val.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '16px', color: '#6b7280' }}>{idx + 1}</td>
                        <td style={{ padding: '16px', fontWeight: '600', color: '#111' }}>{val.name}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button onClick={() => openDeleteModal('variant', { type: activeVariantType, value: val.id }, 'Hapus Varian?', 'Data varian ini akan dihapus secara permanen dan tidak dapat dikembalikan.')} style={{ padding: '6px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }} title="Hapus">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {(activeVariantType === 'posisi' ? posisiPemasangan : posisiPartial).length === 0 && (
                      <tr>
                        <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                          Belum ada opsi terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
      
      {/* Modal Tambah Kendaraan */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '400px', backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '20px', fontFamily: 'var(--font-sans)' }}>{editingVehicleId ? 'Edit Kendaraan' : 'Tambah Master Kendaraan'}</h2>
            
            {duplicateError && (
              <div style={{ padding: '10px 12px', backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', borderRadius: '6px', fontSize: '0.8rem', fontFamily: 'var(--font-sans)', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                Data kendaraan ini sudah terdaftar.
              </div>
            )}

            <div style={{ marginBottom: '16px', position: 'relative' }} ref={brandInputRef}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#4b5563', fontWeight: '600', fontFamily: 'var(--font-sans)' }}>Brand Kendaraan</label>
              <input 
                type="text" 
                value={formData.brand} 
                onFocus={() => { setShowBrandDropdown(true); setDuplicateError(false); }}
                onChange={e => {
                  setFormData({...formData, brand: e.target.value});
                  setShowBrandDropdown(true);
                  setDuplicateError(false);
                }} 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'var(--font-sans)', outline: 'none' }} 
                placeholder="Contoh: Honda" 
                autoComplete="off"
              />
              
              {showBrandDropdown && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredBrands.length > 0 ? (
                    filteredBrands.map(brand => (
                      <div 
                        key={brand} 
                        onClick={() => {
                          setFormData({...formData, brand});
                          setShowBrandDropdown(false);
                        }}
                        style={{ padding: '10px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', borderBottom: '1px solid #f3f4f6' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {brand}
                      </div>
                    ))
                  ) : null}
                  
                  {formData.brand.trim() !== '' && !filteredBrands.map(b => b.toLowerCase()).includes(formData.brand.trim().toLowerCase()) && (
                    <div 
                      onClick={() => {
                        setShowBrandDropdown(false);
                      }}
                      style={{ padding: '10px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: '#2563eb', fontWeight: '600', backgroundColor: '#eff6ff' }}
                    >
                      + Tambah brand: "{formData.brand.trim()}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '16px', position: 'relative' }} ref={modelInputRef}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#4b5563', fontWeight: '600', fontFamily: 'var(--font-sans)' }}>Model Kendaraan</label>
              <input 
                type="text" 
                value={formData.model} 
                disabled={!formData.brand.trim()}
                onFocus={() => { setShowModelDropdown(true); setDuplicateError(false); }}
                onChange={e => { 
                  setFormData({...formData, model: e.target.value}); 
                  setShowModelDropdown(true);
                  setDuplicateError(false); 
                }} 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: !formData.brand.trim() ? '#f3f4f6' : '#fff', cursor: !formData.brand.trim() ? 'not-allowed' : 'text' }} 
                placeholder={!formData.brand.trim() ? "Isi Brand Kendaraan terlebih dahulu" : "Contoh: HR-V"}
                autoComplete="off"
              />
              
              {showModelDropdown && formData.brand.trim() !== '' && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredModels.length > 0 ? (
                    filteredModels.map(model => (
                      <div 
                        key={model} 
                        onClick={() => {
                          setFormData({...formData, model});
                          setShowModelDropdown(false);
                        }}
                        style={{ padding: '10px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', borderBottom: '1px solid #f3f4f6' }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        {model}
                      </div>
                    ))
                  ) : (
                    formData.model.trim() === '' && (
                      <div style={{ padding: '10px 12px', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: '#6b7280' }}>
                        Ketik model untuk {normalizeText(formData.brand)}...
                      </div>
                    )
                  )}
                  
                  {formData.model.trim() !== '' && !filteredModels.map(m => m.toLowerCase()).includes(formData.model.trim().toLowerCase()) && (
                    <div 
                      onClick={() => {
                        setShowModelDropdown(false);
                      }}
                      style={{ padding: '10px 12px', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '0.875rem', color: '#2563eb', fontWeight: '600', backgroundColor: '#eff6ff' }}
                    >
                      + Tambah model: "{formData.model.trim()}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', color: '#4b5563', fontWeight: '600', fontFamily: 'var(--font-sans)' }}>Kategori Ukuran</label>
              <select value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#fff' }}>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="XL/Luxury Car">XL/Luxury Car</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => { setIsModalOpen(false); setDuplicateError(false); setEditingVehicleId(null); setFormData({ brand: '', model: '', size: 'Medium' }); }} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Batal</button>
              <button onClick={handleSaveVehicle} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#111', color: '#fff', fontWeight: '600', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Simpan Data</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Peruntukan */}
      {isPeruntukanModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '400px', backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h2 className="font-sans text-xl font-bold mb-4">Tambah Master Peruntukan</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Nama Peruntukan / Bagian</label>
                <input 
                  type="text" 
                  value={newPeruntukanName} 
                  onChange={(e) => setNewPeruntukanName(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Kategori Produk</label>
                <select 
                  value={newPeruntukanKat} 
                  onChange={(e) => setNewPeruntukanKat(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }}
                >
                  <option value="PPF">PPF</option>
                  <option value="Coating">Coating</option>
                  <option value="Kaca Film">Kaca Film</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button onClick={() => setIsPeruntukanModalOpen(false)} style={{ padding: '8px 16px', border: 'none', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Batal</button>
                <button onClick={handleAddPeruntukan} style={{ padding: '8px 16px', border: 'none', backgroundColor: '#111', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'sales' && (
        <div className="glass-card" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600' }}>Nama Sales</th>
                <th style={{ padding: '16px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {salesItems.map((sales) => (
                <tr key={sales.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '16px', color: '#6b7280', fontFamily: 'monospace' }}>{sales.id}</td>
                  <td style={{ padding: '16px', fontWeight: '600', color: '#111' }}>
                    {editingSalesId === sales.id ? (
                      <input 
                        type="text" 
                        value={editingSalesName} 
                        onChange={(e) => setEditingSalesName(e.target.value)}
                        onBlur={() => handleUpdateSales(sales.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateSales(sales.id)}
                        autoFocus
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d1d5db', width: '200px' }}
                      />
                    ) : (
                      sales.nama
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button onClick={() => { setEditingSalesId(sales.id); setEditingSalesName(sales.nama); }} style={{ padding: '6px', color: '#2563eb', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }} title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => openDeleteModal('sales', sales.id, 'Hapus Data Sales?', 'Data sales ini akan dihapus secara permanen dan tidak dapat dikembalikan.')} style={{ padding: '6px', color: '#dc2626', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }} title="Hapus">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {salesItems.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                    Data sales tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tambah Sales Modal */}
      {isSalesModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '400px', backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', position: 'relative' }}>
            <button onClick={() => setIsSalesModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer' }}>
              <X size={20} color="#6b7280" />
            </button>
            <h2 className="font-sans text-xl font-bold mb-4">Tambah Data Sales</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>Nama Sales</label>
                <input 
                  type="text" 
                  value={newSalesName} 
                  onChange={(e) => setNewSalesName(e.target.value)} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' }} 
                  placeholder="Masukkan nama sales..."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button onClick={() => setIsSalesModalOpen(false)} style={{ padding: '8px 16px', border: 'none', backgroundColor: '#f3f4f6', color: '#374151', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Batal</button>
                <button onClick={handleAddSales} style={{ padding: '8px 16px', border: 'none', backgroundColor: '#111', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteTarget.title}
        message={deleteTarget.message}
      />
    </>
  );
};

export default VehicleMaster;
