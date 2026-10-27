import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Flag, AlertTriangle, Send, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const NewDiscrepancyModal = ({ isOpen, onClose, inventory = [], preselectedItem = null, onSubmitTicket }) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [physicalStock, setPhysicalStock] = useState(0);
  const [priority, setPriority] = useState('HIGH');
  const [initialMessage, setInitialMessage] = useState('');

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id);
      setPhysicalStock(Math.max(0, Number(preselectedItem.stokUtama || 0) - 1));
      setPriority('HIGH');
      setInitialMessage(`Admin, mohon dicek fisik barang di rak gudang tidak sesuai dengan sistem.`);
    } else if (inventory.length > 0 && !selectedItemId) {
      setSelectedItemId(inventory[0].id);
      setPhysicalStock(Number(inventory[0].stokUtama || 0));
    }
  }, [preselectedItem, isOpen]);

  if (!isOpen) return null;

  const currentItem = inventory.find(i => i.id === selectedItemId);
  const currentSystemStock = currentItem ? Number(currentItem.stokUtama || 0) : 0;
  const parsedPhysical = Number(physicalStock || 0);
  const diff = parsedPhysical - currentSystemStock;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedItemId) {
      toast.error('Pilih item terlebih dahulu');
      return;
    }

    onSubmitTicket({
      inventoryId: selectedItemId,
      physicalStock: parsedPhysical,
      priority,
      initialMessage
    });

    onClose();
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
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <Flag size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Lapor Selisih Stok (Discrepancy)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Kirimkan notifikasi & tiket pembahasan ke Admin Pusat
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
            {/* Item selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Pilih Item Bermasalah *
              </label>
              <select
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  const found = inventory.find(i => i.id === e.target.value);
                  if (found) {
                    setPhysicalStock(Number(found.stokUtama || 0));
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white"
                required
              >
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>
                    [{item.id}] {item.brand} {item.varian} - Stok: {item.stokUtama} {item.satuan}
                  </option>
                ))}
              </select>
            </div>

            {/* Current vs Physical Counts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-800">
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-medium">
                  Stok di Sistem
                </span>
                <span className="text-xl font-bold font-mono text-gray-900 dark:text-white mt-1 block">
                  {currentSystemStock} <span className="text-xs font-normal text-gray-500">{currentItem?.satuan}</span>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Stok Fisik Ditemukan *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={physicalStock}
                  onChange={(e) => setPhysicalStock(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* Difference preview */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              diff === 0
                ? 'bg-gray-50 dark:bg-neutral-800/60 border-gray-200 dark:border-neutral-700 text-gray-600 dark:text-gray-300'
                : diff < 0
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle size={15} />
                <span>Selisih Fisik:</span>
              </div>
              <span className="font-mono font-bold text-sm">
                {diff > 0 ? `+${diff}` : diff} {currentItem?.satuan}
              </span>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tingkat Urgensi (Priority)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      priority === p
                        ? p === 'CRITICAL'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : p === 'HIGH'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                          : 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-neutral-800 hover:border-gray-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Initial Note / Chat Message */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Pesan Laporan untuk Admin *
              </label>
              <textarea
                rows="3"
                placeholder="Contoh: Admin, fisik botol Rantiz sisa 18 di rak B, di sistem sisa 20. Mohon diverifikasi."
                value={initialMessage}
                onChange={(e) => setInitialMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none dark:text-white resize-none"
                required
              ></textarea>
            </div>

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
                className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 rounded-lg shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Send size={15} />
                Kirim Laporan Tiket
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default NewDiscrepancyModal;
