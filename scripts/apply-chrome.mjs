// Syncs the shared chrome from index.html into every other page (site redesign 2026-11-01).
//   header  <header class="site-header">…</header>   (skipped on partners/delivery/, which keeps
//           its page-only nav, M5MB-109; aria-current is set per page)
//   footer  <footer class="site-footer">…</footer>
//   head    the font preload <link> and the one.css / one.js cache-busting versions
// Exact-anchor string replacement only: the inline theme-bootstrap script and everything else
// stay byte-identical (scripts/check-csp-hash.mjs guards the hash). Idempotent: a second run
// changes 0 files. partners/index.html is a redirect stub with no chrome and is skipped.
//
// Usage: node scripts/apply-chrome.mjs [--check]
//   --check writes nothing and exits 1 if any file would change.
import {readFileSync, writeFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts', '_includes']);
const SKIP_FILES = new Set(['partners/index.html']);
const PAGE_ONLY_NAV = new Set(['partners/delivery/index.html']);
const CURRENT = [
  ['quietdesk/', 'href="/quietdesk/"'],
  ['consulting/', 'href="/consulting/"'],
  ['partners/', 'href="/partners/delivery/"'],
  ['founder/', 'href="/founder/"'],
];

function slice(html, open, close, rel) {
  const a = html.indexOf(open);
  if (a === -1) throw new Error(`${rel}: ${open} not found`);
  const b = html.indexOf(close, a);
  if (b === -1) throw new Error(`${rel}: ${close} not found`);
  return [a, b + close.length];
}
function attr(html, re, rel, what) {
  const m = html.match(re);
  if (!m) throw new Error(`${rel}: ${what} not found`);
  return m[0];
}

export function loadSource() {
  const html = readFileSync(path.join(root, 'index.html'), 'utf8');
  const [h0, h1] = slice(html, '<header class="site-header">', '</header>', 'index.html');
  const [f0, f1] = slice(html, '<footer class="site-footer">', '</footer>', 'index.html');
  return {
    header: html.slice(h0, h1),
    footer: html.slice(f0, f1),
    preload: attr(html, /<link rel="preload" href="\/assets\/fonts\/[^"]+" as="font" type="font\/woff2" crossorigin>/, 'index.html', 'font preload'),
    fontsCss: attr(html, /<link rel="stylesheet" href="\/assets\/css\/fonts\.css[^"]*">/, 'index.html', 'fonts.css link'),
    oneCss: attr(html, /<link rel="stylesheet" href="\/assets\/css\/one\.css[^"]*">/, 'index.html', 'one.css link'),
    oneJs: attr(html, /<script src="\/assets\/js\/one\.js[^"]*" defer><\/script>/, 'index.html', 'one.js script'),
  };
}

/** Returns the page html with the shared chrome applied. Throws if an anchor is missing. */
export function transform(html, rel, src) {
  let out = html;
  if (!PAGE_ONLY_NAV.has(rel)) {
    const [a, b] = slice(out, '<header class="site-header">', '</header>', rel);
    let header = src.header;
    for (const [prefix, href] of CURRENT) {
      if (rel.startsWith(prefix)) header = header.replace(`<a ${href}>`, `<a ${href} aria-current="page">`);
    }
    out = out.slice(0, a) + header + out.slice(b);
  }
  const [a, b] = slice(out, '<footer class="site-footer">', '</footer>', rel);
  out = out.slice(0, a) + src.footer + out.slice(b);
  out = out.replace(/<link rel="preload" href="\/assets\/fonts\/[^"]+" as="font" type="font\/woff2" crossorigin>/, src.preload)
    .replace(/<link rel="stylesheet" href="\/assets\/css\/fonts\.css[^"]*">/, src.fontsCss)
    .replace(/<link rel="stylesheet" href="\/assets\/css\/one\.css[^"]*">/, src.oneCss)
    .replace(/<script src="\/assets\/js\/one\.js[^"]*" defer><\/script>/, src.oneJs);
  return out;
}

function collect(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = path.relative(root, full).split(path.sep).join('/');
    if (statSync(full).isDirectory()) { if (!SKIP_DIRS.has(name)) collect(full, out); }
    else if (name === 'index.html' || (name === '404.html' && dir === root)) {
      if (rel !== 'index.html' && !SKIP_FILES.has(rel)) out.push(rel);
    }
  }
}

function main(argv) {
  const check = argv.includes('--check');
  const src = loadSource();
  const files = [];
  collect(root, files);
  files.sort();
  const changed = [];
  try {
    for (const rel of files) {
      const full = path.join(root, rel);
      const before = readFileSync(full, 'utf8');
      const after = transform(before, rel, src);
      if (after !== before) { changed.push(rel); if (!check) writeFileSync(full, after); }
    }
  } catch (err) {
    console.error('apply-chrome: ' + err.message);
    return 1;
  }
  for (const rel of changed) console.log((check ? 'would change ' : 'changed ') + rel);
  console.log(`${check ? 'would change' : 'changed'} ${changed.length} files (of ${files.length})`);
  return check && changed.length ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.argv.slice(2));
}
