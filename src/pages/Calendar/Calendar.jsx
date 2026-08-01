import { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  startOfMonth, 
  endOfMonth, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useOrders } from '../../context/OrderContext';
import { useInventory } from '../../context/InventoryContext';
import { toast } from 'sonner';
import './Calendar.css';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [confirmModalOrder, setConfirmModalOrder] = useState(null);
  const { flatOrders: orders, completeOrder, isDateBlocked, getEndDate } = useOrders();
  const { processInventoryDeduction } = useInventory();
  const { userBranch } = useOutletContext() || { userBranch: 'Gallardo' };

  const filteredOrders = orders.filter(o => o.location === userBranch);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleCompleteOrder = (orderId) => {
    const order = filteredOrders.find(o => o.id === orderId);
    if (order && order.paymentType === 'DP 50%') {
      const confirmPayment = window.confirm(`Sisa tagihan Rp ${order.remainingAmount.toLocaleString('id-ID')} belum lunas. Apakah customer sudah melakukan pelunasan?`);
      if (!confirmPayment) {
        return; // Batal selesaikan jika belum lunas
      }
    }
    
    if (order) {
      const deductResult = processInventoryDeduction(order);
      if (!deductResult.success) {
        toast.error(deductResult.message);
        return; // Prevent completion if out of stock
      }
      
      if (deductResult.alerts && deductResult.alerts.length > 0) {
        deductResult.alerts.forEach(msg => toast.warning(msg));
      }
    }
    
    completeOrder(orderId);
    toast.success('Jadwal selesai dan log inventaris diperbarui.');
  };

  const renderHeader = () => {
    return (
      <div className="calendar-header">
        <button onClick={prevMonth} className="icon-btn">
          <ChevronLeft size={24} />
        </button>
        <h2 className="font-sans font-bold text-xl text-center flex-1">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button onClick={nextMonth} className="icon-btn">
          <ChevronRight size={24} />
        </button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    let startDate = startOfWeek(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="day-name font-mono-ui text-secondary" key={i}>
          {format(addDays(startDate, i), 'EEE')}
        </div>
      );
    }
    return <div className="days-row">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const dayOrders = filteredOrders.filter(o => {
          if (o.status !== 'OPEN') return false;
          const start = new Date(o.installationDate || o.date);
          start.setHours(0, 0, 0, 0);
          const end = getEndDate(o.installationDate || o.date, o.serviceType);
          end.setHours(0, 0, 0, 0);
          
          const check = new Date(cloneDay);
          check.setHours(0, 0, 0, 0);
          
          return check >= start && check <= end;
        });
        const hasOrders = dayOrders.length > 0;
        const isToday = isSameDay(day, new Date());
        
        let cellClass = 'cell';
        if (isToday) cellClass += ' today-cell';
        if (!isSameMonth(day, monthStart)) cellClass += ' disabled';
        
        days.push(
          <div
            className={cellClass}
            key={day}
          >
            <span className="number font-mono-num">{formattedDate}</span>
            <div className="cell-content" style={{ padding: '0', width: '100%', flex: 1 }}>
              {isSameMonth(day, monthStart) && (
                hasOrders ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', marginTop: '4px' }}>
                    {dayOrders.map((order, idx) => (
                      <span key={idx} className="order-chip" title={`${order.customerName} - ${order.serviceType}`}>
                        {order.customerName}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <span className="status-indicator">
                      <span className="status-dot"></span>
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="row" key={day}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="body">{rows}</div>;
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (confirmModalOrder) setConfirmModalOrder(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [confirmModalOrder]);

  return (
    <div className="calendar-page animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Jadwal & Antrean Kendaraan</h1>
          <p className="page-subtitle">Pemantauan jadwal operasional dan ketersediaan slot antrean</p>
        </div>
      </div>

      <div className="calendar-layout">
        <div className="calendar-card premium-card">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </div>

        <div className="sidebar-orders premium-card">
          <h3 className="font-sans font-semibold mb-4">Order Aktif</h3>
          <p className="text-sm text-secondary mb-4">
            Klik 'Selesaikan Pemasangan' untuk mengosongkan slot kalender.
          </p>
          
          <div className="order-list">
            {filteredOrders.filter(o => {
              if (o.status !== 'OPEN') return false;
              const orderDate = new Date(o.date);
              const mStart = startOfMonth(currentDate);
              const mEnd = endOfMonth(currentDate);
              return orderDate >= mStart && orderDate <= mEnd;
            }).length === 0 ? (
              <p className="text-sm text-tertiary">Tidak ada order aktif.</p>
            ) : (
              filteredOrders.filter(o => {
                if (o.status !== 'OPEN') return false;
                const orderDate = new Date(o.date);
                const mStart = startOfMonth(currentDate);
                const mEnd = endOfMonth(currentDate);
                return orderDate >= mStart && orderDate <= mEnd;
              }).map(order => (
                <div key={order.id} className="active-order-card">
                  <div className="flex justify-between items-center">
                    <h4 className="font-sans font-bold text-gray-900" style={{ fontSize: '0.95rem' }}>{order.customerName}</h4>
                    <span className="date-badge">
                      {format(new Date(order.date), 'dd/MM')}
                    </span>
                  </div>
                  <p className="product-tag">{order.service}</p>
                  <button 
                    className="btn-resolve"
                    onClick={() => setConfirmModalOrder(order.id)}
                  >
                    <CheckCircle2 size={16} className="resolve-icon" color="#059669" />
                    Selesaikan Pemasangan
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Selesaikan */}
      {confirmModalOrder && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-card">
            <h3 className="confirm-modal-title">Konfirmasi Penyelesaian</h3>
            <p className="confirm-modal-text">
              Apakah Anda yakin pemasangan untuk kendaraan ini sudah selesai?
            </p>
            <div className="confirm-modal-actions">
              <button 
                className="confirm-btn-cancel"
                onClick={() => setConfirmModalOrder(null)}
              >
                Batal
              </button>
              <button 
                className="confirm-btn-confirm"
                onClick={() => {
                  handleCompleteOrder(confirmModalOrder);
                  setConfirmModalOrder(null);
                }}
              >
                Ya, Selesai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
