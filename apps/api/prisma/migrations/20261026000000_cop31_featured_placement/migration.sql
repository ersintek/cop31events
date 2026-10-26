CREATE TYPE "Cop31FeaturedPlacement" AS ENUM ('TOP', 'SIDEBAR', 'BOTH');

ALTER TABLE "Cop31Event"
ADD COLUMN "featuredPlacement" "Cop31FeaturedPlacement" NOT NULL DEFAULT 'BOTH';

