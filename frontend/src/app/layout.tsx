import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export const metadata = {
  title: 'SiteCode AI — Construction Compliance Suite',
  description:
    'AI-powered construction compliance assistant. Instantly verify building codes, project specifications, and inspection reports with zero guesswork.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/25 selection:text-primary flex">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 min-h-screen">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
