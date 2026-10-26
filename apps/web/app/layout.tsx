import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'COP31 Events',
  description: 'COP31-related event directory',
  icons: {
    icon: [
      { url: '/favicon.svg?v=bold2-20261026', type: 'image/svg+xml' },
      { url: '/favicon.ico?v=bold2-20261026', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico?v=bold2-20261026',
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="tr"><body>{children}</body></html>; }

