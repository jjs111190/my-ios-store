import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const configPath = path.join(rootDir, 'apps.config.json');

function packageApp() {
  const appPath = process.argv[2];
  const targetAppName = process.argv[3]; // e.g. "SnapMoment", "RecordFlow", "NeoMini", "Cutory", "Aura"

  if (!appPath || !targetAppName) {
    console.error('❌ Error: Missing arguments.');
    console.error('Usage: node scripts/package-app.mjs <path-to-dot-app> <App-Name-In-Config>');
    console.error('Example: node scripts/package-app.mjs ./build/Build/Products/Release-iphoneos/App.app SnapMoment');
    process.exit(1);
  }

  const resolvedAppPath = path.resolve(appPath);
  if (!fs.existsSync(resolvedAppPath) || !fs.statSync(resolvedAppPath).isDirectory()) {
    console.error(`❌ Error: Provided app path does not exist or is not a directory: ${resolvedAppPath}`);
    process.exit(1);
  }

  console.log(`📦 Packaging application "${targetAppName}" from:`);
  console.log(`   ${resolvedAppPath}`);

  // 1. Read Info.plist using macOS built-in plutil tool
  const plistPath = path.join(resolvedAppPath, 'Info.plist');
  if (!fs.existsSync(plistPath)) {
    console.error('❌ Error: Info.plist not found in the app bundle.');
    process.exit(1);
  }

  console.log('📄 Extracting metadata from Info.plist...');
  const tempJsonPlistPath = path.join(rootDir, 'temp_plist.json');
  try {
    execSync(`plutil -convert json -o "${tempJsonPlistPath}" "${plistPath}"`);
  } catch (error) {
    console.error('❌ Error: Failed to parse Info.plist using plutil.', error.message);
    process.exit(1);
  }

  const plistData = JSON.parse(fs.readFileSync(tempJsonPlistPath, 'utf-8'));
  // Clean up temp plist file
  if (fs.existsSync(tempJsonPlistPath)) {
    fs.unlinkSync(tempJsonPlistPath);
  }

  const bundleIdentifier = plistData.CFBundleIdentifier;
  const version = plistData.CFBundleShortVersionString || '1.0.0';
  const buildVersion = plistData.CFBundleVersion || '1';
  const displayName = plistData.CFBundleDisplayName || plistData.CFBundleName || targetAppName;

  console.log(`✅ Extracted Metadata:`);
  console.log(`   - Display Name: ${displayName}`);
  console.log(`   - Bundle ID: ${bundleIdentifier}`);
  console.log(`   - Version: ${version}`);
  console.log(`   - Build: ${buildVersion}`);

  // 2. Locate App Icon in the bundle
  console.log('🖼️ Locating App Icon...');
  let appIconSourcePath = null;
  const filesInBundle = fs.readdirSync(resolvedAppPath);
  
  // Search for standard iOS icon files
  const appIconCandidates = filesInBundle.filter(file => 
    file.toLowerCase().includes('icon') && file.toLowerCase().endsWith('.png')
  );

  if (appIconCandidates.length > 0) {
    // Sort to get the highest resolution possible
    appIconCandidates.sort((a, b) => {
      const matchA = a.match(/(\d+)x(\d+)/);
      const matchB = b.match(/(\d+)x(\d+)/);
      if (matchA && matchB) {
        return parseInt(matchB[1]) - parseInt(matchA[1]);
      }
      return b.length - a.length;
    });

    appIconSourcePath = path.join(resolvedAppPath, appIconCandidates[0]);
    console.log(`✅ Selected icon candidate: ${appIconCandidates[0]}`);
  }

  // 3. Create IPA package
  console.log('⚡ Compiling .ipa package...');
  const tempPayloadDir = path.join(rootDir, 'Payload');
  
  // Clean existing payload dir
  if (fs.existsSync(tempPayloadDir)) {
    fs.rmSync(tempPayloadDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempPayloadDir);

  const targetAppDest = path.join(tempPayloadDir, path.basename(resolvedAppPath));
  
  console.log('   Copying bundle to Payload directory...');
  execSync(`cp -R "${resolvedAppPath}" "${tempPayloadDir}/"`);

  const ipaFileName = `${targetAppName}.ipa`;
  const ipaDestPath = path.join(rootDir, 'ipas', ipaFileName);

  console.log(`   Creating zip archive: ${ipaFileName}...`);
  if (fs.existsSync(ipaDestPath)) {
    fs.unlinkSync(ipaDestPath);
  }

  try {
    execSync(`zip -r "${ipaDestPath}" Payload`, { cwd: rootDir });
    console.log(`✅ IPA file created successfully at: ${ipaDestPath}`);
  } catch (error) {
    console.error('❌ Error zipping payload:', error.message);
    process.exit(1);
  } finally {
    // Clean payload
    fs.rmSync(tempPayloadDir, { recursive: true, force: true });
  }

  // 4. Update apps.config.json dynamically
  console.log('📝 Updating apps.config.json...');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  
  // Find or insert the app config
  let appConfig = config.apps.find(app => app.name.toLowerCase() === targetAppName.toLowerCase());
  
  const iconRelativePath = `icons/${targetAppName.toLowerCase()}.png`;

  if (!appConfig) {
    console.log(`   Adding new app configuration for "${targetAppName}"`);
    appConfig = {
      name: targetAppName,
      bundleIdentifier: bundleIdentifier,
      ipa: `ipas/${ipaFileName}`,
      icon: iconRelativePath,
      version: version,
      buildVersion: buildVersion,
      subtitle: `${targetAppName} Sideload App`,
      description: `Self-built private app: ${targetAppName}`
    };
    config.apps.push(appConfig);
  } else {
    console.log(`   Updating existing app configuration for "${targetAppName}"`);
    appConfig.bundleIdentifier = bundleIdentifier;
    appConfig.ipa = `ipas/${ipaFileName}`;
    appConfig.icon = iconRelativePath;
    appConfig.version = version;
    appConfig.buildVersion = buildVersion;
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log('✅ Configuration saved.');

  // 5. Copy extracted icon
  if (appIconSourcePath) {
    const iconDestPath = path.join(rootDir, 'icons', `${targetAppName.toLowerCase()}.png`);
    console.log(`🎨 Copying app icon to: ${iconDestPath}`);
    fs.copyFileSync(appIconSourcePath, iconDestPath);
    console.log('✅ Icon copied.');
  } else {
    console.log('⚠️ No custom app icon found in the app bundle. Using default icon.');
  }

  // 6. Regenerate apps.json and index.html
  console.log('🔄 Regenerating repository source...');
  try {
    execSync('npm run generate', { stdio: 'inherit', cwd: rootDir });
    console.log('\n🎉 Sideload App integration complete!');
  } catch (error) {
    console.error('❌ Error regenerating store manifest:', error.message);
  }
}

packageApp();
