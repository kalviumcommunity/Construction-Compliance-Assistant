import './globals.css';

export const metadata = {
  title: 'SiteShield — Building Code & Jobsite Compliance Advisor',
  description:
    'Instant, reliable building code compliance and safety guidance for construction professionals. Cross-reference IBC, NEC, UPC, project specifications, and jobsite requirements.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090e1a] text-slate-100 antialiased site-bg-pattern selection:bg-orange-500/30 selection:text-orange-200">
        {children}
      </body>
    </html>
  );
}
