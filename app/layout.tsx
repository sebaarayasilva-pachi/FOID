import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FOID - Family Office Invest Dashboard',
  description: 'Financial Overview & Investment Dashboard',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
