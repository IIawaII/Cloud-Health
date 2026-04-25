const fs = require('fs');
const path = require('path');

const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
const outputPath = path.join(__dirname, '..', 'src', 'spa-fallback-html.ts');

if (!fs.existsSync(distIndexPath)) {
  console.warn('Warning: dist/index.html not found. Skipping spa-fallback-html update.');
  process.exit(0);
}

const html = fs.readFileSync(distIndexPath, 'utf-8');

// Escape template literals and backslashes for TypeScript string
const escaped = html
  .replace(/\\/g, '\\\\')
  .replace(/`/g, '\\`')
  .replace(/\\\$/g, '\\$');

const tsContent = `export const FALLBACK_HTML = \`${escaped}\`\n`;

const existing = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf-8') : '';
if (existing === tsContent) {
  console.log('src/spa-fallback-html.ts is up to date, skipping write.');
  process.exit(0);
}

fs.writeFileSync(outputPath, tsContent);
console.log('src/spa-fallback-html.ts updated with latest dist/index.html content.');
