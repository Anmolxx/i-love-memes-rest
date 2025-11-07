import {
  InteractionType,
  ReportReason,
} from 'src/interactions/interactions.enum';
import { MemeEntity } from 'src/memes/infrastructure/persistence/relational/entities/meme.entity';
import { UserEntity } from 'src/users/infrastructure/persistence/relational/entities/user.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

@Entity({ name: 'meme_interactions' })
@Unique(['meme', 'user', 'type'])
@Index(['meme', 'type'])
@Index(['user', 'type'])
export class MemeInteractionEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MemeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meme_id' })
  meme: MemeEntity;

  @ManyToOne(() => UserEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({
    type: 'enum',
    enum: InteractionType,
  })
  type: InteractionType;

  @Column({
    type: 'enum',
    enum: ReportReason,
    nullable: true,
  })
  reason: ReportReason | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
