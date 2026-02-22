import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TestimonialsService } from './testimonials.service';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser, type JwtPayload } from '../common/decorators/current-user.decorator';
import { PaidUserGuard } from '../payments/guards/paid-user.guard';
import { createTestimonialSchema } from './dto/create-testimonial.dto';

@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Public()
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post(':slug')
  async submit(@Param('slug') slug: string, @Body() body: unknown) {
    const data = createTestimonialSchema.parse(body);
    return this.testimonialsService.submit(slug, data);
  }

  @UseGuards(PaidUserGuard)
  @Get('me')
  async getMine(@CurrentUser() user: JwtPayload) {
    return this.testimonialsService.getMine(user.sub);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.testimonialsService.approve(id, user.sub);
  }

  @Delete(':id')
  async reject(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.testimonialsService.reject(id, user.sub);
  }
}
