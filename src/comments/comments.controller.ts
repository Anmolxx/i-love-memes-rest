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
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { Comment } from './domain/comment';
import { CreateCommentDto } from './dto/create-comment.dto';
import { QueryCommentDto } from './dto/query-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@ApiTags('Comments')
@Controller({
  path: 'comments',
  version: '1',
})
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiCreatedResponse({ type: Comment })
  create(@Body() createCommentDto: CreateCommentDto, @Request() request) {
    return this.commentsService.create(createCommentDto, request.user.id);
  }

  @Get('memes/:slugOrId')
  @ApiParam({
    name: 'slugOrId',
    type: String,
    description: 'Meme slug or UUID',
  })
  @ApiOkResponse({
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Comment' },
            },
            total: { type: 'number' },
          },
        },
      },
    },
  })
  findByMeme(
    @Param('slugOrId') slugOrId: string,
    @Query() query: QueryCommentDto,
  ) {
    return this.commentsService.findByMeme(slugOrId, query);
  }

  @Get(':id/replies')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Comment' },
            },
            total: { type: 'number' },
          },
        },
      },
    },
  })
  findReplies(@Param('id') id: string, @Query() query: QueryCommentDto) {
    return this.commentsService.findReplies(id, query);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: Comment })
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: Comment })
  update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto,
    @Request() request,
  ) {
    return this.commentsService.update(id, updateCommentDto, request.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  @ApiParam({ name: 'id', type: String })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Request() request) {
    return this.commentsService.remove(id, request.user.id);
  }
}
