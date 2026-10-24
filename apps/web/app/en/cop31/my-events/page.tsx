import type { Metadata } from 'next';
import { Cop31MyEvents } from '../../../cop31/cop31-my-events';
import { getCop31Events } from '../../../cop31/cop31-data';

export const metadata: Metadata = { title: 'My events · COP31 Events', description: 'View your saved COP31 events.' };

export default async function EnglishMyEventsPage() {
  return <Cop31MyEvents events={await getCop31Events()} locale="en"/>;
}
