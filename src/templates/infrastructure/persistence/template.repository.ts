import { JwtPayloadType } from '../../../auth/strategies/types/jwt-payload.type';
import { PaginationMetaDto } from '../../../utils/dto/pagination-response.dto';
import {
  IFilterOptions,
  IPaginationOptions,
  ISearchOptions,
  ISortOptions,
} from '../../../utils/types/pagination-options';
import { Template } from '../../domain/template';
import { CreateTemplateDto } from '../../dto/create-template.dto';
import { TemplateEntity } from './relational/entities/template.entity';

export abstract class TemplateRepository {
  abstract create(
    createTemplateDto: CreateTemplateDto,
    user: JwtPayloadType,
    slug: string,
  ): Promise<TemplateEntity>;

  abstract getByTitle(title: string): Promise<TemplateEntity | null>;
  abstract getById(id: string): Promise<TemplateEntity | null>;
  abstract findBySlug(slug: string): Promise<TemplateEntity | null>;
  abstract findManyWithPagination(
    options: IPaginationOptions &
      ISortOptions<TemplateEntity> &
      IFilterOptions<TemplateEntity> &
      ISearchOptions,
  ): Promise<{ items: TemplateEntity[]; meta: PaginationMetaDto }>;
  abstract update(updateData: Partial<TemplateEntity>, id: Template['id']);

  abstract softDelete(id: Template['id']);
}
