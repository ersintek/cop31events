import type { Metadata } from 'next';
import { Cop31Directory } from '../../cop31/cop31-directory';
import { getCop31Events } from '../../cop31/cop31-data';

export const metadata: Metadata = { title: 'COP31 Events', description: 'Discover COP31-related events.' };
export default async function EnglishCop31Page() { return <Cop31Directory events={await getCop31Events()} locale="en" />; }
