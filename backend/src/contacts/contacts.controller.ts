import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContactsService } from './contacts.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { PaidUserGuard } from '../payments/guards/paid-user.guard';
import { sendMessageSchema } from './dto/send-message.dto';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post(':slug')
  async sendMessage(@Param('slug') slug: string, @Body() body: unknown) {
    const data = sendMessageSchema.parse(body);
    return this.contactsService.sendMessage(slug, data);
  }

  @UseGuards(PaidUserGuard)
  @Get('me')
  async getMyMessages(@CurrentUser() user: JwtPayload) {
    return this.contactsService.getMessages(user.sub);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.contactsService.markAsRead(id, user.sub);
  }
}
