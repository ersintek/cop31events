import { PrismaClient } from '@prisma/client';
import records from '../../../data/cop31-events.json';

const prisma = new PrismaClient();

async function main() {
  for (const record of records) {
    const { startsAt, endsAt, verifiedAt, createdAt, updatedAt, ...data } = record;
    await prisma.cop31Event.upsert({
      where: { slug: record.slug },
      create: { ...data, startsAt: new Date(startsAt), endsAt: endsAt ? new Date(endsAt) : null, verifiedAt: verifiedAt ? new Date(verifiedAt) : null, createdAt: new Date(createdAt), updatedAt: new Date(updatedAt) },
      // Seed only creates missing public entries. Later container restarts must
      // not overwrite edits made in the COP31 editor.
      update: {},
    });
  }
  console.log(JSON.stringify({ seeded: records.length }));
}

main().finally(() => prisma.$disconnect());
