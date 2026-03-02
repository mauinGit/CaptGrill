'use client';

import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/components/Toast';

const PURPOSES = [
  { value: 'Shift 1', label: '🕐 Shift 1' },
  { value: 'Shift 2', label: '🕑 Shift 2' },
  { value: 'Membuat Bahan', label: '🍳 Membuat Bahan' },
];

export default function AbsensiKasirPage() {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [alreadyAttended, setAlreadyAttended] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [purpose, setPurpose] = useState('Shift 1');

  // Check if already attended today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/absensi?date=${today}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setAlreadyAttended(true);
          setTodayAttendance(data[0]);
        }
      });
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, dll)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 640;
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h / w) * maxSize; w = maxSize; }
          else { w = (w / h) * maxSize; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setPhoto(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation tidak didukung browser ini');
      return;
    }

    setLocationError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        setLocationError('Gagal mendapatkan lokasi: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSubmit = async () => {
    if (!photo) {
      toast.error('Pilih foto terlebih dahulu');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photo,
          latitude: location?.latitude,
          longitude: location?.longitude,
          purpose,
        }),
      });

      if (res.ok) {
        toast.success('Absensi berhasil! ✅');
        setAlreadyAttended(true);
        const data = await res.json();
        setTodayAttendance(data);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Gagal melakukan absensi');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    }
    setSubmitting(false);
  };

  if (alreadyAttended) {
    return (
      <div className="animate-fade-in">
        <div className="navbar">
          <div className="navbar-left">
            <h1>📅 Absensi</h1>
            <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h2 style={{ marginBottom: '8px', color: 'var(--success)' }}>Anda Sudah Absen Hari Ini</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Jam masuk: {todayAttendance?.clockIn ? new Date(todayAttendance.clockIn).toLocaleTimeString('id-ID') : '-'}
          </p>
          {todayAttendance?.purpose && (
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Tujuan: <strong>{todayAttendance.purpose}</strong>
            </p>
          )}
          {todayAttendance?.photo && (
            <img src={todayAttendance.photo} alt="Foto absensi" style={{ width: '150px', height: '150px', borderRadius: '16px', objectFit: 'cover', margin: '16px auto', display: 'block' }} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="navbar">
        <div className="navbar-left">
          <h1>📅 Absensi</h1>
          <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Photo Upload */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📸 Foto</h3>
          </div>

          {photo ? (
            <div style={{ textAlign: 'center' }}>
              <img src={photo} alt="Preview" style={{ width: '100%', maxWidth: '400px', borderRadius: '12px' }} />
              <button className="btn btn-secondary mt-4" onClick={() => { setPhoto(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>🔄 Ganti Foto</button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📷</div>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>Pilih file foto untuk absensi</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                📁 Pilih Foto
              </button>
            </div>
          )}
        </div>

        {/* Location & Purpose */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📍 Lokasi & Tujuan</h3>
          </div>

          {/* Purpose Selection */}
          <div style={{ padding: '16px 0' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>Tujuan Absensi</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {PURPOSES.map((p) => (
                <button
                  key={p.value}
                  className={`btn ${purpose === p.value ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setPurpose(p.value)}
                  type="button"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {location ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📍</div>
              <p style={{ color: 'var(--success)', fontWeight: '600', marginBottom: '4px' }}>Lokasi didapatkan!</p>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </p>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                Akurasi: ~{Math.round(location.accuracy)}m
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗺️</div>
              <button className="btn btn-primary" onClick={getLocation}>Ambil Lokasi</button>
              {locationError && <p style={{ color: 'var(--danger)', fontSize: '13px', marginTop: '8px' }}>{locationError}</p>}
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button
              className="btn btn-success w-full"
              onClick={handleSubmit}
              disabled={submitting || !photo}
              style={{ padding: '14px', fontSize: '16px' }}
            >
              {submitting ? '⏳ Memproses...' : '✅ Kirim Absensi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
