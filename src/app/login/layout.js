import { Roboto_Slab } from 'next/font/google';

// Font slab untuk judul — senada dengan huruf di logo CAPT.grill
const slab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-slab',
  display: 'swap',
});

export const metadata = {
  title: 'Masuk · CaptGrill',
};

export const viewport = {
  themeColor: '#0f3b1f',
};

export default function LoginLayout({ children }) {
  return <div className={slab.variable}>{children}</div>;
}
