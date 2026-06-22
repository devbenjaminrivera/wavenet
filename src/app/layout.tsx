import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // <- TIENE QUE ESTAR ESTA IMPORTACIÓN

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WaveNet SYS.SIM",
  description: "Simulador de atenuación RF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}