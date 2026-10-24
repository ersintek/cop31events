import { Module } from '@nestjs/common';
import { Cop31Controller } from './cop31.controller';
import { Cop31Service } from './cop31.service';
import { Cop31SavedController } from './cop31-saved.controller';
import { Cop31SessionGuard } from './cop31-session.guard';

@Module({ controllers: [Cop31Controller, Cop31SavedController], providers: [Cop31Service, Cop31SessionGuard] })
export class Cop31Module {}
