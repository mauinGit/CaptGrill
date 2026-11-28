// Ikon garis serbaguna pengganti emoji di seluruh halaman.
// Pemakaian: <Icon name="plus" />  - ukuran default mengikuti font-size teks di sekitarnya.
const P = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  loader: <path d="M12 3a9 9 0 1 0 9 9" />,
  inbox: <><path d="M3 13h5l1.5 3h5L16 13h5" /><path d="M5.5 5h13L21 13v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6l2.5-8Z" /></>,
  alert: <><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4.5M12 17.5h.01" /></>,
  ban: <><circle cx="12" cy="12" r="9" /><path d="m5.7 5.7 12.6 12.6" /></>,
  sunrise: <><path d="M12 3v3M4.9 8.9l1.4 1.4M19.1 8.9l-1.4 1.4M2 17h2M20 17h2M7 17a5 5 0 0 1 10 0" /><path d="M2 21h20" /></>,
  moon: <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />,
  flask: <><path d="M9 3h6" /><path d="M10 3v6.2L4.6 18.4A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.6-2.6L14 9.2V3" /><path d="M7.3 15h9.4" /></>,
  camera: <><path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></>,
  lightbulb: <><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  pencil: <><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /><path d="m14.5 5.5 4 4" /></>,
  key: <><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2 20 3M16 7l3 3M14 9l2 2" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M5.5 7l1 12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1-12M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7" /></>,
  clipboard: <><rect x="8" y="2.5" width="8" height="4" rx="1" /><path d="M16 4.5h2a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2h2" /><path d="M8.5 12h7M8.5 16h5" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2.5h8a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
  box: <><path d="M21 8.2 12 3 3 8.2l9 5.1 9-5.1Z" /><path d="M3 8.2v7.6L12 21l9-5.2V8.2" /><path d="M12 13.3V21" /></>,
  'x-circle': <><circle cx="12" cy="12" r="9" /><path d="m15 9-6 6M9 9l6 6" /></>,
  'check-circle': <><circle cx="12" cy="12" r="9" /><path d="m8 12.5 2.5 2.5L16 9.5" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  'trending-up': <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  'trending-down': <><path d="m3 7 6 6 4-4 8 8" /><path d="M15 17h6v-6" /></>,
  trophy: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4.5a1.5 1.5 0 0 0 0 3H7M17 6h2.5a1.5 1.5 0 0 1 0 3H17" /></>,
  cup: <><path d="M6 8h12l-1.4 11.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8L6 8Z" /><path d="M5 8h14M13 8l1.5-5h3" /></>,
  burger: <><path d="M4 11a8 8 0 0 1 16 0H4Z" /><path d="M3 14.5h18" /><path d="M4.5 18h15a1 1 0 0 1-1 2.5h-13a1 1 0 0 1-1-2.5Z" /></>,
  fries: <><path d="M6 10h12l-1.5 10.5a1 1 0 0 1-1 .5h-7a1 1 0 0 1-1-.5L6 10Z" /><path d="M8 10 7 3.5M11 10V3M14 10l1-6M17 10l1.5-4.5" /></>,
  coins: <><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M15 10.2c3.4.2 6 1.5 6 2.8 0 1.7-2.7 3-6 3" /><path d="M3 12v5c0 1.7 2.7 3 6 3 1.8 0 3.4-.4 4.5-1M21 13v4c0 1.7-2.7 3-6 3" /></>,
  wallet: <><path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3" /><path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" /><path d="M21 12h-4a2 2 0 0 0 0 4h4v-4Z" /></>,
  lock: <><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  flame: <path d="M12 3c.8 3 4 4.6 4 9a4 4 0 0 1-8 0c0-2.1 1-3.4 2-4.5.1 1.4.6 2.4 1.5 2.7C11 8 11.3 5.2 12 3ZM6 21h12" />,
  gift: <><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M5 12v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8M12 8v13" /><path d="M12 8C10.5 4 6.5 4 7 6.5 7.3 8 10 8 12 8Zm0 0c1.5-4 5.5-4 5-1.5C16.7 8 14 8 12 8Z" /></>,
  'bar-chart': <><path d="M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21" /><path d="M8 17v-5M12.5 17V8M17 17v-8" /></>,
  receipt: <><path d="M5 3v18l2.3-1.5L9.7 21l2.3-1.5 2.3 1.5 2.4-1.5L19 21V3l-2.3 1.5L14.3 3 12 4.5 9.7 3 7.3 4.5 5 3Z" /><path d="M9 9h6M9 13h6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" /></>,
  card: <><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19M6.5 15h4" /></>,
  printer: <><path d="M7 8V3.5h10V8" /><rect x="3" y="8" width="18" height="9" rx="2" /><rect x="7" y="13.5" width="10" height="7.5" rx="1" /></>,
  utensils: <><path d="M4 3v6a3 3 0 0 0 3 3v9M10 3v6a3 3 0 0 1-3 3M7 3v5" /><path d="M20 15V3a4.5 4.5 0 0 0-4 4.5V13a2 2 0 0 0 2 2h2Zm0 0v6" /></>,
  map: <><path d="M9 4 3 6.5v13.5L9 17.5l6 2.5 6-2.5V4l-6 2.5L9 4Z" /><path d="M9 4v13.5M15 6.5V20" /></>,
  pin: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></>,
  refresh: <><path d="M20 11a8 8 0 0 0-14.7-4.3L3 9" /><path d="M3 4v5h5M4 13a8 8 0 0 0 14.7 4.3L21 15" /><path d="M21 20v-5h-5" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>,
  'arrow-down': <path d="M12 5v14M6 13l6 6 6-6" />,
  'arrow-up': <path d="M12 19V5M6 11l6-6 6 6" />,
  'arrow-left': <path d="M19 12H5M11 18l-6-6 6-6" />,
  cart: <><circle cx="9" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /><path d="M2.5 3h2.6l2.4 11.6a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.7-1.3L21.5 7H6" /></>,
  banknote: <><rect x="2.5" y="6" width="19" height="12" rx="2.5" /><circle cx="12" cy="12" r="2.5" /><path d="M6 10v4M18 10v4" /></>,
  phone: <><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M11 18h2" /></>,
  bike: <><circle cx="6" cy="17" r="3.5" /><circle cx="18" cy="17" r="3.5" /><path d="M6 17l4-8h5l3 8M10 9 8.5 6H6M15 9l-1-3h2.5" /></>,
  copy: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
  upload: <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" /></>,
  eye: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  calendar: <><rect x="3" y="4.5" width="18" height="16.5" rx="2.5" /><path d="M8 2.5v4M16 2.5v4M3 10h18" /></>,
  grip: <><circle cx="9" cy="6" r="1.2" /><circle cx="15" cy="6" r="1.2" /><circle cx="9" cy="12" r="1.2" /><circle cx="15" cy="12" r="1.2" /><circle cx="9" cy="18" r="1.2" /><circle cx="15" cy="18" r="1.2" /></>,
  sort: <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5h.01" /></>,
};

export default function Icon({ name, size = '1.15em', strokeWidth = 1.9, className = '', style, title }) {
  const shape = P[name];
  if (!shape) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`icon${name === 'loader' ? ' icon-spin' : ''}${className ? ' ' + className : ''}`}
      style={style}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {shape}
    </svg>
  );
}
