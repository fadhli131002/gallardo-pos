import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, CheckCircle2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Select from 'react-select';
import { useOrders } from '../context/OrderContext';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';

const ComplaintModal = ({ isOpen, onClose, transactionData = null, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    transaction_id: '',
    problem_type: '',
    description: '',
    status: 'Pending',
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingTransactions, setIsFetchingTransactions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (transactionData) {
        setFormData(prev => ({ ...prev, transaction_id: transactionData.dbId || transactionData.id }));
      }
      loadTransactions();
    } else {
      // Reset form on close
      setFormData({
        transaction_id: '',
        problem_type: '',
        description: '',
        status: 'Pending',
      });
      setFile(null);
      setPreview(null);
      setSelectedInventoryItems([]);
    }
  }, [isOpen, transactionData]);

  const { inventory } = useInventory();
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [selectedInventoryItems, setSelectedInventoryItems] = useState([]);

  const loadInventory = () => {
    if (inventory && Array.isArray(inventory)) {
      setInventoryOptions(inventory.map(item => ({
        value: item.id,
        label: `${item.brand} ${item.varian} (Sisa: ${item.stokUtama || item.stok_utama} ${item.satuan})`,
        satuan: item.satuan,
        kategori: item.kategori,
        itemData: item
      })));
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInventory();
    }
  }, [isOpen, inventory]);

  const { orders } = useOrders();

  const loadTransactions = () => {
    setIsFetchingTransactions(true);
    try {
      // Flatten the orders if they have historyMaintenance or simply use orders directly 
      // since the user wants to search all. orders contains the main transactions.
      let allOrders = [];
      if (Array.isArray(orders)) {
        orders.forEach(o => {
          allOrders.push(o);
          if (o.historyMaintenance && Array.isArray(o.historyMaintenance)) {
            allOrders = allOrders.concat(o.historyMaintenance);
          }
        });
      }

      const options = allOrders.map(t => ({
        value: t.dbId,
        label: `[${t.id}] - ${t.customerName || 'Umum'} - ${t.plateNumber || '-'} (${t.carBrand || ''} ${t.carModel || ''})`,
        transactionData: t
      }));
      setTransactions(options);
    } catch (error) {
      console.error('Error parsing orders', error);
    } finally {
      setIsFetchingTransactions(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleAddInventoryItem = () => {
    setSelectedInventoryItems([...selectedInventoryItems, { inventory_id: null, quantity: 1 }]);
  };

  const handleRemoveInventoryItem = (index) => {
    const newItems = [...selectedInventoryItems];
    newItems.splice(index, 1);
    setSelectedInventoryItems(newItems);
  };

  const handleInventoryChange = (index, field, value) => {
    const newItems = [...selectedInventoryItems];
    newItems[index][field] = value;
    setSelectedInventoryItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.transaction_id || !formData.problem_type) {
      toast.error('Harap isi Data Transaksi dan Jenis Masalah');
      return;
    }
    if (!file) {
      toast.error('Harap upload foto bukti kerusakan');
      return;
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append('transaction_id', formData.transaction_id);
      data.append('problem_type', formData.problem_type);
      data.append('description', formData.description);
      data.append('status', formData.status);
      data.append('proof_photo', file);

      const validInventoryItems = selectedInventoryItems.filter(item => item.inventory_id && item.quantity > 0);
      if (validInventoryItems.length > 0) {
        data.append('inventory_items', JSON.stringify(validInventoryItems.map(item => ({
          inventory_id: item.inventory_id.value,
          quantity: item.quantity
        }))));
      }

      const response = await fetch(window.API_URL + '/api/complaints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (!response.ok) {
        let errMsg = 'Gagal mencatat komplain';
        try {
          const errData = await response.json();
          errMsg = errData.error || errData.message || errMsg;
        } catch (e) { }
        throw new Error(errMsg);
      }

      toast.success('Komplain berhasil dicatat');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay animate-fade-in" onClick={onClose} style={{ zIndex: 100 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="modal-content animate-fade-in"
          style={{ width: '600px', maxWidth: '100%', display: 'flex', flexDirection: 'column', maxHeight: '90vh', backgroundColor: '#ffffff', color: '#111827', padding: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>Catat Komplain Baru</h3>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Form input klaim garansi atau keluhan pelanggan</p>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <div style={{ padding: '24px', overflowY: 'auto' }}>
            <form id="complaintForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Transaction Selection */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Data Transaksi / Pelanggan <span style={{ color: '#ef4444' }}>*</span></label>
                {transactionData ? (
                  <div style={{ padding: '12px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 4px', fontWeight: '600', color: '#1f2937' }}>{transactionData.customer_name} - {transactionData.plate_number}</p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{transactionData.car_brand} {transactionData.car_model}</p>
                  </div>
                ) : (
                  <Select
                    options={transactions}
                    value={transactions.find(t => t.value === formData.transaction_id) || null}
                    onChange={(selected) => setFormData({ ...formData, transaction_id: selected ? selected.value : '' })}
                    placeholder={isFetchingTransactions ? "Loading..." : "Cari/Pilih Transaksi Pelanggan..."}
                    isSearchable
                    isLoading={isFetchingTransactions}
                    styles={{
                      control: (base) => ({
                        ...base,
                        borderRadius: '8px',
                        borderColor: '#d1d5db',
                        padding: '2px',
                        fontSize: '14px',
                      })
                    }}
                  />
                )}
              </div>

              {/* Problem Type */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Jenis Kendala <span style={{ color: '#ef4444' }}>*</span></label>
                <select
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#111827', fontSize: '14px', outline: 'none' }}
                  value={formData.problem_type}
                  onChange={(e) => setFormData({ ...formData, problem_type: e.target.value })}
                  required
                >
                  <option value="">Pilih Jenis Kendala...</option>
                  <option value="PPF Terkelupas">PPF Terkelupas</option>
                  <option value="Gelembung / Bintik">Gelembung / Bintik</option>
                  <option value="Kaca Film Cacat / Luntur">Kaca Film Cacat / Luntur</option>
                  <option value="Pemasangan Kurang Rapi">Pemasangan Kurang Rapi</option>
                  <option value="Lainnya">Lainnya...</option>
                </select>
              </div>

              {/* Description */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Deskripsi Catatan</label>
                <textarea
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#fff', color: '#111827', fontSize: '14px', outline: 'none', resize: 'vertical' }}
                  rows="3"
                  placeholder="Ceritakan detail kendala yang dialami..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              {/* Inventory Items Selection (Optional) */}
              <div className="form-group" style={{ padding: '16px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Penggunaan Material (Opsional)</label>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>Pilih bahan yang dipotong untuk pengerjaan komplain ini (Rp 0)</p>
                  </div>
                  <button type="button" onClick={handleAddInventoryItem} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px', fontSize: '12px', fontWeight: '600', color: '#10b981', backgroundColor: '#d1fae5', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    <Plus size={14} /> Tambah Bahan
                  </button>
                </div>

                {selectedInventoryItems.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {selectedInventoryItems.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <Select
                            options={inventoryOptions}
                            value={item.inventory_id}
                            onChange={(selected) => handleInventoryChange(index, 'inventory_id', selected)}
                            placeholder="Pilih Bahan..."
                            isSearchable
                            styles={{
                              control: (base) => ({
                                ...base,
                                fontSize: '13px',
                                borderRadius: '6px'
                              })
                            }}
                          />
                        </div>
                        <div style={{ width: '120px', display: 'flex', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.quantity}
                            onChange={(e) => handleInventoryChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            style={{ width: '60px', padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px 0 0 6px', fontSize: '13px', outline: 'none' }}
                            placeholder="Qty"
                          />
                          <div style={{ padding: '8px', backgroundColor: '#e5e7eb', border: '1px solid #d1d5db', borderLeft: 'none', borderRadius: '0 6px 6px 0', fontSize: '12px', color: '#4b5563', display: 'flex', alignItems: 'center', height: '100%', boxSizing: 'border-box' }}>
                            {item.inventory_id ? (item.inventory_id.kategori === 'Coating' ? 'ml' : 'm/pcs') : 'qty'}
                          </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveInventoryItem(index)} style={{ padding: '8px', color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '35px' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px 0', color: '#9ca3af', fontSize: '13px' }}>
                    Tidak ada penggunaan material tambahan.
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>Foto Bukti Kerusakan <span style={{ color: '#ef4444' }}>*</span></label>

                <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', borderRadius: '8px', border: '2px dashed #d1d5db', padding: '24px', position: 'relative', backgroundColor: '#f9fafb', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  onClick={() => document.getElementById('file-upload').click()}
                  onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = '#f9fafb'}
                >
                  {preview ? (
                    <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
                      <img src={preview} alt="Preview" style={{ maxHeight: '192px', objectFit: 'contain', borderRadius: '6px' }} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFile(null);
                          setPreview(null);
                        }}
                        style={{ position: 'absolute', top: '-10px', right: '-10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center' }}>
                      <Upload style={{ margin: '0 auto', height: '48px', width: '48px', color: '#9ca3af' }} />
                      <div style={{ marginTop: '16px', display: 'flex', fontSize: '14px', color: '#4b5563', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: '600', color: '#10b981' }}>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />
                        <span>or drag and drop</span>
                      </div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 24px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              style={{ padding: '10px 16px', fontSize: '14px', fontWeight: '500', color: '#374151', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1 }}
            >
              Batal
            </button>
            <button
              type="submit"
              form="complaintForm"
              disabled={isLoading}
              style={{ padding: '10px 16px', fontSize: '14px', fontWeight: '500', color: '#fff', backgroundColor: '#10b981', border: 'none', borderRadius: '8px', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isLoading ? (
                <>
                  <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Simpan Komplain</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ComplaintModal;
