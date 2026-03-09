import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Sourcy Supplier Intelligence',
  description:
    'Conversational supplier intelligence assistant for sourcing teams.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-[#fafaf9] font-sans text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
