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
  const client = new Client();
  client.ftp.verbose = false;

  try {
    console.log('Connecting to FTP...');
    await client.access({
      host: env.FTP_HOST,
      user: env.FTP_USER,
      password: env.FTP_PASSWORD,
      secure: false,
    });

    // FTP user root = domain dir, upload to / (which is public_html for the web server)
    await client.cd('/');
    console.log('Connected! Uploading frontend to root...');

    await client.uploadFromDir(distDir);

    console.log('\nDeploy complete!');
    console.log('Site: https://azure-eagle-617866.hostingersite.com');
  } catch (err) {
    console.error('Deploy failed:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
