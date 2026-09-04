import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Wrench, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import './MaintenanceBanner.css';

export default function MaintenanceBanner() {
  const [maintenance, setMaintenance] = useState({
    isActive: false,
    message: '',
    estimatedEnd: '',
    updatedAt: null
  });
  const [isMinimized, setIsMinimized] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const baseUrl = window.API_URL || '';
      const response = await fetch(`${baseUrl}/api/system/maintenance`, {
        cache: 'no-store'
      });
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          setMaintenance(json.data);
        }
      }
    } catch (err) {
      // Silently ignore network poll errors
    }
  }, []);

  useEffect(() => {
    // 1. Initial fetch
    fetchStatus();

    // 2. Poll every 15 seconds
    const interval = setInterval(fetchStatus, 15000);

    // 3. Immediately re-fetch when user refocuses or switches back to tab
    const handleFocus = () => fetchStatus();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStatus]);

  if (!maintenance.isActive) {
    return null;
  }

  const displayMessage = maintenance.message || 'Pemberitahuan: Sistem POS Gallardo sedang dalam pemeliharaan (maintenance). Harap segera simpan transaksi atau pekerjaan Anda.';

  if (isMinimized) {
    return (
      <div 
        className="maintenance-floating-pill no-print" 
        onClick={() => setIsMinimized(false)}
        title="Klik untuk membuka banner pemeliharaan sistem"
      >
        <div className="maintenance-pulse-dot" />
        <Wrench size={14} />
        <span>Mode Maintenance Aktif</span>
        <ChevronDown size={14} />
      </div>
    );
  }

  return (
    <div className="maintenance-banner-wrapper no-print" role="alert">
      <div className="maintenance-banner-content">
        <div className="maintenance-banner-left">
          <div className="maintenance-badge-pulse">
            <div className="maintenance-pulse-dot" />
            <AlertTriangle size={13} style={{ color: '#fef08a' }} />
            <span>PERINGATAN SISTEM</span>
          </div>

          <div className="maintenance-banner-text">
            <strong>Maintenance Sedang Berlangsung:</strong>
            <span>{displayMessage}</span>
            {maintenance.estimatedEnd && (
              <span style={{ marginLeft: '8px', opacity: 0.9, fontWeight: 'normal', fontStyle: 'italic' }}>
                (Estimasi selesai: {maintenance.estimatedEnd})
              </span>
            )}
          </div>
        </div>

        <div className="maintenance-banner-right">
          <button 
            type="button"
            className="maintenance-btn-icon"
            onClick={fetchStatus}
            title="Periksa ulang status sekarang"
          >
            <RefreshCw size={13} />
          </button>
          <button 
            type="button" 
            className="maintenance-btn-icon" 
            onClick={() => setIsMinimized(true)}
            title="Kecilkan banner"
          >
            <ChevronUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
