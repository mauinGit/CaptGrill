'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { haversineDistance, isLocationValid } from '@/lib/logic/absensi';

const PURPOSES = [
  { value: 'Shift 1', label: '🌅 Shift 1', icon: '🌅' },
  { value: 'Shift 2', label: '🌙 Shift 2', icon: '🌙' },
  { value: 'Buat Bahan', label: '🧪 Buat Bahan', icon: '🧪' },
];

// GPS radius — sinkron dengan MAX_ATTENDANCE_DISTANCE di .env (server-side)
// Untuk mengubah jarak maksimal:
//   → Buka file .env di root project
//   → Ubah nilai MAX_ATTENDANCE_DISTANCE (dalam meter)
//   → Contoh: MAX_ATTENDANCE_DISTANCE="200000" = 200 km
//   → Restart server setelah mengubah
const RESTO_LAT = -3.210016033275934;
const RESTO_LNG = 104.65214119416274;
const MAX_RADIUS_M = 200000; // 200 km — samakan dengan .env untuk testing

export default function AbsensiKasirPage() {
  const toast = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [flashEffect, setFlashEffect] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null);
  const [locationDistance, setLocationDistance] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [purpose, setPurpose] = useState('Shift 1');
  const [loading, setLoading] = useState(true);
  const [attendances, setAttendances] = useState({
    'Shift 1': null, 'Shift 2': null, 'Buat Bahan': null,
  });

  // Fetch today's attendance status
  useEffect(() => {
    const fetchAttendances = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        const myId = meData.user?.id;
        if (!myId) return;

        const res = await fetch(`/api/absensi?date=${today}&userId=${myId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          const updated = { 'Shift 1': null, 'Shift 2': null, 'Buat Bahan': null };
          data.forEach((att) => {
            const key = att.purpose === 'Membuat Bahan' ? 'Buat Bahan' : att.purpose;
            if (key in updated) updated[key] = att;
          });
          setAttendances(updated);
          const first = PURPOSES.find((p) => !updated[p.value]);
          if (first) setPurpose(first.value);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendances();
  }, []);

  // Stop camera on unmount
  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  const startCamera = async () => {
    try {
      setCameraReady(false);
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setCameraReady(true);
        };
      }
    } catch (err) {
      setCameraActive(false);
      toast.error('Gagal membuka kamera. Pastikan izin kamera diizinkan di browser.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraReady(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    // Flash effect
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 300);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const maxSize = 640;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > maxSize || h > maxSize) {
      if (w > h) { h = Math.round((h / w) * maxSize); w = maxSize; }
      else { w = Math.round((w / h) * maxSize); h = maxSize; }
    }
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d').drawImage(video, 0, 0, w, h);
    setPhoto(canvas.toDataURL('image/jpeg', 0.75));
    stopCamera();
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung browser ini');
      return;
    }
    setLocationStatus('checking');
    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const dist = haversineDistance(latitude, longitude, RESTO_LAT, RESTO_LNG);
        const valid = isLocationValid(dist, MAX_RADIUS_M);
        setLocation({ latitude, longitude, accuracy });
        setLocationDistance(Math.round(dist));
        setLocationStatus(valid ? 'valid' : 'invalid');
        if (!valid) {
          setLocationError(`Kamu berada ${Math.round(dist)}m dari resto (maks. ${MAX_RADIUS_M}m)`);
        }
      },
      (err) => {
        setLocationStatus(null);
        setLocationError(
          err.code === 1 ? 'Izin lokasi ditolak. Izinkan akses lokasi di browser.' :
          err.code === 2 ? 'Lokasi tidak tersedia. Pastikan GPS aktif.' :
          'Gagal mendapatkan lokasi: ' + err.message
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const hasAttended = (p) => attendances[p] !== null;
  const isFormReady = photo && locationStatus === 'valid';

  const handleSubmit = async () => {
    if (!photo) { toast.error('Foto wajib diambil terlebih dahulu'); return; }
    if (locationStatus !== 'valid') { toast.error('Lokasi harus dalam radius resto'); return; }
    if (hasAttended(purpose)) { toast.error(`Sudah absen ${purpose} hari ini`); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo, latitude: location.latitude, longitude: location.longitude, purpose }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ Absensi ${purpose} berhasil!`);
        setAttendances((prev) => ({ ...prev, [purpose]: { clockIn: new Date().toISOString(), purpose } }));
        setPhoto(null);
        setLocation(null);
        setLocationStatus(null);
        setLocationDistance(null);
        const next = PURPOSES.find((p) => !hasAttended(p.value) && p.value !== purpose);
        if (next) setPurpose(next.value);
      } else {
        toast.error(data.error || 'Gagal melakukan absensi');
      }
    } catch {
      toast.error('Terjadi kesalahan. Periksa koneksi internet.');
    }
    setSubmitting(false);
  };

  const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // Format distance label
  const formatDistance = (meters) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${meters}m`;
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="navbar"><div className="navbar-left"><h1>🗓️ Absensi</h1><p>{todayStr}</p></div></div>
        <div className="empty-state"><div className="empty-state-icon">⏳</div><p>Memuat...</p></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Inline styles for camera animations */}
      <style>{`
        @keyframes pulse-recording {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes scan-line {
          0% { top: 0; }
          100% { top: 100%; }
        }
        @keyframes flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        .camera-viewfinder {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          background: #000;
        }
        .camera-viewfinder video {
          width: 100%;
          display: block;
          max-height: 320px;
          object-fit: cover;
          transform: scaleX(-1);
        }
        .camera-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .camera-corners {
          position: absolute;
          inset: 12px;
        }
        .camera-corners::before,
        .camera-corners::after,
        .camera-corner-bl,
        .camera-corner-br {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          border-color: rgba(255,255,255,0.7);
          border-style: solid;
          border-width: 0;
        }
        .camera-corners::before {
          top: 0; left: 0;
          border-top-width: 3px; border-left-width: 3px;
          border-radius: 4px 0 0 0;
        }
        .camera-corners::after {
          top: 0; right: 0;
          border-top-width: 3px; border-right-width: 3px;
          border-radius: 0 4px 0 0;
        }
        .camera-corner-bl {
          bottom: 0; left: 0;
          border-bottom-width: 3px; border-left-width: 3px;
          border-radius: 0 0 0 4px;
        }
        .camera-corner-br {
          bottom: 0; right: 0;
          border-bottom-width: 3px; border-right-width: 3px;
          border-radius: 0 0 4px 0;
        }
        .face-guide {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 140px; height: 180px;
          border: 2px dashed rgba(255,255,255,0.4);
          border-radius: 50%;
          animation: face-guide-pulse 2s ease-in-out infinite;
        }
        .face-guide-label {
          position: absolute;
          bottom: -28px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255,255,255,0.7);
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,0.8);
        }
        .recording-indicator {
          position: absolute;
          top: 12px; left: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          padding: 4px 10px;
          border-radius: 20px;
        }
        .recording-dot {
          width: 8px; height: 8px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse-recording 1.2s ease-in-out infinite;
        }
        .recording-text {
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .camera-flash {
          position: absolute;
          inset: 0;
          background: #fff;
          animation: flash 0.3s ease-out forwards;
          z-index: 10;
        }
        .capture-btn-ring {
          width: 64px; height: 64px;
          border-radius: 50%;
          border: 4px solid #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.15s ease;
          background: transparent;
          padding: 0;
          font-family: inherit;
        }
        .capture-btn-ring:hover {
          transform: scale(1.08);
        }
        .capture-btn-ring:active {
          transform: scale(0.92);
        }
        .capture-btn-inner {
          width: 48px; height: 48px;
          border-radius: 50%;
          background: #fff;
          transition: background 0.15s ease;
        }
        .capture-btn-ring:hover .capture-btn-inner {
          background: #e5e7eb;
        }
        .photo-preview-container {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
        }
        .photo-preview-container img {
          width: 100%;
          display: block;
          max-height: 320px;
          object-fit: cover;
          border-radius: 16px;
        }
        .photo-check-badge {
          position: absolute;
          top: 12px; right: 12px;
          background: var(--success);
          color: #fff;
          width: 32px; height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 800;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
      `}</style>

      <div className="navbar">
        <div className="navbar-left">
          <h1>🗓️ Absensi</h1>
          <p>{todayStr}</p>
        </div>
      </div>

      {/* Status panel */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-tertiary)', marginBottom: '12px' }}>
          Status Absensi Hari Ini
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-around' }}>
          {PURPOSES.map((p) => {
            const done = hasAttended(p.value);
            const att = attendances[p.value];
            return (
              <div key={p.value} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{done ? '✓' : '✕'}</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: done ? 'var(--success)' : 'var(--text-tertiary)' }}>{p.label}</div>
                {done && att?.clockIn && (
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    {new Date(att.clockIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Purpose selection chips */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Tujuan Absensi</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {PURPOSES.map((p) => {
            const done = hasAttended(p.value);
            const isActive = purpose === p.value;
            return (
              <button
                key={p.value}
                onClick={() => !done && setPurpose(p.value)}
                disabled={done}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: isActive && !done ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: done ? 'var(--bg-tertiary)' : isActive ? 'var(--primary-glow)' : 'var(--bg-card)',
                  color: done ? 'var(--text-tertiary)' : isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  fontSize: '13px', fontWeight: '700',
                  cursor: done ? 'not-allowed' : 'pointer',
                  opacity: done ? 0.6 : 1,
                  textDecoration: done ? 'line-through' : 'none',
                  fontFamily: 'inherit',
                }}
              >
                {p.label} {done && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* 📸 Foto — Interactive Camera */}
        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-secondary)' }}>📸 Foto Selfie</div>

          {/* Live Camera Viewfinder */}
          {cameraActive && !photo && (
            <div>
              <div className="camera-viewfinder">
                {/* Video stream */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    opacity: cameraReady ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                  }}
                />

                {/* Loading state while camera initializes */}
                {!cameraReady && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    color: '#fff', gap: '12px',
                  }}>
                    <div style={{ fontSize: '36px' }}>📷</div>
                    <div style={{ fontSize: '13px', fontWeight: '600' }}>Menyalakan kamera...</div>
                    <div style={{
                      width: '40px', height: '40px',
                      border: '3px solid rgba(255,255,255,0.2)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  </div>
                )}

                {/* Camera overlay — subtle viewfinder corners */}
                {cameraReady && (
                  <div className="camera-overlay">
                    <div className="camera-corners">
                      <div className="camera-corner-bl" />
                      <div className="camera-corner-br" />
                    </div>
                  </div>
                )}

                {/* Recording indicator */}
                {cameraReady && (
                  <div className="recording-indicator">
                    <div className="recording-dot" />
                    <span className="recording-text">KAMERA AKTIF</span>
                  </div>
                )}

                {/* Flash effect */}
                {flashEffect && <div className="camera-flash" />}
              </div>

              {/* Hidden canvas */}
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Camera controls */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '24px', marginTop: '16px', paddingBottom: '4px',
              }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={stopCamera}
                  style={{ borderRadius: '50%', width: '44px', height: '44px', padding: 0, fontSize: '16px' }}
                  title="Batal"
                >
                  ✕
                </button>

                <button
                  className="capture-btn-ring"
                  onClick={capturePhoto}
                  disabled={!cameraReady}
                  title="Ambil Foto"
                  style={{ opacity: cameraReady ? 1 : 0.4 }}
                >
                  <div className="capture-btn-inner" />
                </button>

                <div style={{ width: '44px' }} /> {/* Spacer for symmetry */}
              </div>
            </div>
          )}

          {/* Hidden canvas for non-camera state */}
          {!cameraActive && <canvas ref={canvasRef} style={{ display: 'none' }} />}

          {/* Photo preview */}
          {photo && !cameraActive && (
            <div>
              <div className="photo-preview-container">
                <img src={photo} alt="Selfie" />
                <div className="photo-check-badge">✓</div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '10px', width: '100%' }} onClick={retakePhoto}>
                🔄 Ambil Ulang Foto
              </button>
            </div>
          )}

          {/* No photo, no camera — prompt */}
          {!photo && !cameraActive && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'var(--primary-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px auto', fontSize: '36px',
              }}>
                📷
              </div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Ambil Foto Selfie
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                Kamera akan menyala secara langsung, Anda dapat mengambil foto bebas kapan saja
              </p>
              <button className="btn btn-primary" onClick={startCamera} style={{ padding: '12px 28px', fontSize: '14px' }}>
                📷 Buka Kamera
              </button>
            </div>
          )}

          {photo && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px',
              color: 'var(--success)', fontSize: '12px', fontWeight: '600',
            }}>
              ✓ Foto siap dikirim
            </div>
          )}
        </div>

        {/* 📍 Lokasi GPS */}
        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-secondary)' }}>📍 Lokasi GPS</div>

          {locationStatus === null && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'var(--primary-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px auto', fontSize: '36px',
              }}>
                🗺️
              </div>
              <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Verifikasi Lokasi
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
                Radius maksimal: {formatDistance(MAX_RADIUS_M)} dari resto
              </p>
              <button className="btn btn-primary" onClick={getLocation}>📍 Ambil Lokasi Sekarang</button>
            </div>
          )}

          {locationStatus === 'checking' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{
                width: '48px', height: '48px',
                border: '4px solid var(--border)',
                borderTopColor: 'var(--primary)',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px auto',
              }} />
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>Mengambil lokasi GPS...</p>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Pastikan GPS aktif</p>
            </div>
          )}

          {locationStatus === 'valid' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'var(--success-bg)', color: 'var(--success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px auto', fontSize: '28px',
                border: '2px solid var(--success)',
              }}>✓</div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--success)', marginBottom: '4px' }}>Dalam Radius!</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {formatDistance(locationDistance)} dari resto • max {formatDistance(MAX_RADIUS_M)}
              </p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }} onClick={getLocation}>🔄 Perbarui Lokasi</button>
            </div>
          )}

          {locationStatus === 'invalid' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'var(--danger-bg, rgba(239,68,68,0.1))', color: 'var(--danger)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px auto', fontSize: '28px',
                border: '2px solid var(--danger)',
              }}>✕</div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--danger)', marginBottom: '4px' }}>Di Luar Radius</p>
              <p style={{ fontSize: '12px', color: 'var(--danger)' }}>{locationError}</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }} onClick={getLocation}>🔄 Coba Lagi</button>
            </div>
          )}

          {locationError && locationStatus === null && (
            <p style={{ color: 'var(--danger)', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>{locationError}</p>
          )}

          {/* Submit button */}
          <div style={{ marginTop: '20px' }}>
            <button
              className={`btn w-full ${isFormReady && !hasAttended(purpose) ? 'btn-success' : 'btn-secondary'}`}
              onClick={handleSubmit}
              disabled={!isFormReady || submitting || hasAttended(purpose)}
              style={{ padding: '14px', fontSize: '15px', fontWeight: '700' }}
            >
              {submitting ? '⏳ Memproses...' : `Kirim Absensi ${purpose}`}
            </button>
            {!photo && <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '6px' }}>Ambil foto terlebih dahulu</p>}
            {photo && locationStatus !== 'valid' && <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', marginTop: '6px' }}>Ambil lokasi GPS terlebih dahulu</p>}
          </div>
        </div>
      </div>

      {/* Info box — cara ubah jarak */}
      <div style={{
        marginTop: '20px', padding: '14px 16px',
        background: 'var(--primary-glow)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--primary)',
        fontSize: '12px', color: 'var(--text-secondary)',
        lineHeight: '1.6',
      }}>
        <div style={{ fontWeight: '700', color: 'var(--primary)', marginBottom: '4px' }}>
          ℹ️ Info Pengaturan Jarak
        </div>
        <p>
          Radius absensi saat ini: <strong>{formatDistance(MAX_RADIUS_M)}</strong>.
          Untuk mengubah jarak maksimal, edit file <code style={{ background: 'var(--bg-tertiary)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '11px' }}>.env</code> di root project:
        </p>
        <code style={{
          display: 'block', marginTop: '6px', padding: '8px 12px',
          background: 'var(--bg-tertiary)', borderRadius: '6px',
          fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-primary)',
        }}>
          MAX_ATTENDANCE_DISTANCE=&quot;200000&quot; &nbsp;← ubah angka ini (dalam meter)
        </code>
        <p style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
          Juga perlu update nilai <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>MAX_RADIUS_M</code> di file <code style={{ fontFamily: 'monospace', fontSize: '11px' }}>src/app/kasir/absensi/page.js</code> agar validasi client-side sinkron. Restart server setelah mengubah.
        </p>
      </div>
    </div>
  );
}