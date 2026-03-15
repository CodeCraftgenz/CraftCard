import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ConnectionsService } from './connections.service';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { requestConnectionSchema, requestBySlugSchema } from './dto/request-connection.dto';
import { AppException } from '../common/exceptions/app.exception';

@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Post('request')
  async request(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const parsed = requestConnectionSchema.safeParse(body);
    if (!parsed.success) throw AppException.badRequest('Dados invalidos', parsed.error.flatten());
    const { fromProfileId, toProfileId, ...geo } = parsed.data;
    return this.connectionsService.requestConnection(user.sub, fromProfileId, toProfileId, geo);
  }

  @Post('request-by-slug')
  async requestBySlug(@CurrentUser() user: JwtPayload, @Body() body: unknown) {
    const parsed = requestBySlugSchema.safeParse(body);
    if (!parsed.success) throw AppException.badRequest('Dados invalidos', parsed.error.flatten());
    return this.connectionsService.requestBySlug(user.sub, parsed.data.fromProfileId, parsed.data.slug);
  }

  @Put(':id/accept')
  async accept(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.connectionsService.acceptConnection(user.sub, id);
  }

  @Put(':id/reject')
  async reject(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.connectionsService.rejectConnection(user.sub, id);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.connectionsService.removeConnection(user.sub, id);
  }

  @Get('pending')
  async pending(@CurrentUser() user: JwtPayload) {
    return this.connectionsService.getPending(user.sub);
  }

  @Get('mine')
  async mine(@CurrentUser() user: JwtPayload, @Query('profileId') profileId?: string) {
    return this.connectionsService.getMyConnections(user.sub, profileId);
  }

  @Get('status/:profileId')
  async status(@CurrentUser() user: JwtPayload, @Param('profileId') profileId: string) {
    return this.connectionsService.getConnectionStatus(user.sub, profileId);
  }

  @Public()
  @Get('profile/:profileId')
  async publicConnections(@Param('profileId') profileId: string) {
    return this.connectionsService.getPublicConnections(profileId);
  }

  @Public()
  @Get('discover')
  async discover(
    @Query('q') query?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.connectionsService.discover(
      query,
      page ? parseInt(page, 10) : 1,
      limit ? Math.min(parseInt(limit, 10), 50) : 20,
    );
  }

  @Get('timeline')
  async timeline(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tagId') tagId?: string,
  ) {
    return this.connectionsService.getTimeline(
      user.sub,
      page ? parseInt(page, 10) : 1,
      limit ? Math.min(parseInt(limit, 10), 50) : 20,
      tagId || undefined,
    );
  }

  @Get('map')
  async mapData(@CurrentUser() user: JwtPayload) {
    return this.connectionsService.getMapData(user.sub);
  }

  @Get('wrapped/:year')
  async wrapped(@CurrentUser() user: JwtPayload, @Param('year') year: string) {
    return this.connectionsService.getWrappedStats(user.sub, parseInt(year, 10));
  }
}
