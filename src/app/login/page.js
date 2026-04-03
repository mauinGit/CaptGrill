'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const PasswordInput = ({ value, onChange, placeholder, showPassword, onToggle, autoFocus }) => (
  <div style={{ position: 'relative' }}>
    <input
      type={showPassword ? 'text' : 'password'}
      className="form-input"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required
      autoFocus={autoFocus}
      style={{ paddingRight: '44px' }}
    />
    <button
      type="button"
      onClick={onToggle}
      style={{
        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      tabIndex={-1}
    >
      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  </div>
);

export default function LoginPage() {
  const router = useRouter();

  // Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // View mode: 'login' | 'change' | 'forgot'
  const [mode, setMode] = useState('login');

  // Change password state
  const [cpUsername, setCpUsername] = useState('');
  const [cpOldPassword, setCpOldPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpShowOld, setCpShowOld] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);

  // Forgot password state
  const [fpUsername, setFpUsername] = useState('');
  const [fpAdminPassword, setFpAdminPassword] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpShowAdmin, setFpShowAdmin] = useState(false);
  const [fpShowNew, setFpShowNew] = useState(false);

  const resetAll = () => {
    setError('');
    setSuccess('');
    setLoading(false);
    setCpUsername(''); setCpOldPassword(''); setCpNewPassword(''); setCpConfirmPassword('');
    setFpUsername(''); setFpAdminPassword(''); setFpNewPassword(''); setFpConfirmPassword('');
    setCpShowOld(false); setCpShowNew(false); setFpShowAdmin(false); setFpShowNew(false);
  };

  const switchMode = (newMode) => {
    resetAll();
    setMode(newMode);
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login gagal'); setLoading(false); return; }
      if (data.user.role === 'ADMIN') router.push('/admin/dashboard');
      else router.push('/kasir/transaksi');
    } catch {
      setError('Terjadi kesalahan server');
      setLoading(false);
    }
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (cpNewPassword !== cpConfirmPassword) { setError('Konfirmasi password tidak cocok'); return; }
    if (cpNewPassword.length < 4) { setError('Password baru minimal 4 karakter'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cpUsername, oldPassword: cpOldPassword, newPassword: cpNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal mengubah password'); setLoading(false); return; }
      setSuccess('Password berhasil diubah! Silakan login dengan password baru.');
      setTimeout(() => switchMode('login'), 2500);
    } catch {
      setError('Terjadi kesalahan server');
    }
    setLoading(false);
  };

  // Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (fpNewPassword !== fpConfirmPassword) { setError('Konfirmasi password tidak cocok'); return; }
    if (fpNewPassword.length < 4) { setError('Password baru minimal 4 karakter'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: fpUsername, adminPassword: fpAdminPassword, newPassword: fpNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Gagal mereset password'); setLoading(false); return; }
      setSuccess('Password berhasil direset! Silakan login dengan password baru.');
      setTimeout(() => switchMode('login'), 2500);
    } catch {
      setError('Terjadi kesalahan server');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <img 
            src="/assets/logo.png"
            alt="test"
            style={{ width: '190px', height: '100px'}}
          />
          <h1>CaptGrill</h1>
          <p>Sistem Manajemen Penjualan</p>
        </div>

        {error && <div className="login-error">{error}</div>}
        {success && (
          <div style={{
            background: 'rgba(22, 163, 74, 0.1)',
            border: '1px solid rgba(22, 163, 74, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#16a34a',
            fontSize: '13px',
            textAlign: 'center',
          }}>
            ✅ {success}
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                showPassword={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Memproses...' : '🔓 Masuk'}
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => switchMode('change')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#237227', fontSize: '13px', fontWeight: '600',
                  textDecoration: 'underline', padding: 0,
                }}
              >
                🔑 Ganti Password
              </button>
              <button
                type="button"
                onClick={() => switchMode('forgot')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#237227', fontSize: '13px', fontWeight: '600',
                  textDecoration: 'underline', padding: 0,
                }}
              >
                ❓ Lupa Password
              </button>
            </div>
          </form>
        )}

        {/* CHANGE PASSWORD FORM */}
        {mode === 'change' && (
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(35, 114, 39, 0.08)', borderRadius: '8px', fontSize: '12px', color: '#555', lineHeight: '1.5' }}>
              <strong>🔑 Ganti Password</strong><br/>
              Masukkan username dan password lama untuk mengubah password.
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-input" placeholder="Masukkan username" value={cpUsername} onChange={(e) => setCpUsername(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password Lama</label>
              <PasswordInput value={cpOldPassword} onChange={(e) => setCpOldPassword(e.target.value)} placeholder="Password saat ini" showPassword={cpShowOld} onToggle={() => setCpShowOld(!cpShowOld)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password Baru</label>
              <PasswordInput value={cpNewPassword} onChange={(e) => setCpNewPassword(e.target.value)} placeholder="Password baru (min 4 karakter)" showPassword={cpShowNew} onToggle={() => setCpShowNew(!cpShowNew)} />
            </div>
            <div className="form-group">
              <label className="form-label">Konfirmasi Password Baru</label>
              <PasswordInput value={cpConfirmPassword} onChange={(e) => setCpConfirmPassword(e.target.value)} placeholder="Ulangi password baru" showPassword={cpShowNew} onToggle={() => setCpShowNew(!cpShowNew)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Memproses...' : '✅ Ubah Password'}
            </button>
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#237227', fontSize: '13px', fontWeight: '600', textDecoration: 'underline' }}>
                ← Kembali ke Login
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPassword}>
            <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(35, 114, 39, 0.08)', borderRadius: '8px', fontSize: '12px', color: '#555', lineHeight: '1.5' }}>
              <strong>❓ Lupa Password</strong><br/>
              Hubungi admin untuk otorisasi. Admin akan memasukkan password admin, lalu Anda bisa set password baru.
            </div>
            <div className="form-group">
              <label className="form-label">Username Anda</label>
              <input type="text" className="form-input" placeholder="Username yang lupa password" value={fpUsername} onChange={(e) => setFpUsername(e.target.value)} required autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Password Admin (untuk otorisasi)</label>
              <PasswordInput value={fpAdminPassword} onChange={(e) => setFpAdminPassword(e.target.value)} placeholder="Admin masukkan password" showPassword={fpShowAdmin} onToggle={() => setFpShowAdmin(!fpShowAdmin)} />
            </div>
            <div style={{ borderTop: '1px dashed #ccc', margin: '16px 0', paddingTop: '12px' }}>
              <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>Sekarang masukkan password baru Anda:</p>
            </div>
            <div className="form-group">
              <label className="form-label">Password Baru</label>
              <PasswordInput value={fpNewPassword} onChange={(e) => setFpNewPassword(e.target.value)} placeholder="Password baru (min 4 karakter)" showPassword={fpShowNew} onToggle={() => setFpShowNew(!fpShowNew)} />
            </div>
            <div className="form-group">
              <label className="form-label">Konfirmasi Password Baru</label>
              <PasswordInput value={fpConfirmPassword} onChange={(e) => setFpConfirmPassword(e.target.value)} placeholder="Ulangi password baru" showPassword={fpShowNew} onToggle={() => setFpShowNew(!fpShowNew)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? '⏳ Memproses...' : '✅ Reset Password'}
            </button>
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button type="button" onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#237227', fontSize: '13px', fontWeight: '600', textDecoration: 'underline' }}>
                ← Kembali ke Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
