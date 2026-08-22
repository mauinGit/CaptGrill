'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
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

  // View mode: 'login' | 'change'
  const [mode, setMode] = useState('login');

  // Change password state (Self-service)
  const [cpUsername, setCpUsername] = useState('');
  const [cpOldPassword, setCpOldPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpShowOld, setCpShowOld] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);
  const [cpError, setCpError] = useState('');

  const resetAll = () => {
    setError('');
    setCpError('');
    setSuccess('');
    setLoading(false);
    setCpUsername('');
    setCpOldPassword('');
    setCpNewPassword('');
    setCpConfirmPassword('');
    setCpShowOld(false);
    setCpShowNew(false);
  };

  const switchMode = (newMode) => {
    resetAll();
    setMode(newMode);
  };

  // Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Generic error banner per requirement #4
        setError('⚠️ Username atau password salah. Coba lagi.');
        setLoading(false);
        return;
      }
      // Role-based auto redirect per requirement #6
      if (data.user?.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/kasir/transaksi');
      }
    } catch {
      setError('⚠️ Username atau password salah. Coba lagi.');
      setLoading(false);
    }
  };

  // Change Password Handler (Self-service per requirement #7)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setCpError('');
    setSuccess('');
    if (cpNewPassword !== cpConfirmPassword) {
      setCpError('Konfirmasi password baru tidak cocok');
      return;
    }
    if (cpNewPassword.length < 4) {
      setCpError('Password baru minimal 4 karakter');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cpUsername, oldPassword: cpOldPassword, newPassword: cpNewPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCpError(data.error || 'Gagal mengubah password');
        setLoading(false);
        return;
      }
      setSuccess('Password berhasil diubah! Silakan login dengan password baru.');
      setTimeout(() => switchMode('login'), 2500);
    } catch {
      setCpError('Terjadi kesalahan server');
    }
    setLoading(false);
  };

  // Form Content Component (Reused for Split-Screen Right Panel & Mobile Card)
  const renderFormContent = (isMobileCard = false) => (
    <>
      {/* Error Banner */}
      {error && mode === 'login' && (
        <div className="error-banner">{error}</div>
      )}

      {cpError && mode === 'change' && (
        <div className="error-banner">⚠️ {cpError}</div>
      )}

      {/* Success Banner */}
      {success && (
        <div style={{
          background: 'rgba(22, 163, 74, 0.12)',
          border: '1px solid rgba(22, 163, 74, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          color: '#16a34a',
          fontSize: '13px',
          fontWeight: '600',
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

          {/* Submit Button with Loading Spinner State */}
          <button
            type="submit"
            className={`btn-masuk ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : <span>🔓 Masuk</span>}
          </button>

          <div style={{ marginTop: '18px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => switchMode('change')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: isMobileCard ? '#237227' : 'var(--primary)',
                fontSize: '13px', fontWeight: '700',
                textDecoration: 'underline', padding: 0,
                fontFamily: 'inherit',
              }}
            >
              🔑 Ganti Password
            </button>
          </div>
        </form>
      )}

      {/* SELF-SERVICE GANTI PASSWORD FORM */}
      {mode === 'change' && (
        <form onSubmit={handleChangePassword}>
          <div style={{
            marginBottom: '18px', padding: '12px 14px',
            background: isMobileCard ? 'rgba(35, 114, 39, 0.1)' : 'var(--primary-glow)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            fontSize: '12px', color: isMobileCard ? '#374151' : 'var(--text-secondary)',
            lineHeight: '1.5',
          }}>
            <strong style={{ color: isMobileCard ? '#1b5e20' : 'var(--primary)' }}>🔑 Self-Service Ganti Password</strong><br />
            Masukkan username dan password lama untuk memverifikasi identitas Anda.
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Masukkan username Anda"
              value={cpUsername}
              onChange={(e) => setCpUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password Lama</label>
            <PasswordInput
              value={cpOldPassword}
              onChange={(e) => setCpOldPassword(e.target.value)}
              placeholder="Password lama saat ini"
              showPassword={cpShowOld}
              onToggle={() => setCpShowOld(!cpShowOld)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password Baru</label>
            <PasswordInput
              value={cpNewPassword}
              onChange={(e) => setCpNewPassword(e.target.value)}
              placeholder="Password baru (min 4 karakter)"
              showPassword={cpShowNew}
              onToggle={() => setCpShowNew(!cpShowNew)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password Baru</label>
            <PasswordInput
              value={cpConfirmPassword}
              onChange={(e) => setCpConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              showPassword={cpShowNew}
              onToggle={() => setCpShowNew(!cpShowNew)}
            />
          </div>

          <button
            type="submit"
            className={`btn-masuk ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : <span>✅ Simpan Password Baru</span>}
          </button>

          <div style={{ marginTop: '14px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: isMobileCard ? '#237227' : 'var(--primary)',
                fontSize: '13px', fontWeight: '700',
                textDecoration: 'underline', padding: 0,
                fontFamily: 'inherit',
              }}
            >
              ← Kembali ke Login
            </button>
          </div>
        </form>
      )}
    </>
  );

  return (
    <div className="login-container">
      {/* Fullscreen 5% opacity texture background */}
      <div className="auth-bg-texture" />

      {/* LAPTOP SPLIT-SCREEN LAYOUT (≥ 1024px) */}
      <div className="auth-split-wrapper">
        {/* Kolom Kiri: Brand Panel */}
        <div className="auth-split-left">
          <div className="auth-bg-texture" />
          <div className="auth-brand-badge">
            <img src="/assets/logo.png" alt="CaptGrill Logo" />
          </div>
          <h1 className="auth-brand-title">CaptGrill</h1>
          <p className="auth-brand-tagline">
            Sistem Manajemen Penjualan &amp; Operasional Restoran Real-time
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <span>📦</span> Stok bahan real-time
            </div>
            <div className="auth-feature-item">
              <span>🛒</span> POS Kasir terintegrasi
            </div>
            <div className="auth-feature-item">
              <span>📊</span> Laporan keuangan otomatis
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Form Panel */}
        <div className="auth-split-right">
          <div className="auth-form-header">
            <h2>{mode === 'login' ? 'Selamat Datang' : 'Ganti Password'}</h2>
            <p>
              {mode === 'login'
                ? 'Masukkan akun Anda untuk mengakses sistem CaptGrill'
                : 'Ubah password akun Anda dengan verifikasi password lama'}
            </p>
          </div>
          {renderFormContent(false)}
        </div>
      </div>

      {/* TABLET & MOBILE CENTERED CARD LAYOUT (< 1024px) */}
      <div className="login-card-mobile">
        <div className="login-brand">
          <img src="/assets/logo.png" alt="CaptGrill Logo" />
          <h1>CaptGrill</h1>
          <p>Sistem Manajemen Penjualan</p>
        </div>
        {renderFormContent(true)}
      </div>
    </div>
  );
}
