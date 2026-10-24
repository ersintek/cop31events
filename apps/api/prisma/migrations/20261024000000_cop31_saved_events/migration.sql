CREATE TABLE "Cop31SavedEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cop31SavedEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Cop31SavedEvent_userId_eventId_key" ON "Cop31SavedEvent"("userId", "eventId");
CREATE INDEX "Cop31SavedEvent_userId_savedAt_idx" ON "Cop31SavedEvent"("userId", "savedAt");
ALTER TABLE "Cop31SavedEvent" ADD CONSTRAINT "Cop31SavedEvent_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Cop31Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
