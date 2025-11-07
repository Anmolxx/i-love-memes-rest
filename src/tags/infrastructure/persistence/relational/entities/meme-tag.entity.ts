import { MemeEntity } from 'src/memes/infrastructure/persistence/relational/entities/meme.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TagEntity } from './tag.entity';

@Entity({ name: 'meme_tags' })
export class MemeTagEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => MemeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meme_id' })
  meme: MemeEntity;

  @ManyToOne(() => TagEntity, (tag) => tag.memeTags, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: TagEntity;

  @CreateDateColumn()
  createdAt: Date;
}
