'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

/* ---------- Ikon (inline SVG, ikut currentColor) ---------- */
const Icon = ({ children, size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

const UserIcon = () => (
  <Icon>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
  </Icon>
);

const LockIcon = () => (
  <Icon>
    <rect x="4" y="10" width="16" height="11" rx="2.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </Icon>
);

const EyeIcon = () => (
  <Icon>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

const EyeOffIcon = () => (
  <Icon>
    <path d="M17.9 17.9A10 10 0 0 1 12 19c-6.4 0-10-7-10-7a18.4 18.4 0 0 1 5.1-5.9" />
    <path d="M9.9 5.2A9 9 0 0 1 12 5c6.4 0 10 7 10 7a18.5 18.5 0 0 1-2.2 3.2" />
    <path d="M14.1 14.1a3 3 0 1 1-4.2-4.2" />
    <path d="M2 2l20 20" />
  </Icon>
);

const ArrowRightIcon = () => (
  <Icon size={20} strokeWidth="2.2" className={styles.submitArrow}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

const ArrowLeftIcon = () => (
  <Icon>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </Icon>
);

const KeyIcon = () => (
  <Icon>
    <circle cx="8" cy="15" r="4" />
    <path d="M10.8 12.2L20 3M16 7l3 3M14 9l2 2" />
  </Icon>
);

const AlertIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4.5M12 16h.01" />
  </Icon>
);

const CheckIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.5 2.5L16 9.5" />
  </Icon>
);

const ShieldIcon = () => (
  <Icon size={16}>
    <path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z" />
    <path d="M9 12l2 2 4-4" />
  </Icon>
);

const ClockIcon = () => (
  <Icon size={15} strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

const FlameIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2c.5 3.2-1.2 5-2.8 6.8C7.6 10.6 6 12.4 6 15a6 6 0 0 0 12 0c0-2.3-1.1-4-2.3-5.2.1 1.5-.4 2.7-1.5 3.2.4-3.6-.6-7.6-2.2-11z" />
  </svg>
);

/* ---------- Helper ---------- */
function getGreeting(hour) {
  if (hour >= 4 && hour < 11) return 'Selamat pagi';
  if (hour >= 11 && hour < 15) return 'Selamat siang';
  if (hour >= 15 && hour < 18) return 'Selamat sore';
  return 'Selamat malam';
}

// Jam hanya dirender di client supaya tidak terjadi hydration mismatch
function useNow() {
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const SERVER_DOWN_MSG =
  'Server sedang tidak bisa dihubungi. Coba lagi sebentar lagi, atau hubungi admin.';
const OFFLINE_MSG = 'Tidak ada koneksi ke server. Periksa internet Anda lalu coba lagi.';

/* ---------- Input password + toggle + deteksi Caps Lock ---------- */
function PasswordField({ id, label, value, onChange, placeholder, autoComplete, show, onToggle, inputRef, invalid, describedBy }) {
  const [capsOn, setCapsOn] = useState(false);
  const checkCaps = (e) => {
    if (typeof e.getModifierState === 'function') setCapsOn(e.getModifierState('CapsLock'));
  };

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>{label}</label>
      <div className={styles.control}>
        <span className={styles.controlIcon}><LockIcon /></span>
        <input
          ref={inputRef}
          id={id}
          type={show ? 'text' : 'password'}
          className={styles.input}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onKeyUp={checkCaps}
          onKeyDown={checkCaps}
          onBlur={() => setCapsOn(false)}
          autoComplete={autoComplete}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          required
        />
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
          aria-pressed={show}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {capsOn && (
        <p className={`${styles.hint} ${styles.hintWarn}`}>
          <AlertIcon /> Caps Lock sedang aktif
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const now = useNow();

  const usernameRef = useRef(null);
  const passwordRef = useRef(null);
  const cpUsernameRef = useRef(null);

  // View mode: 'login' | 'change'
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Ganti password (self-service)
  const [cpUsername, setCpUsername] = useState('');
  const [cpOldPassword, setCpOldPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpShowOld, setCpShowOld] = useState(false);
  const [cpShowNew, setCpShowNew] = useState(false);

  // Fokus otomatis hanya di layar lebar — di HP keyboard tidak langsung menutupi layar
  useEffect(() => {
    if (!window.matchMedia('(min-width: 1024px)').matches) return;
    if (mode === 'change') cpUsernameRef.current?.focus();
    else if (username) passwordRef.current?.focus();
    else usernameRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const resetChangeForm = () => {
    setCpUsername('');
    setCpOldPassword('');
    setCpNewPassword('');
    setCpConfirmPassword('');
    setCpShowOld(false);
    setCpShowNew(false);
  };

  const switchMode = (newMode) => {
    setError('');
    setSuccess('');
    setLoading(false);
    resetChangeForm();
    if (newMode === 'change') setCpUsername(username.trim());
    setMode(newMode);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) setError('Username atau password salah. Coba lagi.');
        else if (res.status === 400) setError(data.error || 'Username dan password harus diisi.');
        else setError(SERVER_DOWN_MSG);
        setLoading(false);
        return;
      }
      // Redirect sesuai role
      router.replace(data.user?.role === 'ADMIN' ? '/admin/dashboard' : '/kasir/transaksi');
    } catch {
      setError(OFFLINE_MSG);
      setLoading(false);
    }
  };

  const passwordsMismatch = cpConfirmPassword.length > 0 && cpNewPassword !== cpConfirmPassword;
  const passwordsMatch = cpConfirmPassword.length > 0 && cpNewPassword === cpConfirmPassword;

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (cpNewPassword.length < 4) {
      setError('Password baru minimal 4 karakter.');
      return;
    }
    if (cpNewPassword !== cpConfirmPassword) {
      setError('Konfirmasi password baru belum sama.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cpUsername.trim(),
          oldPassword: cpOldPassword,
          newPassword: cpNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status >= 500 ? SERVER_DOWN_MSG : data.error || 'Gagal mengubah password.');
        setLoading(false);
        return;
      }
      // Kembali ke login dengan username sudah terisi
      const savedUsername = cpUsername.trim();
      resetChangeForm();
      setUsername(savedUsername);
      setPassword('');
      setLoading(false);
      setMode('login');
      setSuccess('Password berhasil diubah. Silakan masuk dengan password baru.');
    } catch {
      setError(OFFLINE_MSG);
      setLoading(false);
    }
  };

  const dateLabel = now?.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeLabel = now?.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const year = now?.getFullYear() ?? new Date().getFullYear();

  return (
    <div className={styles.root}>
      {/* ===== Panel brand ===== */}
      <aside className={styles.brand}>
        <div className={styles.brandTop}>
          <Image
            src="/assets/logo.png"
            alt="CaptGrill — #PERFECTIN1BITE by Sekenyangan"
            width={1681}
            height={748}
            sizes="140px"
            priority
            className={styles.logo}
          />
          {now && (
            <div className={styles.clock} aria-label={`${dateLabel}, pukul ${timeLabel}`}>
              <ClockIcon />
              <span>{dateLabel}</span>
              <span className={styles.clockSep} aria-hidden="true" />
              <strong>{timeLabel}</strong>
            </div>
          )}
        </div>

        <div className={styles.photoArea} aria-hidden="true">
          <div className={styles.photoFrame}>
            <Image
              src="/images/Autentikasi.webp"
              alt=""
              fill
              sizes="(min-width: 1024px) 400px, 1px"
              priority
              className={styles.photo}
            />
            <span className={styles.sticker}>
              <FlameIcon /> #PERFECTIN1BITE
            </span>
          </div>
        </div>

        <div className={styles.brandCopy}>
          <h1>
            Siap melayani
            <br />
            <span>hari ini?</span>
          </h1>
          <p>Transaksi kasir, stok bahan, dan absensi karyawan CaptGrill — semuanya tercatat di satu tempat.</p>
        </div>
      </aside>

      {/* ===== Panel form ===== */}
      <main className={styles.formPanel}>
        <div className={styles.formInner} key={mode}>
          {mode === 'login' ? (
            <>
              <p className={styles.eyebrow}>{now ? getGreeting(now.getHours()) : 'Selamat datang'}</p>
              <h2 className={styles.title}>Masuk ke akun Anda</h2>
              <p className={styles.subtitle}>
                Gunakan username dan password dari admin. Anda akan langsung diarahkan ke halaman sesuai peran.
              </p>

              {success && (
                <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
                  <CheckIcon /> <span>{success}</span>
                </div>
              )}
              {error && (
                <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                  <AlertIcon /> <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className={styles.field}>
                  <label htmlFor="username" className={styles.label}>Username</label>
                  <div className={styles.control}>
                    <span className={styles.controlIcon}><UserIcon /></span>
                    <input
                      ref={usernameRef}
                      id="username"
                      type="text"
                      className={styles.input}
                      placeholder="contoh: kasir1"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                    />
                  </div>
                </div>

                <PasswordField
                  id="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  inputRef={passwordRef}
                />

                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? (
                    <>
                      <span className={styles.spinner} aria-hidden="true" /> Memeriksa akun…
                    </>
                  ) : (
                    <>
                      Masuk <ArrowRightIcon />
                    </>
                  )}
                </button>
              </form>

              <div className={styles.linkRow}>
                <button type="button" className={styles.linkBtn} onClick={() => switchMode('change')}>
                  <KeyIcon /> Ganti password
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`${styles.linkBtn} ${styles.backBtn}`}
                onClick={() => switchMode('login')}
              >
                <ArrowLeftIcon /> Kembali ke login
              </button>

              <p className={styles.eyebrow}>Keamanan akun</p>
              <h2 className={styles.title}>Ganti password</h2>
              <p className={styles.subtitle}>Verifikasi dengan password lama, lalu buat password baru.</p>

              <div className={styles.note}>
                <ShieldIcon />
                <span>Lupa password lama? Minta admin untuk mereset password Anda dari menu Akun.</span>
              </div>

              {error && (
                <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                  <AlertIcon /> <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                <div className={styles.field}>
                  <label htmlFor="cp-username" className={styles.label}>Username</label>
                  <div className={styles.control}>
                    <span className={styles.controlIcon}><UserIcon /></span>
                    <input
                      ref={cpUsernameRef}
                      id="cp-username"
                      type="text"
                      className={styles.input}
                      placeholder="Username Anda"
                      value={cpUsername}
                      onChange={(e) => setCpUsername(e.target.value)}
                      autoComplete="username"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      required
                    />
                  </div>
                </div>

                <PasswordField
                  id="cp-old"
                  label="Password lama"
                  value={cpOldPassword}
                  onChange={(e) => setCpOldPassword(e.target.value)}
                  placeholder="Password saat ini"
                  autoComplete="current-password"
                  show={cpShowOld}
                  onToggle={() => setCpShowOld((v) => !v)}
                />

                <PasswordField
                  id="cp-new"
                  label="Password baru"
                  value={cpNewPassword}
                  onChange={(e) => setCpNewPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  autoComplete="new-password"
                  show={cpShowNew}
                  onToggle={() => setCpShowNew((v) => !v)}
                />

                <PasswordField
                  id="cp-confirm"
                  label="Ulangi password baru"
                  value={cpConfirmPassword}
                  onChange={(e) => setCpConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  autoComplete="new-password"
                  show={cpShowNew}
                  onToggle={() => setCpShowNew((v) => !v)}
                  invalid={passwordsMismatch}
                  describedBy="cp-confirm-hint"
                />
                {(passwordsMismatch || passwordsMatch) && (
                  <p
                    id="cp-confirm-hint"
                    className={`${styles.hint} ${passwordsMatch ? styles.hintOk : styles.hintBad}`}
                    style={{ marginTop: -8, marginBottom: 18 }}
                  >
                    {passwordsMatch ? <CheckIcon /> : <AlertIcon />}
                    {passwordsMatch ? 'Password cocok' : 'Password belum sama'}
                  </p>
                )}

                <button type="submit" className={styles.submit} disabled={loading}>
                  {loading ? (
                    <>
                      <span className={styles.spinner} aria-hidden="true" /> Menyimpan…
                    </>
                  ) : (
                    'Simpan password baru'
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        <footer className={styles.footer}>© {year} CaptGrill · #PERFECTIN1BITE by Sekenyangan</footer>
      </main>
    </div>
  );
}
