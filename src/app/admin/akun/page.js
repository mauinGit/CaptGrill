'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import Modal from '@/components/Modal';

export default function AkunPage() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ username: '', password: '', name: '', role: 'KASIR' });
  const [showPassword, setShowPassword] = useState(false);

  const fetchData = async () => {
    const res = await fetch('/api/users');
    setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditItem(null);
    setForm({ username: '', password: '', name: '', role: 'KASIR' });
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ username: item.username, password: '', name: item.name, role: item.role });
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = editItem ? `/api/users/${editItem.id}` : '/api/users';
    const method = editItem ? 'PUT' : 'POST';
    const payload = { ...form, role: 'KASIR' };
    if (editItem && !payload.password) delete payload.password;

    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (res.ok) {
      toast.success(editItem ? 'Akun diupdate' : 'Akun dibuat');
      setModalOpen(false);
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || 'Gagal');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus akun ini? Semua data terkait (transaksi, absensi, log) akan ikut terhapus.')) return;
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Akun berhasil dihapus'); fetchData(); } else toast.error('Gagal menghapus');
  };

  const handleResetPassword = async (user) => {
    const newPassword = prompt(`Reset password untuk ${user.name}?\nMasukkan password baru:`);
    if (!newPassword) return;
    if (newPassword.length < 4) {
      toast.error('Password minimal 4 karakter');
      return;
    }
    const res = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    if (res.ok) {
      toast.success(`Password ${user.name} berhasil direset`);
    } else {
      toast.error('Gagal mereset password');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>👤 Manajemen Akun</h1>
          <p>Kelola akun pengguna sistem</p>
        </div>
        <div className="navbar-right">
          <button className="btn btn-primary" onClick={openAdd}>➕ Tambah Akun Kasir</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead><tr><th>No</th><th>Username</th><th>Nama</th><th>Role</th><th>Aksi</th></tr></thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: '600' }}>{u.username}</td>
                    <td>{u.name}</td>
                    <td>
                      <span className={`badge ${u.role === 'ADMIN' ? 'badge-info' : 'badge-success'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>✏️</button>
                        <button className="btn btn-warning btn-sm" onClick={() => handleResetPassword(u)} title="Reset Password">🔑</button>
                        {u.role !== 'ADMIN' && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? 'Edit Akun' : 'Tambah Akun Kasir'}>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Nama Lengkap</label>
              <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password {editItem && '(kosongkan jika tidak diubah)'}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  {...(!editItem && { required: true })}
                  style={{ paddingRight: '44px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                    display: 'flex', alignItems: 'center',
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <input type="text" className="form-input" value="KASIR" disabled style={{ background: 'var(--bg-tertiary)' }} />
              <small style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>Akun baru hanya bisa Kasir</small>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Batal</button>
            <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Simpan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
