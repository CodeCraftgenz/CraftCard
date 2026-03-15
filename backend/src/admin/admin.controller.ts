import { Controller, Get, Put, Delete, Param, Query, Body, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { updateUserSchema } from './dto/update-user.dto';

@Roles('SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  async listUsers(
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers({
      search, plan, role,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('users/:userId')
  async getUserDetail(@Param('userId') userId: string) {
    return this.adminService.getUserDetail(userId);
  }

  @Put('users/:userId')
  async updateUser(@Param('userId') userId: string, @Body() body: unknown) {
    const data = updateUserSchema.parse(body);
    return this.adminService.updateUser(userId, data);
  }

  @Delete('users/:userId')
  async deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  @Get('payments')
  async listPayments(
    @Query('status') status?: string,
    @Query('plan') plan?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listPayments({
      status, plan,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('organizations')
  async listOrganizations(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listOrganizations({
      search,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('organizations/:orgId')
  async getOrgDetail(@Param('orgId') orgId: string) {
    return this.adminService.getOrgDetail(orgId);
  }

  @Put('organizations/:orgId')
  async updateOrg(@Param('orgId') orgId: string, @Body() body: { extraSeats?: number }) {
    return this.adminService.updateOrg(orgId, body);
  }

  // --- Hackathon ---

  @Get('hackathon/dashboard')
  async getHackathonDashboard() {
    return this.adminService.getHackathonDashboard();
  }

  @Get('hackathon/participants')
  async getHackathonParticipants(
    @Query('search') search?: string,
    @Query('area') area?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getHackathonParticipants({
      search, area,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('hackathon/analytics')
  async getHackathonAnalytics() {
    return this.adminService.getHackathonAnalytics();
  }

  @Get('hackathon/export-csv')
  async exportHackathonCsv(@Res() res: Response) {
    const csv = await this.adminService.exportHackathonCsv();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hackathon-senac-participantes.csv"');
    res.send(csv);
  }

  @Get('hackathon/teams')
  async getHackathonTeams() {
    return this.adminService.getHackathonTeams();
  }

  @Get('hackathon/teams/:orgId')
  async getHackathonTeamDetail(@Param('orgId') orgId: string) {
    return this.adminService.getHackathonTeamDetail(orgId);
  }

  // --- Settings ---

  @Get('settings/:key')
  async getSetting(@Param('key') key: string) {
    return this.adminService.getSetting(key);
  }

  @Put('settings/:key')
  async setSetting(@Param('key') key: string, @Body() body: { value: string }) {
    return this.adminService.setSetting(key, body.value);
  }
}
