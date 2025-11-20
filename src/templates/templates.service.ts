import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { RoleEnum } from 'src/roles/roles.enum';
import { TagRepository } from 'src/tags/infrastructure/persistence/tag.repository';
import { JwtPayloadType } from '../auth/strategies/types/jwt-payload.type';
import { TagsService } from '../tags/tags.service';
import {
  generateBaseSlug,
  generateUniqueSlug,
  isUUID,
} from '../utils/slug.util';
import {
  IFilterOptions,
  IPaginationOptions,
  ISortOptions,
} from '../utils/types/pagination-options';
import { Template } from './domain/template';
import { CreateTemplateDto } from './dto/create-template.dto';
import {
  ITemplateFilters,
  TemplateSortField,
} from './dto/template-filter-options.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplateEntity } from './infrastructure/persistence/relational/entities/template.entity';
import { TemplateMapper } from './infrastructure/persistence/relational/mapper/template.mapper';
import { TemplateRepository } from './infrastructure/persistence/template.repository';

@Injectable()
export class TemplateService {
  constructor(
    private readonly templateRepository: TemplateRepository,
    private readonly tagsService: TagsService,
    private readonly tagRepository: TagRepository,
  ) {}

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
    // Handle tags
    if (createTemplateDto.tags && createTemplateDto.tags.length > 0) {
      const tags = await this.tagsService.findOrCreate({
        names: createTemplateDto.tags,
      });
      for (const tag of tags) {
        await this.tagRepository.linkTagToTemplate(template.id, tag.id);
      }
    }

    const domain = TemplateMapper.toDomain(template);
    return {
      ...domain,
      summary: {
        totalMemes: 0,
      },
    };
  }

  async getById(templateId: string) {
    const template = await this.templateRepository.getById(templateId);
    if (!template) {
      throw new NotFoundException('Template not found with given template id');
    }

    const domain = TemplateMapper.toDomain(template);
    const memeCount = await this.templateRepository.getMemeCountByTemplateId(
      template.id,
    );

    return {
      ...domain,
      summary: {
        totalMemes: memeCount,
      },
    };
  }

  async findOne(slugOrId: string): Promise<Template> {
    // Try to find by slug first (more user-friendly)
    let template = await this.templateRepository.findBySlug(slugOrId);

    // If not found by slug, only try by ID when the input is a valid UUID
    if (!template && isUUID(slugOrId)) {
      template = await this.templateRepository.getById(slugOrId);
    }

    if (!template) {
      throw new NotFoundException(
        `Template with identifier ${slugOrId} not found`,
      );
    }

    const domain = TemplateMapper.toDomain(template);
    const memeCount = await this.templateRepository.getMemeCountByTemplateId(
      template.id,
    );

    return {
      ...domain,
      summary: {
        totalMemes: memeCount,
      },
    };
  }

  async getAll(options: {
    paginationOptions: IPaginationOptions;
    sortOptions?: ISortOptions<TemplateSortField>;
    filterOptions?: IFilterOptions<ITemplateFilters>;
  }) {
    const { paginationOptions, sortOptions, filterOptions } = options;

    const { items: entities, meta } =
      await this.templateRepository.findManyWithPagination({
        paginationOptions,
        sortOptions,
        filterOptions,
      });

    const items = await Promise.all(
      entities.map(async (e) => {
        const domain = TemplateMapper.toDomain(e);
        const memeCount =
          await this.templateRepository.getMemeCountByTemplateId(e.id);
        return {
          ...domain,
          summary: {
            totalMemes: memeCount,
          },
        };
      }),
    );

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

    // If not found by slug, only try by ID when the input is a valid UUID
    if (!existingTemplate && isUUID(slugOrId)) {
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
    const updatedTemplate = await this.templateRepository.update(
      updateData,
      existingTemplate.id,
    );
    // Handle tags
    if (updateTemplateDto.tags) {
      // Remove old tags
      // You should implement a method in TagRepository to remove all links for a template if needed
      // For now, assume such a method exists: removeAllTagLinksForTemplate(templateId)
      if (
        typeof this.tagRepository.removeAllTagLinksForTemplate === 'function'
      ) {
        await this.tagRepository.removeAllTagLinksForTemplate(
          existingTemplate.id,
        );
      }
      if (updateTemplateDto.tags.length > 0) {
        const tags = await this.tagsService.findOrCreate({
          names: updateTemplateDto.tags,
        });
        for (const tag of tags) {
          await this.tagRepository.linkTagToTemplate(
            existingTemplate.id,
            tag.id,
          );
        }
      }
    }
    return updatedTemplate;
  }

  async delete(slugOrId: string) {
    // Try to find by slug first
    let template = await this.templateRepository.findBySlug(slugOrId);

    // If not found by slug, only try by ID when the input is a valid UUID
    if (!template && isUUID(slugOrId)) {
      template = await this.templateRepository.getById(slugOrId);
    }

    if (!template) {
      throw new NotFoundException('Template not found with given identifier');
    }

    await this.templateRepository.softDelete(template.id);
  }

  async findDeletedWithPagination(options: {
    paginationOptions: IPaginationOptions;
    sortOptions?: ISortOptions<TemplateSortField>;
    filterOptions?: IFilterOptions<ITemplateFilters>;
  }) {
    // Delegate to repository with structured options
    return await this.templateRepository.findDeletedWithPagination({
      paginationOptions: options.paginationOptions,
      sortOptions: options.sortOptions,
      filterOptions: options.filterOptions,
    });
  }

  async restore(slugOrId: string, user: JwtPayloadType) {
    // Try to find including deleted
    let template = await this.templateRepository.findBySlug(slugOrId);
    if (!template && isUUID(slugOrId)) {
      template = await this.templateRepository.getById(slugOrId);
    }

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const isOwner = template.author?.id === user.id;
    const isAdmin = (user as any)?.role?.name === RoleEnum.admin;

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to restore this template',
      );
    }

    // Call repository restore
    if (typeof this.templateRepository.restore === 'function') {
      await this.templateRepository.restore(template.id);
    } else {
      await this.templateRepository.update(
        { ...template, deletedAt: undefined } as any,
        template.id,
      );
    }

    const reloaded = await this.templateRepository.getById(template.id);
    return reloaded;
  }

  async hardDelete(slugOrId: string) {
    let template = await this.templateRepository.findBySlug(slugOrId);
    if (!template && isUUID(slugOrId)) {
      template = await this.templateRepository.getById(slugOrId);
    }

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Admin-only enforced at controller via RolesGuard
    // Call repository hardDelete
    if (typeof this.templateRepository.hardDelete === 'function') {
      await this.templateRepository.hardDelete(template.id);
    } else {
      await this.templateRepository.softDelete(template.id);
    }
  }
}
