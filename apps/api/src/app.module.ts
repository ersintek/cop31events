import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Cop31Module } from './modules/cop31/cop31.module';
import { PersistenceModule } from './shared/persistence/persistence.module';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), PersistenceModule, Cop31Module] })
export class AppModule {}
