import { TemplateEntity } from 'src/templates/infrastructure/persistence/relational/entities/template.entity';
import { EntityRelationalHelper } from 'src/utils/relational-entity-helper';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { TagEntity } from './tag.entity';

@Entity({ name: 'template_tags' })
export class TemplateTagEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TemplateEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: TemplateEntity;

  @ManyToOne(() => TagEntity, (tag) => tag.templateTags, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tag_id' })
  tag: TagEntity;

  @CreateDateColumn()
  createdAt: Date;
}
