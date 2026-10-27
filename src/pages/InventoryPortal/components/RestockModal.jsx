import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowDownRight, PackagePlus, Check, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const RestockModal = ({ isOpen, onClose, item, onConfirmRestock }) => {
  const [qtyUtama, setQtyUtama] = useState(1);
  const [qtyPecahan, setQtyPecahan] = useState(0);
  const [supplierName, setSupplierName] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setQtyUtama(1);
      setQtyPecahan(0);
      setSupplierName(item.brand ? `Supplier ${item.brand}` : '');
      setInvoiceRef(`PO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`);
      setNote('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const currentUtama = Number(item.stokUtama || 0);
  const currentPecahan = Number(item.stokPecahan || 0);
  const addUtama = Math.max(0, Number(qtyUtama || 0));
  const addPecahan = Math.max(0, Number(qtyPecahan || 0));

  const newUtama = currentUtama + addUtama;
  const newPecahan = currentPecahan + addPecahan;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (addUtama <= 0 && addPecahan <= 0) {
      toast.error('Jumlah restock harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmRestock({
        itemId: item.id,
        stokUtama: newUtama,
        stokPecahan: newPecahan,
        addedUtama: addUtama,
        addedPecahan: addPecahan,
        supplierName,
        invoiceRef,
        note: note || `Restock supplier ${supplierName || 'Pusat'} (${invoiceRef || 'Manual'})`
      });
      toast.success(`Restock ${item.brand} ${item.varian} (+${addUtama} ${item.satuan}) berhasil!`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Gagal memproses restock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-900/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <PackagePlus size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Restock Barang Masuk
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.id} &bull; {item.kategori}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Target Item Info */}
            <div className="p-3.5 bg-gray-50 dark:bg-[#252525] rounded-xl border border-gray-200/80 dark:border-neutral-700/80">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Item Sasaran
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                {item.brand} {item.varian} {item.kegelapan && `(${item.kegelapan})`}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-300">
                <span>Stok Sistem Saat Ini: <strong>{currentUtama} {item.satuan}</strong></span>
                {item.stokPecahan > 0 && (
                  <span>Pecahan: <strong>{currentPecahan} {item.kategori === 'Coating' ? 'ml' : 'm'}</strong></span>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Qty Masuk ({item.satuan}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={qtyUtama}
                  onChange={(e) => setQtyUtama(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono font-medium"
                  required
                />
              </div>

              {(item.kategori === 'Kaca Film' || item.kategori === 'PPF' || item.kategori === 'Coating') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Pecahan Masuk ({item.kategori === 'Coating' ? 'ml' : 'Meter'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={qtyPecahan}
                    onChange={(e) => setQtyPecahan(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono font-medium"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Nama Supplier / Vendor
                </label>
                <input
                  type="text"
                  placeholder="e.g. PT Vansgard Indonesia"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  No. DO / Faktur Pengiriman
                </label>
                <input
                  type="text"
                  placeholder="PO-2026-0921"
                  value={invoiceRef}
                  onChange={(e) => setInvoiceRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Catatan Penerimaan Gudang
              </label>
              <textarea
                rows="2"
                placeholder="Kondisi kemasan rapi, segel pabrik utuh..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white resize-none"
              ></textarea>
            </div>

            {/* Live Calculation Preview Banner */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs">
              <span className="text-emerald-800 dark:text-emerald-300 font-medium">
                Kalkulasi Stok Akhir:
              </span>
              <div className="font-mono font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                {currentUtama} + {addUtama} = <span className="underline">{newUtama} {item.satuan}</span>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Check size={16} />
                {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Restock'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default RestockModal;
