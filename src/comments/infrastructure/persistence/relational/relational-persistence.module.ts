import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentRepository } from '../comment.repository';
import { CommentEntity } from './entities/comment.entity';
import { CommentRelationalRepository } from './repositories/comment-relational.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CommentEntity])],
  providers: [
    {
      provide: CommentRepository,
      useClass: CommentRelationalRepository,
    },
  ],
  exports: [CommentRepository],
})
export class RelationalCommentPersistenceModule {}
