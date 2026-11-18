import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, PackagePlus, Check, ArrowLeftRight } from '@/icons/itshover';
import { toast } from 'sonner';
import {
  getConversionDetails,
  calculateStockMutation,
  formatThousand
} from '../utils/unitConversion';

const RestockModal = ({ isOpen, onClose, item, onConfirmRestock }) => {
  const [inputUnit, setInputUnit] = useState('ROLL');
  const [primaryQty, setPrimaryQty] = useState(1);
  const [secondaryQty, setSecondaryQty] = useState(0);
  const [secondaryUnit, setSecondaryUnit] = useState('M');
  const [supplierName, setSupplierName] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      if (item.kategori === 'PPF' || item.kategori === 'Kaca Film') {
        setInputUnit('ROLL');
        setSecondaryUnit('M');
      } else if (item.kategori === 'Coating') {
        setInputUnit('BOTOL');
        setSecondaryUnit('ML');
      } else {
        setInputUnit('PCS');
      }
      setPrimaryQty(1);
      setSecondaryQty(0);
      setSupplierName(item.brand ? `Supplier ${item.brand}` : '');
      setInvoiceRef(
        `PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`
      );
      setNote('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const conv = getConversionDetails(item);
  const calc = calculateStockMutation(
    item,
    'add',
    inputUnit,
    primaryQty,
    secondaryQty,
    secondaryUnit
  );

  const handleUnitChange = (newUnit) => {
    setInputUnit(newUnit);
    setSecondaryQty(0);
    if (newUnit === 'CM') {
      setPrimaryQty(item.kategori === 'PPF' ? 1500 : 3000);
    } else if (newUnit === 'M') {
      setPrimaryQty(item.kategori === 'PPF' ? 15 : 30);
    } else if (newUnit === 'ML') {
      setPrimaryQty(50);
    } else if (newUnit === 'UNIT') {
      setPrimaryQty(3);
    } else {
      setPrimaryQty(1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!calc.hasChanged) {
      toast.error('Jumlah restock harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const autoNote =
        note.trim() ||
        `Restock masuk +${calc.actionSummary} dari ${supplierName || 'Pusat'} (${invoiceRef || 'Manual'}): Stok Akhir ${calc.resultSummary}`;

      await onConfirmRestock({
        itemId: item.id,
        stokUtama: calc.stokUtama,
        stokPecahan: calc.stokPecahan,
        addedUtama: calc.diffUtama,
        addedPecahan: calc.diffPecahan,
        actionSummary: calc.actionSummary,
        supplierName,
        invoiceRef,
        note: autoNote
      });
      toast.success(`Restock ${item.brand} ${item.varian} (+${calc.actionSummary}) berhasil disimpan!`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses restock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    backgroundColor: '#ffffff',
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
          maxWidth: '580px',
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
          <div>
            <h2 className="font-sans" style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#111827' }}>
              Restock Barang Masuk
            </h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
              {item.id} &bull; {item.kategori} &bull; {conv.ruleHint}
            </p>
          </div>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Item Info Box */}
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: '#f9fafb',
                borderRadius: '10px',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }}>
                  Item Sasaran
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    color: '#111827',
                    border: '1px solid #d1d5db'
                  }}
                >
                  Total: {conv.totalKonversiDisplay}
                </span>
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>
                {item.brand} {item.varian} {item.kegelapan ? `(${item.kegelapan})` : ''}
              </div>
              <div style={{ display: 'flex', gap: '16px', marginTop: '6px', fontSize: '13px', color: '#4b5563' }}>
                <span>
                  Stok Utama: <strong style={{ color: '#111827' }}>{conv.utamaDisplay}</strong>
                </span>
                {conv.isConvertible && (
                  <span>
                    Pecahan: <strong style={{ color: '#111827' }}>{conv.pecahanFullDisplay}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Satuan Input Selector */}
            {conv.isConvertible && (
              <div>
                <label style={labelStyle}>Pilih Satuan Input Restock</label>
                {conv.type === 'FILM_PPF' ? (
                  <select value={inputUnit} onChange={(e) => handleUnitChange(e.target.value)} style={inputStyle}>
                    <option value="ROLL">
                      Roll (1 Roll = {formatThousand(conv.cmPerRoll)} CM / {conv.mPerRoll} m) + Pecahan
                    </option>
                    <option value="CM">
                      Centimeter / CM (Input langsung CM, otomatis dipecah ke Roll &amp; m)
                    </option>
                    <option value="M">
                      Meter / m (1 m = 100 CM, otomatis dipecah ke Roll &amp; m)
                    </option>
                  </select>
                ) : (
                  <select value={inputUnit} onChange={(e) => handleUnitChange(e.target.value)} style={inputStyle}>
                    <option value="BOTOL">
                      {conv.isLiter
                        ? 'LITER (1 LITER = 1.000 ML / 60 UNIT) + Pecahan ML'
                        : 'Botol (1 Botol = 50 ML / 3 UNIT) + Pecahan ML'}
                    </option>
                    <option value="ML">
                      Mililiter / ML (Input langsung ML, otomatis dipecah ke {conv.satuan} &amp; ML)
                    </option>
                    <option value="UNIT">
                      UNIT Mobil (1 UNIT = 16,67 ML)
                    </option>
                  </select>
                )}
              </div>
            )}

            {/* Dynamic Quantity Inputs */}
            {conv.type === 'FILM_PPF' && inputUnit === 'ROLL' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Stok Masuk (Roll)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={primaryQty}
                    onChange={(e) => setPrimaryQty(Math.max(0, parseInt(e.target.value) || 0))}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 500, color: '#374151' }}>
                      Pecahan ({secondaryUnit === 'CM' ? 'CM' : 'Meter'})
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (secondaryUnit === 'M') {
                          setSecondaryUnit('CM');
                          setSecondaryQty(Math.round(secondaryQty * 100));
                        } else {
                          setSecondaryUnit('M');
                          setSecondaryQty(parseFloat((secondaryQty / 100).toFixed(2)));
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#111827',
                        textDecoration: 'underline',
                        cursor: 'pointer'
                      }}
                    >
                      Ganti ke {secondaryUnit === 'M' ? 'CM' : 'Meter'}
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step={secondaryUnit === 'CM' ? '1' : '0.1'}
                    value={secondaryQty}
                    onChange={(e) => setSecondaryQty(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={inputStyle}
                  />
                </div>
              </div>
            ) : conv.type === 'COATING' && inputUnit === 'BOTOL' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Stok Masuk ({conv.satuan})</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={primaryQty}
                    onChange={(e) => setPrimaryQty(Math.max(0, parseInt(e.target.value) || 0))}
                    style={inputStyle}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>Pecahan Masuk (ml)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={secondaryQty}
                    onChange={(e) => setSecondaryQty(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={inputStyle}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label style={labelStyle}>
                  Jumlah Restock Masuk (
                  {inputUnit === 'CM'
                    ? 'Centimeter / CM'
                    : inputUnit === 'M'
                    ? 'Meter / m'
                    : inputUnit === 'ML'
                    ? 'Mililiter / ML'
                    : inputUnit === 'UNIT'
                    ? 'UNIT Mobil'
                    : item.satuan}
                  )
                </label>
                <input
                  type="number"
                  min="0"
                  step={inputUnit === 'M' || inputUnit === 'ML' ? '0.01' : '1'}
                  value={primaryQty}
                  onChange={(e) => setPrimaryQty(Math.max(0, parseFloat(e.target.value) || 0))}
                  style={inputStyle}
                  required
                />
                {inputUnit === 'CM' && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Pilih Cepat:</span>
                    {[300, 500, 1000, conv.cmPerRoll, conv.cmPerRoll * 2].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPrimaryQty(preset)}
                        style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#f3f4f6',
                          color: '#111827',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        +{formatThousand(preset)} CM
                      </button>
                    ))}
                  </div>
                )}
                {inputUnit === 'UNIT' && (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>Pilih Cepat:</span>
                    {[1, 2, 3, 6, 9].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setPrimaryQty(preset)}
                        style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          backgroundColor: '#f3f4f6',
                          color: '#111827',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        +{preset} UNIT ({preset % 3 === 0 ? `${preset / 3} Botol` : `${formatThousand(preset * 16.67, 2)} ML`})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Nama Supplier / Vendor</label>
                <input
                  type="text"
                  placeholder="Misal: PT Vansgard Indonesia"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>No. DO / Faktur</label>
                <input
                  type="text"
                  placeholder="PO-2026-0921"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Catatan Penerimaan Gudang</label>
              <textarea
                rows="2"
                placeholder="Kondisi kemasan rapi, segel pabrik utuh..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                style={{ ...inputStyle, resize: 'none' }}
              />
            </div>

            {/* Live Calculation Preview */}
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '13px',
                color: '#111827'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: '#4b5563', fontWeight: 500 }}>Penambahan Masuk:</span>
                <strong style={{ color: '#059669' }}>+{calc.actionSummary}</strong>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '6px',
                  borderTop: '1px solid #e5e7eb'
                }}
              >
                <span style={{ color: '#111827', fontWeight: 600 }}>Stok Akhir (Hasil Konversi):</span>
                <strong>{calc.resultSummary}</strong>
              </div>
            </div>
          </div>

          {/* Fixed Footer identik dengan AdminInventory.jsx */}
          <div
            style={{
              padding: '16px 24px',
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
                fontWeight: 600,
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
              disabled={isSubmitting || !calc.hasChanged}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: '#111827',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: isSubmitting || !calc.hasChanged ? 0.5 : 1
              }}
            >
              <Check size={16} />
              <span>{isSubmitting ? 'Menyimpan...' : 'Konfirmasi Restock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default RestockModal;
