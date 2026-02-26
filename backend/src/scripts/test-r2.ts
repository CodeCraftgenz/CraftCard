/**
 * Quick R2 connectivity test — run with: npx ts-node src/scripts/test-r2.ts
 */
import 'dotenv/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID!;
const bucket = process.env.R2_BUCKET_NAME!;
const publicUrl = process.env.R2_PUBLIC_URL!.replace(/\/$/, '');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

async function main() {
  const key = 'test/connectivity-check.txt';
  const body = `CraftCard R2 test — ${new Date().toISOString()}`;

  console.log('1. Uploading test file...');
  await s3.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'text/plain',
  }));
  console.log(`   OK — uploaded to ${key}`);

  const url = `${publicUrl}/${key}`;
  console.log(`2. Public URL: ${url}`);
  console.log('   Fetching...');

  const res = await fetch(url);
  if (res.ok) {
    const text = await res.text();
    console.log(`   OK — status ${res.status}, content: "${text}"`);
  } else {
    console.log(`   WARN — status ${res.status} (public access may not be enabled yet)`);
  }

  console.log('3. Deleting test file...');
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  console.log('   OK — deleted');

  console.log('\nR2 connection test PASSED!');
}

main().catch((err) => {
  console.error('R2 test FAILED:', err.message || err);
  process.exit(1);
});
