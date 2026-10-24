import { Body, Controller, Delete, Get, HttpCode, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../shared/persistence/prisma.service';
import { Cop31SessionGuard, Cop31SessionUser } from './cop31-session.guard';

class SaveCop31EventDto {
  @IsString() @MinLength(1) @MaxLength(180) slug!: string;
}

type AuthenticatedRequest = { user: Cop31SessionUser };

@ApiTags('cop31 saved events')
@ApiBearerAuth()
@UseGuards(Cop31SessionGuard)
@Controller('cop31/saved')
export class Cop31SavedController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  async list(@Req() request: AuthenticatedRequest) {
    return this.prisma.$queryRaw<Array<{ id: string; slug: string; savedAt: Date }>>(Prisma.sql`
      SELECT e."id", e."slug", s."savedAt"
      FROM "Cop31SavedEvent" s
      JOIN "Cop31Event" e ON e."id" = s."eventId"
      WHERE s."userId" = ${request.user.id}
        AND e."status" IN ('PUBLISHED', 'POSTPONED', 'CANCELLED')
      ORDER BY s."savedAt" DESC
    `);
  }

  @Post()
  async save(@Req() request: AuthenticatedRequest, @Body() dto: SaveCop31EventDto) {
    const events = await this.prisma.$queryRaw<Array<{ id: string; slug: string }>>(Prisma.sql`
      SELECT "id", "slug" FROM "Cop31Event"
      WHERE "slug" = ${dto.slug} AND "status" IN ('PUBLISHED', 'POSTPONED', 'CANCELLED')
      LIMIT 1
    `);
    const event = events[0];
    if (!event) return { saved: false, slug: dto.slug };
    await this.prisma.$executeRaw(Prisma.sql`
      INSERT INTO "Cop31SavedEvent" ("id", "userId", "eventId")
      VALUES (${`cse_${randomUUID()}`}, ${request.user.id}, ${event.id})
      ON CONFLICT ("userId", "eventId") DO NOTHING
    `);
    return { saved: true, ...event };
  }

  @Delete(':slug')
  @HttpCode(204)
  async remove(@Req() request: AuthenticatedRequest, @Param('slug') slug: string) {
    await this.prisma.$executeRaw(Prisma.sql`
      DELETE FROM "Cop31SavedEvent"
      WHERE "userId" = ${request.user.id}
        AND "eventId" IN (SELECT "id" FROM "Cop31Event" WHERE "slug" = ${slug})
    `);
  }
}
