import type { Metadata } from 'next';
import { Cop31Directory } from './cop31-directory';
import { getCop31Events } from './cop31-data';

export const metadata: Metadata = { title: 'COP31 Events', description: 'COP31 ile bağlantılı etkinlikleri keşfedin.' };

export default async function Cop31Page() { return <Cop31Directory events={await getCop31Events()} locale="tr" />; }
