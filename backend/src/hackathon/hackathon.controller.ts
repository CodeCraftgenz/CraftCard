import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { HackathonService } from './hackathon.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('hackathon')
export class HackathonController {
  constructor(private readonly hackathonService: HackathonService) {}

  // ── Teams ─────────────────────────────────────────────

  @Post('teams')
  async createTeam(@CurrentUser() user: JwtPayload, @Body('name') name: string) {
    if (!name?.trim()) throw new Error('Nome da equipe e obrigatorio');
    return this.hackathonService.createTeam(user.sub, name.trim());
  }

  @Get('teams/mine')
  async getMyTeam(@CurrentUser() user: JwtPayload) {
    return this.hackathonService.getMyTeam(user.sub);
  }

  @Put('teams')
  async updateTeam(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name?: string; logoUrl?: string | null },
  ) {
    return this.hackathonService.updateTeam(user.sub, body);
  }

  // ── Invites ───────────────────────────────────────────

  @Post('teams/invite')
  async invite(@CurrentUser() user: JwtPayload, @Body('slug') slug: string) {
    if (!slug?.trim()) throw new Error('Slug do perfil e obrigatorio');
    return this.hackathonService.inviteByProfileSlug(user.sub, slug.trim());
  }

  @Get('invites')
  async getMyInvites(@CurrentUser() user: JwtPayload) {
    return this.hackathonService.getMyInvites(user.sub);
  }

  @Post('invites/:id/accept')
  async acceptInvite(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.hackathonService.acceptInvite(user.sub, id);
  }

  @Post('invites/:id/decline')
  async declineInvite(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.hackathonService.declineInvite(user.sub, id);
  }

  @Delete('teams/leave')
  async leaveTeam(@CurrentUser() user: JwtPayload) {
    return this.hackathonService.leaveTeam(user.sub);
  }

  // ── Participants (public) ─────────────────────────────

  @Public()
  @Get('participants')
  async getParticipants() {
    return this.hackathonService.getParticipants();
  }
}
