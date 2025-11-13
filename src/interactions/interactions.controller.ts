import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { MemeInteraction } from './domain/meme-interaction';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { InteractionSummaryDto } from './dto/interaction-summary.dto';
import { InteractionType } from './interactions.enum';
import { InteractionsService } from './interactions.service';

@ApiTags('Interactions')
@Controller({
  path: 'interactions',
  version: '1',
})
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @ApiCreatedResponse({ type: MemeInteraction })
  create(
    @Body() createInteractionDto: CreateInteractionDto,
    @Request() request,
  ) {
    return this.interactionsService.createInteraction(
      createInteractionDto,
      request.user.id,
    );
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete('memes/:slugOrId')
  @ApiParam({
    name: 'slugOrId',
    type: String,
    description: 'Meme slug or UUID',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('slugOrId') slugOrId: string,
    @Query('type') type: InteractionType,
    @Request() request,
  ) {
    return this.interactionsService.removeInteraction(
      slugOrId,
      request.user.id,
      type,
    );
  }

  @Get('memes/:slugOrId/summary')
  @ApiParam({
    name: 'slugOrId',
    type: String,
    description: 'Meme slug or UUID',
  })
  @ApiParam({
    name: 'userId',
    type: String,
    description: 'User UUID (optional)',
    required: false,
  })
  @ApiOkResponse({ type: InteractionSummaryDto })
  getMemeInteractions(
    @Param('slugOrId') slugOrId: string,
    @Query('userId') userId?: string,
  ) {
    return this.interactionsService.getMemeInteractions(slugOrId, userId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('my-interactions')
  @ApiOkResponse({ type: [MemeInteraction] })
  getUserInteractions(@Request() request) {
    return this.interactionsService.getUserInteractions(request.user.id);
  }
}
