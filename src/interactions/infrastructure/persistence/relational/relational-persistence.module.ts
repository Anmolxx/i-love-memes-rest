import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemeInteractionRepository } from '../meme-interaction.repository';
import { MemeInteractionEntity } from './entities/meme-interaction.entity';
import { MemeInteractionRelationalRepository } from './repositories/meme-interaction-relational.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MemeInteractionEntity])],
  providers: [
    {
      provide: MemeInteractionRepository,
      useClass: MemeInteractionRelationalRepository,
    },
  ],
  exports: [MemeInteractionRepository],
})
export class RelationalMemeInteractionPersistenceModule {}
