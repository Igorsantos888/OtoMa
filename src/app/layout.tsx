import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OdontoSys - Sistema de Gestão Odontológica',
  description: 'Sistema completo e inteligente para clínicas e consultórios odontológicos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22%20%220%22%20%22100%22%20%22100%22><text y=%22.9em%22 font-size=%2290%22>🦷</text></svg>" />
      </head>
      <body className="antialiased text-slate-900 bg-slate-50 min-h-screen">
        {children}
      </body>
    </html>
  );
}
