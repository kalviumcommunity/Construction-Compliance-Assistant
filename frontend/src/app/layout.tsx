import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

export const metadata = {
  title: 'SiteSafe — Construction Compliance & Building Code Assistant',
  description:
    'AI-powered building code verification and jobsite specification compliance platform.',
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
        <SidebarProvider>
          <Sidebar />
          <div className="flex flex-col flex-1 min-w-0 min-h-screen transition-all duration-300">
            <Topbar />
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <ErrorBoundary
                  fallbackTitle="SiteSafe Service Temporarily Unavailable"
                  fallbackMessage="An unexpected rendering exception was caught safely by the application boundary."
                >
                  {children}
                </ErrorBoundary>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </body>
    </html>
  );
}

