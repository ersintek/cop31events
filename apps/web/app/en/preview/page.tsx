import type { Metadata } from 'next';
import { getCop31Events } from '../../cop31/cop31-data';
import { Cop31PreviewDirectory } from '../../cop31/cop31-preview-directory';

export const metadata: Metadata = {
  title: 'COP31 Events · Preview',
  description: 'COP31Radar event directory preview.',
  robots: { index: false, follow: false },
};

export default async function EnglishPreviewPage() {
  return <Cop31PreviewDirectory events={await getCop31Events()} locale="en" />;
}

