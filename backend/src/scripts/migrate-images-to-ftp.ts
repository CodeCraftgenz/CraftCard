/**
 * Migration script: Move base64 images from MySQL to FTP storage.
 *
 * Run manually ONCE after deploying the schema migration:
 *   npx ts-node -r tsconfig-paths/register src/scripts/migrate-images-to-ftp.ts
 *
 * What it does:
 * 1. Reads profiles with photoData / coverPhotoData
 * 2. Uploads each to FTP as WebP
 * 3. Updates the profile with the new URL and clears the base64 data
 * 4. Same for gallery images (imageData → imageUrl)
 * 5. Same for resumes (resumeData → resumeUrl on FTP)
 *
 * Safe to re-run: skips records that already have FTP URLs.
 */

import { PrismaClient } from '@prisma/client';
import { Client } from 'basic-ftp';
import { Readable } from 'stream';
import { v4 as uuid } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const FTP_HOST = process.env.FTP_HOST!;
const FTP_USER = process.env.FTP_USER!;
const FTP_PASSWORD = process.env.FTP_PASSWORD!;
const FTP_BASE_PATH = process.env.FTP_BASE_PATH || '/public_html/uploads';
const PUBLIC_URL = process.env.UPLOADS_PUBLIC_URL!;

let uploadCount = 0;
let skipCount = 0;
let errorCount = 0;

async function uploadToFtp(buffer: Buffer, folder: string, id: string, ext: string): Promise<string> {
  const fileName = `${uuid()}.${ext}`;
  const remotePath = `${FTP_BASE_PATH}/${folder}/${id}/${fileName}`;
  const publicUrl = `${PUBLIC_URL}/${folder}/${id}/${fileName}`;

  const client = new Client();
  try {
    await client.access({ host: FTP_HOST, user: FTP_USER, password: FTP_PASSWORD, secure: false });
    await client.ensureDir(`${FTP_BASE_PATH}/${folder}/${id}`);
    await client.uploadFrom(Readable.from(buffer), remotePath);
    uploadCount++;
    return publicUrl;
  } finally {
    client.close();
  }
}

async function migratePhotos() {
  console.log('\n--- Migrating profile photos ---');
  const profiles = await prisma.profile.findMany({
    where: { photoData: { not: null } },
    select: { id: true, userId: true, photoUrl: true, photoData: true },
  });

  for (const p of profiles) {
    // Skip if already has FTP URL
    if (p.photoUrl?.startsWith('http')) {
      skipCount++;
      continue;
    }
    try {
      const buffer = Buffer.from(p.photoData!, 'base64');
      const url = await uploadToFtp(buffer, 'photos', p.userId, 'webp');
      await prisma.profile.update({
        where: { id: p.id },
        data: { photoUrl: url, photoData: null },
      });
      console.log(`  [OK] Photo for profile ${p.id}`);
    } catch (err) {
      console.error(`  [ERR] Photo for profile ${p.id}:`, (err as Error).message);
      errorCount++;
    }
  }
  console.log(`  Photos done: ${profiles.length} found, ${uploadCount} uploaded`);
}

async function migrateCovers() {
  console.log('\n--- Migrating cover photos ---');
  const beforeCount = uploadCount;
  const profiles = await prisma.profile.findMany({
    where: { coverPhotoData: { not: null } },
    select: { id: true, userId: true, coverPhotoUrl: true, coverPhotoData: true },
  });

  for (const p of profiles) {
    if (p.coverPhotoUrl?.startsWith('http')) {
      skipCount++;
      continue;
    }
    try {
      const buffer = Buffer.from(p.coverPhotoData!, 'base64');
      const url = await uploadToFtp(buffer, 'covers', p.userId, 'webp');
      await prisma.profile.update({
        where: { id: p.id },
        data: { coverPhotoUrl: url, coverPhotoData: null },
      });
      console.log(`  [OK] Cover for profile ${p.id}`);
    } catch (err) {
      console.error(`  [ERR] Cover for profile ${p.id}:`, (err as Error).message);
      errorCount++;
    }
  }
  console.log(`  Covers done: ${profiles.length} found, ${uploadCount - beforeCount} uploaded`);
}

async function migrateGallery() {
  console.log('\n--- Migrating gallery images ---');
  const beforeCount = uploadCount;
  const images = await prisma.galleryImage.findMany({
    where: { imageData: { not: null }, imageUrl: null },
    select: { id: true, profileId: true, imageData: true, imageUrl: true },
  });

  for (const img of images) {
    if (img.imageUrl) {
      skipCount++;
      continue;
    }
    try {
      const buffer = Buffer.from(img.imageData!, 'base64');
      const url = await uploadToFtp(buffer, 'gallery', img.profileId, 'webp');
      await prisma.galleryImage.update({
        where: { id: img.id },
        data: { imageUrl: url, imageData: null },
      });
      console.log(`  [OK] Gallery image ${img.id}`);
    } catch (err) {
      console.error(`  [ERR] Gallery image ${img.id}:`, (err as Error).message);
      errorCount++;
    }
  }
  console.log(`  Gallery done: ${images.length} found, ${uploadCount - beforeCount} uploaded`);
}

async function migrateResumes() {
  console.log('\n--- Migrating resumes ---');
  const beforeCount = uploadCount;
  const profiles = await prisma.profile.findMany({
    where: { resumeData: { not: null } },
    select: { id: true, slug: true, resumeUrl: true, resumeData: true },
  });

  for (const p of profiles) {
    // Skip if already FTP URL
    if (p.resumeUrl?.startsWith('http')) {
      skipCount++;
      continue;
    }
    try {
      const buffer = Buffer.from(p.resumeData!, 'base64');
      const url = await uploadToFtp(buffer, 'resumes', p.slug, 'pdf');
      await prisma.profile.update({
        where: { id: p.id },
        data: { resumeUrl: url, resumeData: null },
      });
      console.log(`  [OK] Resume for profile ${p.id} (${p.slug})`);
    } catch (err) {
      console.error(`  [ERR] Resume for profile ${p.id}:`, (err as Error).message);
      errorCount++;
    }
  }
  console.log(`  Resumes done: ${profiles.length} found, ${uploadCount - beforeCount} uploaded`);
}

async function main() {
  console.log('=== CraftCard Image Migration: Base64 → FTP ===');
  console.log(`FTP Host: ${FTP_HOST}`);
  console.log(`Public URL: ${PUBLIC_URL}`);
  console.log(`Base Path: ${FTP_BASE_PATH}`);

  await migratePhotos();
  await migrateCovers();
  await migrateGallery();
  await migrateResumes();

  console.log('\n=== Migration Complete ===');
  console.log(`  Uploaded: ${uploadCount}`);
  console.log(`  Skipped:  ${skipCount}`);
  console.log(`  Errors:   ${errorCount}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  prisma.$disconnect();
  process.exit(1);
});
