import SftpClient from 'ssh2-sftp-client';
import path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../frontend/dist');

// Read SFTP credentials from backend/.env
const envFile = readFileSync(path.resolve(__dirname, '../backend/.env'), 'utf-8');
const env = Object.fromEntries(
  envFile.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const [key, ...rest] = l.split('=');
    return [key.trim(), rest.join('=').trim()];
  }),
);

const SFTP_HOST = env.SFTP_HOST || '147.93.37.67';
const SFTP_PORT = parseInt(env.SFTP_PORT || '65002');
const SFTP_USER = env.SFTP_USER || 'u984096926';
const SFTP_PASSWORD = env.SFTP_PASSWORD;
const REMOTE_DIR = './domains/craftcardgenz.com/public_html';

async function deploy() {
  if (!SFTP_PASSWORD) {
    console.error('SFTP_PASSWORD not found in backend/.env');
    process.exit(1);
  }

  const sftp = new SftpClient();

  try {
    console.log(`Connecting to ${SFTP_HOST}:${SFTP_PORT}...`);
    await sftp.connect({ host: SFTP_HOST, port: SFTP_PORT, username: SFTP_USER, password: SFTP_PASSWORD });
    console.log('Connected!');

    // Clean old assets
    const assetsDir = `${REMOTE_DIR}/assets`;
    const assetsExist = await sftp.exists(assetsDir);
    if (assetsExist) {
      console.log('Removing old assets...');
      await sftp.rmdir(assetsDir, true);
    }

    // Upload dist
    console.log(`Uploading ${distDir} → ${REMOTE_DIR}...`);
    await sftp.uploadDir(distDir, REMOTE_DIR);

    console.log('\nDeploy complete!');
    console.log('Site: https://craftcardgenz.com');
  } catch (err) {
    console.error('Deploy failed:', err.message);
    process.exit(1);
  } finally {
    await sftp.end();
  }
}

deploy();
