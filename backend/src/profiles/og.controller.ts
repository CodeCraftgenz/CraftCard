import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { OgImageService } from './og-image.service';
import { Public } from '../common/decorators/public.decorator';
import type { EnvConfig } from '../common/config/env.config';

const BOT_USER_AGENTS = [
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'WhatsApp',
  'TelegramBot',
  'Slackbot',
  'Discordbot',
  'Googlebot',
  'bingbot',
];

@Controller('og')
export class OgController {
  private readonly backendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig>,
    private readonly ogImageService: OgImageService,
  ) {
    this.backendUrl = this.configService.get('BACKEND_URL', { infer: true }) || '';
  }

  @Public()
  @Get('image/:slug')
  async getOgImage(
    @Param('slug') slug: string,
    @Res() res: Response,
  ) {
    const buffer = await this.ogImageService.generateOgImage(slug);
    if (!buffer) {
      return res.status(404).send('Not found');
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h
    res.send(buffer);
  }

  @Public()
  @Get(':slug')
  async getOgMeta(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userAgent = req.headers['user-agent'] || '';
    const isBot = BOT_USER_AGENTS.some((bot) => userAgent.includes(bot));

    const frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });

    if (!isBot) {
      return res.redirect(302, `${frontendUrl}/${slug}`);
    }

    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      select: {
        displayName: true,
        bio: true,
        photoUrl: true,
        isPublished: true,
      },
    });

    if (!profile || !profile.isPublished) {
      return res.redirect(302, `${frontendUrl}/${slug}`);
    }

    const title = `${profile.displayName} — CraftCard`;
    const description = profile.bio
      ? profile.bio.slice(0, 160)
      : `Cartao digital de ${profile.displayName}`;
    // Use dynamic OG image instead of just the profile photo
    const ogImage = `${this.backendUrl}/api/og/image/${slug}`;
    const url = `${frontendUrl}/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(title)}</title>
  <meta name="description" content="${this.escapeHtml(description)}">
  <meta property="og:type" content="profile">
  <meta property="og:title" content="${this.escapeHtml(title)}">
  <meta property="og:description" content="${this.escapeHtml(description)}">
  <meta property="og:url" content="${this.escapeHtml(url)}">
  <meta property="og:image" content="${this.escapeHtml(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${this.escapeHtml(title)}">
  <meta name="twitter:description" content="${this.escapeHtml(description)}">
  <meta name="twitter:image" content="${this.escapeHtml(ogImage)}">
  <meta http-equiv="refresh" content="0;url=${this.escapeHtml(url)}">
</head>
<body>
  <p>Redirecionando para <a href="${this.escapeHtml(url)}">${this.escapeHtml(title)}</a>...</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
