import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { TagEntity } from '../../../../../tags/infrastructure/persistence/relational/entities/tag.entity';

@Entity({
  name: 'template',
})
export class TemplateEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, unique: true })
  @Index()
  title: string;

  @Index()
  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: String, nullable: true })
  description?: string;

  @Column({ type: 'jsonb' })
  config: Record<string, any>;

  @ManyToOne(() => UserEntity, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  author: UserEntity;

  @ManyToMany(() => TagEntity, { eager: true })
  @JoinTable({ name: 'template_tags' })
  tags: TagEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
