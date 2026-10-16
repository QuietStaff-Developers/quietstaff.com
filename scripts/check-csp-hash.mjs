// Guard: the inline theme-bootstrap script on every page must hash to CSP_HASH.
// Why: GitHub Pages cannot send headers, so the product page carries its CSP in a
// <meta> tag and allows the theme script by sha256. One changed character in that
// script silently breaks the CSP. Run in the publish gate (08-15, 08-21).
// Usage: node scripts/check-csp-hash.mjs [--root <dir>]
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const CSP_HASH = "nDw54IVKwdEJKWR5Vbudg0V/xQITKJWrkkd0j9AsGtE=";
const SKIP = new Set(['.git', 'node_modules']);
const argRoot = process.argv.indexOf('--root');
const root = path.resolve(argRoot > -1 && process.argv[argRoot + 1]
  ? process.argv[argRoot + 1]
  : path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));

function walk(dir, out = []) {
  for (const e of readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, e.name);
    const rel = path.relative(root, full).split(path.sep).join('/');
    if (e.isDirectory()) {
      if (SKIP.has(e.name) || rel === 'scripts/fixtures') continue;
      walk(full, out);
    } else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

function themeScript(html) {
  for (const m of html.matchAll(/<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (m[2].includes('quietstaff-theme')) return m[2];
  }
  return null;
}

const findings = [];
const files = walk(root);
for (const file of files) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const html = readFileSync(file, 'utf8');
  const body = themeScript(html);
  const csp = html.match(/<meta\s+http-equiv="Content-Security-Policy"\s+content="([^"]*)"/i);
  if (body !== null) {
    const h = createHash('sha256').update(body, 'utf8').digest('base64');
    if (h !== CSP_HASH) findings.push(`${rel}: theme script hash ${h} differs from CSP hash ${CSP_HASH}`);
  }
  if (csp && !csp[1].includes(`'sha256-${CSP_HASH}'`)) {
    findings.push(`${rel}: meta CSP does not include 'sha256-${CSP_HASH}'`);
  }
  if (rel === 'quietdesk/index.html') {
    if (!csp) findings.push(`${rel}: no meta Content-Security-Policy`);
    if (body === null) findings.push(`${rel}: no inline theme script`);
  }
}

if (findings.length) {
  for (const f of findings) console.error(f);
  process.exit(1);
}
console.log(`OK: ${files.length} pages checked`);
