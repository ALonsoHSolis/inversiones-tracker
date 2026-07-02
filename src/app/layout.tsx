import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mi portafolio",
  description: "Seguimiento de rendimiento real de inversiones en varias plataformas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
