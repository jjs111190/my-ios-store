import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const configPath = path.join(rootDir, 'apps.config.json');
const outputPath = path.join(rootDir, 'apps.json');

function generateSource() {
  console.log('🚀 Starting SideStore source generation...');

  if (!fs.existsSync(configPath)) {
    console.error(`❌ Error: Configuration file not found at ${configPath}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash if exists

  const sourceData = {
    name: config.name || 'Private App Store',
    identifier: config.identifier || 'com.private.store',
    sourceURL: `${baseURL}/apps.json`,
    subtitle: config.subtitle || 'Private Sideload Repository',
    description: config.description || 'Self-hosted private iOS app store',
    iconURL: `${baseURL}/icons/default.png`,
    tintColor: '#007AFF', // Premium Apple Blue
    apps: []
  };

  for (const app of config.apps) {
    const ipaPath = path.join(rootDir, app.ipa);
    
    // Check if IPA exists
    if (!fs.existsSync(ipaPath)) {
      console.warn(`⚠️ Warning: IPA file not found for ${app.name} at "${app.ipa}". Excluding from source.`);
      continue;
    }

    const stats = fs.statSync(ipaPath);
    if (stats.size === 0) {
      console.warn(`⚠️ Warning: IPA file for ${app.name} is empty at "${app.ipa}". Excluding from source.`);
      continue;
    }

    // Determine icon
    let resolvedIcon = app.icon;
    const iconPath = path.join(rootDir, app.icon);
    if (!fs.existsSync(iconPath) || fs.statSync(iconPath).size === 0) {
      console.warn(`⚠️ Warning: Icon file not found for ${app.name} at "${app.icon}". Falling back to default.`);
      resolvedIcon = 'icons/default.png';
    }

    // Get file size in bytes
    const fileSize = stats.size;

    // Date formatting (YYYY-MM-DD)
    const releaseDate = new Date().toISOString().split('T')[0];

    const appEntry = {
      name: app.name,
      bundleIdentifier: app.bundleIdentifier,
      developerName: app.developerName || config.developerName || 'Unknown Developer',
      subtitle: app.subtitle || 'Private App',
      localizedDescription: app.description || 'No description provided.',
      iconURL: `${baseURL}/${resolvedIcon}`,
      versions: [
        {
          version: app.version || '1.0.0',
          buildVersion: app.buildVersion || '1',
          date: releaseDate,
          downloadURL: `${baseURL}/${app.ipa}`,
          localizedDescription: app.description || 'Initial release.',
          size: fileSize
        }
      ]
    };

    sourceData.apps.push(appEntry);
  }

  fs.writeFileSync(outputPath, JSON.stringify(sourceData, null, 2), 'utf-8');
  console.log(`✅ Success! Generated SideStore source at "${outputPath}"`);
  console.log(`📡 Base URL: ${baseURL}`);
  console.log(`📱 Included ${sourceData.apps.length} of ${config.apps.length} apps.`);
}

generateSource();
