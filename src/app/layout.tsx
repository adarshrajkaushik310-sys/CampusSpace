import type { Metadata } from 'next';
import './globals.css';
import { CampusProvider } from '@/lib/store';
import { Navbar } from '@/components/Navbar';
import { AppFooter } from '@/components/AppFooter';
import { AuthGuard } from '@/components/AuthGuard';

export const metadata: Metadata = {
  title: 'CampusSpace — Campus Facility Booking & Smart Classrooms',
  description:
    'College facility scheduling system with conflict prevention, sequential approvals, and verified QR Hall Passes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F9FAFB] text-[#111827] selection:bg-[#2563EB]/15 selection:text-[#2563EB]">
        <CampusProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <AuthGuard>{children}</AuthGuard>
            </main>
            <AppFooter />
          </div>
        </CampusProvider>
      </body>
    </html>
  );
}
