import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WaveNet — Simulador de Interferencia Wi-Fi',
  description: 'Simulación de superposición de ondas electromagnéticas en GPU mediante WebGL/GLSL',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
