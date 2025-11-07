import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagRepository } from '../tag.repository';
import { MemeTagEntity } from './entities/meme-tag.entity';
import { TagEntity } from './entities/tag.entity';
import { TemplateTagEntity } from './entities/template-tag.entity';
import { TagRelationalRepository } from './repositories/tag-relational.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([TagEntity, MemeTagEntity, TemplateTagEntity]),
  ],
  providers: [
    {
      provide: TagRepository,
      useClass: TagRelationalRepository,
    },
  ],
  exports: [TagRepository],
})
export class RelationalTagPersistenceModule {}
