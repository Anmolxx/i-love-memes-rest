import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { RelationalTagPersistenceModule } from '../tags/infrastructure/persistence/relational/relational-persistence.module';
import { RelationalMemePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { MemesController } from './memes.controller';
import { MemesService } from './memes.service';
import { TagsModule } from '../tags/tags.module';

@Module({
  imports: [
    RelationalMemePersistenceModule,
    FilesModule,
    RelationalTagPersistenceModule,
    TagsModule,
  ],
  controllers: [MemesController],
  providers: [MemesService],
  exports: [MemesService],
})
export class MemesModule {}
