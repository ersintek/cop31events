import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCop31Events } from '../../cop31-data';
import { Cop31ProgrammeView } from '../../cop31-programme-view';
import { getCop31Programme, getProgrammeForEvent } from '../../cop31-programmes';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const programme = getCop31Programme((await params).slug);
  return programme ? { title: programme.title.tr, description: `${programme.title.tr} etkinlik programı` } : { title: 'Program bulunamadı' };
}

export default async function ProgrammePage({ params }: Props) {
  const programme = getCop31Programme((await params).slug);
  if (!programme) notFound();
  const events = (await getCop31Events()).filter(event => getProgrammeForEvent(event)?.slug === programme.slug).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return <Cop31ProgrammeView programme={programme} events={events} locale="tr"/>;
}
