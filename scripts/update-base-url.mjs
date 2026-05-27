import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const configPath = path.join(rootDir, 'apps.config.json');
const htmlPath = path.join(rootDir, 'index.html');

function updateBaseURL() {
  const newURL = process.argv[2];

  if (!newURL) {
    console.error('❌ Error: No URL provided.');
    console.error('Usage: npm run update-url <your-cloudflare-tunnel-url>');
    console.error('Example: npm run update-url https://my-store.trycloudflare.com');
    process.exit(1);
  }

  // Normalize URL (remove trailing slash)
  const normalizedURL = newURL.trim().replace(/\/$/, '');

  console.log(`🔄 Updating baseURL to: ${normalizedURL}`);

  // 1. Update apps.config.json
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Error: ${configPath} not found.`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const oldURL = config.baseURL;
  config.baseURL = normalizedURL;
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log('✅ Updated apps.config.json');

  // 2. Update index.html
  if (!fs.existsSync(htmlPath)) {
    console.error(`❌ Error: ${htmlPath} not found.`);
    process.exit(1);
  }

  let htmlContent = fs.readFileSync(htmlPath, 'utf-8');
  // Match both single quotes, double quotes, and template literals
  const baseUrlRegex = /const BASE_URL\s*=\s*["'`][^"'`]*["'`]/;
  
  if (baseUrlRegex.test(htmlContent)) {
    htmlContent = htmlContent.replace(baseUrlRegex, `const BASE_URL = "${normalizedURL}"`);
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    console.log('✅ Updated index.html base URL');
  } else {
    console.warn('⚠️ Warning: "const BASE_URL" declaration not found in index.html. Skipping HTML update.');
  }

  // 3. Regenerate apps.json
  console.log('🔄 Regenerating apps.json with new URL...');
  try {
    execSync(`"${process.execPath}" scripts/generate-source.mjs`, { stdio: 'inherit', cwd: rootDir });
  } catch (error) {
    console.error('❌ Error regenerating apps.json:', error.message);
    process.exit(1);
  }

  console.log('\n🎉 URL update and source regeneration complete!');
  console.log(`🌐 Base Store Link: ${normalizedURL}/`);
  console.log(`🔌 SideStore Add Source Link: sidestore://source?url=${normalizedURL}/apps.json`);
}

updateBaseURL();
