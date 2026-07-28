import React, { useRef, useEffect } from 'react';
import { X, Download, Shield } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import logoGallardo from '../assets/logo-gallardo.png';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export const hasWarranty = (order) => {
  if (!order || !order.items) return false;
  return order.items.some(item => 
    ['PPF', 'Coating', 'Kaca Film'].includes(item.category) || 
    ['PPF', 'Coating', 'Kaca Film'].includes(item.type)
  );
};

const WarrantyModal = ({ order, onClose }) => {
  const printRef = useRef();

  if (!order) return null;

  const getWarrantyDetails = (itemName, installDate) => {
    let years = 1; // Default
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

  const handleDownload = async () => {
    const element = printRef.current;
    if (!element) return;

    try {
      // 1. Buat Clone Element untuk di-capture di luar modal
      const clone = element.cloneNode(true);
      
      // Simpan scroll asli dan gulir ke paling atas (mencegah viewport clipping)
      const originalScrollY = window.scrollY;
      window.scrollTo(0, 0);

      // 2. Isolasi clone di posisi absolut agar tidak terpotong (clip) oleh batas layar
      Object.assign(clone.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        zIndex: '-1',
        margin: '0',
        boxShadow: 'none',
        transform: 'none'
      });
      document.body.appendChild(clone);

      // Jeda agar DOM merender clone
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(clone, {
        scale: 3, // Perbesar scale agar resolusi tinggi
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // 4. Bersihkan clone
      document.body.removeChild(clone);

      // Kembalikan scroll ke posisi semula
      window.scrollTo(0, originalScrollY);

      const imgData = canvas.toDataURL('image/png');

      // Inisialisasi jsPDF ukuran A6 kembali
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a6' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Tambahkan margin fisik (8mm) agar gambar tidak menempel ke ujung kertas PDF
      const pdfMargin = 8;
      const safePdfWidth = pdfWidth - (pdfMargin * 2);
      const safePdfHeight = pdfHeight - (pdfMargin * 2);

      const imgProps = pdf.getImageProperties(imgData);
      const ratio = Math.min(safePdfWidth / imgProps.width, safePdfHeight / imgProps.height);

      const finalWidth = imgProps.width * ratio;
      const finalHeight = imgProps.height * ratio;

      // Letakkan di tengah (otomatis menyisakan ruang/spasi di atas dan bawah)
      const marginX = (pdfWidth - finalWidth) / 2;
      const marginY = (pdfHeight - finalHeight) / 2;

      // Tempel gambar dan langsung simpan (tanpa garis potong)
      pdf.addImage(imgData, 'PNG', marginX, marginY, finalWidth, finalHeight);

      // Generate Nama File Dinamis (Sesuaikan variabel order Anda)
      const customerName = order.customerName || 'TanpaNama';
      const chassis = (order.chassisNumber && order.chassisNumber !== '-') ? order.chassisNumber : (order.engineNumber || 'TanpaRangka');
      const productName = (order.items && order.items.length > 0) ? (order.items[0].name || order.items[0].varian) : (order.service || 'Produk');
      
      const installationDateStr = order.completedAt || order.updatedAt || order.date || new Date();
      const { years } = getWarrantyDetails(productName, new Date(installationDateStr));
      
      const rawFileName = `Garansi_${customerName}_${chassis}_${productName}_${years}Tahun.pdf`;
      const fileName = rawFileName.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '_');
      
      pdf.save(fileName);
    } catch (error) {
      console.error("Gagal generate PDF: ", error);
    }
  };


  
  // 3. Logika Tanggal Instalasi & Kalkulasi Maintenance
  const installationDateStr = order.completedAt || order.updatedAt || order.date || new Date();
  const installationDate = new Date(installationDateStr);
  
  const maintenanceDate = new Date(installationDate);
  maintenanceDate.setDate(maintenanceDate.getDate() + 30); // Persis 1 Bulan (30 Hari)

  // Ambil data produk utama untuk menentukan angka tahun dinamis pada badge Shield
  const mainProductName = (order.items && order.items.length > 0) ? (order.items[0].name || order.items[0].varian) : (order.service || 'Produk');
  const { years: badgeYears } = getWarrantyDetails(mainProductName, installationDate);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay animate-fade-in" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      
      {/* Floating Action Bar */}
      <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '12px 16px', backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(4px)', borderRadius: '16px', marginBottom: '24px', width: '100%', maxWidth: '460px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }} onClick={e => e.stopPropagation()}>
        <button onClick={handleDownload} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)', fontSize: '14px' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#059669'; e.currentTarget.style.transform = 'translateY(-1px)' }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#10b981'; e.currentTarget.style.transform = 'none' }}>
          <Download size={18} /> Unduh PDF (A6)
        </button>
        <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px', backgroundColor: '#ffffff', color: '#4b5563', border: '1px solid #d1d5db', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#111827' }} onMouseOut={e => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#4b5563' }}>
          <X size={20} />
        </button>
      </div>

      <div className="modal-content animate-scale-up" style={{ width: '460px', maxWidth: '100%', position: 'relative', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)' }} onClick={e => e.stopPropagation()}>
        
        {/* Certificate Preview Container */}
        <div style={{ backgroundColor: 'transparent', display: 'flex', justifyContent: 'center', overflowY: 'auto', paddingBottom: '16px' }} className="custom-scrollbar">
          <div className="flex justify-center" style={{ borderRadius: '4px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <div 
              ref={printRef}
              className="bg-white text-black px-10 py-12 relative w-[420px] min-h-[595px] flex flex-col justify-between shrink-0 box-border"
              style={{ 
                border: '1px solid #e5e7eb'
              }}
            >
            {/* 2. Header */}
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
                <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#000' }}>{order.customerName || '-'}</p>
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
                      <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: '#000' }}>{item.name}</p>
                      <p style={{ fontSize: '0.8rem', color: '#333', margin: 0, fontWeight: '500' }}>Valid: {format(installationDate, 'dd MMM yyyy')} - {format(expiryDate, 'dd MMM yyyy')}</p>
                    </div>
                  );
                })
              ) : (
                (() => {
                  const { expiryDate } = getWarrantyDetails(order.service, installationDate);
                  return (
                    <div className="flex flex-col gap-2 mb-3">
                      <p style={{ fontSize: '1rem', fontWeight: '600', margin: 0, color: '#000' }}>{order.service || '-'}</p>
                      <p style={{ fontSize: '0.8rem', color: '#333', margin: 0, fontWeight: '500' }}>Valid: {format(installationDate, 'dd MMM yyyy')} - {format(expiryDate, 'dd MMM yyyy')}</p>
                    </div>
                  );
                })()
              )}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '24px' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#000', margin: '0 0 16px' }}>Jadwal Maintenance: {format(maintenanceDate, 'dd MMMM yyyy', { locale: id })}</p>
                <p style={{ fontSize: '0.65rem', color: '#6b7280', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Installation Date</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#000' }}>{format(installationDate, 'dd MMM yyyy')}</p>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg viewBox="0 0 130 130" width="110" height="110" style={{ backgroundColor: '#ffffff' }}>
                  <defs>
                    {/* Path Atas: Mulai dari bawah (6 o'clock), searah jarum jam ke atas (12 o'clock), kembali ke bawah */}
                    <path id="topArc" d="M 65 109 A 44 44 0 0 1 65 21 A 44 44 0 0 1 65 109" />
                    {/* Path Bawah: Mulai dari atas (12 o'clock), berlawanan jarum jam ke bawah (6 o'clock), kembali ke atas */}
                    <path id="bottomArc" d="M 65 15 A 50 50 0 0 0 65 115 A 50 50 0 0 0 65 15" />
                  </defs>

                  {/* Outer Solid */}
                  <circle cx="65" cy="65" r="62" fill="none" stroke="#000000" strokeWidth="2" />
                  {/* Outer Dashed */}
                  <circle cx="65" cy="65" r="56" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="4,3" />
                  {/* Inner Dashed */}
                  <circle cx="65" cy="65" r="38" fill="none" stroke="#000000" strokeWidth="1.2" strokeDasharray="4,3" />

                  {/* Circular Texts */}
                  <text fill="#000000" fontSize="10" fontWeight="bold" fontFamily="Montserrat, Arial, sans-serif" style={{ letterSpacing: '2px' }}>
                    <textPath href="#topArc" startOffset="50%" textAnchor="middle">GALLARDO AUTO SPORT</textPath>
                  </text>

                  <text fill="#000000" fontSize="10" fontWeight="bold" fontFamily="Montserrat, Arial, sans-serif" style={{ letterSpacing: '2px' }}>
                    <textPath href="#bottomArc" startOffset="50%" textAnchor="middle">WARRANTY</textPath>
                  </text>

                  {/* Inner Content */}
                  <text x="65" y="74" fill="#000000" fontSize="42" fontWeight="900" fontFamily="Montserrat, Arial, sans-serif" textAnchor="middle">{badgeYears}</text>
                  <text x="65" y="88" fill="#000000" fontSize="10" fontWeight="bold" fontFamily="Montserrat, Arial, sans-serif" textAnchor="middle" style={{ letterSpacing: '2px' }}>YEARS</text>
                </svg>
              </div>
            </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyModal;
