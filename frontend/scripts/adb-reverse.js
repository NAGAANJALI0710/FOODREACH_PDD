const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const localAppData = process.env.LOCALAPPDATA || '';
const defaultAdbPath = path.join(localAppData, 'Android', 'Sdk', 'platform-tools', 'adb.exe');

let adbCmd = 'adb';
if (localAppData && fs.existsSync(defaultAdbPath)) {
  adbCmd = `"${defaultAdbPath}"`;
}

try {
  console.log(`Executing ADB reverse setup using: ${adbCmd}`);
  execSync(`${adbCmd} reverse tcp:5000 tcp:5000`, { stdio: 'inherit' });
  execSync(`${adbCmd} reverse tcp:8081 tcp:8081`, { stdio: 'inherit' });
  console.log('✅ ADB Reverse configured: tcp:5000 -> tcp:5000 and tcp:8081 -> tcp:8081.');
} catch (err) {
  console.error('⚠️  Failed to run adb reverse:', err.message);
  process.exit(1);
}
