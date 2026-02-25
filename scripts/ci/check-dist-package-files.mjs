import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPackagePath = path.join(__dirname, '../../dist/package.json');

const allowedFolders = new Set(['bin', 'src', 'public']);
const forbiddenFolders = new Set(['app', 'config', 'routes', 'packages']);

if (!fs.existsSync(distPackagePath)) {
  console.error('❌ dist/package.json not found. Run npm run -s core:build:dist first.');
  process.exit(1);
}

const distPackage = JSON.parse(fs.readFileSync(distPackagePath, 'utf8'));
const files = Array.isArray(distPackage.files) ? distPackage.files : [];

const invalidEntries = files.filter((entry) => !allowedFolders.has(entry));
const forbiddenEntries = files.filter((entry) => forbiddenFolders.has(entry));

if (invalidEntries.length > 0 || forbiddenEntries.length > 0) {
  console.error('❌ dist/package.json has invalid publish folders in files[]');
  console.error(`   Allowed: ${Array.from(allowedFolders).join(', ')}`);
  console.error(`   Found:   ${files.join(', ') || '(empty)'}`);
  if (forbiddenEntries.length > 0) {
    console.error(`   Forbidden present: ${forbiddenEntries.join(', ')}`);
  }
  process.exit(1);
}

console.log('✅ dist/package.json files[] contains only allowed npm folders (bin, src, public)');
