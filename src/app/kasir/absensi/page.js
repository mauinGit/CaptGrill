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
  const [purpose, setPurpose] = useState('Shift 1');
  
  // State baru: track absensi per kategori
  const [attendances, setAttendances] = useState({
    'Shift 1': null,
    'Shift 2': null,
    'Membuat Bahan': null,
  });
  
  // State untuk loading data
  const [loading, setLoading] = useState(true);

  // Check all attendances today
  useEffect(() => {
    const fetchAttendances = async () => {
      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching attendances for:', today);
      
      try {
        const response = await fetch(`/api/absensi?date=${today}`);
        if (!response.ok) {
          console.error('API error:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('Fetched data:', data);
        
        if (Array.isArray(data)) {
          const newAttendances = {
            'Shift 1': null,
            'Shift 2': null,
            'Membuat Bahan': null,
          };
          
          data.forEach((att) => {
            if (newAttendances.hasOwnProperty(att.purpose)) {
              newAttendances[att.purpose] = att;
            }
          });
          
          setAttendances(newAttendances);
        }
      } catch (error) {
        console.error('Failed to fetch attendances:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendances();
  }, []);

  // Cek apakah sudah absen untuk kategori tertentu
  const hasAttended = (category) => {
    return attendances[category] !== null;
  };

  // Cek apakah semua kategori sudah diisi
  const allAttended = () => {
    return Object.values(attendances).every(att => att !== null);
  };

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
    toast.info('Mengambil lokasi...');
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        toast.success('Lokasi berhasil didapatkan!');
      },
      (err) => {
        let errorMsg = '';
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMsg = 'Izin lokasi ditolak. Izinkan akses lokasi di browser.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMsg = 'Lokasi tidak tersedia. Pastikan GPS aktif.';
            break;
          case err.TIMEOUT:
            errorMsg = 'Waktu pengambilan lokasi habis. Coba lagi.';
            break;
          default:
            errorMsg = 'Gagal mendapatkan lokasi: ' + err.message;
        }
        setLocationError(errorMsg);
        toast.error(errorMsg);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleSubmit = async () => {
    // Validasi
    if (!photo) {
      toast.error('Pilih foto terlebih dahulu');
      return;
    }

    if (!location) {
      toast.error('Ambil lokasi terlebih dahulu');
      return;
    }

    // Cek apakah sudah absen untuk kategori ini
    if (hasAttended(purpose)) {
      toast.error(`Anda sudah absen untuk ${purpose} hari ini`);
      return;
    }

    console.log('Submitting attendance for:', purpose);
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

      const data = await res.json();

      if (res.ok) {
        toast.success(`Absensi ${purpose} berhasil! ✅`);
        
        // Update state untuk kategori yang baru diisi
        setAttendances(prev => ({
          ...prev,
          [purpose]: {
            clockIn: new Date().toISOString(),
            photo: photo,
            purpose: purpose,
            ...data
          }
        }));
        
        // Reset form untuk absen kategori berikutnya
        setPhoto(null);
        setLocation(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Optional: pindah ke kategori yang belum diisi
        const nextPurpose = PURPOSES.find(p => !hasAttended(p.value));
        if (nextPurpose) {
          setPurpose(nextPurpose.value);
        }
      } else {
        toast.error(data.error || 'Gagal melakukan absensi');
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Terjadi kesalahan. Periksa koneksi internet Anda.');
    }
    setSubmitting(false);
  };

  // Tampilkan loading state
  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="navbar">
          <div className="navbar-left">
            <h1>📅 Absensi</h1>
            <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <h2>Memuat data absensi...</h2>
        </div>
      </div>
    );
  }

  // Tampilkan jika semua kategori sudah diisi
  if (allAttended()) {
    return (
      <div className="animate-fade-in">
        <div className="navbar">
          <div className="navbar-left">
            <h1>📅 Absensi</h1>
            <p>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ marginBottom: '8px', color: 'var(--success)' }}>Semua Absensi Selesai!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Anda sudah melakukan semua absensi hari ini:
          </p>
          <div style={{ marginTop: '24px' }}>
            {PURPOSES.map(p => (
              <div key={p.value} style={{ marginBottom: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <strong>{p.label}</strong>
                <p style={{ fontSize: '12px', marginTop: '4px' }}>
                  Jam: {attendances[p.value]?.clockIn ? new Date(attendances[p.value].clockIn).toLocaleTimeString('id-ID') : '-'}
                </p>
              </div>
            ))}
          </div>
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

      {/* Ringkasan Absensi Hari Ini */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">📋 Status Absensi Hari Ini</h3>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-around', flexWrap: 'wrap' }}>
          {PURPOSES.map(p => (
            <div key={p.value} style={{ textAlign: 'center', flex: 1, minWidth: '100px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{p.label}</div>
              <div style={{ 
                fontSize: '32px', 
                color: hasAttended(p.value) ? 'var(--success)' : 'var(--danger)',
                marginTop: '8px'
              }}>
                {hasAttended(p.value) ? '✅' : '❌'}
              </div>
              {hasAttended(p.value) && (
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  {new Date(attendances[p.value].clockIn).toLocaleTimeString('id-ID')}
                </div>
              )}
            </div>
          ))}
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
              {PURPOSES.map((p) => {
                const isAttended = hasAttended(p.value);
                const isSelected = purpose === p.value;
                return (
                  <button
                    key={p.value}
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    onClick={() => !isAttended && setPurpose(p.value)}
                    disabled={isAttended}
                    style={{ opacity: isAttended ? 0.5 : 1, cursor: isAttended ? 'not-allowed' : 'pointer' }}
                    type="button"
                  >
                    {p.label} {isAttended && '✅'}
                  </button>
                );
              })}
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
              disabled={submitting || !photo || !location || hasAttended(purpose)}
              style={{ padding: '14px', fontSize: '16px' }}
            >
              {submitting ? '⏳ Memproses...' : `✅ Kirim Absensi ${purpose}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}