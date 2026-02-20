import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {}

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
    const image = profile.photoUrl || '';
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
  ${image ? `<meta property="og:image" content="${this.escapeHtml(image)}">` : ''}
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${this.escapeHtml(title)}">
  <meta name="twitter:description" content="${this.escapeHtml(description)}">
  ${image ? `<meta name="twitter:image" content="${this.escapeHtml(image)}">` : ''}
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
