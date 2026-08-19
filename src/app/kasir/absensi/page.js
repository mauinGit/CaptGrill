'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useToast } from '@/components/Toast';

const PURPOSES = [
  { value: 'Shift 1', label: '🌅 Shift 1', icon: '🌅' },
  { value: 'Shift 2', label: '🌙 Shift 2', icon: '🌙' },
  { value: 'Buat Bahan', label: '🧪 Buat Bahan', icon: '🧪' },
];

// GPS radius check — 100 meter sesuai spec §18.5
const RESTO_LAT = -6.2; // ganti dengan koordinat resto aktual
const RESTO_LNG = 106.8;
const MAX_RADIUS_M = 100;

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function AbsensiKasirPage() {
  const toast = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid'
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

          // Auto-select first unfilled purpose
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (err) {
      toast.error('Gagal membuka kamera. Pastikan izin kamera diizinkan.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
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
        const isValid = dist <= MAX_RADIUS_M;
        setLocation({ latitude, longitude, accuracy });
        setLocationDistance(Math.round(dist));
        setLocationStatus(isValid ? 'valid' : 'invalid');
        if (!isValid) {
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
        // Move to next unfilled purpose
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
      <div className="navbar">
        <div className="navbar-left">
          <h1>🗓️ Absensi</h1>
          <p>{todayStr}</p>
        </div>
      </div>

      {/* Status panel — spec §18.2 */}
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

      {/* Tujuan selection chips — terkunci setelah terkirim §18.3 */}
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
        {/* Foto — Live Capture §18.4 */}
        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-secondary)' }}>📸 Foto Selfie</div>

          {/* Camera stream */}
          {cameraActive && !photo && (
            <div style={{ textAlign: 'center' }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', borderRadius: '10px', maxHeight: '260px', objectFit: 'cover', background: '#000' }} />
              <canvas ref={canvasRef} style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
                <button className="btn btn-secondary btn-sm" onClick={stopCamera}>✕ Batal</button>
                <button className="btn btn-primary" onClick={capturePhoto}>📸 Ambil Foto</button>
              </div>
            </div>
          )}

          {/* Hidden canvas for capture */}
          {!cameraActive && <canvas ref={canvasRef} style={{ display: 'none' }} />}

          {/* Photo preview */}
          {photo && !cameraActive && (
            <div style={{ textAlign: 'center' }}>
              <img src={photo} alt="Selfie" style={{ width: '100%', borderRadius: '10px', maxHeight: '260px', objectFit: 'cover' }} />
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }} onClick={retakePhoto}>
                🔄 Ambil Ulang
              </button>
            </div>
          )}

          {/* No photo, no camera */}
          {!photo && !cameraActive && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>📷</div>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                Klik tombol di bawah untuk membuka kamera secara langsung
              </p>
              <button className="btn btn-primary" onClick={startCamera}>
                📷 Buka Kamera
              </button>
            </div>
          )}

          {photo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: 'var(--success)', fontSize: '12px', fontWeight: '600' }}>
              ✓ Foto siap
            </div>
          )}
        </div>

        {/* Lokasi §18.5 */}
        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: 'var(--text-secondary)' }}>📍 Lokasi GPS</div>

          {locationStatus === null && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🗺️</div>
              <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '14px' }}>
                Ambil lokasi untuk verifikasi radius {MAX_RADIUS_M}m dari resto
              </p>
              <button className="btn btn-primary" onClick={getLocation}>📍 Ambil Lokasi Sekarang</button>
            </div>
          )}

          {locationStatus === 'checking' && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Mengambil lokasi GPS...</p>
            </div>
          )}

          {locationStatus === 'valid' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--success)', marginBottom: '4px' }}>Dalam Radius!</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {locationDistance}m dari resto • max {MAX_RADIUS_M}m
              </p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }} onClick={getLocation}>🔄 Perbarui</button>
            </div>
          )}

          {locationStatus === 'invalid' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: '36px', marginBottom: '8px' }}>❌</div>
              <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--danger)', marginBottom: '4px' }}>Di Luar Radius</p>
              <p style={{ fontSize: '12px', color: 'var(--danger)' }}>{locationError}</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }} onClick={getLocation}>🔄 Coba Lagi</button>
            </div>
          )}

          {locationError && locationStatus === null && (
            <p style={{ color: 'var(--danger)', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>{locationError}</p>
          )}

          {/* Submit button — nonaktif sampai foto + lokasi valid §18.6 */}
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
    </div>
  );
}