import { Controller, Get, Put, Delete, Param, Query, Body } from '@nestjs/common';
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
  ) {
    return this.adminService.listUsers(search, plan, role);
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
  ) {
    return this.adminService.listPayments(status, plan);
  }

  @Get('organizations')
  async listOrganizations(@Query('search') search?: string) {
    return this.adminService.listOrganizations(search);
  }
}
