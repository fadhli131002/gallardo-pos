import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Megaphone, Plus, Search, Edit3, Trash2, Eye, Globe, Lock, CheckCircle2, 
  Clock, Sparkles, Tag, Calendar, ShieldCheck, RefreshCw, X, AlertTriangle, Send
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import ReleaseNoteModal from '../../components/ReleaseNoteModal';

const AdminReleaseNotes = () => {
  const { token, user } = useAuth();

  const [notes, setNotes] = useState([]);
  const [counts, setCounts] = useState({ total: 0, published: 0, draft: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PUBLISHED' | 'DRAFT'

  // State untuk Form Modal (Create / Edit)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [formData, setFormData] = useState({
    version: '',
    title: '',
    content: '',
    is_published: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk Preview Modal
  const [previewNote, setPreviewNote] = useState(null);

  // State untuk Delete Confirmation
  const [deletingNote, setDeletingNote] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch Release Notes
  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch(`${window.API_URL || ''}/api/release-notes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setNotes(json.data || []);
          if (json.counts) setCounts(json.counts);
        }
      } else {
        toast.error('Gagal memuat daftar release notes.');
      }
    } catch (err) {
      console.error('Error fetching release notes:', err);
      toast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // 2. Filtered Notes
  const filteredNotes = useMemo(() => {
    let list = [...notes];
    if (statusFilter === 'PUBLISHED') {
      list = list.filter(n => n.is_published);
    } else if (statusFilter === 'DRAFT') {
      list = list.filter(n => !n.is_published);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(n =>
        (n.version || '').toLowerCase().includes(q) ||
        (n.title || '').toLowerCase().includes(q) ||
        (n.content || '').toLowerCase().includes(q) ||
        (n.author_name || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [notes, statusFilter, searchQuery]);

  // 3. Open Create Modal
  const handleOpenCreate = () => {
    setEditingNote(null);
    setFormData({
      version: '',
      title: '',
      content: '',
      is_published: true
    });
    setIsFormModalOpen(true);
  };

  // 4. Open Edit Modal
  const handleOpenEdit = (note) => {
    setEditingNote(note);
    setFormData({
      version: note.version,
      title: note.title,
      content: note.content,
      is_published: note.is_published
    });
    setIsFormModalOpen(true);
  };

  // 5. Template snippet helpers
  const handleInsertTemplate = (type) => {
    let templateText = '';
    if (type === 'features') {
      templateText = `\n### 🚀 Fitur Baru:\n- **Nama Fitur**: Penjelasan singkat kegunaan fitur baru bagi kasir/admin.\n- **Fitur Tambahan**: Deskripsi alur kerja baru yang lebih cepat.\n`;
    } else if (type === 'fixes') {
      templateText = `\n### 🛠️ Perbaikan & Bug Fixes:\n- **Perbaikan Perhitungan**: Mengoreksi rumus rekonsiliasi kas.\n- **Optimasi UI**: Perbaikan tata letak modal agar tepat di tengah layar.\n`;
    } else if (type === 'guide') {
      templateText = `\n### 💡 Panduan Singkat:\n1. Buka menu terkait di bilah navigasi kiri.\n2. Klik tombol tindakan yang tersedia untuk memulai.\n`;
    }

    setFormData(prev => ({
      ...prev,
      content: (prev.content ? prev.content + '\n' : '') + templateText.trim()
    }));
  };

  // 6. Submit Create / Update
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.version.trim() || !formData.title.trim() || !formData.content.trim()) {
      toast.error('Harap lengkapi semua kolom wajib (Versi, Judul, dan Konten).');
      return;
    }

    try {
      setIsSubmitting(true);
      const url = editingNote 
        ? `${window.API_URL || ''}/api/release-notes/${editingNote.id}`
        : `${window.API_URL || ''}/api/release-notes`;

      const method = editingNote ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Release note berhasil disimpan!');
        setIsFormModalOpen(false);
        fetchNotes();
      } else {
        toast.error(json.message || 'Gagal menyimpan release note.');
      }
    } catch (err) {
      console.error('Error saving release note:', err);
      toast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Toggle Publish
  const handleTogglePublish = async (note) => {
    try {
      const res = await fetch(`${window.API_URL || ''}/api/release-notes/${note.id}/toggle-publish`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Status publikasi berhasil diubah.');
        fetchNotes();
      } else {
        toast.error(json.message || 'Gagal mengubah status publikasi.');
      }
    } catch (err) {
      toast.error('Gagal menghubungi server: ' + err.message);
    }
  };

  // 8. Delete Note
  const handleDelete = async () => {
    if (!deletingNote) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`${window.API_URL || ''}/api/release-notes/${deletingNote.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        toast.success(json.message || 'Release note berhasil dihapus.');
        setDeletingNote(null);
        fetchNotes();
      } else {
        toast.error(json.message || 'Gagal menghapus release note.');
      }
    } catch (err) {
      toast.error('Gagal menghubungi server: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Megaphone size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pusat Release Notes & What's New
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
              Kelola pengumuman pembaruan sistem dan changelog secara dinamis langsung ke database
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer"
        >
          <Plus size={16} />
          <span>Buat Release Note Baru</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">TOTAL CATATAN RILIS</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{counts.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600">
            <Tag size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">DIPUBLIKASIKAN (LIVE)</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{counts.published}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Globe size={20} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider">DRAFT (BELUM TAYANG)</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{counts.draft}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Lock size={20} />
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Semua ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PUBLISHED')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'PUBLISHED'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Dipublikasikan ({counts.published})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'DRAFT'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Draft ({counts.draft})
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari versi, judul, konten..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-400"
            />
          </div>
          <button
            type="button"
            onClick={fetchNotes}
            disabled={isLoading}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Release Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200/90 text-center text-slate-400">
            {isLoading ? 'Memuat data release notes...' : 'Belum ada release notes yang sesuai.'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="px-3 py-1 bg-indigo-50 border border-indigo-200/80 text-indigo-700 rounded-full text-xs font-black">
                    {note.version}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    note.is_published
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {note.is_published ? <Globe size={11} /> : <Lock size={11} />}
                    {note.is_published ? 'Dipublikasikan (Live)' : 'Draft (Internal)'}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(note.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {note.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                  {note.content.replace(/#{1,3}\s+/g, '').replace(/[*_]/g, '')}
                </p>

                {note.author_name && (
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                    <ShieldCheck size={12} className="text-indigo-500" />
                    Dibuat oleh: <strong className="text-slate-600">{note.author_name}</strong>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <button
                  type="button"
                  onClick={() => setPreviewNote(note)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Lihat tampilan pop-up modal"
                >
                  <Eye size={13} />
                  <span>Preview</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTogglePublish(note)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    note.is_published
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title={note.is_published ? 'Ubah status jadi Draft' : 'Publikasikan ke Kasir/User'}
                >
                  {note.is_published ? <Lock size={13} /> : <Globe size={13} />}
                  <span>{note.is_published ? 'Unpublish' : 'Publish'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(note)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
                  title="Edit data rilis"
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeletingNote(note)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
                  title="Hapus permanen"
                >
                  <Trash2 size={13} />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Form Create / Edit */}
      {isFormModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(5px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '640px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            overflow: 'hidden'
          }}>
            {/* Header Form */}
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#e0e7ff',
                  color: '#4338ca',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>
                    {editingNote ? 'Edit Release Note' : 'Buat Release Note Baru'}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                    Pengumuman akan otomatis tampil saat pengguna login jika statusnya Publikasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                disabled={isSubmitting}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body Form */}
            <form onSubmit={handleSubmitForm} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Nomor Versi <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. v2.5.0"
                      value={formData.version}
                      onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        color: '#4338ca',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                      Judul Pembaruan <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Update Laporan Keuangan Akrual & Approval Hapus Data"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                {/* Quick Insert Templates */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '700', color: '#334155' }}>
                      Rincian / Konten Pembaruan <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('features')}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #c7d2fe',
                          backgroundColor: '#eef2ff',
                          color: '#4338ca',
                          cursor: 'pointer'
                        }}
                      >
                        + Template Fitur Baru
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertTemplate('fixes')}
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: '600',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: '1px solid #fecdd3',
                          backgroundColor: '#fff1f2',
                          color: '#be123c',
                          cursor: 'pointer'
                        }}
                      >
                        + Template Bug Fix
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={8}
                    required
                    placeholder="Tuliskan poin-poin update, gunakan tanda - untuk bullet list dan ### untuk judul sub-bagian..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.84rem',
                      lineHeight: 1.5,
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                      resize: 'vertical'
                    }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Tips: Gunakan <code>### Subjudul</code> untuk heading, <code>- Poin update</code> untuk bullet list, dan <code>**teks tebal**</code> untuk highlight.
                  </span>
                </div>

                {/* Publish Checkbox */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: '700', color: '#0f172a' }}>
                      Status Publikasi (Live)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Jika dicentang, rilis ini akan langsung memicu pop-up notifikasi untuk kasir/user saat login.
                    </div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.is_published}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked }))}
                      style={{ width: '18px', height: '18px', accentColor: '#4f46e5', cursor: 'pointer' }}
                    />
                  </label>
                </div>
              </div>

              {/* Footer Form */}
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  disabled={isSubmitting}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.84rem',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: isSubmitting ? '#94a3b8' : '#4f46e5',
                    color: '#ffffff',
                    fontSize: '0.84rem',
                    fontWeight: '700',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 4px rgba(79, 70, 229, 0.3)'
                  }}
                >
                  <Send size={14} />
                  <span>{isSubmitting ? 'Menyimpan...' : (editingNote ? 'Simpan Perubahan' : 'Terbitkan Release Note')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingNote && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 100000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px'
            }}>
              <Trash2 size={26} />
            </div>
            <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: '700', color: '#111827' }}>
              Hapus Release Note?
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: '#4b5563', lineHeight: 1.5 }}>
              Anda akan menghapus pengumuman versi <strong>{deletingNote.version}</strong> ("{deletingNote.title}"). Tindakan ini bersifat permanen.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeletingNote(null)}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontWeight: '600',
                  fontSize: '0.84rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isDeleting ? '#94a3b8' : '#dc2626',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.84rem',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewNote && (
        <ReleaseNoteModal
          isOpen={Boolean(previewNote)}
          onClose={() => setPreviewNote(null)}
          releaseNote={previewNote}
          isHistoryMode={true}
        />
      )}
    </div>
  );
};

export default AdminReleaseNotes;
