// Publish gate for the founder's name (2026-11-01, M5MB-123): the site calls him Mohan.
// Fails (exit 1) on "Raj" anywhere in site text or build scripts, except inside the full name
// "Mohan Raj Dhanapal", and on URL-encoded "%20Raj" (WhatsApp prefills).
// Exit 0 means a clean tree. Exit 2 means the root is missing or holds no files (fail closed).
//
// Usage: node scripts/check-name.mjs [--root <dir>]
import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const argRoot = process.argv.indexOf('--root');
const root = path.resolve(argRoot > -1 && process.argv[argRoot + 1] ? process.argv[argRoot + 1] : path.join(here, '..'));
const SKIP = new Set(['.git', 'node_modules', 'fixtures']);
const EXT = new Set(['.html', '.mjs', '.js', '.json', '.xml', '.txt', '.svg', '.webmanifest', '.vtt']);
const SELF = fileURLToPath(import.meta.url);
const NAME = /(?<!Mohan )\bRaj\b(?! Dhanapal)|%20Raj/g;

function collect(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) { if (!SKIP.has(name)) collect(full, out); }
    else if (EXT.has(path.extname(name)) && full !== SELF) out.push(full);
  }
}

if (!existsSync(root)) { console.error(`check-name: root not found: ${root}`); process.exit(2); }
const files = [];
collect(root, files);
if (!files.length) { console.error('check-name: no files to scan'); process.exit(2); }
let hits = 0;
for (const full of files) {
  readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(NAME)) {
      hits++;
      console.error(`${path.relative(root, full)}:${i + 1}:${m.index + 1}: …${line.slice(Math.max(0, m.index - 40), m.index + 40)}…`);
    }
  });
}
if (hits) { console.error(`check-name: ${hits} hit(s); use "Mohan" (full name "Mohan Raj Dhanapal" is fine)`); process.exit(1); }
console.log(`check-name: ok (${files.length} files scanned)`);
