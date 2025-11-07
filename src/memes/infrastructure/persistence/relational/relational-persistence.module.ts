import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemesRepository } from '../meme.repository';
import { MemeEntity } from './entities/meme.entity';
import { MemesRelationalRepository } from './repositories/meme.repository';

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
