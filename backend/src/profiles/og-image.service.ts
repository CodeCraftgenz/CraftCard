import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import type { EnvConfig } from '../common/config/env.config';
import * as sharp from 'sharp';
import * as https from 'https';
import * as http from 'http';

/** In-memory cache entry */
interface CacheEntry {
  buffer: Buffer;
  createdAt: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

@Injectable()
export class OgImageService {
  private readonly logger = new Logger(OgImageService.name);
  private readonly cache = new Map<string, CacheEntry>();
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<EnvConfig>,
  ) {
    this.frontendUrl = this.configService.get('FRONTEND_URL', { infer: true }) || '';
  }

  async generateOgImage(slug: string): Promise<Buffer | null> {
    // Check cache
    const cached = this.cache.get(slug);
    if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
      return cached.buffer;
    }

    const profile = await this.prisma.profile.findUnique({
      where: { slug },
      select: {
        displayName: true,
        bio: true,
        tagline: true,
        photoUrl: true,
        photoData: true,
        buttonColor: true,
        isPublished: true,
      },
    });

    if (!profile || !profile.isPublished) return null;

    const accentColor = profile.buttonColor || '#00E4F2';
    const displayName = this.escSvg(profile.displayName || 'CraftCard');
    const bio = this.escSvg((profile.tagline || profile.bio || '').slice(0, 120));
    const url = this.escSvg(`${this.frontendUrl}/${slug}`);

    // Try to fetch and embed the profile photo
    let photoBase64 = '';
    try {
      const photoBuffer = await this.fetchPhoto(profile);
      if (photoBuffer) {
        const resized = await sharp(photoBuffer)
          .resize(140, 140, { fit: 'cover' })
          .png()
          .toBuffer();
        photoBase64 = `data:image/png;base64,${resized.toString('base64')}`;
      }
    } catch {
      // No photo — skip
    }

    const photoSvg = photoBase64
      ? `
        <defs>
          <clipPath id="circle">
            <circle cx="600" cy="220" r="70" />
          </clipPath>
        </defs>
        <image href="${photoBase64}" x="530" y="150" width="140" height="140" clip-path="url(#circle)" />
        <circle cx="600" cy="220" r="70" fill="none" stroke="${accentColor}" stroke-width="3" />
      `
      : '';

    const nameY = photoBase64 ? 340 : 260;
    const bioY = nameY + 50;
    const urlY = OG_HEIGHT - 50;

    const svg = `
      <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1A1A2E;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#16213E;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:${accentColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#D12BF2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bg)" />
        <rect x="0" y="0" width="${OG_WIDTH}" height="4" fill="url(#accent)" />
        <rect x="0" y="${OG_HEIGHT - 4}" width="${OG_WIDTH}" height="4" fill="url(#accent)" />

        ${photoSvg}

        <text x="600" y="${nameY}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="42" fill="white">${displayName}</text>
        <text x="600" y="${bioY}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="22" fill="rgba(255,255,255,0.7)">${bio}</text>

        <text x="600" y="${urlY}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="400" font-size="16" fill="${accentColor}">${url}</text>

        <text x="${OG_WIDTH - 40}" y="40" text-anchor="end" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="18" fill="rgba(255,255,255,0.3)">CraftCard</text>
      </svg>
    `;

    const buffer = await sharp(Buffer.from(svg))
      .resize(OG_WIDTH, OG_HEIGHT)
      .png({ quality: 85 })
      .toBuffer();

    // Cache result
    this.cache.set(slug, { buffer, createdAt: Date.now() });

    // Evict old cache entries periodically (keep max 200)
    if (this.cache.size > 200) {
      const oldest = [...this.cache.entries()]
        .sort((a, b) => a[1].createdAt - b[1].createdAt)
        .slice(0, this.cache.size - 100);
      for (const [key] of oldest) {
        this.cache.delete(key);
      }
    }

    return buffer;
  }

  /** Invalidate cached OG image when profile is updated */
  invalidateCache(slug: string) {
    this.cache.delete(slug);
  }

  private async fetchPhoto(profile: { photoUrl: string | null; photoData: string | null }): Promise<Buffer | null> {
    // Try base64 data first (legacy)
    if (profile.photoData) {
      const match = profile.photoData.match(/^data:[^;]+;base64,(.+)$/);
      if (match) return Buffer.from(match[1], 'base64');
    }

    // Fetch from URL
    if (!profile.photoUrl) return null;
    let url = profile.photoUrl;
    if (!url.startsWith('http')) {
      const backendUrl = this.configService.get('BACKEND_URL', { infer: true }) || '';
      url = backendUrl + url;
    }

    return new Promise<Buffer | null>((resolve) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { timeout: 5000 }, (res) => {
        if (res.statusCode !== 200) { resolve(null); return; }
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
        res.on('error', () => resolve(null));
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    });
  }

  private escSvg(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
