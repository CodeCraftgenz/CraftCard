import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicApiService } from './public-api.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { Public } from '../common/decorators/public.decorator';

/**
 * Public API endpoints for Enterprise customers.
 * Authentication via Bearer token (API Key), not JWT.
 * All routes prefixed with /api/v1/
 * Rate limited: 60 requests/minute per API key
 */
@Throttle({ default: { ttl: 60000, limit: 60 } })
@Public() // Skip JWT guard — we use ApiKeyGuard instead
@UseGuards(ApiKeyGuard)
@Controller('api/v1')
export class PublicApiController {
  constructor(private readonly apiService: PublicApiService) {}

  @Get('leads')
  async getLeads(
    @Req() req: { apiUser: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isRead') isRead?: string,
  ) {
    return this.apiService.getLeads(req.apiUser.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
    });
  }

  @Get('connections')
  async getConnections(
    @Req() req: { apiUser: { id: string } },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.apiService.getConnections(req.apiUser.id, {
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('profiles')
  async getProfiles(@Req() req: { apiUser: { id: string } }) {
    return this.apiService.getProfiles(req.apiUser.id);
  }

  @Get('analytics')
  async getAnalytics(@Req() req: { apiUser: { id: string } }) {
    return this.apiService.getAnalytics(req.apiUser.id);
  }
}
