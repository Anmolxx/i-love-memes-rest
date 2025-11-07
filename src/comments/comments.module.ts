import { Module } from '@nestjs/common';
import { RelationalMemePersistenceModule } from 'src/memes/infrastructure/persistence/relational/relational-persistence.module';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { RelationalCommentPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    RelationalCommentPersistenceModule,
    RelationalMemePersistenceModule,
  ],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService, RelationalCommentPersistenceModule],
})
export class CommentsModule {}
