import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EarnNest Starter',
  description: 'Next.js + Firebase starter',
  icons: {
    icon: '/Favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}