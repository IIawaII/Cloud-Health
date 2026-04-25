const fs = require('fs');
const path = require('path');

const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');
let content = fs.readFileSync(wranglerPath, 'utf-8');

function replacePlaceholder(placeholder, value) {
  if (!value) {
    console.warn(`Warning: ${placeholder} is not set, leaving placeholder in wrangler.toml`);
    return;
  }
  // 使用正则全局替换，避免 value 中的特殊字符被当作正则解析
  const escaped = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escaped, 'g');
  content = content.replace(regex, value);
}

replacePlaceholder('KV_AUTH_TOKENS_ID', process.env.KV_AUTH_TOKENS_ID);
replacePlaceholder('KV_VERIFICATION_CODES_ID', process.env.KV_VERIFICATION_CODES_ID);
replacePlaceholder('D1_DATABASE_ID', process.env.D1_DATABASE_ID);

// 处理 vars 段
const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY;
function addVarLine(key, value) {
  if (!value) return;
  if (!content.match(/^\[vars\]\s*$/m)) {
    content += '\n[vars]\n';
  }
  content = content.replace(new RegExp(`^${key}\\s*=.*\\n?`, 'gm'), '');
  content = content.replace(/^(\[vars\]\s*)\n?/m, `$1\n${key} = "${value}"\n`);
}

addVarLine('TURNSTILE_SITE_KEY', turnstileSiteKey);

fs.writeFileSync(wranglerPath, content);
console.log('wrangler.toml updated successfully.');
