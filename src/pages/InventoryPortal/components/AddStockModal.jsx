import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeftRight } from '@/icons/itshover';
import { toast } from 'sonner';
import { formatThousand, isLiterItem } from '../utils/unitConversion';

const AddStockModal = ({ isOpen, onClose, inventory = [], onAddStock }) => {
  const [formData, setFormData] = useState({
    kategori: 'Kaca Film',
    brand: '',
    varian: '',
    kegelapan: '20%',
    stokUtama: 0,
    stokPecahan: 0,
    satuan: 'Roll',
    konversi: 30
  });

  const [bulkInput, setBulkInput] = useState('0');
  const [eceranInput, setEceranInput] = useState('0');
  const [eceranUnit, setEceranUnit] = useState('M'); // 'M' | 'CM' | 'ML' | 'UNIT'

  const [isNewKategori, setIsNewKategori] = useState(false);
  const [isNewBrand, setIsNewBrand] = useState(false);
  const [isNewVarian, setIsNewVarian] = useState(false);
  const [isNewKegelapan, setIsNewKegelapan] = useState(false);
  const [isNewSatuan, setIsNewSatuan] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getDynamicBrands = (kategori) => {
    const brands = new Set();
    inventory.forEach((item) => {
      if (item.kategori === kategori && item.brand && item.brand.trim() !== '') {
        brands.add(item.brand);
      }
    });
    return Array.from(brands).sort();
  };

  const getDynamicVariants = (kategori, brand) => {
    const variants = new Set();
    inventory.forEach((item) => {
      if (
        item.kategori === kategori &&
        item.brand === brand &&
        item.varian &&
        item.varian.trim() !== ''
      ) {
        variants.add(item.varian);
      }
    });
    return Array.from(variants).sort();
  };

  useEffect(() => {
    if (isOpen) {
      setIsNewKategori(false);
      setIsNewBrand(false);
      setIsNewVarian(false);
      setIsNewKegelapan(false);
      setIsNewSatuan(false);
      setBulkInput('0');
      setEceranInput('0');
      setEceranUnit('M');

      const availBrands = getDynamicBrands('Kaca Film');
      const initialBrand = availBrands.length > 0 ? availBrands[0] : '';
      const availVariants = initialBrand ? getDynamicVariants('Kaca Film', initialBrand) : [];

      if (availBrands.length === 0) setIsNewBrand(true);
      if (availVariants.length === 0) setIsNewVarian(true);

      setFormData({
        kategori: 'Kaca Film',
        brand: initialBrand,
        varian: availVariants.length > 0 ? availVariants[0] : '',
        kegelapan: '20%',
        stokUtama: 0,
        stokPecahan: 0,
        satuan: 'Roll',
        konversi: 30
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleKategoriChange = (e) => {
    const val = e.target.value;
    if (val === '+ Tambah Jenis Layanan Baru...') {
      setIsNewKategori(true);
      setIsNewBrand(true);
      setIsNewVarian(true);
      setFormData({ ...formData, kategori: '', brand: '', varian: '' });
      return;
    }

    let newSatuan = 'Roll';
    let newKonversi = 15;

    if (val === 'Kaca Film') {
      newSatuan = 'Roll';
      newKonversi = 30;
      setEceranUnit('M');
    } else if (val === 'PPF') {
      newSatuan = 'Roll';
      newKonversi = 15;
      setEceranUnit('M');
    } else if (val === 'Coating') {
      newSatuan = 'Botol';
      newKonversi = 50;
      setEceranUnit('ML');
    } else {
      newSatuan = 'Pcs';
      newKonversi = 1;
    }

    const availableBrands = getDynamicBrands(val);
    let newBrand = '';
    let newVarian = '';

    if (availableBrands.length > 0) {
      newBrand = availableBrands[0];
      setIsNewBrand(false);
      const availableVariants = getDynamicVariants(val, newBrand);
      if (availableVariants.length > 0) {
        newVarian = availableVariants[0];
        setIsNewVarian(false);
      } else {
        setIsNewVarian(true);
      }
    } else {
      setIsNewBrand(true);
      setIsNewVarian(true);
    }

    setFormData({
      ...formData,
      kategori: val,
      brand: newBrand,
      varian: newVarian,
      kegelapan: val === 'Kaca Film' ? '20%' : '',
      satuan: newSatuan,
      konversi: newKonversi
    });
  };

  const handleBrandChange = (e) => {
    const val = e.target.value;
    if (val === '+ Tambah Brand Baru...') {
      setIsNewBrand(true);
      setIsNewVarian(true);
      setFormData({ ...formData, brand: '', varian: '' });
      return;
    }

    setIsNewBrand(false);
    const availableVariants = getDynamicVariants(formData.kategori, val);
    let newVarian = '';
    if (availableVariants.length > 0) {
      newVarian = availableVariants[0];
      setIsNewVarian(false);
    } else {
      setIsNewVarian(true);
    }

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

  const handleKegelapanChange = (e) => {
    const val = e.target.value;
    if (val === '+ Tambah Kegelapan Baru...') {
      setIsNewKegelapan(true);
      setFormData({ ...formData, kegelapan: '' });
      return;
    }
    setIsNewKegelapan(false);
    setFormData({ ...formData, kegelapan: val });
  };

  const handleSatuanChange = (e) => {
    const val = e.target.value;
    if (val === '+ Tambah Satuan Baru...') {
      setIsNewSatuan(true);
      setFormData({ ...formData, satuan: '' });
      return;
    }
    setIsNewSatuan(false);
    setFormData({ ...formData, satuan: val });
  };

  const computeNormalizedStock = () => {
    const kat = formData.kategori;
    const rawBulk = Math.max(0, Number(bulkInput) || 0);
    const rawEceran = Math.max(0, Number(eceranInput) || 0);

    if (kat === 'PPF' || kat === 'Kaca Film') {
      const cmPerRoll = kat === 'PPF' ? 1500 : 3000;
      const eceranCM = eceranUnit === 'CM' ? Math.round(rawEceran) : Math.round(rawEceran * 100);
      const totalCM = Math.round(rawBulk * cmPerRoll) + eceranCM;
      const finalUtama = Math.floor(totalCM / cmPerRoll);
      const remCM = totalCM % cmPerRoll;
      const finalPecahan = parseFloat((remCM / 100).toFixed(2));
      return {
        stokUtama: finalUtama,
        stokPecahan: finalPecahan,
        konversi: kat === 'PPF' ? 15 : 30,
        previewText: `${formatThousand(finalUtama)} Roll${finalPecahan > 0 ? ` + ${formatThousand(finalPecahan, 2)} m (${formatThousand(remCM)} CM)` : ''} | Total: ${formatThousand(totalCM)} CM`
      };
    }

    if (kat === 'Coating') {
      const isLiter = isLiterItem(formData);
      const mlPerBotol = isLiter ? 1000 : 50;
      const unitPerBotol = isLiter ? 60 : 3;
      const unitLabel = isLiter ? (formData.satuan || 'LITER') : (formData.satuan || 'Botol');
      const eceranML =
        eceranUnit === 'UNIT'
          ? Math.floor(rawEceran / 3) * 50 + (rawEceran % 3) * 16.67
          : rawEceran;
      const totalML = (rawBulk * mlPerBotol) + eceranML;
      let finalUtama = Math.floor((totalML + 0.08) / mlPerBotol);
      let remML = totalML - (finalUtama * mlPerBotol);
      const nearestThird = Math.round(remML / (50 / 3)) * (50 / 3);
      if (remML <= 0.12) remML = 0;
      else if (remML >= mlPerBotol - 0.15) {
        finalUtama += 1;
        remML = 0;
      } else if (Math.abs(remML - nearestThird) <= 0.16) {
        remML = parseFloat(nearestThird.toFixed(2));
      } else {
        remML = parseFloat(remML.toFixed(2));
      }
      const totalUnit = (finalUtama * unitPerBotol) + Math.floor((remML + 0.5) / (50 / 3));
      return {
        stokUtama: finalUtama,
        stokPecahan: remML,
        konversi: mlPerBotol,
        previewText: `${formatThousand(finalUtama)} ${unitLabel}${remML > 0 ? ` + ${formatThousand(remML, 2)} ml` : ''} | Total: ${formatThousand(totalUnit)} UNIT (${formatThousand(Math.round(totalML))} ML)`
      };
    }

    const stdUtama = Math.max(0, Math.round(Number(formData.stokUtama) || 0));
    return {
      stokUtama: stdUtama,
      stokPecahan: 0,
      konversi: 1,
      previewText: `${formatThousand(stdUtama)} ${formData.satuan || 'Pcs'}`
    };
  };

  const normalized = computeNormalizedStock();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.kategori.trim() || !formData.brand.trim() || !formData.varian.trim()) {
      toast.error('Harap lengkapi Jenis Layanan, Brand, dan Varian');
      return;
    }

    const isDuplicate = inventory.some(
      (item) =>
        (item.kategori || '').trim().toLowerCase() === formData.kategori.trim().toLowerCase() &&
        (item.brand || '').trim().toLowerCase() === formData.brand.trim().toLowerCase() &&
        (item.varian || '').trim().toLowerCase() === formData.varian.trim().toLowerCase() &&
        (formData.kategori !== 'Kaca Film' ||
          (item.kegelapan || '').trim() === (formData.kegelapan || '').trim())
    );

    if (isDuplicate) {
      toast.error(
        'Gagal: Barang dengan spesifikasi varian dan kegelapan ini sudah ada di inventaris. Gunakan fitur Restock/Adjust untuk memperbarui stok.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        stokUtama: normalized.stokUtama,
        stokPecahan: normalized.stokPecahan,
        konversi: normalized.konversi,
        kegelapan: formData.kategori === 'Kaca Film' ? formData.kegelapan : ''
      };

      const res = await onAddStock(payload);
      if (res && res.success !== false) {
        toast.success(
          `Stok baru ${formData.brand} ${formData.varian} berhasil ditambahkan!`
        );
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menambahkan stok baru');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableBrands = [...getDynamicBrands(formData.kategori), '+ Tambah Brand Baru...'];
  const availableVariants = [
    ...getDynamicVariants(formData.kategori, formData.brand),
    '+ Tambah Varian Baru...'
  ];

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    backgroundColor: 'white',
    color: '#111827',
    outline: 'none'
  };

  return createPortal(
    <div
      className="modal-overlay animate-fade-in"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: '24px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="premium-card"
        style={{
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Header identik dengan AdminInventory.jsx */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f3f4f6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f9fafb',
            flexShrink: 0
          }}
        >
          <h2 className="font-sans" style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
            Tambah Stok Masuk
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '50%',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body identik dengan AdminInventory.jsx */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Jenis Layanan */}
            <div>
              <label style={labelStyle}>Jenis Layanan</label>
              {isNewKategori ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    placeholder="Masukkan Layanan Baru..."
                    required
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewKategori(false);
                      handleKategoriChange({ target: { value: 'Kaca Film' } });
                    }}
                    style={{
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#f9fafb',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <select value={formData.kategori} onChange={handleKategoriChange} required style={inputStyle}>
                  {Array.from(
                    new Set([
                      'Kaca Film',
                      'PPF',
                      'Coating',
                      'Tools & Equipment',
                      ...inventory.map((i) => i.kategori)
                    ])
                  )
                    .filter(Boolean)
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  <option value="+ Tambah Jenis Layanan Baru...">+ Tambah Jenis Layanan Baru...</option>
                </select>
              )}
            </div>

            {/* 2. Brand & Series */}
            <div>
              <label style={labelStyle}>Brand &amp; Series</label>
              {isNewBrand ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Masukkan Brand Baru..."
                    required
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {getDynamicBrands(formData.kategori).length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const firstBrand = getDynamicBrands(formData.kategori)[0] || '';
                        const firstVar = firstBrand
                          ? getDynamicVariants(formData.kategori, firstBrand)[0] || ''
                          : '';
                        setIsNewBrand(false);
                        setIsNewVarian(!firstVar);
                        setFormData({ ...formData, brand: firstBrand, varian: firstVar });
                      }}
                      style={{
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#f9fafb',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Batal
                    </button>
                  )}
                </div>
              ) : (
                <select value={formData.brand} onChange={handleBrandChange} required style={inputStyle}>
                  {availableBrands.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Varian */}
            <div>
              <label style={labelStyle}>Varian</label>
              {isNewVarian ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={formData.varian}
                    onChange={(e) => setFormData({ ...formData, varian: e.target.value })}
                    placeholder="Masukkan Varian Baru..."
                    required
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  {getDynamicVariants(formData.kategori, formData.brand).length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewVarian(false);
                        setFormData({
                          ...formData,
                          varian: getDynamicVariants(formData.kategori, formData.brand)[0] || ''
                        });
                      }}
                      style={{
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#f9fafb',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Batal
                    </button>
                  )}
                </div>
              ) : (
                <select value={formData.varian} onChange={handleVarianChange} required style={inputStyle}>
                  {availableVariants.map((variant) => (
                    <option key={variant} value={variant}>
                      {variant}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 4. Kegelapan */}
            {formData.kategori === 'Kaca Film' && (
              <div>
                <label style={labelStyle}>Kegelapan</label>
                {isNewKegelapan ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={formData.kegelapan}
                      onChange={(e) => setFormData({ ...formData, kegelapan: e.target.value })}
                      placeholder="Masukkan Kegelapan Baru..."
                      required
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsNewKegelapan(false);
                        setFormData({ ...formData, kegelapan: '20%' });
                      }}
                      style={{
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        backgroundColor: '#f9fafb',
                        color: '#374151',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <select value={formData.kegelapan} onChange={handleKegelapanChange} required style={inputStyle}>
                    {Array.from(
                      new Set([
                        '20%',
                        '40%',
                        '60%',
                        '80%',
                        ...inventory.filter((i) => i.kegelapan).map((i) => i.kegelapan)
                      ])
                    )
                      .filter(Boolean)
                      .map((keg) => (
                        <option key={keg} value={keg}>
                          {keg}
                        </option>
                      ))}
                    <option value="+ Tambah Kegelapan Baru...">+ Tambah Kegelapan Baru...</option>
                  </select>
                )}
              </div>
            )}

            {/* 5. Stok Bulk & Eceran */}
            {formData.kategori === 'Tools & Equipment' ? (
              <div>
                <label style={labelStyle}>Stok</label>
                <input
                  type="number"
                  min="0"
                  value={formData.stokUtama}
                  onChange={(e) => setFormData({ ...formData, stokUtama: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>
                    Stok Bulk ({formData.kategori === 'Coating' ? 'Botol' : 'Roll'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                      Stok Eceran (
                      {formData.kategori === 'Coating'
                        ? eceranUnit === 'UNIT'
                          ? 'UNIT'
                        : 'ml'
                        : eceranUnit === 'CM'
                        ? 'CM'
                        : 'Meter'}
                      )
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.kategori === 'Coating') {
                          setEceranUnit((prev) => (prev === 'ML' ? 'UNIT' : 'ML'));
                          setEceranInput('0');
                        } else {
                          if (eceranUnit === 'M') {
                            setEceranUnit('CM');
                            setEceranInput(String(Math.round((Number(eceranInput) || 0) * 100)));
                          } else {
                            setEceranUnit('M');
                            setEceranInput(
                              String(parseFloat(((Number(eceranInput) || 0) / 100).toFixed(2)))
                            );
                          }
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#111827',
                        textDecoration: 'underline',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <ArrowLeftRight size={11} />
                      <span>
                        {formData.kategori === 'Coating'
                          ? eceranUnit === 'ML'
                            ? 'Input UNIT'
                            : 'Input ML'
                          : eceranUnit === 'M'
                          ? 'Input CM'
                          : 'Input Meter'}
                      </span>
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step={eceranUnit === 'CM' || eceranUnit === 'UNIT' ? '1' : '0.1'}
                    value={eceranInput}
                    onChange={(e) => setEceranInput(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            {/* 6. Satuan */}
            <div>
              <label style={labelStyle}>Satuan</label>
              {isNewSatuan ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={formData.satuan}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    placeholder="Masukkan Satuan Baru..."
                    required
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewSatuan(false);
                      setFormData({
                        ...formData,
                        satuan: formData.kategori === 'Coating' ? 'Botol' : 'Roll'
                      });
                    }}
                    style={{
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      backgroundColor: '#f9fafb',
                      color: '#374151',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Batal
                  </button>
                </div>
              ) : (
                <select value={formData.satuan} onChange={handleSatuanChange} required style={inputStyle}>
                  {Array.from(
                    new Set(['Roll', 'Botol', 'LITER', 'Pcs', 'Unit', ...inventory.map((i) => i.satuan)])
                  )
                    .filter(Boolean)
                    .map((sat) => (
                      <option key={sat} value={sat}>
                        {sat}
                      </option>
                    ))}
                  <option value="+ Tambah Satuan Baru...">+ Tambah Satuan Baru...</option>
                </select>
              )}
            </div>

            {/* Live Preview Konversi */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '13px',
                color: '#111827'
              }}
            >
              <span style={{ fontWeight: 600, color: '#4b5563' }}>Konversi Stok Awal:</span>
              <strong style={{ color: '#111827' }}>{normalized.previewText}</strong>
            </div>
          </div>

          {/* Fixed Footer identik dengan AdminInventory.jsx */}
          <div
            style={{
              padding: '20px 32px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              flexShrink: 0
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                backgroundColor: '#ffffff',
                border: '1px solid #d1d5db',
                cursor: 'pointer'
              }}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: '#111827',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                opacity: isSubmitting ? 0.6 : 1
              }}
            >
              {isSubmitting ? 'Menyimpan...' : 'Tambahkan'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default AddStockModal;
