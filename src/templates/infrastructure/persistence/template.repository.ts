import { JwtPayloadType } from '../../../auth/strategies/types/jwt-payload.type';
import { PaginationMetaDto } from '../../../utils/dto/pagination-response.dto';
import {
  IFilterOptions,
  IPaginationOptions,
  ISortOptions,
} from '../../../utils/types/pagination-options';
import { Template } from '../../domain/template';
import { CreateTemplateDto } from '../../dto/create-template.dto';
import {
  ITemplateFilters,
  TemplateSortField,
} from '../../dto/template-filter-options.dto';
import { TemplateEntity } from './relational/entities/template.entity';

export abstract class TemplateRepository {
  abstract create(
    createTemplateDto: CreateTemplateDto,
    user: JwtPayloadType,
    slug: string,
  ): Promise<TemplateEntity>;

  abstract getByTitle(title: string): Promise<TemplateEntity | null>;
  abstract getById(
    id: string,
    withDeleted?: boolean,
  ): Promise<TemplateEntity | null>;
  abstract findBySlug(
    slug: string,
    withDeleted?: boolean,
  ): Promise<TemplateEntity | null>;
  abstract findManyWithPagination(options: {
    paginationOptions: IPaginationOptions;
    sortOptions?: ISortOptions<TemplateSortField>;
    filterOptions?: IFilterOptions<ITemplateFilters> | null;
  }): Promise<{ items: TemplateEntity[]; meta: PaginationMetaDto }>;
  abstract update(updateData: Partial<TemplateEntity>, id: Template['id']);

  abstract softDelete(id: Template['id']);
  abstract findDeletedWithPagination(options: {
    paginationOptions: IPaginationOptions;
    sortOptions?: ISortOptions<TemplateSortField>;
    filterOptions?: IFilterOptions<ITemplateFilters> | null;
  }): Promise<{ items: TemplateEntity[]; meta: PaginationMetaDto }>;
  abstract restore(id: Template['id']): Promise<void>;
  abstract hardDelete(id: Template['id']): Promise<void>;

  abstract getMemeCountByTemplateId(templateId: string): Promise<number>;
}
