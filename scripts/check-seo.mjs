// SEO gate for every indexable page (site redesign 2026-11-01, seo-requirements.md):
//   title 30–60 chars · meta description 70–160 · exactly one <h1> · absolute canonical
//   JSON-LD parses · og:title / og:description / og:url / og:image present
//   sitemap.xml lists exactly the indexable pages (no noindex, not 404.html).
// Usage: node scripts/check-seo.mjs [--root <dir>]   exit 1 on any finding.
import {readFileSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const argRoot = process.argv.indexOf('--root');
const root = path.resolve(argRoot > -1 && process.argv[argRoot + 1] ? process.argv[argRoot + 1] : path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const SKIP_DIRS = new Set(['.git', 'node_modules', 'scripts', '_includes']);
const SITE = 'https://quietstaff.co.uk/';

function collect(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) { if (!SKIP_DIRS.has(name)) collect(full, out); }
    else if (name.endsWith('.html')) out.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return out;
}
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const meta = (html, re) => { const m = html.match(re); return m ? decode(m[1]) : null; };

const findings = [];
const indexable = [];
for (const rel of collect(root).sort()) {
  const html = readFileSync(path.join(root, rel), 'utf8');
  if (rel === '404.html' || /<meta name="robots" content="[^"]*noindex/i.test(html)) continue;
  const url = SITE + rel.replace(/index\.html$/, '');
  indexable.push(url);
  const f = msg => findings.push(`${rel}: ${msg}`);
  const title = meta(html, /<title>([^<]*)<\/title>/);
  if (!title) f('no <title>'); else if (title.length < 30 || title.length > 60) f(`title is ${title.length} chars (want 30–60): ${title}`);
  const desc = meta(html, /<meta name="description" content="([^"]*)"/);
  if (!desc) f('no meta description'); else if (desc.length < 70 || desc.length > 160) f(`description is ${desc.length} chars (want 70–160)`);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) f(`${h1} <h1> elements (want exactly 1)`);
  const canonical = meta(html, /<link rel="canonical" href="([^"]*)"/);
  if (!canonical) f('no canonical'); else if (!canonical.startsWith(SITE)) f(`canonical is not absolute: ${canonical}`); else if (canonical !== url) f(`canonical ${canonical} differs from path ${url}`);
  for (const p of ['og:title', 'og:description', 'og:url', 'og:image']) {
    const v = meta(html, new RegExp(`<meta property="${p}" content="([^"]*)"`));
    if (!v) f(`missing ${p}`);
    else if (p === 'og:url' && v !== url) f(`og:url ${v} differs from ${url}`);
    else if (p === 'og:title' && v !== title) f('og:title differs from <title>');
  }
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { f(`JSON-LD does not parse: ${e.message}`); }
  }
  if (!/<script type="application\/ld\+json">/.test(html)) f('no JSON-LD');
}
let sitemap;
try { sitemap = readFileSync(path.join(root, 'sitemap.xml'), 'utf8'); } catch { findings.push('sitemap.xml missing'); }
if (sitemap) {
  const listed = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map(m => m[1]);
  for (const u of indexable) if (!listed.includes(u)) findings.push(`sitemap.xml: missing ${u}`);
  for (const u of listed) if (!indexable.includes(u)) findings.push(`sitemap.xml: lists ${u}, which is not an indexable page`);
  const dup = listed.filter((u, i) => listed.indexOf(u) !== i);
  for (const u of new Set(dup)) findings.push(`sitemap.xml: duplicate ${u}`);
}
if (findings.length) {
  for (const x of findings) console.error(x);
  console.error(`check-seo: FAIL, ${findings.length} finding(s) across ${indexable.length} indexable pages`);
  process.exit(1);
}
console.log(`check-seo: ok (${indexable.length} indexable pages, sitemap matches)`);
