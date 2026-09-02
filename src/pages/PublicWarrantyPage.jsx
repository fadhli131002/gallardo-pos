import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import logoGallardo from '../assets/logo-gallardo.png';

const getWarrantyDetails = (itemName, installDate) => {
  let years = 1;
  const nameStr = (itemName || '').toLowerCase();
  
  if (nameStr.includes('ultra') || nameStr.includes('matte')) {
    years = 5;
  } else if (nameStr.includes('armor') || nameStr.includes('super safe')) {
    years = 10;
  } else if (nameStr.includes('iron')) {
    years = 2;
  } else if (nameStr.includes('performante')) {
    years = 5;
  } else if (nameStr.includes('deluxe')) {
    years = 7;
  } else if (nameStr.includes('9h') || nameStr.includes('14h')) {
    years = 3;
  } else if (nameStr.includes('20h')) {
    years = 5;
  }
  
  const expiryDate = new Date(installDate);
  expiryDate.setFullYear(expiryDate.getFullYear() + years);
  
  return { years, expiryDate };
};

const PublicWarrantyPage = () => {
  const params = useParams();
  const transactionId = params['*'];
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const printRef = useRef(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!transactionId) return;
      try {
        const response = await fetch(`${window.API_URL || ''}/api/transactions/public/${transactionId}`);
        if (!response.ok) {
          throw new Error('Data tidak ditemukan');
        }
        const trx = await response.json();
        
        const orderObj = {
          id: trx.id,
          customerName: trx.customer_name || 'Pelanggan',
          customerHp: trx.customer_phone || '-',
          carBrand: trx.car_brand || trx.carBrand || '',
          carModel: trx.car_model || trx.carModel || '',
          plateNumber: trx.plate_number || trx.plateNumber || '-',
          chassisNumber: trx.chassis_number || trx.chassisNumber || '-',
          engineNumber: trx.engine_number || trx.engineNumber || '-',
          installationDate: trx.installation_date || trx.installationDate || trx.created_at || new Date().toISOString(),
          service: (trx.items || []).map(item => `${item.product_name} (x${item.quantity || 1})`).join(', ') || 'Layanan POS',
          items: (trx.items || []).map(item => ({
            name: item.product_name,
            finalPrice: item.price,
            qty: item.quantity,
          })),
        };
        setOrder(orderObj);
      } catch (err) {
        console.error(err);
        setError('Garansi tidak ditemukan atau terjadi kesalahan server.');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [transactionId]);

  useEffect(() => {
    if (order) {
      document.title = `Garansi_${order.customerName}`;
    } else {
      document.title = "POS Gallardo - Garansi";
    }
  }, [order]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <p className="text-gray-500 font-medium">Memuat data garansi...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-100">
        <p className="text-red-500 font-bold mb-4">{error || 'Garansi tidak ditemukan!'}</p>
        <button 
          onClick={() => window.close()}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          Tutup Halaman
        </button>
      </div>
    );
  }

  const customerName = order.customerName || 'TanpaNama';
  const chassis = (order.chassisNumber && order.chassisNumber !== '-') ? order.chassisNumber : (order.engineNumber || 'TanpaRangka');
  const productName = (order.items && order.items.length > 0) ? (order.items[0].name || order.items[0].varian) : (order.service || 'Produk');
  const installationDateStr = order.installationDate || new Date();
  const installationDate = new Date(installationDateStr);
  
  const { years: badgeYears } = getWarrantyDetails(productName, installationDate);
  const maintenanceDate = new Date(installationDate);
  maintenanceDate.setDate(maintenanceDate.getDate() + 30);

  const getDynamicFileName = () => {
    const rawFileName = `Garansi_${customerName}_${chassis}_${productName}_${badgeYears}Tahun`;
    return rawFileName.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_');
  };

  const handleDownload = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a6' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const pdfMargin = 8;
      const safePdfWidth = pdfWidth - (pdfMargin * 2);
      const safePdfHeight = pdfHeight - (pdfMargin * 2);

      const imgProps = pdf.getImageProperties(imgData);
      const ratio = Math.min(safePdfWidth / imgProps.width, safePdfHeight / imgProps.height);

      const finalWidth = imgProps.width * ratio;
      const finalHeight = imgProps.height * ratio;

      const marginX = (pdfWidth - finalWidth) / 2;
      const marginY = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'PNG', marginX, marginY, finalWidth, finalHeight);
      pdf.save(getDynamicFileName() + '.pdf');
    } catch (error) {
      console.error("Gagal generate PDF Garansi: ", error);
      alert('Gagal mendownload PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 font-sans">
      <div className="mb-6">
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-5 py-2.5 rounded-lg shadow-md font-medium transition-all hover:-translate-y-0.5"
        >
          <Download size={18} /> Simpan PDF Garansi
        </button>
      </div>

      <div 
        ref={printRef}
        className="bg-white text-black relative w-[420px] min-h-[595px] flex flex-col justify-between shrink-0 box-border shadow-2xl rounded"
        style={{ padding: '40px' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <img src={logoGallardo} alt="GALLARDO AUTOSPORT" style={{ height: '40px', margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: '300', color: '#000000', margin: '0 0 8px', letterSpacing: '2px' }}>DIGITAL WARRANTY</h1>
          <p style={{ color: '#333333', fontSize: '0.7rem', letterSpacing: '4px', textTransform: 'uppercase', margin: 0, fontWeight: '500' }}>Certificate of Authenticity</p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '16px', width: '100%' }} />

        {/* Grid Data Customer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Name</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#000' }}>{customerName}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Contact Number</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#000' }}>{order.customerHp || '-'}</p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '16px', width: '100%' }} />

        {/* Grid Data Kendaraan */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Vehicle Brand & Model</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 16px', color: '#000' }}>{order.carBrand} {order.carModel}</p>
            
            <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Chassis Number (VIN)</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#000' }}>{order.chassisNumber || '-'}</p>
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>License Plate</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 16px', color: '#000' }}>{order.plateNumber || '-'}</p>
            
            <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Engine Number</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#000' }}>{order.engineNumber || '-'}</p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', marginBottom: '16px', width: '100%' }} />

        {/* Daftar Produk */}
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Products Installed & Warranty</p>
          
          {order.items && order.items.length > 0 ? (
            order.items.map((item, idx) => {
              const { expiryDate } = getWarrantyDetails(item.name || item.varian, installationDate);
              return (
                <div key={idx} className="flex flex-col gap-2 mb-3">
                  <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: '#000' }}>{item.name || item.varian}</p>
                  <p style={{ fontSize: '0.8rem', color: '#333', margin: 0, fontWeight: '500' }}>Valid: {format(installationDate, 'dd MMM yyyy')} - {format(expiryDate, 'dd MMM yyyy')}</p>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col gap-2 mb-3">
              <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: '#000' }}>{order.service || '-'}</p>
              <p style={{ fontSize: '0.8rem', color: '#333', margin: 0, fontWeight: '500' }}>Valid: {format(installationDate, 'dd MMM yyyy')} - {format(getWarrantyDetails(order.service, installationDate).expiryDate, 'dd MMM yyyy')}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#000', margin: '0 0 16px' }}>Jadwal Maintenance: {format(maintenanceDate, 'dd MMMM yyyy', { locale: localeId })}</p>
            <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Installation Date</p>
            <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#000' }}>{format(installationDate, 'dd MMM yyyy')}</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 130 130" width="110" height="110" style={{ backgroundColor: '#ffffff' }}>
              <defs>
                <path id="topArc" d="M 65 109 A 44 44 0 0 1 65 21 A 44 44 0 0 1 65 109" />
                <path id="bottomArc" d="M 65 15 A 50 50 0 0 0 65 115 A 50 50 0 0 0 65 15" />
              </defs>
              <circle cx="65" cy="65" r="62" fill="none" stroke="#000000" strokeWidth="2" />
              <circle cx="65" cy="65" r="56" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="4,3" />
              <circle cx="65" cy="65" r="38" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="4,3" />
              <text fill="#000000" fontSize="10" fontWeight="bold" fontFamily="Montserrat, Arial, sans-serif" style={{ letterSpacing: '2px' }}>
                <textPath href="#topArc" startOffset="50%" textAnchor="middle">GALLARDO AUTO SPORT</textPath>
              </text>
              <text fill="#000000" fontSize="10" fontWeight="bold" fontFamily="Montserrat, Arial, sans-serif" style={{ letterSpacing: '2px' }}>
                <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">WARRANTY</textPath>
              </text>
              <text x="65" y="74" fill="#000000" fontSize="42" fontWeight="900" fontFamily="Montserrat, Arial, sans-serif" textAnchor="middle">{badgeYears}</text>
              <text x="65" y="88" fill="#000000" fontSize="10" fontWeight="bold" fontFamily="Montserrat, Arial, sans-serif" textAnchor="middle" style={{ letterSpacing: '2px' }}>YEARS</text>
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PublicWarrantyPage;
