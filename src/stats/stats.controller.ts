import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../roles/roles.decorator';
import { RoleEnum } from '../roles/roles.enum';
import { RolesGuard } from '../roles/roles.guard';
import { User } from '../users/domain/user';
import { PlatformOverviewDto } from './dto/admin-stats-response.dto';
import { TimeRangeDto } from './dto/time-range.dto';
import {
  MemePerformanceDto,
  UserActivityDto,
  UserDashboardDto,
} from './dto/user-stats-response.dto';
import { StatsService } from './stats.service';

@ApiTags('Statistics')
@Controller({ path: 'stats', version: '1' })
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  // ==================== End User Endpoints ====================

  @Get('user/dashboard')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user dashboard statistics' })
  @ApiOkResponse({ type: UserDashboardDto })
  @HttpCode(HttpStatus.OK)
  async getUserDashboard(@CurrentUser() user: User): Promise<UserDashboardDto> {
    return this.statsService.getUserDashboard(user.id);
  }

  @Get('user/memes/:id/performance')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get individual meme performance metrics' })
  @ApiParam({ name: 'id', description: 'Meme ID or slug' })
  @ApiQuery({
    name: 'includeComparisons',
    type: Boolean,
    required: false,
    description: 'Include platform average comparisons',
  })
  @ApiOkResponse({ type: MemePerformanceDto })
  @HttpCode(HttpStatus.OK)
  async getMemePerformance(
    @Param('id') memeId: string,
    @CurrentUser() user: User,
    @Query('includeComparisons') includeComparisons?: boolean,
  ): Promise<MemePerformanceDto> {
    return this.statsService.getMemePerformance(
      memeId,
      user.id,
      includeComparisons || false,
    );
  }

  @Get('user/activity')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get user activity statistics' })
  @ApiOkResponse({ type: UserActivityDto })
  @HttpCode(HttpStatus.OK)
  async getUserActivity(
    @CurrentUser() user: User,
    @Query() timeRange: TimeRangeDto,
  ): Promise<UserActivityDto> {
    return this.statsService.getUserActivity(user.id, timeRange);
  }

  // ==================== Admin Endpoints ====================

  @Get('admin/overview')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(RoleEnum.admin)
  @ApiOperation({ summary: 'Get platform overview statistics' })
  @ApiOkResponse({ type: PlatformOverviewDto })
  @HttpCode(HttpStatus.OK)
  async getAdminOverview(): Promise<PlatformOverviewDto> {
    return this.statsService.getPlatformOverview();
  }

  // TODO: Implement these endpoints in future phases
  // @Get('admin/templates/usage')
  // @Get('admin/top-charts')
  // @Get('admin/users/growth')
  // @Get('admin/interactions/summary')
}
