'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { formatCurrency, formatDate } from '@/lib/utils';

// Kategori manual (Gaji Karyawan excluded from manual input per spec §9.2)
const CATEGORIES = ['Pembelian Bahan', 'Peralatan & Perlengkapan', 'Sewa & Utilitas', 'Perawatan & Servis', 'Marketing & Promosi', 'Lain-lain'];
const ALL_CATEGORIES = [...CATEGORIES, 'Gaji Karyawan'];

export default function PengeluaranPage() {
  const toast = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filterCat, setFilterCat] = useState('Semua');
  const [customCategories, setCustomCategories] = useState([]);
  const [form, setForm] = useState({ category: '', description: '', amount: '', date: '' });

  const allCategories = [...new Set([...ALL_CATEGORIES, ...customCategories])];

  const handleAddNewCategory = () => {
    const name = prompt('Masukkan nama kategori pengeluaran baru:');
    if (!name || !name.trim()) return;
    const newCat = name.trim();
    if (!customCategories.includes(newCat)) {
      setCustomCategories((prev) => [...prev, newCat]);
    }
    setFilterCat(newCat);
    toast.success(`Kategori "${newCat}" berhasil ditambahkan`);
  };

  const fetchData = async () => {
    let url = '/api/pengeluaran';
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (params.toString()) url += '?' + params.toString();

    const res = await fetch(url);
    setExpenses(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [from, to]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ category: 'Pembelian Bahan', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      category: item.category,
      description: item.description,
      amount: item.amount.toString(),
      date: new Date(item.date).toISOString().split('T')[0],
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/pengeluaran/${editItem.id}` : '/api/pengeluaran';
    const method = editItem ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) {
      toast.success(editItem ? 'Pengeluaran diupdate' : 'Pengeluaran ditambahkan');
      setModalOpen(false);
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Gagal menyimpan');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus?')) return;
    const res = await fetch(`/api/pengeluaran/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Dihapus'); fetchData(); } else toast.error('Gagal menghapus');
  };

  // Filter by category
  const filtered = filterCat === 'Semua' ? expenses : expenses.filter((e) => e.category === filterCat);
  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const renderFormFields = () => (
    <>
      <div className="form-group">
        <label className="form-label">Kategori *</label>
        <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Deskripsi</label>
        <input type="text" className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Keterangan" />
      </div>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Nominal (Rp) *</label>
          <input type="number" className="form-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="50000" />
        </div>
        <div className="form-group">
          <label className="form-label">Tanggal *</label>
          <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
        </div>
      </div>
    </>
  );

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>💸 Manajemen Pengeluaran</h1>
          <p>Catat semua pengeluaran operasional</p>
        </div>
      </div>

      {/* Toolbar: date range + add button */}
      <div className="toolbar">
        <div className="toolbar-left" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <input type="date" className="form-input" value={from} onChange={(e) => setFrom(e.target.value)} style={{ maxWidth: '150px' }} />
          <span style={{ color: 'var(--text-tertiary)' }}>:</span>
          <input type="date" className="form-input" value={to} onChange={(e) => setTo(e.target.value)} style={{ maxWidth: '150px' }} />
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary hide-mobile" onClick={openAdd}>➕ Tambah</button>
        </div>
      </div>

      {/* Category chip filter (Desktop/Tablet >=768px) */}
      <div className="chip-filter-row" style={{ marginBottom: '16px' }}>
        {['Semua', ...allCategories].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              border: filterCat === cat ? '1px solid var(--primary)' : '1px solid var(--border)',
              background: filterCat === cat ? 'var(--primary-glow)' : 'var(--bg-card)',
              color: filterCat === cat ? 'var(--primary)' : 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition)',
              flexShrink: 0,
            }}
          >
            {cat}
          </button>
        ))}
        <button
          className="chip-add-new"
          onClick={handleAddNewCategory}
          title="Tambah Kategori Baru"
        >
          + Baru
        </button>
      </div>

      {/* Category Dropdown (Mobile <768px) */}
      <div className="category-dropdown-mobile">
        <select
          className="form-select"
          value={filterCat}
          onChange={(e) => {
            if (e.target.value === '__ADD_NEW__') {
              handleAddNewCategory();
            } else {
              setFilterCat(e.target.value);
            }
          }}
          style={{
            width: '100%',
            fontWeight: '600',
            fontSize: '13px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
          }}
        >
          <option value="Semua">📁 Semua Kategori</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>📁 {cat}</option>
          ))}
          <option value="__ADD_NEW__" style={{ fontWeight: '700', color: 'var(--primary)' }}>
            ➕ Tambah Kategori Baru...
          </option>
        </select>
      </div>

      {/* Summary card */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'linear-gradient(135deg, var(--danger-bg), rgba(239,68,68,0.04))',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(239,68,68,0.15)',
        marginBottom: '20px',
      }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Pengeluaran</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: 'var(--danger)' }}>{formatCurrency(total)}</div>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{filtered.length} transaksi</div>
      </div>

      {/* Table view for Tablet & Laptop (>= 768px) */}
      <div className="card hide-mobile">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p>Belum ada pengeluaran</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr><th>No</th><th>Tanggal</th><th>Kategori</th><th>Deskripsi</th><th>Nominal</th><th>Aksi</th></tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const isAutoEntry = item.category === 'Gaji Karyawan';
                  return (
                    <tr key={item.id} style={{ background: isAutoEntry ? 'var(--bg-tertiary)' : undefined, opacity: isAutoEntry ? 0.8 : 1 }}>
                      <td>{i + 1}</td>
                      <td>{formatDate(item.date)}</td>
                      <td>
                        <span className={`badge ${isAutoEntry ? 'badge-secondary' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                          {isAutoEntry && '🔒 '}{item.category}
                        </span>
                      </td>
                      <td>{item.description || '-'}</td>
                      <td style={{ fontWeight: '700', color: 'var(--danger)' }}>{formatCurrency(item.amount)}</td>
                      <td>
                        {isAutoEntry ? (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Otomatis</span>
                        ) : (
                          <div className="btn-group">
                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card list view for HP (< 768px) */}
      <div className="show-mobile">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📭</div><p>Belum ada pengeluaran</p></div>
        ) : (
          <div className="mobile-card-list">
            {filtered.map((item) => {
              const isAutoEntry = item.category === 'Gaji Karyawan';
              return (
                <div key={item.id} className="mobile-card" style={{ opacity: isAutoEntry ? 0.85 : 1, background: isAutoEntry ? 'var(--bg-tertiary)' : undefined }}>
                  <div className="mobile-card-header">
                    <span className={`badge ${isAutoEntry ? 'badge-secondary' : 'badge-warning'}`} style={{ fontSize: '11px' }}>
                      {isAutoEntry && '🔒 '}{item.category}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{formatDate(item.date)}</span>
                  </div>
                  <div className="mobile-card-body">
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>{item.description || item.category}</div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--danger)' }}>{formatCurrency(item.amount)}</div>
                  </div>
                  <div className="mobile-card-footer">
                    {isAutoEntry ? (
                      <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Entri Otomatis</span>
                    ) : (
                      <div className="btn-group">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(item)}>✏️ Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️ Hapus</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB Button for HP (< 768px) */}
      <button className="fab-btn" onClick={openAdd} title="Tambah Pengeluaran">
        +
      </button>

      {/* HP Full Screen Page for Add (< 768px) */}
      {modalOpen && !editItem && (
        <div className="show-mobile">
          <div className="full-screen-page-overlay">
            <div className="full-screen-page-header">
              <button className="btn btn-secondary btn-sm" onClick={() => setModalOpen(false)}>← Kembali</button>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tambah Pengeluaran</h3>
              <div style={{ width: '60px' }} />
            </div>
            <div className="full-screen-page-body">
              <form id="expense-form-hp" onSubmit={handleSubmit}>
                {renderFormFields()}
              </form>
            </div>
            <div className="full-screen-page-footer">
              <button type="submit" form="expense-form-hp" className="btn btn-primary w-full" style={{ padding: '12px' }}>
                Simpan Pengeluaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog for Tablet & Laptop, or Edit on all devices */}
      {modalOpen && (editItem || true) && (
        <div className={!editItem ? 'hide-mobile' : ''}>
          <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {renderFormFields()}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Simpan'}</button>
              </div>
            </form>
          </Modal>
        </div>
      )}
    </div>
  );
}
