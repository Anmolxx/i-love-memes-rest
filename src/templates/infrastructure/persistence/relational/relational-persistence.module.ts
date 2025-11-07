import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TemplateRepository } from '../template.repository';
import { TemplateEntity } from './entities/template.entity';
import { TemplateRelationalRepository } from './repositories/template.repository';

@Module({
  imports: [TypeOrmModule.forFeature([TemplateEntity])],
  providers: [
    {
      provide: TemplateRepository,
      useClass: TemplateRelationalRepository,
    },
  ],
  exports: [TemplateRepository],
})
export class RelationalTemplatePersistenceModule {}
