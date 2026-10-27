import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, SlidersHorizontal, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const ADJUST_REASONS = [
  'Stok Opname Rutin Akhir Shift',
  'Penyesuaian Fisik Aktual Gudang',
  'Barang Rusak / Cacat Pabrik / Bocor',
  'Sisa Potongan Pemasangan Workshop',
  'Koreksi Salah Input Kasir / Transaksi',
  'Sampel Uji / Display Pelanggan',
  'Lainnya (Tuliskan di Catatan)'
];

const AdjustModal = ({ isOpen, onClose, item, onConfirmAdjust, onFlagIssue }) => {
  const [physicalUtama, setPhysicalUtama] = useState(0);
  const [physicalPecahan, setPhysicalPecahan] = useState(0);
  const [reason, setReason] = useState(ADJUST_REASONS[0]);
  const [note, setNote] = useState('');
  const [alsoCreateTicket, setAlsoCreateTicket] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setPhysicalUtama(Number(item.stokUtama || 0));
      setPhysicalPecahan(Number(item.stokPecahan || 0));
      setReason(ADJUST_REASONS[0]);
      setNote('');
      setAlsoCreateTicket(false);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const currentUtama = Number(item.stokUtama || 0);
  const currentPecahan = Number(item.stokPecahan || 0);
  const targetUtama = Number(physicalUtama || 0);
  const targetPecahan = Number(physicalPecahan || 0);

  const diffUtama = targetUtama - currentUtama;
  const diffPecahan = targetPecahan - currentPecahan;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmAdjust({
        itemId: item.id,
        stokUtama: targetUtama,
        stokPecahan: targetPecahan,
        diffUtama,
        diffPecahan,
        reason,
        note: note || reason
      });

      // If user checked "Also flag issue in Comms", trigger ticket creation
      if (alsoCreateTicket && diffUtama !== 0 && onFlagIssue) {
        onFlagIssue({
          inventoryId: item.id,
          physicalStock: targetUtama,
          priority: Math.abs(diffUtama) >= 2 ? 'HIGH' : 'MEDIUM',
          initialMessage: `Penyesuaian Stok Opname: Fisik ${targetUtama} ${item.satuan} vs Sistem ${currentUtama} ${item.satuan} (Selisih: ${diffUtama}). Alasan: ${reason}. Catatan: ${note || '-'}`
        });
      }

      toast.success(`Stok opname ${item.brand} ${item.varian} berhasil disesuaikan ke ${targetUtama} ${item.satuan}!`);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Gagal menyimpan penyesuaian stok');
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
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <SlidersHorizontal size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Penyesuaian Stok (Stok Opname)
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
            {/* Target Item Details */}
            <div className="p-3.5 bg-gray-50 dark:bg-[#252525] rounded-xl border border-gray-200/80 dark:border-neutral-700/80">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                Item Sasaran
              </span>
              <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                {item.brand} {item.varian} {item.kegelapan && `(${item.kegelapan})`}
              </p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Stok Sistem Saat Ini:</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  {currentUtama} {item.satuan} {currentPecahan > 0 ? `+ ${currentPecahan} ${item.kategori === 'Coating' ? 'ml' : 'm'}` : ''}
                </span>
              </div>
            </div>

            {/* Inputs: Physical count */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Stok Fisik Aktual ({item.satuan}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={physicalUtama}
                  onChange={(e) => setPhysicalUtama(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white font-mono font-bold"
                  required
                />
              </div>

              {(item.kategori === 'Kaca Film' || item.kategori === 'PPF' || item.kategori === 'Coating') && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Fisik Pecahan ({item.kategori === 'Coating' ? 'ml' : 'Meter'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={physicalPecahan}
                    onChange={(e) => setPhysicalPecahan(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white font-mono font-medium"
                  />
                </div>
              )}
            </div>

            {/* Variance indicator banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
              diffUtama === 0
                ? 'bg-gray-50 dark:bg-neutral-800/60 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300'
                : diffUtama > 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
            }`}>
              <div className="flex items-center gap-2">
                {diffUtama !== 0 ? <AlertTriangle size={16} /> : <Check size={16} />}
                <span className="font-semibold">
                  {diffUtama === 0
                    ? 'Stok Sesuai (Tidak Ada Selisih)'
                    : diffUtama > 0
                    ? `Surplus Fisik: +${diffUtama} ${item.satuan}`
                    : `Defisit Fisik: ${diffUtama} ${item.satuan}`}
                </span>
              </div>
              <div className="font-mono text-xs font-bold">
                {currentUtama} &rarr; <span className="underline">{targetUtama} {item.satuan}</span>
              </div>
            </div>

            {/* Reason selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Alasan Penyesuaian *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
              >
                {ADJUST_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Note text */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Keterangan Tambahan
              </label>
              <textarea
                rows="2"
                placeholder="Detail hasil pemeriksaan fisik rak gudang..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white resize-none"
              ></textarea>
            </div>

            {/* Checkbox to flag discrepancy to Comms */}
            {diffUtama !== 0 && (
              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={alsoCreateTicket}
                  onChange={(e) => setAlsoCreateTicket(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">
                  Buat tiket di <strong>Stock Discrepancy Comms</strong> agar admin mengetahui selisih ini
                </span>
              </label>
            )}

            {/* Footer */}
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
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Check size={16} />
                {isSubmitting ? 'Menyimpan...' : 'Simpan Penyesuaian'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default AdjustModal;
