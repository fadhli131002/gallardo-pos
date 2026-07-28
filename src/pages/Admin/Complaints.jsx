import { useState, useEffect } from 'react';
import { MessageSquareWarning, Plus, Search, Filter, CheckCircle2, Clock, Wrench } from 'lucide-react';
import ComplaintModal from '../../components/ComplaintModal';
import { toast } from 'sonner';

const Complaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://31.97.51.101/api/complaints', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setComplaints(data);
      } else {
        console.error('Failed to fetch complaints:', response.status);
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
      toast.error('Gagal mengambil data komplain');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const updateStatus = async (id, newStatus) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`http://31.97.51.101/api/complaints/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        toast.success(`Status berhasil diubah menjadi ${newStatus}`);
        fetchComplaints();
      } else {
        toast.error('Gagal mengubah status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Terjadi kesalahan');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12} /> Pending</span>;
      case 'Proses Pengerjaan Ulang':
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><Wrench size={12} /> Proses Pengerjaan</span>;
      case 'Selesai':
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle2 size={12} /> Selesai</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  const filteredComplaints = complaints.filter(c => {
    const matchSearch =
      c.transaction?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.transaction?.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.problem_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'Semua Status' || statusFilter === 'All' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="customers-page animate-fade-in print:hidden">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div style={{ padding: '8px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
              <MessageSquareWarning size={24} />
            </div>
            Data Komplain / Klaim Garansi
          </h1>
          <p className="page-subtitle">Kelola dan pantau semua komplain masuk dari pelanggan</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={20} />
          Catat Komplain
        </button>
      </div>

      {/* Filters */}
      <div className="premium-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '1.5rem', flexWrap: 'nowrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '0' }}>
            <Search size={18} color="#9ca3af" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Cari nama pelanggan, plat, atau kendala..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', height: '42px', padding: '0 16px 0 44px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', itemsCenter: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280' }}>
              <Filter size={18} />
              <select
                style={{ padding: '0 16px', height: '42px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#f9fafb', cursor: 'pointer' }}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">Semua Status</option>
                <option value="Pending">Pending</option>
                <option value="Proses Pengerjaan Ulang">Proses Pengerjaan Ulang</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive premium-card" style={{ overflow: 'visible', padding: 0 }}>
        <table className="customers-table">
          <thead>
            <tr>
              <th className="font-sans">Tanggal Masuk</th>
              <th className="font-sans">Pelanggan & Kendaraan</th>
              <th className="font-sans">Jenis Masalah</th>
              <th className="font-sans text-center">Foto Bukti</th>
              <th className="font-sans text-center">Status</th>
              <th className="font-sans text-right">Aksi Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <div style={{ width: '20px', height: '20px', border: '2px solid rgba(16,185,129,0.3)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    Memuat data komplain...
                  </div>
                </td>
              </tr>
            ) : filteredComplaints.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
                  <MessageSquareWarning size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p style={{ fontSize: '1.125rem' }}>Tidak ada data komplain ditemukan</p>
                </td>
              </tr>
            ) : (
              filteredComplaints.map(complaint => (
                <tr key={complaint.id} style={{ verticalAlign: 'top' }}>
                  <td style={{ minWidth: '150px' }}>
                    <div className="text-sm font-bold text-primary">
                      {new Date(complaint.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-secondary font-mono-ui mt-1">
                      {new Date(complaint.created_at).toLocaleTimeString('id-ID', {
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </td>
                  <td style={{ minWidth: '200px' }}>
                    <div className="font-bold text-sm text-primary">{complaint.transaction?.customer_name}</div>
                    <div className="text-xs text-secondary mt-1">
                      {complaint.transaction?.plate_number} &bull; {complaint.transaction?.car_brand} {complaint.transaction?.car_model}
                    </div>
                  </td>
                  <td style={{ minWidth: '200px' }}>
                    <div className="font-bold text-sm text-primary">{complaint.problem_type}</div>
                    {complaint.description && (
                      <div className="text-xs text-secondary mt-1" style={{ maxWidth: '250px', whiteSpace: 'normal' }}>
                        {complaint.description}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    {complaint.proof_photo ? (
                      <a href={`http://31.97.51.101${complaint.proof_photo}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block' }}>
                        <img
                          src={`http://31.97.51.101${complaint.proof_photo}`}
                          alt="Bukti"
                          style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', transition: 'transform 0.2s' }}
                          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </a>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>- Tidak ada -</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    {getStatusBadge(complaint.status)}
                  </td>
                  <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
                    <select
                      style={{ padding: '6px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'var(--font-sans)', outline: 'none', backgroundColor: '#fff', cursor: 'pointer', fontWeight: '500' }}
                      value={complaint.status}
                      onChange={(e) => updateStatus(complaint.id, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Proses Pengerjaan Ulang">Proses</option>
                      <option value="Selesai">Selesai</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <ComplaintModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchComplaints}
      />
    </div>
  );
};

export default Complaints;
