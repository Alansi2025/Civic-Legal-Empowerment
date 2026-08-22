import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Legal Adviser AI - Multilingual Civic & Legal Empowerment Platform',
  description: 'AI-powered Legal Adviser platform for statutory RTI, CPGRAMS, IPC ↔ BNS legal code conversion, and civic grievances.',
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-civic-dark text-slate-100 antialiased selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
