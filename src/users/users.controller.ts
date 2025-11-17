import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { API_PAGE_LIMIT } from '../constants/common.constant';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { createResponse } from '../utils/base-response';
import { PaginatedResponse } from '../utils/dto/pagination-response.dto';
import { NullableType } from '../utils/types/nullable.type';
import { User } from './domain/user';
import { CreateUserDto } from './dto/create-user.dto';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiCreatedResponse({
    type: User,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createProfileDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createProfileDto);
  }

  @ApiOkResponse({
    type: PaginatedResponse(User),
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 2,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'firstName',
    required: false,
    type: String,
    description: 'Filter users by first name (partial, case-insensitive)',
    example: 'John',
  })
  @ApiQuery({
    name: 'lastName',
    required: false,
    type: String,
    description: 'Filter users by last name (partial, case-insensitive)',
    example: 'Doe',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter users by email (partial, case-insensitive)',
    example: 'john.doe@example.com',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: Number,
    description: 'Filter users by status ID',
    example: 1,
  })
  @ApiQuery({
    name: 'role',
    required: false,
    type: Number,
    description: 'Filter users by role ID',
    example: 2,
  })
  @ApiQuery({
    name: 'orderBy',
    required: false,
    enum: ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email'],
    description: 'Field to sort users by',
    example: 'createdAt',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort direction',
    example: 'DESC',
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() filterOptions: FilterUserDto,
    @Query() sortOptions: SortUserDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const safePage = page ?? 1;
    let safeLimit = limit ?? 10;
    if (safeLimit > API_PAGE_LIMIT) {
      safeLimit = API_PAGE_LIMIT;
    }

    const result = await this.usersService.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions: {
        page: safePage,
        limit: safeLimit,
      },
    });

    return createResponse(
      'user fetched successfully',
      result.data,
      result.meta,
    );
  }

  @ApiOkResponse({
    type: User,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  findOne(@Param('id') id: User['id']): Promise<NullableType<User>> {
    return this.usersService.findById(id);
  }

  @ApiOkResponse({
    type: User,
  })
  @SerializeOptions({
    groups: ['admin'],
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  update(
    @Param('id') id: User['id'],
    @Body() updateProfileDto: UpdateUserDto,
  ): Promise<User | null> {
    return this.usersService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @ApiParam({
    name: 'id',
    type: String,
    required: true,
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: User['id']): Promise<void> {
    return this.usersService.remove(id);
  }
}
