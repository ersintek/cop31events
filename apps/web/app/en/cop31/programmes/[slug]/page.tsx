import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCop31Events } from '../../../../cop31/cop31-data';
import { Cop31ProgrammeView } from '../../../../cop31/cop31-programme-view';
import { getCop31Programme, getProgrammeForEvent } from '../../../../cop31/cop31-programmes';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const programme = getCop31Programme((await params).slug);
  return programme ? { title: programme.title.en, description: `${programme.title.en} event programme` } : { title: 'Programme not found' };
}

export default async function EnglishProgrammePage({ params }: Props) {
  const programme = getCop31Programme((await params).slug);
  if (!programme) notFound();
  const events = (await getCop31Events()).filter(event => getProgrammeForEvent(event)?.slug === programme.slug).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return <Cop31ProgrammeView programme={programme} events={events} locale="en"/>;
}
