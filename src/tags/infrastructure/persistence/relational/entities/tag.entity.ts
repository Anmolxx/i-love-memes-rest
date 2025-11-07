import { TagStatus } from 'src/tags/tags.enum';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { MemeTagEntity } from './meme-tag.entity';
import { TemplateTagEntity } from './template-tag.entity';

@Entity({ name: 'tags' })
export class TagEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 50, unique: true })
  normalizedName: string;

  @Index()
  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({
    type: 'enum',
    enum: TagStatus,
    default: TagStatus.ACTIVE,
  })
  status: TagStatus;

  @OneToMany(() => MemeTagEntity, (memeTag) => memeTag.tag)
  memeTags: MemeTagEntity[];

  @OneToMany(() => TemplateTagEntity, (templateTag) => templateTag.tag)
  templateTags: TemplateTagEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
