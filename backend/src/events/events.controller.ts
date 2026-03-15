import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { EventsService } from './events.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: {
    name: string;
    description?: string;
    startDate: string;
    endDate?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    isPublic?: boolean;
  }) {
    if (!body.name?.trim()) throw new Error('Nome do evento e obrigatório');
    if (!body.startDate) throw new Error('Data de início e obrigatoria');
    return this.eventsService.create(user.sub, {
      ...body,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Get()
  async getMyEvents(@CurrentUser() user: JwtPayload) {
    return this.eventsService.getMyEvents(user.sub);
  }

  @Get(':id')
  async getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.eventsService.getById(user.sub, id);
  }

  @Put(':id')
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    location?: string;
    coverUrl?: string | null;
    isPublic?: boolean;
  }) {
    return this.eventsService.update(user.sub, id, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
    });
  }

  @Delete(':id')
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.eventsService.delete(user.sub, id);
  }

  @Public()
  @Get('public/:slug')
  async getPublicEvent(@Param('slug') slug: string) {
    return this.eventsService.getPublicEvent(slug);
  }
}
