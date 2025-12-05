import { CommentStatus } from 'src/comments/comments.enum';
import { MemeEntity } from 'src/memes/infrastructure/persistence/relational/entities/meme.entity';
import { UserEntity } from 'src/users/infrastructure/persistence/relational/entities/user.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'comments' })
@Index(['meme', 'createdAt'])
@Index(['author'])
export class CommentEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => MemeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meme_id' })
  meme: MemeEntity;

  @ManyToOne(() => UserEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: UserEntity;

  @ManyToOne(() => CommentEntity, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_comment_id' })
  parentComment: CommentEntity | null;

  @RelationId((comment: CommentEntity) => comment.parentComment)
  parentCommentId: string | null;

  @OneToMany(() => CommentEntity, (comment) => comment.parentComment)
  replies: CommentEntity[];

  @Column({ type: 'int', default: 0 })
  replyCount: number;

  @Column({ type: 'int', default: 0 })
  depth: number;

  @Column({
    type: 'enum',
    enum: CommentStatus,
    default: CommentStatus.ACTIVE,
  })
  status: CommentStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  editedAt: Date | null;

  @DeleteDateColumn()
  deletedAt: Date;
}
