import { PrismaClient } from '@prisma/client';
import records from '../../../data/cop31-events.json';
import additions from '../../../data/cop31-import-2026-10-24.json';
import bLabWebinar from '../../../data/cop31-b-lab-webinar-2026-10-29.json';

const prisma = new PrismaClient();

async function main() {
  for (const record of [...records, ...additions, ...bLabWebinar]) {
    const { startsAt, endsAt, verifiedAt, createdAt, updatedAt, ...data } = record;
    await prisma.cop31Event.upsert({
      where: { slug: record.slug },
      create: { ...data, startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : null, verifiedAt: verifiedAt ? new Date(verifiedAt) : null, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) },
      // Seed only creates missing public entries. Later container restarts must
      // not overwrite edits made in the COP31 editor.
      update: {},
    });
  }
  console.log(JSON.stringify({ seeded: records.length + additions.length + bLabWebinar.length }));
}

main().finally(() => prisma.$disconnect());

