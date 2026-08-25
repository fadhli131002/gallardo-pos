import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import SharedInvoice from '../components/SharedInvoice';
import { Printer, MessageCircle, X } from 'lucide-react';
import { formatCurrency } from '../data/mockData';

const InvoicePrintPage = () => {
  const { transactionId } = useParams();
  const { orders } = useOrders();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orders && transactionId) {
      // transactionId di URL mungkin ID asli yg ada slash (WRK-26080010038)
      // Kita perlu mencari order yang cocok
      const found = orders.find(o =>
        String(o.id).replace(/\//g, '-') === transactionId ||
        String(o.id) === transactionId ||
        String(o.dbId) === transactionId ||
        String(o.transaction_id) === transactionId
      );
      if (found) {
        setOrder(found);
      }
    }
  }, [orders, transactionId]);
  useEffect(() => {
    if (order) {
      const customerName = (order.customerName || order.customer_name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const invoiceNo = String(order.id || 'INV').replace(/\//g, '-').replace(/[^a-zA-Z0-9-]/g, '_');

      document.title = `Invoice_${invoiceNo}_${customerName}`;
    }

    return () => {
      document.title = "POS Gallardo";
    };
  }, [order]);

  if (!orders || orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-gray-500 font-medium">Memuat data invoice...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <p className="text-red-500 font-bold mb-4">Invoice tidak ditemukan!</p>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          Tutup Halaman
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    const hp = order.customerHp || order.customer_phone;
    if (!hp) {
      alert('Nomor telepon customer tidak tersedia!');
      return;
    }
    let phone = hp.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    const remaining =
      order.sisa_tagihan !== undefined
        ? order.sisa_tagihan
        : (order.cart || order.items || []).reduce((sum, item) => sum + item.price * (item.quantity || 1), 0) -
        (order.discount || 0) +
        (order.tax || 0) -
        (order.amountPaid || 0);
    const cleanId = String(order.id).replace(/\//g, '-');
    const custName = order.customerName || order.customer_name || '';

    // Create public link
    const baseUrl = import.meta.env.VITE_PUBLIC_URL || window.location.origin;
    const publicLink = `${baseUrl}/public/invoice/${cleanId}`;

    const msg = `Halo Bapak/Ibu ${custName}, berikut adalah rincian Invoice ${cleanId} Anda dari Gallardo Autosport.

Klik link berikut untuk melihat/mengunduh Invoice resmi Anda:
${publicLink}

Sisa Tagihan: ${remaining > 0 ? formatCurrency(remaining) : 'Lunas'}.
Terima kasih telah mempercayakan kendaraan Anda kepada kami!`;
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <style>{`
        /* 1. Kunci Container Invoice ke Ukuran A4 Asli */
        .printable-invoice-container {
          width: 210mm !important;
          min-height: 297mm !important;
          padding: 15mm 20mm !important;
          margin: 0 auto !important;
          background: #ffffff !important;
          box-sizing: border-box !important;
        }

        /* 2. CSS Khusus Cetak/Print */
        @media print {
          @page {
            size: A4 portrait !important;
            margin: 0 !important; /* Hilangkan header/footer bawaan browser */
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          /* Sembunyikan Header Mode & Action Bar */
          .no-print, header, nav, .action-bar {
            display: none !important;
          }

          /* Hilangkan style parent wrapper */
          .no-print-bg {
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important;
            display: block !important;
          }

          /* Bikin Container Memenuhi 1 Kertas A4 Utuh */
          .printable-invoice-container {
            width: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      {/* Floating Action Bar (Hidden when printing) */}
      <div className="no-print sticky top-0 z-50 bg-white shadow-md border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="font-bold text-gray-800">
          Invoice Print Mode
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gray-800 hover:bg-black text-white px-4 py-2 rounded font-medium transition-colors"
          >
            <Printer size={16} /> Cetak / Simpan PDF
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            <MessageCircle size={16} /> Kirim ke WhatsApp
          </button>
          <button
            onClick={() => window.close()}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            <X size={16} /> Tutup
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="flex justify-center bg-gray-100 py-8 no-print-bg">
        <div className="printable-invoice-container shadow-2xl">
          <SharedInvoice order={order} />
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintPage;
