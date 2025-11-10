import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FileEntity } from '../../../../../files/infrastructure/persistence/relational/entities/file.entity';
import { TemplateEntity } from '../../../../../templates/infrastructure/persistence/relational/entities/template.entity';
import { UserEntity } from '../../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { MemeAudience } from '../../../../memes.enum';

@Entity({ name: 'memes' })
export class MemeEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', unique: true, length: 30 })
  title: string;

  @Index()
  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => TemplateEntity, { nullable: true, eager: true })
  @JoinColumn()
  template: TemplateEntity | null;

  @OneToOne(() => FileEntity, { eager: true })
  @JoinColumn()
  file: FileEntity;

  @ManyToOne(() => UserEntity, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  author: UserEntity;

  @Column({
    type: 'enum',
    enum: MemeAudience,
    default: MemeAudience.PUBLIC,
  })
  audience: MemeAudience;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
