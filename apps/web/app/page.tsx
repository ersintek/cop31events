import type { Metadata } from 'next';
import { Cop31Directory } from './cop31/cop31-directory';
import { getCop31Events } from './cop31/cop31-data';
import './cop31/cop31.css';
import './cop31/cop31-refinements.css';
import './cop31/cop31-detail.css';
import './cop31/cop31-coming-soon.css';

export const metadata: Metadata = { title: 'COP31 Events', description: 'COP31 ile bağlantılı etkinlikleri keşfedin.' };

export default async function Home() { return <Cop31Directory events={await getCop31Events()} locale="tr" />; }
