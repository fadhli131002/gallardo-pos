import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import PrintOptionsModal from './PrintOptionsModal';
import SharedInvoice from './SharedInvoice';
import { formatCurrency } from '../data/mockData';

const PrintInvoiceHandler = ({ isOpen, onClose, transaction }) => {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setInvoiceOrder(null);
      setIsGeneratingPDF(false);
      setIsDownloading(false);
    }
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const getDynamicFileName = (order) => {
    if (!order) return 'Invoice_Tanpa_Nama';
    let rawName = 'Tanpa_Nama';
    if (order.type === 'RETAIL') {
      rawName = order.supplierName || 'Tanpa_Nama';
    } else {
      rawName = order.customerName || order.customer_name || (order.customer && order.customer.name) || 'Tanpa_Nama';
    }
    if (rawName.trim() === '') rawName = 'Tanpa_Nama';
    const cleanName = rawName.replace(/\s+/g, '_');
    
    let orderId = order.id || order.invoice_number || 'Tanpa_ID';
    if (String(orderId).startsWith('ORD-')) {
      orderId = String(orderId).replace('ORD-', 'WRK/300260700');
    }
    const cleanId = String(orderId).replace(/\//g, '-');
    return `Invoice_${cleanName}_${cleanId}`;
  };

  const handleDownloadInvoiceClick = async (orderToDownload) => {
    const element = document.getElementById('printable-invoice-wrapper-handler');
    if (!element || !orderToDownload) {
      setIsGeneratingPDF(false);
      return;
    }

    const dynamicFileName = getDynamicFileName(orderToDownload) + '.pdf';
    const originalTitle = document.title;
    document.title = getDynamicFileName(orderToDownload);

    const opt = {
      margin: 0,
      filename: dynamicFileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1024, ignoreElements: (el) => el.classList && el.classList.contains('no-print') },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Print failed", error);
    } finally {
      document.title = originalTitle;
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintModal_DirectPrint = () => {
    setIsGeneratingPDF(true);
    setInvoiceOrder(transaction);
    setTimeout(() => {
      const originalTitle = document.title;
      document.title = getDynamicFileName(transaction);
      
      const style = document.createElement('style');
      style.id = 'print-invoice-style';
      style.innerHTML = `
        @media print {
          body * { visibility: hidden; }
          #printable-invoice-wrapper-handler, #printable-invoice-wrapper-handler * { visibility: visible; }
          #printable-invoice-wrapper-handler {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `;
      document.head.appendChild(style);
      
      window.print();
      
      document.head.removeChild(style);
      document.title = originalTitle;
      
      setIsGeneratingPDF(false);
      setInvoiceOrder(null);
      onClose();
    }, 500);
  };

  const handlePrintModal_DownloadPDF = async () => {
    setIsGeneratingPDF(true);
    setInvoiceOrder(transaction);
    setIsDownloading(true);
    
    try {
      // Wait for SharedInvoice to render
      await new Promise(resolve => setTimeout(resolve, 500));
      await handleDownloadInvoiceClick(transaction); 
    } catch (error) {
      console.error("Gagal mendownload PDF:", error);
    } finally {
      setIsDownloading(false);
      onClose();
    }
  };

  const handlePrintModal_WhatsApp = () => {
    const order = transaction;
    const hp = order.customerHp || order.customer_phone;
    if (!hp) {
      toast.error('Nomor telepon customer tidak tersedia!');
      return;
    }
    
    let phone = hp.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    
    // Fallback amount calculations if cart/items isn't exactly the same as Admin
    const remaining = order.sisa_tagihan !== undefined ? order.sisa_tagihan : 
      ((order.cart || order.items || []).reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) - (order.discount || 0) + (order.tax || 0) - (order.amountPaid || 0));
    
    let orderId = order.id || order.invoice_number || 'Tanpa_ID';
    if (String(orderId).startsWith('ORD-')) {
      orderId = String(orderId).replace('ORD-', 'WRK/300260700');
    }
    const cleanId = String(orderId).replace(/\//g, '-');
    const custName = order.customerName || order.customer_name || '';

    const msg = `Halo Bapak/Ibu ${custName}, berikut adalah rincian Invoice ${cleanId} Anda dari Gallardo Autosport. Sisa Tagihan: ${remaining > 0 ? formatCurrency(remaining) : 'Lunas'}. Terima kasih telah mempercayakan kendaraan Anda kepada kami!`;

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <>
      <PrintOptionsModal
        isOpen={isOpen}
        onClose={onClose}
        title="Opsi Cetak Invoice"
        transaction={transaction}
        isDownloading={isDownloading}
        onPrint={handlePrintModal_DirectPrint}
        onDownload={handlePrintModal_DownloadPDF}
        onWhatsApp={handlePrintModal_WhatsApp}
      />

      {/* Hidden Invoice Template for PDF Generation */}
      {invoiceOrder && (
        <div id="printable-invoice-wrapper-handler" style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '794px' }}>
          <SharedInvoice order={invoiceOrder} />
        </div>
      )}

      {isGeneratingPDF && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(4px)' }}>
          <Loader2 className="animate-spin" size={48} color="#2563eb" style={{ marginBottom: '16px' }} />
          <p className="text-sm font-medium text-gray-700">Menyiapkan Dokumen...</p>
        </div>
      )}
    </>
  );
};

export default PrintInvoiceHandler;
