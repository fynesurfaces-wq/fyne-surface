import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/inter';
import { Providers } from '@/providers/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'FYNE SURFACES Admin', template: '%s · FYNE Admin' },
  description: 'FYNE SURFACES — Premium Vertical Garden admin panel',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: '#2E7D32' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
