import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { PaidUserGuard } from '../payments/guards/paid-user.guard';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Get('slots/:slug')
  async getSlots(@Param('slug') slug: string) {
    return this.bookingsService.getSlots(slug);
  }

  @Public()
  @Get('available/:slug')
  async getAvailableTimes(@Param('slug') slug: string, @Query('date') date: string) {
    return this.bookingsService.getAvailableTimes(slug, date);
  }

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post(':slug')
  async createBooking(@Param('slug') slug: string, @Body() body: { name: string; email: string; phone?: string; date: string; time: string; notes?: string }) {
    return this.bookingsService.createBooking(slug, body);
  }

  @UseGuards(PaidUserGuard)
  @Get('me/list')
  async getMyBookings(@CurrentUser() user: JwtPayload) {
    return this.bookingsService.getMyBookings(user.sub);
  }

  @UseGuards(PaidUserGuard)
  @Get('me/slots')
  async getMySlots(@CurrentUser() user: JwtPayload) {
    return this.bookingsService.getMySlots(user.sub);
  }

  @UseGuards(PaidUserGuard)
  @Put('me/slots')
  async saveSlots(@CurrentUser() user: JwtPayload, @Body('slots') slots: Array<{ dayOfWeek: number; startTime: string; endTime: string; duration: number }>) {
    return this.bookingsService.saveSlots(user.sub, slots);
  }

  @Put('me/:id/status')
  async updateStatus(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body('status') status: string) {
    return this.bookingsService.updateBookingStatus(user.sub, id, status);
  }
}
