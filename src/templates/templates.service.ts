import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { generateBaseSlug, generateUniqueSlug } from '../utils/slug.util';
import {
  IFilterOptions,
  IPaginationOptions,
  ISearchOptions,
  ISortOptions,
} from '../utils/types/pagination-options';
import { Template } from './domain/template';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateEntity } from './infrastructure/persistence/relational/entities/template.entity';
import { TemplateMapper } from './infrastructure/persistence/relational/mapper/template.mapper';
import { TemplateRepository } from './infrastructure/persistence/template.repository';

@Injectable()
export class TemplateService {
  constructor(private readonly templateRepository: TemplateRepository) {}

  async create(createTemplateDto: CreateTemplateDto, user: JwtPayloadType) {
    const isExist = await this.templateRepository.getByTitle(
      createTemplateDto.title,
    );

    if (isExist) {
      throw new UnprocessableEntityException(
        'Template with this name already exists',
      );
    }

    // Automated unique slug generation
    const baseSlug = generateBaseSlug(createTemplateDto.title);
    const slug = await generateUniqueSlug(baseSlug, async (slug) => {
      const found = await this.templateRepository.findBySlug(slug);
      return !!found;
    });
    const template = await this.templateRepository.create(
      createTemplateDto,
      user,
      slug,
    );
    return TemplateMapper.toDomain(template);
  }

  async getById(templateId: string) {
    const template = await this.templateRepository.getById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found with given template id');
    }
    return TemplateMapper.toDomain(template);
  }

  async findOne(slugOrId: string): Promise<Template> {
    // Try to find by slug first (more user-friendly)
    let template = await this.templateRepository.findBySlug(slugOrId);

    // If not found by slug, try by ID
    if (!template) {
      template = await this.templateRepository.getById(slugOrId);
    }

    if (!template) {
      throw new NotFoundException(
        `Template with identifier ${slugOrId} not found`,
      );
    }

    return TemplateMapper.toDomain(template);
  }

  async getAll(options: {
    paginationOptions: IPaginationOptions;
    sortOptions: ISortOptions<TemplateEntity>;
    search?: string;
    filterOptions?: Partial<Record<keyof TemplateEntity, string>>;
  }) {
    const { paginationOptions, sortOptions, search } = options;

    const repoOptions: IPaginationOptions &
      ISortOptions<TemplateEntity> &
      IFilterOptions<TemplateEntity> &
      ISearchOptions = {
      ...paginationOptions,
      ...sortOptions,
      search,
    };

    const { items: entities, meta } =
      await this.templateRepository.findManyWithPagination(repoOptions);

    const items = entities.map((e) => TemplateMapper.toDomain(e));

    return {
      items,
      meta,
    };
  }

  async update(
    slugOrId: string,
    updateTemplateDto: UpdateTemplateDto,
    user: JwtPayloadType,
  ): Promise<TemplateEntity> {
    // Try to find by slug first
    let existingTemplate = await this.templateRepository.findBySlug(slugOrId);

    // If not found by slug, try by ID
    if (!existingTemplate) {
      existingTemplate = await this.templateRepository.getById(slugOrId);
    }

    if (!existingTemplate) {
      throw new NotFoundException('Template not found');
    }

    if (existingTemplate.author?.id !== user.id) {
      throw new ForbiddenException(
        'You are not allowed to update this template',
      );
    }

    let slug = existingTemplate.slug;

    if (
      updateTemplateDto?.title &&
      updateTemplateDto.title !== existingTemplate.title
    ) {
      const isExist = await this.templateRepository.getByTitle(
        updateTemplateDto.title,
      );

      if (isExist) {
        throw new UnprocessableEntityException(
          'Template with given title alreay exists',
        );
      }

      // Automated unique slug generation for update
      const baseSlug = generateBaseSlug(updateTemplateDto.title);
      slug = await generateUniqueSlug(baseSlug, async (slug) => {
        const found = await this.templateRepository.findBySlug(slug);
        // Allow current template's slug
        return !!found && found.id !== existingTemplate.id;
      });
    }

    const updateData = {
      title: updateTemplateDto.title?.trim(),
      description: updateTemplateDto.description ?? undefined,
      config: updateTemplateDto.config,
      slug,
    };

    return this.templateRepository.update(updateData, existingTemplate.id);
  }

  async delete(slugOrId: string) {
    // Try to find by slug first
    let template = await this.templateRepository.findBySlug(slugOrId);

    // If not found by slug, try by ID
    if (!template) {
      template = await this.templateRepository.getById(slugOrId);
    }

    if (!template) {
      throw new NotFoundException('Template not found with given identifier');
    }

    await this.templateRepository.softDelete(template.id);
  }
}
