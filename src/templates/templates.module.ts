import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { RelationalTemplatePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { TemplateController } from './templates.controller';
import { TemplateService } from './templates.service';

const infrastructurePersistenceModule = RelationalTemplatePersistenceModule;

@Module({
  imports: [
    // import modules, etc.
    infrastructurePersistenceModule,
    FilesModule,
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
