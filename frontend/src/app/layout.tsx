import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Civic & Legal Empowerment Platform (IEEE MAS Architecture)',
  description: 'IEEE-compliant multi-agent system powered by Gemini 3.7 / 2.5 for statutory RTI, CPGRAMS, and civic grievances.',
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
