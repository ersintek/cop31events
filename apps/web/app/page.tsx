import type { Metadata } from 'next';
import { Cop31Directory } from './cop31/cop31-directory';
import { getCop31Events } from './cop31/cop31-data';
import './cop31/cop31.css';
import './cop31/cop31-refinements.css';
import './cop31/cop31-detail.css';
import './cop31/cop31-coming-soon.css';
import './cop31/cop31-site-header.css';
import './cop31/cop31-programme.css';

export const metadata: Metadata = { title: 'COP31 Events', description: 'COP31 ile bağlantılı etkinlikleri keşfedin.' };

export default async function Home() { const { cookies } = await import('next/headers'); const { redirect } = await import('next/navigation'); if ((await cookies()).get('cop31_language')?.value === 'en') redirect('/en/cop31'); return <Cop31Directory events={await getCop31Events()} locale="tr" />; }
