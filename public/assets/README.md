# CaptGrill - Assets (Logo & Gambar)

Folder ini berisi aset gambar untuk sistem CaptGrill.

## Cara Ganti Logo

Taruh file logo kamu di folder ini dengan nama berikut:

| File          | Kegunaan                         | Ukuran Ideal |
| ------------- | -------------------------------- | ------------ |
| `logo.png`    | Logo utama (sidebar & login)     | 200x200 px   |
| `logo-bw.png` | Logo hitam putih (struk/receipt) | 200x200 px   |

### Langkah:

1. Siapkan file logo kamu (format PNG, dengan background transparan lebih bagus)
2. Rename menjadi `logo.png` untuk logo utama
3. Buat versi hitam putih dan rename menjadi `logo-bw.png` untuk struk
4. Taruh kedua file di folder `public/assets/` ini
5. Restart server (`npm run dev`)

Logo akan otomatis muncul di:

- ✅ Halaman Login
- ✅ Sidebar (navigation)
- ✅ Struk Transaksi (preview di Laporan)
