import type { Metadata } from 'next';
import { Cop31MyEvents } from '../cop31-my-events';
import { getCop31Events } from '../cop31-data';

export const metadata: Metadata = { title: 'Etkinliklerim · COP31 Events', description: 'Kaydettiğiniz COP31 etkinliklerini görüntüleyin.' };

export default async function MyEventsPage() {
  return <Cop31MyEvents events={await getCop31Events()} locale="tr"/>;
}
