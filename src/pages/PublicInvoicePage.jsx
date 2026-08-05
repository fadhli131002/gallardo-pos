import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SharedInvoice from '../components/SharedInvoice';
import { Printer } from 'lucide-react';
import { formatCurrency } from '../data/mockData';

const PublicInvoicePage = () => {
  const { transactionId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!transactionId) return;
      try {
        const response = await fetch(`${window.API_URL || ''}/api/transactions/public/${transactionId}`);
        if (!response.ok) {
          throw new Error('Invoice tidak ditemukan');
        }
        const trx = await response.json();
        
        const isLunas = (trx.status_pembayaran || '').toUpperCase() === 'LUNAS' || (trx.sisa_tagihan <= 0);
        const remainingAmount = isLunas ? 0 : (trx.sisa_tagihan || 0);
        const paidAmount = isLunas ? (trx.total_amount || 0) : Math.max(0, (trx.total_amount || 0) - remainingAmount);
        
        const orderObj = {
          id: trx.id,
          customerName: trx.customer_name || 'Pelanggan Umum (Tanpa Nama)',
          customerHp: trx.customer_phone || '-',
          customerAddress: trx.customer_address || '-',
          carBrand: trx.car_brand || trx.carBrand || 'Toyota',
          carModel: trx.car_model || trx.carModel || 'Camry',
          carColor: trx.car_color || trx.carColor || '',
          plateNumber: trx.plate_number || trx.plateNumber || 'B 1234 XYZ',
          chassisNumber: trx.chassis_number || trx.chassisNumber || '-',
          engineNumber: trx.engine_number || trx.engineNumber || '-',
          carYear: trx.car_year || trx.carYear || '-',
          installationDate: trx.installation_date || trx.installationDate || '',
          installationTime: trx.installation_time || trx.installationTime || '',
          service: (trx.items || []).map(item => `${item.product_name} (x${item.quantity || 1})`).join(', ') || 'Layanan POS',
          totalPrice: trx.total_amount || 0,
          discount: trx.discount || 0,
          paidAmount: paidAmount,
          remainingAmount: remainingAmount,
          paymentType: trx.payment_type || (isLunas ? 'Lunas' : (trx.status_pembayaran || 'Belum Bayar')),
          paymentMethod: trx.payment_method || 'Penagihan',
          terminSchedule: (() => {
            try {
              return trx.termin_schedule ? JSON.parse(trx.termin_schedule) : [];
            } catch (e) {
              return [];
            }
          })(),
          spgName: trx.event || null,
          date: trx.created_at || new Date().toISOString(),
          type: trx.type || 'WORKSHOP',
          status: trx.status_pembayaran || 'OPEN',
          location: 'Gallardo',
          notes: trx.notes || '',
          items: (trx.items || []).map(item => ({
            name: item.product_name,
            finalPrice: item.price,
            qty: item.quantity,
            notes: item.product_note
          })),
          paymentHistory: (trx.payments || []).map(p => ({
            date: p.created_at || new Date().toISOString(),
            amount: p.amount,
            method: p.method,
            notes: p.notes,
            paymentProof: p.payment_proof || null
          })),
        };
        setOrder(orderObj);
      } catch (err) {
        console.error(err);
        setError('Invoice tidak ditemukan atau terjadi kesalahan server.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [transactionId]);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-gray-500 font-medium">Memuat data invoice...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <p className="text-red-500 font-bold mb-4">{error || 'Invoice tidak ditemukan!'}</p>
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
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded shadow transition-colors"
          >
            <Printer size={16} /> Cetak / Simpan PDF
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

export default PublicInvoicePage;
