import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export const metadata = {
  title: 'SiteSafe — Enterprise Construction Regulatory RAG Suite',
  description:
    'AI-powered statutory building code verification and project specification compliance platform.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/25 selection:text-primary flex overflow-x-hidden">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 min-h-screen">
          <Topbar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
