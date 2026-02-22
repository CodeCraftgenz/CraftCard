import { Client } from 'basic-ftp';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../frontend/dist');

// Read FTP credentials from backend/.env
const envFile = readFileSync(path.resolve(__dirname, '../backend/.env'), 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const [key, ...rest] = l.split('=');
    return [key.trim(), rest.join('=').trim()];
  }),
);

async function deploy() {
  const client = new Client(30000);
  client.ftp.verbose = false;

  try {
    console.log('Connecting to FTP...');
    await client.access({
      host: env.FTP_HOST,
      user: env.FTP_USER,
      password: env.FTP_PASSWORD,
      secure: false,
    });
    client.trackProgress((info) => {
      if (info.bytesOverall > 0) {
        process.stdout.write(`\r  Uploaded ${(info.bytesOverall / 1024).toFixed(0)} KB`);
      }
    });

    // Upload to public_html (Hostinger document root)
    await client.cd('/public_html');
    console.log('Connected! Cleaning old assets...');
    try { await client.removeDir('assets'); } catch { /* may not exist */ }
    console.log('Uploading frontend to /public_html/...');

    await client.uploadFromDir(distDir);

    console.log('\nDeploy complete!');
    console.log('Site: https://craftcardgenz.com');
  } catch (err) {
    console.error('Deploy failed:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
