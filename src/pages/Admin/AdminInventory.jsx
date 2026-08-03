import { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, X, AlertTriangle, Printer, Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useOutletContext } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { useAuth } from '../../context/AuthContext';
import './AdminInventory.css';

const AdminInventory = () => {
  const { user } = useAuth();
  const outletContext = useOutletContext() || {};
  const userRole = String(outletContext.userRole || user?.role || '').toLowerCase().trim();
  const isSuperOrOwner = userRole && ['superadmin', 'super_admin', 'super administrator', 'owner'].includes(userRole);
  const { inventory, inventoryLogs, addStock, updateStock, deleteStock, refreshInventoryFromApi } = useInventory();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTab, setActiveTab] = useState('inventory');

  useEffect(() => {
    if (typeof refreshInventoryFromApi === 'function') {
      refreshInventoryFromApi();
    }
  }, [activeTab]);

  const [editBulk, setEditBulk] = useState("");
  const [editEceran, setEditEceran] = useState("");
  const [isExportingLogs, setIsExportingLogs] = useState(false);

  const [logFilterStartDate, setLogFilterStartDate] = useState('');
  const [logFilterEndDate, setLogFilterEndDate] = useState('');
  const [logFilterType, setLogFilterType] = useState('Semua');

  const [formData, setFormData] = useState({
    kategori: 'Kaca Film',
    brand: '',
    varian: '',
    stokUtama: 0,
    stokPecahan: 0,
    harga_modal: 0,
    satuan: 'Roll'
  });

  const [isNewBrand, setIsNewBrand] = useState(false);
  const [isNewVarian, setIsNewVarian] = useState(false);

  const getDynamicBrands = (kategori) => {
    const brands = new Set();
    inventory.forEach(item => {
      if (item.kategori === kategori && item.brand && item.brand.trim() !== '') {
        brands.add(item.brand);
      }
    });
    return Array.from(brands).sort();
  };

  const getDynamicVariants = (kategori, brand) => {
    const variants = new Set();
    inventory.forEach(item => {
      if (item.kategori === kategori && item.brand === brand && item.varian && item.varian.trim() !== '') {
        variants.add(item.varian);
      }
    });
    return Array.from(variants).sort();
  };

  const getAvailableBrands = () => {
    const brands = getDynamicBrands(formData.kategori);
    return [...brands, '+ Tambah Brand Baru...'];
  };

  const getAvailableVariants = () => {
    const variants = getDynamicVariants(formData.kategori, formData.brand);
    return [...variants, '+ Tambah Varian Baru...'];
  };

  const getKegelapanFromVarian = (varian) => {
    if (!varian) return '';
    if (varian.includes('70')) return '20%';
    if (varian.includes('35')) return '40%';
    if (varian.includes('20')) return '60%';
    if (varian.includes('05')) return '80%';
    return '';
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item.id);

      setEditBulk(item.stokUtama ? item.stokUtama.toString() : "0");
      setEditEceran(item.stokPecahan ? item.stokPecahan.toString() : "0");

      setFormData({
        kategori: item.kategori,
        brand: item.brand || '',
        varian: item.varian || '',
        stokUtama: item.stokUtama || 0,
        stokPecahan: item.stokPecahan || 0,
        harga_modal: item.harga_modal || 0,
        satuan: item.satuan,
        konversi: item.konversi || 1
      });
    } else {
      setEditingItem(null);
      setEditBulk("");
      setEditEceran("");
      setIsNewBrand(false);
      setIsNewVarian(false);
      
      const availBrands = getDynamicBrands('Kaca Film');
      const initialBrand = availBrands.length > 0 ? availBrands[0] : '';
      const availVariants = initialBrand ? getDynamicVariants('Kaca Film', initialBrand) : [];
      
      setFormData({
        kategori: 'Kaca Film',
        brand: initialBrand,
        varian: availVariants.length > 0 ? availVariants[0] : '',
        stokUtama: 0,
        stokPecahan: 0,
        harga_modal: 0,
        satuan: 'Roll',
        konversi: 30
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = (e) => {
    e.preventDefault();

    let finalUtama = editBulk !== "" ? (Number(editBulk) || 0) : (Number(formData.stokUtama) || 0);
    let finalPecahan = editEceran !== "" ? (Number(editEceran) || 0) : (Number(formData.stokPecahan) || 0);
    let konversi = formData.kategori === 'Coating' ? 50 : (formData.kategori === 'Kaca Film' ? 30 : (formData.kategori === 'PPF' ? 15 : 1));

    if (formData.kategori === 'Tools & Equipment') {
      finalUtama = Number(formData.stokUtama) || 0;
      finalPecahan = 0;
    }

    // Normalize
    const totalBase = (finalUtama * konversi) + finalPecahan;
    finalUtama = Math.floor(totalBase / konversi);
    finalPecahan = totalBase % konversi;

    const payload = {
      ...formData,
      stokUtama: finalUtama,
      stokPecahan: finalPecahan,
      harga_modal: Number(formData.harga_modal) || 0,
      konversi: konversi,
      ...(formData.kategori === 'Kaca Film' ? { kegelapan: getKegelapanFromVarian(formData.varian) } : {})
    };

    if (editingItem) {
      updateStock(editingItem, payload);
    } else {
      const isDuplicate = inventory.some(item =>
        item.kategori === formData.kategori &&
        item.brand === formData.brand &&
        item.varian === formData.varian
      );

      if (isDuplicate) {
        alert('Gagal: Barang dengan spesifikasi varian ini sudah ada di inventaris. Gunakan fitur Edit untuk memperbarui stok.');
        return;
      }

      addStock(payload);
    }
    handleCloseModal();
  };

  const handleKategoriChange = (e) => {
    const val = e.target.value;
    let newBrand = '';
    let newVarian = '';
    let newSatuan = formData.satuan;
    let newKonversi = 15;

    if (val === 'Kaca Film') {
      newKonversi = 30;
    } else if (val === 'PPF') {
      newKonversi = 15;
    } else if (val === 'Coating') {
      newSatuan = 'Botol';
      newKonversi = 50;
    }

    setIsNewBrand(false);
    setIsNewVarian(false);

    const availableBrands = getDynamicBrands(val);
    if (availableBrands.length > 0) {
      newBrand = availableBrands[0];
      const availableVariants = getDynamicVariants(val, newBrand);
      if (availableVariants.length > 0) {
        newVarian = availableVariants[0];
      }
    }

    setFormData({
      ...formData,
      kategori: val,
      brand: newBrand,
      varian: newVarian,
      satuan: newSatuan,
      konversi: newKonversi
    });
  };

  const handleBrandChange = (e) => {
    const val = e.target.value;

    if (val === '+ Tambah Brand Baru...') {
      setIsNewBrand(true);
      setFormData({ ...formData, brand: '', varian: '' });
      setIsNewVarian(true);
      return;
    }

    let newVarian = '';
    const availableVariants = getDynamicVariants(formData.kategori, val);
    if (availableVariants.length > 0) {
      newVarian = availableVariants[0];
    }

    setIsNewBrand(false);
    setIsNewVarian(false);

    setFormData({
      ...formData,
      brand: val,
      varian: newVarian
    });
  };

  const handleVarianChange = (e) => {
    const val = e.target.value;
    if (val === '+ Tambah Varian Baru...') {
      setIsNewVarian(true);
      setFormData({ ...formData, varian: '' });
      return;
    }
    
    setIsNewVarian(false);
    setFormData({ ...formData, varian: val });
  };

  const handleDelete = (id) => {
    setItemToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteStock(itemToDelete);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handlePrintPDF = () => {
    setIsPrinting(true);
    const element = document.getElementById('stocktake-pdf-content');
    if (!element) {
      setIsPrinting(false);
      return;
    }

    // Unhide for printing
    element.style.display = 'block';

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getFullYear()}`;
    const filename = `Lembar_Cek_Stok_${formattedDate}.pdf`;

    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Hide again after generating
      element.style.display = 'none';
      setIsPrinting(false);
    });
  };

  const handleExportLogsPDF = () => {
    setIsExportingLogs(true);
    const element = document.getElementById('logs-pdf-content');
    if (!element) {
      setIsExportingLogs(false);
      return;
    }

    // Unhide for printing
    element.style.display = 'block';

    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}_${(today.getMonth() + 1).toString().padStart(2, '0')}_${today.getFullYear()}`;
    const filename = `Laporan_Audit_Inventory_${formattedDate}.pdf`;

    const opt = {
      margin: 10,
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      // Hide again after generating
      element.style.display = 'none';
      setIsExportingLogs(false);
    });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isModalOpen) setIsModalOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const lowStockItems = inventory.filter(item => item.stokUtama < 1);

  // Compute filtered logs
  const filteredLogs = (inventoryLogs || []).filter(log => {
    let matchesDate = true;
    let matchesType = true;
    
    // Filter by date range
    if (logFilterStartDate || logFilterEndDate) {
      const logDate = new Date(log.date);
      // Remove time for accurate date comparison
      logDate.setHours(0, 0, 0, 0);

      if (logFilterStartDate) {
        const startDate = new Date(logFilterStartDate);
        startDate.setHours(0, 0, 0, 0);
        if (logDate < startDate) matchesDate = false;
      }
      
      if (logFilterEndDate) {
        const endDate = new Date(logFilterEndDate);
        endDate.setHours(23, 59, 59, 999);
        if (logDate > endDate) matchesDate = false;
      }
    }

    // Filter by type
    if (logFilterType !== 'Semua') {
      const isRetail = log.orderId && log.orderId.startsWith('RTL');
      if (logFilterType === 'Retail (Grosir)' && !isRetail) matchesType = false;
      if (logFilterType === 'Workshop (Pemasangan)' && isRetail) matchesType = false;
    }

    return matchesDate && matchesType;
  });

  return (
    <div className="admin-inventory-page animate-fade-in">
      {lowStockItems.length > 0 && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', borderRadius: '8px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle color="#ef4444" size={24} />
          <div>
            <h4 style={{ color: '#991b1b', fontWeight: 'bold', margin: 0, fontSize: '14px' }}>Peringatan: Stok Menipis!</h4>
            <p style={{ color: '#b91c1c', margin: '4px 0 0 0', fontSize: '13px' }}>
              Ada {lowStockItems.length} barang yang stoknya di bawah 1 roll / botol. Segera lakukan restock.
            </p>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory & Stok</h1>
          <p className="page-subtitle">Kelola data material dan ketersediaan barang bengkel</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-secondary" onClick={handlePrintPDF} disabled={isPrinting} style={{ opacity: isPrinting ? 0.7 : 1 }}>
            {isPrinting ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />}
            {isPrinting ? 'Menyiapkan PDF...' : 'Cetak Lembar Cek Fisik'}
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            + Tambah Stok Masuk
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '0' }}>
        <button 
          onClick={() => setActiveTab('inventory')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'inventory' ? '2px solid #111' : '2px solid transparent', color: activeTab === 'inventory' ? '#111' : '#6b7280', fontWeight: activeTab === 'inventory' ? 'bold' : '500', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Data Master Inventory
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'logs' ? '2px solid #111' : '2px solid transparent', color: activeTab === 'logs' ? '#111' : '#6b7280', fontWeight: activeTab === 'logs' ? 'bold' : '500', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          Riwayat Pemotongan (Logs)
        </button>
      </div>

      <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
        {activeTab === 'inventory' && (
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-gray-100)', borderBottom: '2px solid var(--border-light)' }}>
              <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>ID BARANG</th>
              <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>JENIS LAYANAN</th>
              <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>BRAND & SERIES</th>
              <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>VARIAN / KEGELAPAN</th>
              {(isSuperOrOwner) && (
                <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>HARGA MODAL</th>
              )}
              <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>STOK TERSEDIA</th>
              <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600, textAlign: 'center' }}>AKSI</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length > 0 ? (
              inventory.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s ease' }} className="hover:bg-gray-50">
                  <td style={{ padding: '1rem', fontWeight: 500, color: 'var(--color-black)' }}>{item.id}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '4px 8px', backgroundColor: 'var(--color-gray-100)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-black)' }}>
                      {item.kategori}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-black)' }}>{item.brand || '-'}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-black)' }}>
                      {item.varian || '-'}
                      {item.kategori === 'Kaca Film' && item.kegelapan ? ` (Kegelapan ${item.kegelapan})` : ''}
                    </div>
                  </td>
                  {(isSuperOrOwner) && (
                    <td style={{ padding: '1rem', fontWeight: 600 }}>
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.harga_modal || 0)}
                    </td>
                  )}
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {item.kategori === 'Tools & Equipment' ? (
                        <>
                          <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-black)' }}>
                            {item.stokUtama}
                          </span>
                          <span style={{ fontSize: '0.875rem', color: 'var(--color-secondary)' }}>{item.satuan}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-black)' }}>
                          {item.kategori === 'Coating'
                            ? `${item.stokUtama} Botol (${item.stokPecahan} ml)`
                            : `${item.stokUtama} Roll + ${item.stokPecahan} Meter`}
                        </span>
                      )}

                      {((item.kategori === 'Tools & Equipment' && item.stokUtama <= 2) ||
                        (item.kategori !== 'Tools & Equipment' && item.stokUtama < 2)) && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#fef2f2', padding: '2px 6px', borderRadius: '4px', border: '1px solid #fca5a5' }}>
                            <AlertTriangle size={12} />
                            [Stok Menipis]
                          </span>
                        )}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button onClick={() => handleOpenModal(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }} title="Edit">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-secondary)' }} title="Hapus">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-secondary)' }}>
                  <Package size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: '1rem' }} />
                  <p>Tidak ada data inventaris.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        )}

        {activeTab === 'logs' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Mulai:</label>
                  <input type="date" value={logFilterStartDate} onChange={(e) => setLogFilterStartDate(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Sampai:</label>
                  <input type="date" value={logFilterEndDate} onChange={(e) => setLogFilterEndDate(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#4b5563' }}>Tipe:</label>
                  <select value={logFilterType} onChange={(e) => setLogFilterType(e.target.value)} style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '13px' }}>
                    <option value="Semua">Semua Transaksi</option>
                    <option value="Retail (Grosir)">Retail (Grosir)</option>
                    <option value="Workshop (Pemasangan)">Workshop (Pemasangan)</option>
                  </select>
                </div>
              </div>
              <button onClick={handleExportLogsPDF} disabled={isExportingLogs} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: isExportingLogs ? 'wait' : 'pointer', fontWeight: 600, fontSize: '13px', opacity: isExportingLogs ? 0.7 : 1 }}>
                {isExportingLogs ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                Export PDF
              </button>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-gray-100)', borderBottom: '2px solid var(--border-light)' }}>
                  <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>TANGGAL</th>
                  <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>ORDER ID</th>
                  <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>LAYANAN</th>
                  <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>ITEM BAHAN</th>
                  <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>DIPOTONG</th>
                  <th style={{ padding: '1rem', color: 'var(--color-secondary)', fontSize: '0.75rem', letterSpacing: '0.05em', fontWeight: 600 }}>SISA STOK</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="hover:bg-gray-50">
                      <td style={{ padding: '1rem', fontSize: '13px' }}>{new Date(log.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold' }}>{log.orderId}</td>
                      <td style={{ padding: '1rem', fontSize: '13px' }}>{log.serviceName}</td>
                      <td style={{ padding: '1rem', fontSize: '13px', color: '#4b5563' }}>{log.itemName}</td>
                      <td style={{ padding: '1rem', fontSize: '13px', fontWeight: 'bold', color: '#ef4444' }}>-{log.deducted}</td>
                      <td style={{ padding: '1rem', fontSize: '13px', color: '#059669', fontWeight: 'bold' }}>{log.remaining}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
                      <Package size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: '1rem' }} />
                      <p>Data tidak ditemukan pada periode ini.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)', padding: '24px' }}>
          <div className="modal-content premium-card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f9fafb', flexShrink: 0 }}>
              <h2 className="font-sans text-xl font-bold" style={{ margin: 0, color: '#111827' }}>
                {editingItem ? 'Edit Stok Material' : 'Tambah Stok Masuk'}
              </h2>
              <button onClick={handleCloseModal} className="icon-btn" style={{ padding: '8px', borderRadius: '50%', backgroundColor: '#f3f4f6', color: '#6b7280', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#e5e7eb'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              
              {/* Scrollable Body */}
              <div style={{ padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Jenis Layanan</label>
                    <select
                      value={formData.kategori}
                      onChange={handleKategoriChange}
                      required
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', backgroundColor: 'white', color: '#111827' }}
                      className="focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                    >
                      <option value="Kaca Film">Kaca Film</option>
                      <option value="PPF">PPF</option>
                      <option value="Coating">Coating</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Brand & Series</label>
                    {isNewBrand ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          placeholder="Masukkan Brand Baru..."
                          required
                          style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111827' }}
                          className="focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        />
                        <button type="button" onClick={() => { setIsNewBrand(false); setIsNewVarian(false); setFormData({...formData, brand: getDynamicBrands(formData.kategori)[0] || '', varian: getDynamicBrands(formData.kategori)[0] ? getDynamicVariants(formData.kategori, getDynamicBrands(formData.kategori)[0])[0] || '' : ''}); }} style={{ padding: '0 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#374151', cursor: 'pointer' }}>Batal</button>
                      </div>
                    ) : (
                      <select
                        value={formData.brand}
                        onChange={handleBrandChange}
                        required
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', backgroundColor: 'white', color: '#111827' }}
                        className="focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      >
                        {getAvailableBrands().map((brand) => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Varian / Kegelapan</label>
                    {isNewVarian ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={formData.varian}
                          onChange={(e) => setFormData({ ...formData, varian: e.target.value })}
                          placeholder="Masukkan Varian Baru..."
                          required
                          style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111827' }}
                          className="focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        />
                        <button type="button" onClick={() => { setIsNewVarian(false); setFormData({...formData, varian: getDynamicVariants(formData.kategori, formData.brand)[0] || ''}); }} style={{ padding: '0 16px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#f9fafb', color: '#374151', cursor: 'pointer' }}>Batal</button>
                      </div>
                    ) : (
                      <select
                        value={formData.varian}
                        onChange={handleVarianChange}
                        required
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', backgroundColor: 'white', color: '#111827' }}
                        className="focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      >
                        {getAvailableVariants().map((variant) => (
                          <option key={variant} value={variant}>{variant}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {formData.kategori === 'Tools & Equipment' ? (
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Stok</label>
                        <input 
                          type="number" 
                          min="0" 
                          value={formData.stokUtama} 
                          onChange={(e) => setFormData({ ...formData, stokUtama: e.target.value })} 
                          required 
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111827' }}
                          className="focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="form-group">
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Stok Bulk ({formData.kategori === 'Coating' ? 'Botol' : 'Roll'})</label>
                          <input 
                            type="number" 
                            min="0" 
                            value={editBulk} 
                            onChange={(e) => setEditBulk(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111827' }}
                            className="focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                          />
                        </div>
                        <div className="form-group">
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Stok Eceran ({formData.kategori === 'Coating' ? 'ml' : 'Meter'})</label>
                          <input 
                            type="number" 
                            min="0" 
                            value={editEceran} 
                            onChange={(e) => setEditEceran(e.target.value)} 
                            required 
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111827' }}
                            className="focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                          />
                        </div>
                      </>
                    )}
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Satuan</label>
                      <select
                        value={formData.satuan}
                        onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                        required
                        style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', backgroundColor: 'white', color: '#111827' }}
                        className="focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                      >
                        <option value="Roll">Roll</option>
                        <option value="Botol">Botol</option>
                        <option value="Pcs">Pcs</option>
                        <option value="Unit">Unit</option>
                      </select>
                    </div>
                    
                    {(isSuperOrOwner) && (
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>Harga Modal (Rp)</label>
                        <input 
                          type="text" 
                          value={formData.harga_modal ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(formData.harga_modal) : ''} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, harga_modal: val ? Number(val) : '' });
                          }} 
                          required 
                          placeholder="Rp 0"
                          style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', color: '#111827' }}
                          className="focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div style={{ padding: '20px 32px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', flexShrink: 0 }}>
                <button type="button" onClick={handleCloseModal} style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: '#374151', backgroundColor: '#ffffff', border: '1px solid #d1d5db', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#ffffff'}>
                  Batal
                </button>
                <button type="submit" style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', color: 'white', backgroundColor: '#111827', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#374151'} onMouseOut={e => e.currentTarget.style.backgroundColor = '#111827'}>
                  {editingItem ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content premium-card relative animate-scale-up" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', backgroundColor: '#fff', borderRadius: '24px', padding: '32px 24px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>

            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
              <h2 className="font-sans font-bold" style={{ color: '#111827', fontSize: '1.25rem', margin: 0 }}>Hapus Data Stok?</h2>
              <p className="font-sans" style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: '1.6', margin: 0, padding: '0 12px' }}>
                Data stok yang dihapus tidak dapat dikembalikan. Anda yakin ingin melanjutkan?
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={cancelDelete}
                style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '12px', color: '#4b5563', background: '#ffffff', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}
                onMouseOver={(e) => { e.target.style.backgroundColor = '#f3f4f6'; e.target.style.color = '#111827'; }}
                onMouseOut={(e) => { e.target.style.backgroundColor = '#ffffff'; e.target.style.color = '#4b5563'; }}
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                style={{ flex: 1, padding: '12px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px', boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)' }}
                onMouseOver={(e) => { e.target.style.backgroundColor = '#dc2626'; e.target.style.boxShadow = '0 10px 15px -3px rgba(239, 68, 68, 0.3)'; e.target.style.transform = 'translateY(-1px)'; }}
                onMouseOut={(e) => { e.target.style.backgroundColor = '#ef4444'; e.target.style.boxShadow = '0 4px 6px -1px rgba(239, 68, 68, 0.2)'; e.target.style.transform = 'none'; }}
              >
                Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Element for PDF */}
      <div id="stocktake-pdf-content" style={{ display: 'none', backgroundColor: '#ffffff', padding: '20px', color: '#000' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase' }}>LEMBAR PEMERIKSAAN FISIK STOK (STOCKTAKE)</h1>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <span><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            <span><strong>Pemeriksa:</strong> _______________________</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#f3f4f6', fontWeight: 'bold', textAlign: 'left', width: '10%' }}>ID BARANG</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#f3f4f6', fontWeight: 'bold', textAlign: 'left', width: '12%' }}>JENIS LAYANAN</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#f3f4f6', fontWeight: 'bold', textAlign: 'left', width: '20%' }}>BRAND & SERIES</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#f3f4f6', fontWeight: 'bold', textAlign: 'left', width: '20%' }}>VARIAN / KEGELAPAN</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#f3f4f6', fontWeight: 'bold', textAlign: 'center', width: '10%' }}>STOK SISTEM</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#e5e7eb', fontWeight: 'bold', textAlign: 'center', width: '8%' }}>Sesuai</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#e5e7eb', fontWeight: 'bold', textAlign: 'center', width: '10%' }}>Kurang (Qty)</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#e5e7eb', fontWeight: 'bold', textAlign: 'center', width: '10%' }}>Lebih (Qty)</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, index) => (
              <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{ border: '1px solid #000', padding: '16px 8px' }}>{item.id}</td>
                <td style={{ border: '1px solid #000', padding: '16px 8px' }}>{item.kategori}</td>
                <td style={{ border: '1px solid #000', padding: '16px 8px' }}>{item.brand || '-'}</td>
                <td style={{ border: '1px solid #000', padding: '16px 8px' }}>
                  {item.varian || '-'}
                  {item.kategori === 'Kaca Film' && item.kegelapan ? ` (Kegelapan ${item.kegelapan})` : ''}
                </td>
                <td style={{ border: '1px solid #000', padding: '16px 8px', textAlign: 'center', fontWeight: 'bold' }}>
                  {item.kategori === 'Tools'
                    ? `${item.stokUtama} ${item.satuan}`
                    : item.kategori === 'Coating'
                      ? `${item.stokUtama} Botol (${item.stokPecahan} ml)`
                      : `${item.stokUtama} Roll + ${item.stokPecahan} Meter`}
                </td>
                <td style={{ border: '1px solid #000', padding: '16px 8px', textAlign: 'center' }}>
                  <div style={{ width: '20px', height: '20px', border: '2px solid #000', margin: '0 auto' }}></div>
                </td>
                <td style={{ border: '1px solid #000', padding: '16px 8px' }}>
                  <div style={{ width: '100%', height: '24px', borderBottom: '1px dotted #9ca3af' }}></div>
                </td>
                <td style={{ border: '1px solid #000', padding: '16px 8px' }}>
                  <div style={{ width: '100%', height: '24px', borderBottom: '1px dotted #9ca3af' }}></div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '30px', fontSize: '12px', color: '#4b5563', fontStyle: 'italic' }}>
          * Dokumen ini digenerate secara otomatis oleh sistem POS Gallardo. Harap kembalikan lembar ini ke Admin Gudang setelah pengecekan fisik selesai dilakukan.
        </div>
      </div>

      {/* Hidden Print Element for Logs PDF */}
      <div id="logs-pdf-content" style={{ display: 'none', backgroundColor: '#ffffff', padding: '20px', color: '#000' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0', textTransform: 'uppercase' }}>LAPORAN AUDIT INVENTORY</h1>
          <p style={{ margin: '0 0 15px 0', color: '#4b5563' }}>Riwayat Pemotongan Stok</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
            <span>
              <strong>Periode:</strong> {logFilterStartDate ? new Date(logFilterStartDate).toLocaleDateString('id-ID') : 'Awal'} 
              {' s/d '}
              {logFilterEndDate ? new Date(logFilterEndDate).toLocaleDateString('id-ID') : 'Sekarang'}
            </span>
            <span><strong>Tipe Transaksi:</strong> {logFilterType}</span>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#f3f4f6', fontWeight: 'bold', textAlign: 'left', width: '15%' }}>TANGGAL</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#f3f4f6', fontWeight: 'bold', textAlign: 'left', width: '15%' }}>ORDER ID</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#f3f4f6', fontWeight: 'bold', textAlign: 'left', width: '25%' }}>ITEM BAHAN</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#f3f4f6', fontWeight: 'bold', textAlign: 'center', width: '15%' }}>DIPOTONG</th>
              <th style={{ border: '1px solid #000', padding: '12px 8px', backgroundColor: '#f3f4f6', fontWeight: 'bold', textAlign: 'center', width: '30%' }}>SISA STOK</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => (
                <tr key={log.id} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                  <td style={{ border: '1px solid #000', padding: '12px 8px' }}>{new Date(log.date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td style={{ border: '1px solid #000', padding: '12px 8px' }}>{log.orderId}</td>
                  <td style={{ border: '1px solid #000', padding: '12px 8px' }}>
                    <div style={{ fontWeight: 'bold' }}>{log.itemName}</div>
                    <div style={{ fontSize: '10px', color: '#6b7280' }}>{log.serviceName}</div>
                  </td>
                  <td style={{ border: '1px solid #000', padding: '12px 8px', textAlign: 'center', color: '#dc2626', fontWeight: 'bold' }}>-{log.deducted}</td>
                  <td style={{ border: '1px solid #000', padding: '12px 8px', textAlign: 'center', color: '#059669', fontWeight: 'bold' }}>{log.remaining}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ border: '1px solid #000', padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  Tidak ada data pada periode ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ marginTop: '30px', fontSize: '12px', color: '#4b5563', fontStyle: 'italic', textAlign: 'right' }}>
          * Dokumen ini digenerate secara otomatis oleh sistem POS Gallardo.
        </div>
      </div>
    </div>
  );
};

export default AdminInventory;
