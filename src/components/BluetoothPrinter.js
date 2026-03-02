'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const BluetoothContext = createContext();

export function useBluetooth() {
  return useContext(BluetoothContext);
}

// Common Bluetooth thermal printer service/characteristic UUIDs
const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Generic ESC/POS
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Common thermal
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Microchip BLE
];

const PRINTER_CHAR_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
];

export function BluetoothProvider({ children }) {
  const [device, setDevice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [error, setError] = useState('');
  const characteristicRef = useRef(null);
  const serverRef = useRef(null);

  const isSupported = typeof navigator !== 'undefined' && !!navigator.bluetooth;

  const connect = useCallback(async () => {
    if (!isSupported) {
      setError('Bluetooth tidak didukung di browser ini. Gunakan Chrome/Edge.');
      return false;
    }

    setConnecting(true);
    setError('');

    try {
      const selectedDevice = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICE_UUIDS,
      });

      setDeviceName(selectedDevice.name || 'Printer Tidak Dikenal');

      selectedDevice.addEventListener('gattserverdisconnected', () => {
        setConnected(false);
        setDevice(null);
        characteristicRef.current = null;
        serverRef.current = null;
      });

      const server = await selectedDevice.gatt.connect();
      serverRef.current = server;

      // Try to find a writable characteristic
      let foundChar = null;
      for (const serviceUuid of PRINTER_SERVICE_UUIDS) {
        try {
          const service = await server.getPrimaryService(serviceUuid);
          for (const charUuid of PRINTER_CHAR_UUIDS) {
            try {
              const characteristic = await service.getCharacteristic(charUuid);
              if (characteristic.properties.write || characteristic.properties.writeWithoutResponse) {
                foundChar = characteristic;
                break;
              }
            } catch { /* try next */ }
          }
          if (foundChar) break;

          // Fallback: try all characteristics of this service
          if (!foundChar) {
            const chars = await service.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                foundChar = c;
                break;
              }
            }
          }
          if (foundChar) break;
        } catch { /* try next service */ }
      }

      // Last resort: try all services
      if (!foundChar) {
        try {
          const services = await server.getPrimaryServices();
          for (const service of services) {
            const chars = await service.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                foundChar = c;
                break;
              }
            }
            if (foundChar) break;
          }
        } catch { /* no writable characteristic found */ }
      }

      characteristicRef.current = foundChar;
      setDevice(selectedDevice);
      setConnected(true);
      setConnecting(false);
      return true;
    } catch (err) {
      setConnecting(false);
      if (err.name === 'NotFoundError') {
        setError('Tidak ada printer yang dipilih');
      } else {
        setError('Gagal terhubung: ' + (err.message || 'Unknown error'));
      }
      return false;
    }
  }, [isSupported]);

  const disconnect = useCallback(async () => {
    try {
      if (device?.gatt?.connected) {
        device.gatt.disconnect();
      }
    } catch { /* ignore */ }
    setDevice(null);
    setConnected(false);
    setDeviceName('');
    characteristicRef.current = null;
    serverRef.current = null;
  }, [device]);

  // Send raw bytes to printer in chunks (BLE has 20-byte MTU)
  const sendData = useCallback(async (data) => {
    const char = characteristicRef.current;
    if (!char) throw new Error('Printer characteristic not found');

    const CHUNK_SIZE = 20;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (char.properties.writeWithoutResponse) {
        await char.writeValueWithoutResponse(chunk);
      } else {
        await char.writeValueWithResponse(chunk);
      }
      // Small delay between chunks
      await new Promise((r) => setTimeout(r, 30));
    }
  }, []);

  // Print a receipt
  const printReceipt = useCallback(async ({ orderNumber, items, discount, totalPrice, finalPrice, amountPaid, paymentMethod, change, transactionDate }) => {
    if (!connected || !characteristicRef.current) {
      throw new Error('Printer tidak terhubung');
    }

    const encoder = new TextEncoder();
    const ESC = 0x1B;
    const GS = 0x1D;

    // Build receipt as ESC/POS commands
    const commands = [];

    // Initialize printer
    commands.push(new Uint8Array([ESC, 0x40]));

    // Center align
    commands.push(new Uint8Array([ESC, 0x61, 0x01]));

    // Bold on + double size
    commands.push(new Uint8Array([ESC, 0x45, 0x01]));
    commands.push(new Uint8Array([GS, 0x21, 0x11]));
    commands.push(encoder.encode('CaptGrill\n'));
    commands.push(new Uint8Array([GS, 0x21, 0x00]));
    commands.push(new Uint8Array([ESC, 0x45, 0x00]));

    // Subtitle
    commands.push(encoder.encode('Jl. Nusantara Gg. Buntu, Timbangan, Kecamatan Indralaya Utara, Kabupaten Ogan Ilir, Sumatera Selatan 30862\n'));
    commands.push(encoder.encode('================================\n'));

    // Left align
    commands.push(new Uint8Array([ESC, 0x61, 0x00]));

    // Order number & Date
    if (orderNumber) {
      commands.push(encoder.encode(`No: ${orderNumber}\n`));
    }
    const date = transactionDate
      ? new Date(transactionDate).toLocaleString('id-ID')
      : new Date().toLocaleString('id-ID');
    commands.push(encoder.encode(`Tanggal: ${date}\n`));
    commands.push(encoder.encode('--------------------------------\n'));

    // Items
    for (const item of items) {
      const name = item.name.substring(0, 16).padEnd(16);
      const qty = `x${item.quantity}`.padStart(3);
      const price = formatRp(item.price * item.quantity).padStart(10);
      commands.push(encoder.encode(`${name}${qty}${price}\n`));
    }

    commands.push(encoder.encode('--------------------------------\n'));

    // Subtotal
    const subtotalLine = 'Subtotal'.padEnd(19) + formatRp(totalPrice).padStart(13);
    commands.push(encoder.encode(`${subtotalLine}\n`));

    if (discount > 0) {
      const discountLine = 'Diskon'.padEnd(19) + ('-' + formatRp(discount)).padStart(13);
      commands.push(encoder.encode(`${discountLine}\n`));
    }

    commands.push(encoder.encode('================================\n'));

    // Total - bold
    commands.push(new Uint8Array([ESC, 0x45, 0x01]));
    const totalLine = 'TOTAL'.padEnd(19) + formatRp(finalPrice).padStart(13);
    commands.push(encoder.encode(`${totalLine}\n`));
    commands.push(new Uint8Array([ESC, 0x45, 0x00]));

    // Payment info
    if (paymentMethod) {
      const methodLine = 'Bayar'.padEnd(19) + (paymentMethod).padStart(13);
      commands.push(encoder.encode(`${methodLine}\n`));
    }
    if (amountPaid) {
      const paidLine = 'Diterima'.padEnd(19) + formatRp(amountPaid).padStart(13);
      commands.push(encoder.encode(`${paidLine}\n`));
    }
    if (change > 0) {
      const changeLine = 'Kembalian'.padEnd(19) + formatRp(change).padStart(13);
      commands.push(encoder.encode(`${changeLine}\n`));
    }

    commands.push(encoder.encode('================================\n'));

    // Center
    commands.push(new Uint8Array([ESC, 0x61, 0x01]));
    commands.push(encoder.encode('\nTerima kasih sudah berkunjung!\n'));
    commands.push(encoder.encode('Selamat menikmati CaptGrill!\n'));
    commands.push(encoder.encode('Follow IG: @captgrill.id\n'));
    commands.push(encoder.encode('================================\n'));
    commands.push(encoder.encode('Powered by Mahasiswa Sistem Informasi Unsri\n'));

    // Feed & cut
    commands.push(encoder.encode('\n\n\n'));
    commands.push(new Uint8Array([GS, 0x56, 0x00]));

    // Combine all commands
    const totalLength = commands.reduce((sum, c) => sum + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const cmd of commands) {
      combined.set(cmd, offset);
      offset += cmd.length;
    }

    await sendData(combined);
  }, [connected, sendData]);

  return (
    <BluetoothContext.Provider value={{
      isSupported,
      device,
      connected,
      connecting,
      deviceName,
      error,
      connect,
      disconnect,
      printReceipt,
    }}>
      {children}
    </BluetoothContext.Provider>
  );
}

function formatRp(amount) {
  return 'Rp' + new Intl.NumberFormat('id-ID').format(amount);
}
