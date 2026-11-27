// Set ikon garis (24×24, stroke currentColor) untuk navigasi & UI aplikasi.
const Svg = ({ size = 20, strokeWidth = 1.9, children, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    {children}
  </svg>
);

export const IconDashboard = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="7.5" height="9" rx="1.8" />
    <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.8" />
    <rect x="13.5" y="11.5" width="7.5" height="9.5" rx="1.8" />
    <rect x="3" y="15" width="7.5" height="6" rx="1.8" />
  </Svg>
);

export const IconBox = (p) => (
  <Svg {...p}>
    <path d="M21 8.2 12 3 3 8.2l9 5.1 9-5.1Z" />
    <path d="M3 8.2v7.6L12 21l9-5.2V8.2" />
    <path d="M12 13.3V21" />
  </Svg>
);

export const IconFlask = (p) => (
  <Svg {...p}>
    <path d="M9 3h6" />
    <path d="M10 3v6.2L4.6 18.4A1.8 1.8 0 0 0 6.2 21h11.6a1.8 1.8 0 0 0 1.6-2.6L14 9.2V3" />
    <path d="M7.3 15h9.4" />
  </Svg>
);

export const IconUtensils = (p) => (
  <Svg {...p}>
    <path d="M4 3v6a3 3 0 0 0 3 3v9" />
    <path d="M10 3v6a3 3 0 0 1-3 3" />
    <path d="M7 3v5" />
    <path d="M20 15V3a4.5 4.5 0 0 0-4 4.5V13a2 2 0 0 0 2 2h2Zm0 0v6" />
  </Svg>
);

export const IconWallet = (p) => (
  <Svg {...p}>
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v3" />
    <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
    <path d="M21 12h-4a2 2 0 0 0 0 4h4v-4Z" />
  </Svg>
);

export const IconReport = (p) => (
  <Svg {...p}>
    <path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8l-5-5Z" />
    <path d="M14 3v5h5" />
    <path d="M9 17v-3M12 17v-5M15 17v-2" />
  </Svg>
);

export const IconCalendarCheck = (p) => (
  <Svg {...p}>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
    <path d="M8 2.5v4M16 2.5v4M3 10h18" />
    <path d="m9 15.5 2 2 4-4" />
  </Svg>
);

export const IconBanknote = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <circle cx="12" cy="12" r="2.5" />
    <path d="M6 10v4M18 10v4" />
  </Svg>
);

export const IconUsers = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c.6-3.4 3.3-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.2 2.5 3.5 5.2" />
  </Svg>
);

export const IconActivity = (p) => (
  <Svg {...p}>
    <path d="M8 4h11M8 9.5h11M8 15h11M8 20.5h7" />
    <circle cx="4" cy="4" r="1" />
    <circle cx="4" cy="9.5" r="1" />
    <circle cx="4" cy="15" r="1" />
    <circle cx="4" cy="20.5" r="1" />
  </Svg>
);

export const IconChart = (p) => (
  <Svg {...p}>
    <path d="M3 3v16.5A1.5 1.5 0 0 0 4.5 21H21" />
    <path d="m7 15 4-4.5 3 3L20 7" />
  </Svg>
);

export const IconCart = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="20" r="1.3" />
    <circle cx="18" cy="20" r="1.3" />
    <path d="M2.5 3h2.6l2.4 11.6a1.8 1.8 0 0 0 1.8 1.4h8.4a1.8 1.8 0 0 0 1.7-1.3L21.5 7H6" />
  </Svg>
);

export const IconReceipt = (p) => (
  <Svg {...p}>
    <path d="M5 3v18l2.3-1.5L9.7 21l2.3-1.5 2.3 1.5 2.4-1.5L19 21V3l-2.3 1.5L14.3 3 12 4.5 9.7 3 7.3 4.5 5 3Z" />
    <path d="M9 9h6M9 13h6" />
  </Svg>
);

export const IconMore = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </Svg>
);

export const IconLogout = (p) => (
  <Svg {...p}>
    <path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </Svg>
);

export const IconMoon = (p) => (
  <Svg {...p}>
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
  </Svg>
);

export const IconSun = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);

export const IconPrinter = (p) => (
  <Svg {...p}>
    <path d="M7 8V3.5h10V8" />
    <rect x="3" y="8" width="18" height="9" rx="2" />
    <rect x="7" y="13.5" width="10" height="7.5" rx="1" />
    <path d="M17.5 11h.01" />
  </Svg>
);

export const IconLock = (p) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconChevronRight = (p) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);
