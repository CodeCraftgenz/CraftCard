import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TagsService } from './tags.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() body: { name: string; color?: string }) {
    if (!body.name?.trim()) throw new Error('Nome da tag e obrigatório');
    return this.tagsService.create(user.sub, body.name, body.color);
  }

  @Get()
  async getAll(@CurrentUser() user: JwtPayload) {
    return this.tagsService.getAll(user.sub);
  }

  @Put(':id')
  async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: { name?: string; color?: string }) {
    return this.tagsService.update(user.sub, id, body);
  }

  @Delete(':id')
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.tagsService.delete(user.sub, id);
  }

  @Post('/connections/:connId')
  async assignToConnection(
    @CurrentUser() user: JwtPayload,
    @Param('connId') connId: string,
    @Body('tagId') tagId: string,
  ) {
    return this.tagsService.assignToConnection(user.sub, connId, tagId);
  }

  @Delete('/connections/:connId/:tagId')
  async removeFromConnection(
    @CurrentUser() user: JwtPayload,
    @Param('connId') connId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagsService.removeFromConnection(user.sub, connId, tagId);
  }
}
