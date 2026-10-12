import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'COP31 Events', description: 'COP31-related event directory' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="tr"><body>{children}</body></html>; }
