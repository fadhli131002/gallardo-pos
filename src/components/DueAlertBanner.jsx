import { useState, useEffect, useCallback } from 'react';
import { Bell, X, AlertTriangle, Clock } from 'lucide-react';

const POLL_INTERVAL = 5 * 60 * 1000; // 5 menit

const urgencyConfig = {
  critical: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800', badge: 'bg-red-600', label: 'Hari Ini!' },
  high:     { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800', badge: 'bg-orange-500', label: 'Besok' },
  medium:   { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800', badge: 'bg-yellow-500', label: '2-3 Hari' },
};

/**
 * DueAlertBanner — Banner notifikasi piutang jatuh tempo H-3
 * Polling setiap 5 menit ke /api/finance/receivable-alerts
 * Muncul di header Admin & Finance jika ada transaksi yang akan jatuh tempo
 */
const DueAlertBanner = () => {
  const [alerts, setAlerts] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchAlerts = useCallback(async () => {
    try {
      const base = window.API_URL || '';
      const res = await fetch(`${base}/api/finance/receivable-alerts?daysAhead=3`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.count > 0) {
        setAlerts(data.data);
        setDismissed(false); // reset dismiss jika ada alert baru
      } else {
        setAlerts([]);
      }
    } catch (_) {
      // Gagal fetch — jangan tampilkan error, cukup diam
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  if (dismissed || alerts.length === 0) return null;

  const criticalCount = alerts.filter(a => a.urgency === 'critical').length;
  const hasCritical = criticalCount > 0;
  const primaryConfig = hasCritical ? urgencyConfig.critical : urgencyConfig.high;

  const formatCurrency = (n) =>
    `Rp ${Number(n).toLocaleString('id-ID')}`;

  return (
    <div className={`mb-4 rounded-xl border-2 ${primaryConfig.border} ${primaryConfig.bg} overflow-hidden shadow-sm`}>
      {/* Header bar */}
      <div
        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${primaryConfig.bg}`}
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${primaryConfig.badge} flex items-center justify-center flex-shrink-0`}>
            <Bell className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className={`font-semibold text-sm ${primaryConfig.text}`}>
              {hasCritical
                ? `🔴 ${criticalCount} Piutang Jatuh Tempo HARI INI!`
                : `⚠️ ${alerts.length} Piutang Mendekati Jatuh Tempo`
              }
            </p>
            <p className={`text-xs ${primaryConfig.text} opacity-75`}>
              Klik untuk {isExpanded ? 'sembunyikan' : 'lihat'} detail · Total sisa tagihan:{' '}
              <strong>{formatCurrency(alerts.reduce((s, a) => s + a.sisa_tagihan, 0))}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            className={`p-1 rounded-full hover:bg-black/10 transition-colors ${primaryConfig.text}`}
            title="Tutup notifikasi (akan muncul kembali setelah 5 menit)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable detail list */}
      {isExpanded && (
        <div className="border-t border-current/20 divide-y divide-current/10 max-h-60 overflow-y-auto">
          {alerts.map((alert) => {
            const cfg = urgencyConfig[alert.urgency] || urgencyConfig.medium;
            const dueLabel = alert.days_until_due === 0
              ? 'Hari ini!'
              : alert.days_until_due === 1
              ? 'Besok'
              : `${alert.days_until_due} hari lagi`;

            return (
              <div key={alert.transaction_id} className="flex items-center justify-between px-4 py-2.5 bg-white/60">
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className={`w-4 h-4 flex-shrink-0 ${cfg.text}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      TRX-{alert.transaction_id} · {alert.customer_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Sisa tagihan: <span className="font-semibold text-red-600">{formatCurrency(alert.sisa_tagihan)}</span>
                      {alert.customer_phone !== '-' && ` · ${alert.customer_phone}`}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${cfg.badge}`}>
                    {dueLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DueAlertBanner;
