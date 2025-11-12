import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { RelationalTemplatePersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RelationalTagPersistenceModule } from '../tags/infrastructure/persistence/relational/relational-persistence.module';
import { TemplateController } from './templates.controller';
import { TemplateService } from './templates.service';
import { TagsModule } from '../tags/tags.module';

const infrastructurePersistenceModule = RelationalTemplatePersistenceModule;

@Module({
  imports: [
    // import modules, etc.
    infrastructurePersistenceModule,
    FilesModule,
    RelationalTagPersistenceModule,
    TagsModule,
  ],
  controllers: [TemplateController],
  providers: [TemplateService],
  exports: [TemplateService],
})
export class TemplateModule {}
