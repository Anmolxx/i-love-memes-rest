import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { RelationalMemePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { MemesController } from './memes.controller';
import { MemesService } from './memes.service';

@Module({
  imports: [RelationalMemePersistenceModule, FilesModule],
  controllers: [MemesController],
  providers: [MemesService],
  exports: [MemesService],
})
export class MemesModule {}
