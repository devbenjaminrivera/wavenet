import type { Metadata } from 'next';
import { Inter, Newsreader } from 'next/font/google';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'WaveNet — Simulador de Interferencia Wi-Fi',
  description:
    'Simulación de superposición de ondas electromagnéticas en GPU mediante WebGL/GLSL',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${newsreader.variable}`}>
        {children}
      </body>
    </html>
  );
}