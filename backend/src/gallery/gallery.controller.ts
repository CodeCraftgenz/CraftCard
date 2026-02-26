import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { PlanGuard, RequiresFeature } from '../payments/guards/plan.guard';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

@UseGuards(PlanGuard)
@RequiresFeature('gallery')
@Controller()
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post('me/gallery')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE }),
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('caption') caption?: string,
  ) {
    return this.galleryService.upload(user.sub, file.buffer, caption);
  }

  @Get('me/gallery')
  async getMine(@CurrentUser() user: JwtPayload) {
    return this.galleryService.getMine(user.sub);
  }

  @Put('me/gallery/order')
  async reorder(@CurrentUser() user: JwtPayload, @Body('imageIds') imageIds: string[]) {
    return this.galleryService.updateOrder(user.sub, imageIds);
  }

  @Put('me/gallery/:id/caption')
  async updateCaption(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body('caption') caption: string,
  ) {
    return this.galleryService.updateCaption(user.sub, id, caption);
  }

  @Delete('me/gallery/:id')
  async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.galleryService.delete(user.sub, id);
  }
}
