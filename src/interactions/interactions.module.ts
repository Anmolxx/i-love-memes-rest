import { Module } from '@nestjs/common';
import { RelationalMemeInteractionPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { InteractionsController } from './interactions.controller';
import { InteractionsService } from './interactions.service';

@Module({
  imports: [RelationalMemeInteractionPersistenceModule],
  controllers: [InteractionsController],
  providers: [InteractionsService],
  exports: [InteractionsService, RelationalMemeInteractionPersistenceModule],
})
export class InteractionsModule {}
