import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { RelationalMemePersistenceModule } from 'src/memes/infrastructure/persistence/relational/relational-persistence.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { UserStatsService } from './services/user-stats.service';
import { AdminStatsService } from './services/admin-stats.service';
import { CacheManagerService } from './services/cache-manager.service';
import { MemesModule } from '../memes/memes.module';
import { InteractionsModule } from '../interactions/interactions.module';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300, // Default TTL: 5 minutes
      max: 1000, // Maximum number of items in cache
    }),
    MemesModule,
    InteractionsModule,
    RelationalMemePersistenceModule,
  ],
  controllers: [StatsController],
  providers: [
    StatsService,
    UserStatsService,
    AdminStatsService,
    CacheManagerService,
  ],
  exports: [StatsService],
})
export class StatsModule {}
