import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarClock, CalendarRange, Download, ChevronLeft, ChevronRight, Search, Loader2, MoreVertical, Edit2, CheckCircle, Clock, FileText, X } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { id } from 'date-fns/locale';
import { useOrders } from '../../context/OrderContext';
import '../Dashboard/Dashboard.css';

const AdminScheduling = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Custom Date Range State for Export
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua'); // New state for status filter
  const [bookingSlotBranch, setBookingSlotBranch] = useState('Gallardo'); // Branch filter for calendar
  const [calendarView, setCalendarView] = useState('bulan'); // 'bulan' or 'minggu'
  const [isExporting, setIsExporting] = useState(false);
  
  // Action Menu State
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  // Modals State
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderForTime, setSelectedOrderForTime] = useState(null);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  
  const [newEstimasiDate, setNewEstimasiDate] = useState('');
  const [newEstimasiTime, setNewEstimasiTime] = useState('');

  const { flatOrders: orders, getEndDate, getOrderEndDate, updateOrderOperational, isDateBlocked } = useOrders();

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Calendar Grid Dates
  const monthStart = startOfMonth(currentDate);
  const calendarStart = calendarView === 'bulan' 
    ? startOfWeek(monthStart, { weekStartsOn: 0 }) 
    : startOfWeek(currentDate, { weekStartsOn: 0 });
    
  const calendarEnd = calendarView === 'bulan'
    ? endOfWeek(endOfMonth(monthStart), { weekStartsOn: 0 })
    : endOfWeek(currentDate, { weekStartsOn: 0 });
    
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Filtering Logic for Table & PDF
  const filteredOrdersTable = orders.filter(order => {
    // 0. Filter ONLY Non-Retail (SERVICE / WORKSHOP)
    if (order.type === 'RETAIL') return false;

    // 1. Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id?.toLowerCase().includes(q);
      const matchCustomer = order.customerName?.toLowerCase().includes(q);
      const matchCar = `${order.carBrand} ${order.carModel}`.toLowerCase().includes(q);
      const matchPic = order.spgName?.toLowerCase().includes(q) || order.billType?.toLowerCase().includes(q);
      if (!matchId && !matchCustomer && !matchCar && !matchPic) return false;
    }

    // 2. Filter by Status
    if (statusFilter !== 'Semua') {
      const mappedStatus = (order.status === 'Aktif') ? 'In Progress' : order.status;
      if (mappedStatus !== statusFilter) return false;
    }

    // 3. Filter by Date
    // Jika tidak ada filter tanggal kustom, tampilkan SEMUA data (Sinkron dengan tabel Customer)
    if (!customStartDate && !customEndDate) {
      return true;
    }

    let filterStart = new Date(0); // Default ke masa lalu jauh
    let filterEnd = new Date(8640000000000000); // Default ke masa depan jauh
    
    if (customStartDate) {
      const [y, m, d] = customStartDate.split('-');
      filterStart = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
    }
    if (customEndDate) {
      const [y, m, d] = customEndDate.split('-');
      filterEnd = new Date(Number(y), Number(m) - 1, Number(d), 23, 59, 59, 999);
    }

    const orderStart = new Date(order.date);
    orderStart.setHours(0, 0, 0, 0);
    
    const orderEnd = getOrderEndDate(order);
    orderEnd.setHours(23, 59, 59, 999);

    // Overlap condition: Order starts before or on filter end, AND order ends after or on filter start
    return orderStart <= filterEnd && orderEnd >= filterStart;
  });

  const handleUpdateEstimasi = () => {
    if (selectedOrderForTime && newEstimasiDate && newEstimasiTime) {
      // Combine date and time
      const combinedDateTimeStr = `${newEstimasiDate}T${newEstimasiTime}:00`;
      const combinedDate = new Date(combinedDateTimeStr);
      updateOrderOperational(selectedOrderForTime.id, { customEndDate: combinedDate.toISOString() });
      setIsTimeModalOpen(false);
    }
  };

  const handleExportPDF = () => {
    setIsExporting(true);
    const element = document.getElementById('pdf-report-content');
    element.style.display = 'block';

    const sDate = customStartDate ? format(parseISO(customStartDate), 'dd_MM_yyyy') : 'All';
    const eDate = customEndDate ? format(parseISO(customEndDate), 'dd_MM_yyyy') : 'All';
    const timestamp = format(new Date(), 'HHmmss');

    const opt = {
      margin:       10,
      filename:     `Laporan_Operasional_${sDate}_to_${eDate}_${timestamp}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = 'none';
      setIsExporting(false);
    }).catch((err) => {
      console.error(err);
      element.style.display = 'none';
      setIsExporting(false);
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Aktif':
      case 'In Progress':
        return <span className="inline-block px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-[10px] font-bold uppercase tracking-wider">In Progress</span>;
      case 'Menunggu':
        return <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Menunggu</span>;
      case 'Selesai':
        return <span className="inline-block px-3 py-1 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-wider">Selesai</span>;
      default:
        return <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full text-[10px] font-bold uppercase tracking-wider">Terjadwal</span>;
    }
  };

  const reportPeriodStart = customStartDate ? format(parseISO(customStartDate), 'dd MMMM yyyy', {locale: id}) : 'Awal';
  const reportPeriodEnd = customEndDate ? format(parseISO(customEndDate), 'dd MMMM yyyy', {locale: id}) : 'Akhir';

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Log Penjadwalan & Antrean Kendaraan</h1>
          <p className="page-subtitle">Sistem pemantauan jadwal pengerjaan dan alokasi antrean harian</p>
        </div>
      </div>

      {/* Mini Calendar / Booking Slot Matrix */}
      <div className="chart-card premium-card mb-6" style={{ padding: '24px 32px' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarRange size={20} className="text-primary" />
            <h3 className="font-sans font-semibold">Booking Slot Matrix</h3>
            
            <select
              value={bookingSlotBranch}
              onChange={(e) => setBookingSlotBranch(e.target.value)}
              style={{ marginLeft: '12px', padding: '4px 12px', height: '32px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#f9fafb', cursor: 'pointer' }}
              className="focus:border-black focus:ring-1 focus:ring-black transition-colors"
            >
              <option value="Gallardo">Gallardo</option>
              <option value="New Ratu">New Ratu</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
              <button onClick={() => { setCalendarView('minggu'); setCurrentDate(new Date()); }} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'var(--font-sans)', border: '1px solid #111', borderRadius: '4px', background: calendarView === 'minggu' ? '#111' : 'transparent', color: calendarView === 'minggu' ? '#fff' : '#111', cursor: 'pointer', transition: 'all 0.2s' }}>Minggu Ini</button>
              <button onClick={() => { setCalendarView('bulan'); setCurrentDate(new Date()); }} style={{ padding: '6px 12px', fontSize: '0.75rem', fontWeight: 'bold', fontFamily: 'var(--font-sans)', border: '1px solid #111', borderRadius: '4px', background: calendarView === 'bulan' ? '#111' : 'transparent', color: calendarView === 'bulan' ? '#fff' : '#111', cursor: 'pointer', transition: 'all 0.2s' }}>Bulan Ini</button>
            </div>
            <button onClick={prevMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <ChevronLeft size={20} className="text-gray-600 hover:text-black transition-colors" />
            </button>
            <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 'bold', color: '#111', textTransform: 'uppercase', letterSpacing: '1px', margin: 0, minWidth: '140px', textAlign: 'center' }}>
              {format(currentDate, 'MMMM yyyy', { locale: id })}
            </h4>
            <button onClick={nextMonth} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
              <ChevronRight size={20} className="text-gray-600 hover:text-black transition-colors" />
            </button>
          </div>
        </div>
        
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(dayName => (
              <div key={dayName} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', padding: '12px 8px', borderRight: '1px solid #e5e7eb', fontFamily: 'var(--font-sans)' }} className="last:border-r-0">
                {dayName}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {days.map((day, idx) => {
              const sameMonth = isSameMonth(day, monthStart);
              
              // Find orders for this day
              const dayOrders = orders.filter(o => {
                if (o.type === 'RETAIL') return false;
                if (o.location !== bookingSlotBranch) return false;
                // Tampilkan SEMUA status (Aktif maupun Selesai) agar sinkron dengan tabel log operasional
                const start = new Date(o.date);
                start.setHours(0, 0, 0, 0);
                const end = getOrderEndDate(o);
                end.setHours(0, 0, 0, 0);
                
                const check = new Date(day);
                check.setHours(0, 0, 0, 0);
                
                return check >= start && check <= end;
              });
              
              const hasOrders = dayOrders.length > 0;
              const isFull = isDateBlocked(day);
              
              let cellStyle = { backgroundColor: sameMonth ? '#fff' : '#f9fafb', color: sameMonth ? '#1f2937' : '#9ca3af' };
              let indicatorColor = '#6b7280';
              let indicatorText = 'Tersedia';

              if (sameMonth) {
                if (isFull) {
                  cellStyle = { backgroundColor: '#111', color: '#fff', borderColor: '#111' };
                  indicatorColor = '#fff';
                  indicatorText = 'FULL (3/3)';
                } else if (hasOrders) {
                  cellStyle = { backgroundColor: '#fff', color: '#111', border: '2px solid #111' };
                  indicatorColor = '#111';
                  indicatorText = `${dayOrders.length} Mobil`;
                }
              }
                
              return (
                <div 
                  key={idx} 
                  style={{
                    ...cellStyle,
                    minHeight: '100px',
                    padding: '12px',
                    borderRight: sameMonth && hasOrders && !isFull ? '2px solid #111' : '1px solid #e5e7eb',
                    borderBottom: sameMonth && hasOrders && !isFull ? '2px solid #111' : '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'var(--font-sans)',
                  }}
                  className="transition-colors"
                >
                  <span style={{ fontWeight: '600', fontSize: '1rem', marginBottom: '8px', display: 'block', fontFamily: 'var(--font-mono-num)' }}>
                    {format(day, 'd')}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                    {sameMonth && (
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: hasOrders || isFull ? '700' : '500', 
                        padding: '2px 6px', 
                        border: isFull ? '1px solid #333' : '1px solid #e5e7eb', 
                        color: indicatorColor, 
                        borderRadius: '4px', 
                        display: 'inline-block', 
                        width: 'fit-content' 
                      }}>
                        {indicatorText}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded Operational Log Table */}
      <div className="chart-card premium-card" style={{ padding: '24px 32px' }}>
        
        {/* BARIS PERTAMA: Header & Main Action */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CalendarClock size={24} className="text-black" />
            <h3 className="font-sans font-bold text-lg text-black">Log Detail Jadwal Kerja Operasional</h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="font-sans text-sm font-medium text-gray-600">Total: <strong className="text-black font-bold">{filteredOrdersTable.length}</strong> Kendaraan</span>
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              style={{ backgroundColor: '#fff', color: '#000', border: '2px solid #000', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease', whiteSpace: 'nowrap', borderRadius: '4px', cursor: isExporting ? 'wait' : 'pointer', opacity: isExporting ? 0.7 : 1 }}
              className={isExporting ? "" : "hover:bg-black hover:text-white"}
            >
              {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              <span className="font-sans text-sm font-bold tracking-wide">
                {isExporting ? 'MEMPROSES...' : 'EXPORT PDF'}
              </span>
            </button>
          </div>
        </div>
        
        {/* BARIS KEDUA: Filter & Search Control Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '24px', flexWrap: 'wrap' }}>
          
          {/* Sisi Kiri: Search Bar */}
          <div style={{ position: 'relative', width: '100%', flex: '1', minWidth: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
            <input 
              type="text" 
              placeholder="Cari ID Order, customer, kendaraan, atau PIC..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', height: '42px', padding: '0 16px 0 44px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
              className="focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
          </div>

          {/* Sisi Kanan: Status & Date Picker Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: '0 16px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box', cursor: 'pointer' }}
              className="focus:border-black focus:ring-1 focus:ring-black transition-colors"
            >
              <option value="Semua">Semua Status</option>
              <option value="In Progress">In Progress</option>
              <option value="Selesai">Selesai</option>
            </select>
            
            <div style={{ width: '1px', height: '24px', backgroundColor: '#e5e7eb', margin: '0 4px' }}></div>

            <input 
              type="date" 
              value={customStartDate} 
              onChange={(e) => setCustomStartDate(e.target.value)}
              style={{ padding: '0 16px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
              title="Tanggal Mulai"
              className="focus:border-black focus:ring-1 focus:ring-black transition-colors cursor-pointer"
            />
            <span style={{ color: '#d1d5db', fontFamily: 'var(--font-sans)', fontSize: '1.125rem', fontWeight: '300' }}>-</span>
            <input 
              type="date" 
              value={customEndDate} 
              onChange={(e) => setCustomEndDate(e.target.value)}
              style={{ padding: '0 16px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#f9fafb', boxSizing: 'border-box' }}
              title="Tanggal Selesai"
              className="focus:border-black focus:ring-1 focus:ring-black transition-colors cursor-pointer"
            />
          </div>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', whiteSpace: 'nowrap' }}>ID Order</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Waktu Masuk</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Waktu Keluar / Estimasi</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Kendaraan</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Layanan / Brand</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Cabang / Lokasi</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>Status Operasional</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600' }}>PIC / SPG</th>
                <th style={{ padding: '16px 20px', color: '#6b7280', fontWeight: '600', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrdersTable.map(order => {
                const startDate = new Date(order.date);
                const endDate = getOrderEndDate(order);
                
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }} className="hover:bg-gray-50 transition-colors">
                    <td style={{ padding: '16px 20px', fontFamily: 'var(--font-sans)', fontWeight: 'bold' }} className="text-gray-800">
                      {order.id}
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace' }} className="text-gray-800">
                      {format(startDate, "dd MMMM yyyy", { locale: id })}<br/>
                      <span className="text-gray-500 font-bold">{format(startDate, "HH:mm 'WIB'")}</span>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace' }} className="text-gray-800">
                      {format(endDate, "dd MMMM yyyy", { locale: id })}<br/>
                      <span className="text-gray-500 font-bold">{format(endDate, "HH:mm 'WIB'")}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <p className="font-semibold font-sans">{order.customerName}</p>
                      <p className="text-xs text-gray-500 font-mono-num mt-1">{order.customerHp}</p>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <p className="font-semibold font-sans text-gray-800">{order.carBrand} {order.carModel}</p>
                      <p className="text-xs text-gray-500 font-mono-num mt-1">{order.plateNumber}</p>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <p className="font-sans font-medium">{order.serviceType}</p>
                      {order.product && <p className="text-xs text-gray-500 mt-1">{order.product}</p>}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span className="font-sans text-xs font-semibold px-2 py-1 bg-gray-100 text-gray-700 rounded-md">
                        {order.location}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {getStatusBadge(order.status)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <p className="font-sans font-bold text-gray-800">{order.spgName || 'Internal Sales'}</p>
                      <p className="text-xs text-gray-500 font-sans mt-1">PIC: {order.billType || 'Sales'}</p>
                    </td>
                    <td className="text-center print:hidden" style={{ position: 'relative', verticalAlign: 'middle', padding: '16px 20px' }}>
                      <button 
                        className="btn-icon mx-auto relative z-10"
                        onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === order.id ? null : order.id); }}
                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}
                      >
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>
                      
                      {activeDropdown === order.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(null); }}
                          />
                          <div className="dropdown-menu premium-card animate-fade-in" style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', minWidth: 'max-content', zIndex: 50, padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', borderRadius: '12px', marginRight: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', backgroundColor: '#ffffff' }}>
                          <button  
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveDropdown(null); 
                              setSelectedOrderForTime(order); 
                              const endD = getOrderEndDate(order);
                              setNewEstimasiDate(format(endD, 'yyyy-MM-dd'));
                              setNewEstimasiTime(format(endD, 'HH:mm'));
                              setIsTimeModalOpen(true); 
                            }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', fontSize: '13.5px', fontWeight: '500', color: '#f59e0b', transition: 'all 0.2s', textAlign: 'left', whiteSpace: 'nowrap' }} 
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#fef3c7'} 
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <Clock size={16} color="#f59e0b" style={{ flexShrink: 0 }} /> 
                            <span>Ubah Estimasi Waktu Selesai</span>
                          </button>
                          
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setActiveDropdown(null); 
                              setSelectedOrderForDetail(order); 
                              setIsDetailModalOpen(true); 
                            }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px', padding: '10px 16px', width: '100%', border: 'none', background: 'transparent', cursor: 'pointer', borderRadius: '8px', fontSize: '13.5px', fontWeight: '500', color: '#374151', transition: 'all 0.2s', textAlign: 'left', whiteSpace: 'nowrap' }} 
                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f3f4f6'} 
                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <FileText size={16} color="#4b5563" style={{ flexShrink: 0 }} /> 
                            <span>Detail Pekerjaan</span>
                          </button>
                        </div>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredOrdersTable.length === 0 && (
                <tr>
                  <td colSpan="9" className="text-center py-8 text-gray-500 font-sans">Belum ada log operasional.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hidden Print Layout */}
      <div id="pdf-report-content" style={{ display: 'none', padding: '20px', backgroundColor: '#fff', color: '#000' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '24px', fontWeight: 'bold', margin: '0' }}>GALLARDO AUTO SPORT</h1>
          <h2 style={{ fontFamily: 'var(--font-mono-ui)', fontSize: '14px', letterSpacing: '2px', margin: '5px 0 0 0' }}>LAPORAN OPERASIONAL CUSTOM MINGGUAN / BULANAN</h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', marginTop: '10px' }}>Periode: {reportPeriodStart} - {reportPeriodEnd}</p>
        </div>
        
        <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '10px', fontFamily: 'var(--font-sans)' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #000' }}>
              <th style={{ padding: '8px 4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>ID Order</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Waktu Masuk</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Waktu Keluar / Estimasi</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Customer</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Kendaraan</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Layanan / Brand</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Cabang / Lokasi</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>Status Operasional</th>
              <th style={{ padding: '8px 4px', fontWeight: 'bold' }}>PIC / SPG</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrdersTable.map(order => {
              const start = new Date(order.date);
              const end = getOrderEndDate(order);
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid #ccc' }}>
                  <td style={{ padding: '8px 4px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{order.id}</td>
                  <td style={{ padding: '8px 4px' }}>{format(start, "dd MMM yyyy HH:mm")}</td>
                  <td style={{ padding: '8px 4px' }}>{format(end, "dd MMM yyyy HH:mm")}</td>
                  <td style={{ padding: '8px 4px' }}>{order.customerName}<br/>{order.customerHp}</td>
                  <td style={{ padding: '8px 4px' }}>{order.carBrand} {order.carModel}<br/>{order.plateNumber}</td>
                  <td style={{ padding: '8px 4px' }}>{order.serviceType}</td>
                  <td style={{ padding: '8px 4px' }}>{order.location}</td>
                  <td style={{ padding: '8px 4px' }}>{order.status}</td>
                  <td style={{ padding: '8px 4px' }}><strong>{order.spgName || 'Internal Sales'}</strong><br/>PIC: {order.billType || 'Sales'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div style={{ marginTop: '20px', borderTop: '2px solid #000', paddingTop: '10px', textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 'bold', margin: '0' }}>
            Total Operasional: {filteredOrdersTable.length} Kendaraan
          </p>
        </div>
      </div>

      {/* MODALS FOR TECHNICIANS */}
      {isTimeModalOpen && selectedOrderForTime && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center bg-black/50" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="animate-fade-in" style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '512px', position: 'relative' }}>
            <h3 style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '16px', color: '#1f2937', marginTop: 0 }}>Ubah Estimasi Waktu Selesai</h3>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Kendaraan: <strong style={{ color: '#1f2937' }}>{selectedOrderForTime.carBrand} {selectedOrderForTime.carModel}</strong></p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Pilih Tanggal Selesai:</label>
                <input type="date" value={newEstimasiDate} onChange={(e) => setNewEstimasiDate(e.target.value)} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '4px' }}>Pilih Jam Selesai:</label>
                <input type="time" value={newEstimasiTime} onChange={(e) => setNewEstimasiTime(e.target.value)} style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '8px', padding: '10px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button onClick={() => setIsTimeModalOpen(false)} style={{ backgroundColor: '#e5e7eb', color: '#1f2937', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '500', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleUpdateEstimasi} style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '500', cursor: 'pointer' }}>Simpan Perubahan</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isDetailModalOpen && selectedOrderForDetail && createPortal(
        <div className="fixed top-0 left-0 w-screen h-screen z-[9999] flex items-center justify-center bg-black/50" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', padding: '16px' }}>
          <div className="animate-fade-in" style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', width: '100%', maxWidth: '672px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <button onClick={() => setIsDetailModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', padding: '8px', color: '#9ca3af', backgroundColor: 'transparent', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>
              <X size={20}/>
            </button>
            
            <div style={{ marginBottom: '16px', paddingRight: '32px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '20px', marginBottom: '4px', color: '#1f2937', marginTop: 0 }}>Surat Perintah Kerja (SPK)</h3>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>ID Order: <strong style={{ color: '#374151' }}>{selectedOrderForDetail.id}</strong></p>
            </div>
            
            <div style={{ overflowY: 'auto', paddingRight: '8px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', fontWeight: '500', margin: 0 }}>Informasi Kendaraan</p>
                <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#111827', margin: '4px 0' }}>{selectedOrderForDetail.carBrand} {selectedOrderForDetail.carModel}</p>
                <p style={{ fontFamily: 'monospace', color: '#4b5563', fontWeight: '500', margin: 0 }}>{selectedOrderForDetail.plateNumber}</p>
              </div>

              <div>
                <h4 style={{ fontWeight: 'bold', color: '#1f2937', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                  <div style={{ width: '6px', height: '16px', backgroundColor: '#2563eb', borderRadius: '4px' }}></div>
                  Daftar Layanan & Produk
                </h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedOrderForDetail.items && selectedOrderForDetail.items.map((item, idx) => (
                    <li key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #f3f4f6' }}>
                      <div style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', flexShrink: 0 }}>{idx + 1}</div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 'bold', color: '#1f2937', margin: 0 }}>{item.name}</p>
                      </div>
                      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '6px' }}>
                        <p style={{ fontSize: '14px', color: '#4b5563', fontWeight: 'bold', margin: 0, whiteSpace: 'nowrap' }}>Qty: <span style={{ color: '#1d4ed8' }}>{item.qty}</span></p>
                      </div>
                    </li>
                  ))}
                  {(!selectedOrderForDetail.items || selectedOrderForDetail.items.length === 0) && (
                    <p style={{ color: '#6b7280', fontSize: '14px', fontStyle: 'italic', backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px dashed #d1d5db', margin: 0 }}>Detail produk tidak tersedia (Order manual).</p>
                  )}
                </ul>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
              <button onClick={() => setIsDetailModalOpen(false)} style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 24px', borderRadius: '8px', border: 'none', fontWeight: '500', cursor: 'pointer' }}>Tutup SPK</button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default AdminScheduling;
