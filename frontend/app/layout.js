import './globals.css';

export const metadata = {
  title: 'SiteShield AI — On-Site Construction Compliance Verification',
  description:
    'Instant, strictly grounded statutory code compliance verification for active construction jobsites. Cross-reference IBC, NEC, UPC, project specifications, and inspection logs with hybrid vector retrieval.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-titanium-950 text-slate-100 antialiased blueprint-bg selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
