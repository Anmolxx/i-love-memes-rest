import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemesRepository } from '../meme.repository';
import { MemesRelationalRepository } from './repositories/meme.repository';
import { MemeEntity } from './entities/meme.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MemeEntity])],
  providers: [
    {
      provide: MemesRepository,
      useClass: MemesRelationalRepository,
    },
  ],
  exports: [MemesRepository],
})
export class RelationalMemePersistenceModule {}
