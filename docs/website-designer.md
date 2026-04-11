# QuietStaff Website Designer — Skill & Reference

> **Purpose:** A self-contained guide for any AI assistant (Claude Code, Claude.ai, Cursor, etc.) to pick up the role of "website designer & engineer" for `quietstaff.com` and continue the work consistently.
>
> **How to use this doc in a new session:** paste this entire file into the first message of a new AI chat, or open it in Claude Code — it will be auto-loaded via the project memory pointer.

---

## 1. Project at a Glance

- **Site:** `https://quietstaff.com`
- **Repo:** `github.com/quietstaff/quietstaff.com` — `main` branch deploys automatically
- **Hosting:** GitHub Pages
- **DNS / edge:** Cloudflare → GitHub Pages (HTTPS auto)
- **Deploy latency:** a `git push origin main` goes live in about 60 seconds (Fastly cache)
- **Local working directory:** `/Users/molab/Documents/Users/molab/Documents/Claude/Projects/QS-OIA Incubation/quietstaff.com-1/`

### What QuietStaff is
A managed **AI Agent Team service** for business operations — specifically targeting Indian SMBs. Custom-trained AI agents handle WhatsApp, email, sales, invoicing, scheduling, document processing, etc. Every agent is fine-tuned to a business through an internal engine called the **Skills Engine** (internal codename: **OpenClaw** — do NOT expose "OpenClaw" on the public site). The Skills Engine is the actual core product; the agents are the user-visible surface.

### Brand essentials
- **Brand name:** QuietStaff (one word, capital Q and S)
- **Hero tagline (product):** *"AI Agents as Skilled Staff"*
- **Brand tagline (footer/ops):** *"AI, Quietly Running Your Operations"*
- **Agent naming convention:** `Quiet[Role]` — `QuietMind` (orchestrator), `QuietGate` (routing/classification), `QuietSell` (sales), `QuietBooks` (invoicing/finance), `QuietCare` (support), `QuietWatch` (monitoring). When inventing new agents, follow this pattern.
- **Voice:** calm, confident, operational — not hypey. Think "enterprise-grade, quietly competent".
- **Audience:** Indian SMB decision-makers (founders, ops leads) plus global enterprise. Must feel credible to both.

### Contact surfaces
- Primary inbox: `contact@quietstaff.com`
- Telegram bot CTA: `https://t.me/kira_quietstaff_bot` (named "Kira")
- Form handler: `https://formsubmit.co/contact@quietstaff.com` (inside the contact modal)

---

## 2. Technical Stack

### Build model: zero-build, single file
- **No build step.** No bundler, no npm install, no CI. Just HTML + inline CSS + inline JS.
- **Tailwind CSS via CDN** is loaded but most styles are **hand-written CSS** inside a `<style>` block. Tailwind is a convenience fallback; do not introduce a Tailwind config or PostCSS.
- **Google Fonts:** Inter (400/500/600/700/800) and JetBrains Mono (400/600). Already preconnected + linked in `<head>`.
- **Favicons:** inline SVG favicon only (`brand/logo-package/svg/quietstaff-favicon.svg`). Avoid referencing PNG favicons that don't exist on disk (this was a past bug).

### Repository layout
```
quietstaff.com-1/
├── index.html               # Homepage, ~3000+ lines, single source of truth
├── founder/
│   └── index.html           # /founder/ subpage (folder-based URL)
├── assets/
│   └── images/
│       ├── hero-accent.webp     # 100 KB, homepage hero background accent
│       ├── tech-texture.webp    # 29 KB, How It Works section background
│       └── og-image.jpg         # 1200×630 social share preview
├── brand/
│   └── logo-package/
│       └── svg/
│           └── quietstaff-favicon.svg
├── docs/
│   └── website-designer.md  # ← this file
└── .DS_Store                # ignore
```

### Deploy process (manual, explicit)
```bash
git add <files>
git commit -m "Descriptive message"
git push origin main
# ~60s later it's live at https://quietstaff.com
```
No CI checks, no preview environments, no staging. **Never push without previewing locally first.**

### Local preview
```bash
cd "/Users/molab/Documents/Users/molab/Documents/Claude/Projects/QS-OIA Incubation/quietstaff.com-1"
python3 -m http.server 8000
```
Then open `http://localhost:8000/` (homepage) and `http://localhost:8000/founder/` (founder page). **Do not use `file://` — relative links like `/founder/` won't resolve.**

---

## 3. Design System

### Colors — CSS custom properties with dark + light themes

All colors flow through CSS variables. Both pages define them in a `:root, [data-theme="dark"]` block and an overriding `[data-theme="light"]` block.

**Dark mode (default):**
```css
--bg-primary: #030710;      /* near-black, primary body bg */
--bg-secondary: #0f172a;    /* slate-900, footer / modal bg */
--bg-card: rgba(15, 23, 42, 0.6);  /* semi-transparent card */
--border-card: rgba(99, 102, 241, 0.12);
--text-primary: #f1f5f9;    /* near-white */
--text-secondary: #94a3b8;  /* slate-400 */
--text-muted: #64748b;      /* slate-500 */
--accent-primary: #6366f1;  /* indigo-500 */
--accent-secondary: #22d3ee; /* cyan-400 */
--accent-tertiary: #7c3aed; /* violet-600 */
--aws-orange: #FF9900;      /* AWS brand color (tech section) */
--error-red: #ef4444;
--gradient-accent: linear-gradient(135deg, #6366f1, #7c3aed, #22d3ee);
```

**Light mode:**
```css
--bg-primary: #ffffff;
--bg-secondary: #f8fafc;
--bg-card: rgba(255, 255, 255, 0.78);
--border-card: rgba(99, 102, 241, 0.18);
--text-primary: #0f172a;
--text-secondary: #475569;
--text-muted: #64748b;
--accent-secondary: #0891b2; /* darker cyan for contrast on white */
/* --accent-primary stays #6366f1; --accent-tertiary stays #7c3aed */
```

**Surface-specific variables** (nav bg, modal overlay, form input, mobile nav overlay, hero glow, highlight chips, particle colors, logo gradient stops) are also themed. Read the top of the `<style>` block on each page for the full list.

**Rule:** never use hardcoded `rgba(3, 7, 16, ...)` or `rgba(15, 23, 42, ...)` inline — route them through a theme variable. This is how light mode became possible.

### Typography
- **Body:** `'Inter', sans-serif` @ 400/500/600/700/800
- **Monospace (code snippets, stat numbers):** `'JetBrains Mono', monospace`
- **Scale:**
  - `h1`: `clamp(2.5rem, 8vw, 4.5rem)`, weight 800, letter-spacing -0.03em
  - `h2` (sections): 2.5rem, weight 800, letter-spacing -0.02em
  - `h2` (inside `.capability-card`): 1.125rem — **this is critical**; hero cards need an explicit override or titles word-wrap (past bug)
  - `h3`: 1.5rem, weight 700
  - `h4`: 1.125rem, weight 600
  - Body: 1rem, line-height 1.6

### Spacing & layout
- Section vertical padding: `120px 0` desktop, `80px` at 768px, `60px` at 480px
- Container: `max-width: 1280px; padding: 0 1.5rem;` → `1rem` at 480 → `0.75rem` at 375
- Cards use `border-radius: 1rem` or `1.5rem`, subtle `backdrop-filter: blur(16px)` on dark-card surfaces

### Gradient language
The site relies heavily on **two gradient motifs:**
1. **The "accent" gradient:** `linear-gradient(135deg, #6366f1, #7c3aed, #22d3ee)` — used on CTA buttons, gradient text (`text-gradient` class), and the CTA section background
2. **The logo gradient stops** (different hues): `#818CF8 → #3B82F6 → #06B6D4` on dark / `#4338CA → #1D4ED8 → #0E7490` on light

Do not invent a third gradient. Match the existing ones when adding new accents.

### Iconography
- All icons are **inline SVG** with `stroke="currentColor"`, `fill="none"` where applicable, and 24×24 viewBox. This lets them inherit `color` from the parent.
- Never add an icon font or external SVG file — keep everything inline so the page is single-file and has zero extra HTTP requests.

---

## 4. Theme Architecture (dark / light toggle)

### How it works
1. **`data-theme="dark|light"` attribute on `<html>`**
2. **Early inline script** runs at the top of `<head>` before paint, reading `localStorage.quietstaff-theme` and setting the attribute immediately. This prevents a flash of the wrong theme.
3. **CSS variables** in `:root, [data-theme="dark"]` and `[data-theme="light"]` blocks define everything themeable.
4. **Theme toggle button** in the nav: a 44×44 button with a sun icon (light mode) and moon icon (dark mode), toggled via CSS display rules.
5. **Toggle handler** sets the attribute, writes to localStorage, refreshes the hero canvas particle colors via `canvas._refreshTheme()`, and updates the `<meta name="theme-color">` tag so mobile browser chrome follows the theme.

### Pattern reference (for new pages)
When creating a new page or section that needs theming:
- Reference `var(--bg-primary)`, `var(--text-primary)`, etc. — never hardcode
- Use the existing variables before defining new ones
- If you do define a new variable, define it in BOTH theme blocks on both pages

### Gotchas
- **SVG presentation attributes with inline `var()` do NOT work reliably across browsers.** When theming SVG gradient stops or fills, use a CSS **class** on the element and set the property in a CSS rule:
  ```html
  <stop offset="0%" stop-color="#818CF8" class="logo-stop-0"/>
  ```
  ```css
  .logo-stop-0 { stop-color: var(--logo-grad-0); }
  ```
  Keep the inline hex as a pre-CSS fallback.
- **Dark-mode images with heavy overlays look out of place in light mode.** The two background accent images are intentionally hidden in light mode via `[data-theme="light"] .section-bg { display: none; }`.

---

## 5. Logo System (critical — don't break again)

The logo is a **hand-drawn inline SVG** containing:
- A wireframe hexagonal "orb" (left) with glow filters + connecting lines
- "Quiet" (gradient fill, light weight)
- "Staff" (solid theme-color fill, bold)
- A small tagline: "Multi-model AGaaS · Managed AI Ops"

**Both `index.html` and `founder/index.html` must use the IDENTICAL logo SVG** — same `viewBox="0 0 320 64"`, same paths, same filter IDs (`fg`, `fs`, `ft`), same gradient IDs (`gi`, `gw`). A past bug shipped a simpler disc+hole design on the founder page that didn't match the homepage brand mark. Do not re-introduce that.

### Theming the logo
- `.logo-staff-text` → `fill: var(--text-primary)` (dark text on light, light text on dark)
- `.logo-tagline-text` → `fill: var(--text-muted)`
- `.logo-stop-0/1/2` → `stop-color: var(--logo-grad-0/1/2)` (applied to each `<stop>` in both `gi` and `gw` gradients)

### Dark-mode logo gradient stops
```css
--logo-grad-0: #818CF8;  /* indigo-400 */
--logo-grad-1: #3B82F6;  /* blue-500   */
--logo-grad-2: #06B6D4;  /* cyan-500   */
```

### Light-mode logo gradient stops (Tailwind -700 variants for contrast on white)
```css
--logo-grad-0: #4338CA;  /* indigo-700 */
--logo-grad-1: #1D4ED8;  /* blue-700   */
--logo-grad-2: #0E7490;  /* cyan-700   */
```

### Logo QA rule
**Whenever you touch brand colors, theme variables, or add a new theme, explicitly verify the logo in BOTH modes on BOTH pages.** Grep the SVG for every `fill=`, `stroke=`, `stop-color=` with hex/named colors and confirm each is theme-aware.

---

## 6. Responsive Breakpoints

### Breakpoints in use
- `@media (max-width: 1024px)` — grids collapse 3→2 or 4→2 cols; nav stays desktop
- `@media (max-width: 768px)` — hamburger menu appears; `.nav-center` hidden; hero stacks; most grids collapse to 1 col
- `@media (max-width: 767px)` — strict "phones only" used to hide decorative background images (`.section-bg`). Note the 767 vs 768 distinction: iPad portrait at 768 should see the images.
- `@media (max-width: 480px)` — fine-tune for small phones; some cards collapse further
- `@media (max-width: 375px)` — very small phones (iPhone SE gen 1); tighter padding + smaller logo

### Critical mobile fixes that must stay in place
- **Theme toggle must be visible on mobile.** It lives inside `.nav-right`. Do NOT hide `.nav-right` entirely on mobile — hide only `.nav-right .nav-button` (the desktop Request Demo button). The theme toggle must remain clickable at every viewport.
- **Logo SVG height scales down on mobile** to prevent nav overflow:
  - Desktop: `height: 56`
  - ≤768px: `height: 44` (index.html and founder page)
  - ≤480px (founder page): `height: 32`
  - ≤375px (index.html): `height: 38`
- **Touch targets ≥ 44×44**: hamburger, theme toggle, CTA buttons — enforce explicit sizes at mobile breakpoints
- **Hero cards** (`.capability-card h2`) must have an explicit `font-size: 1.125rem` — without this, the global `h2 { font-size: 2.5rem }` inherits and card titles word-stack (one word per line). This was a real bug that shipped once.
- **Hero buttons** stack vertically with `width: 100%; max-width: 300px` on mobile
- **Modal fits 320px** viewports via `width: 95%; padding: 1.5rem` at ≤375px
- **Founder page "← Back to Home" button** uses a dual `<span>` pattern — `.label-desktop` shows "← Back to Home", `.label-mobile` shows "← Home". CSS swaps them at the 768 breakpoint.

### Responsive QA rule (always apply)
For every change, walk through viewports **320 / 375 / 768 / 1024 / 1280** explicitly. List what happens at each width. Fix any overflow, word-stacking, or cramped nav before asking for git push.

---

## 7. Hero Particle Canvas

Both pages have a `<canvas id="hero-canvas">` with ~60 animated indigo/cyan particles connected by faint lines. Implementation lives at the bottom of each file in a `<script>` block.

### Key behaviors
- Canvas resizes on window resize
- Pauses animation on `document.visibilitychange` (battery savings)
- **Theme-aware particle colors** read from CSS variables `--particle-color-a`, `--particle-color-b`, `--particle-line`, `--particle-line-opacity`
- Exposes `canvas._refreshTheme()` so the theme toggle can re-read colors immediately without waiting for natural repaint

### Light-mode tuning
Dark mode uses brighter particle colors; light mode uses slightly darker + more opaque values so they remain visible on white. The same indigo base color works for both.

---

## 8. Background Images (subtle accents)

Two decorative background images exist **only on the homepage** (`index.html`):

1. **`assets/images/hero-accent.webp`** — hero section background (Adi Goldstein, Unsplash)
2. **`assets/images/tech-texture.webp`** — How It Works section background

### Rules that MUST be preserved
- Always WebP, always `< 100 KB` per image (current: 99 KB + 29 KB)
- Always **92% dark overlay** (`rgba(3, 7, 16, 0.92)`) via `.section-bg::after` so text remains fully readable
- Always `loading="lazy"` and `decoding="async"`
- Always explicit `width=` and `height=` attributes to prevent CLS
- Always `display: none` **on phones** (`@media max-width: 767px`) to save mobile data
- Always `display: none` **in light mode** (`[data-theme="light"] .section-bg`) — the dark overlay panels look out of place on a white layout; users who pick light mode get a clean plain layout
- Never add more than these two background images
- Never use an external URL — always serve from `assets/images/` to avoid third-party dependencies

### Social share preview (OG image)
- `assets/images/og-image.jpg` is a 1200×630 JPEG (~202 KB) used in Open Graph + Twitter card meta tags
- Referenced from both `index.html` and `founder/index.html` `<meta>` tags
- Only fetched by social crawlers, never loaded on the live page

---

## 9. Founder Page (`/founder/`)

### Purpose
Standalone biography page at `https://quietstaff.com/founder/` — used in email signatures, blog posts, speaker bios, LinkedIn posts for the QuietStaff brand (not personal).

### Privacy constraint (HARD RULE)
**The founder page must not contain anything that uniquely fingerprints the founder's LinkedIn identity.** Specifically **NEVER add**:
- Full surname (the founder's surname starts with D — do not add it). Use first name only, currently "Raj".
- `linkedin.com` URLs of any kind
- "IIM" or "Indian Institute of Management"
- "Harvard"
- "EIMT" / "European Institute of Management and Technology"
- Specific certifications (AWS Certified Solutions Architect, PMP, ITIL V3, ITIL V4, Apache Airflow) — the COMBINATION fingerprints the identity
- "15+ years AWS" or any number that can be cross-referenced. Unify any experience mention into the single phrase **"21 years"** (in tech / on cloud platforms / etc.)
- Specific city names (Bengaluru, etc.)
- Sector list from LinkedIn (fintech, healthcare tech, energy analytics, real estate tech, digital marketing)
- Specific tenure years (e.g., "5 years at X")
- "500+ Professional Network" phrasing
- Regional footprints like "NAM · APAC · EMEA" or "US · UK · India"
- JSON-LD Person schema or `sameAs` pointing to LinkedIn

### What IS allowed
- First name only (currently "Raj")
- Title: "Founder & CEO, QuietStaff" (primary) + "Chief AI Architect" (secondary line)
- Generic experience: "21 years building technology operations" / "21 years on cloud platforms and AWS"
- "Doctoral researcher in Business Administration" (generic phrasing, no institution, no dates, no "pursuing")
- Generic skill chips: Generative AI & Agentic Systems, Multi-Agent Architecture, AI Strategy & Governance, Cloud-Native Platform Engineering, Distributed Engineering Leadership, Enterprise Operations at Scale, Product Support Engineering, Technical Programme Delivery
- Multi-model AI passion narrative
- The "30-Day Promise" marketing block
- "Talk to Kira" CTA (Telegram bot) + `contact@quietstaff.com`

### Page structure (locked — do not reorder without cause)
1. Hero (badge + "Meet Raj" + dual title pill + tagline, with particle canvas behind)
2. Background (3-paragraph story, generic)
3. At a Glance (4 highlight cards: Experience / Platform / Research / Focus)
4. Point of View (pull-quote card with large `"` glyph)
5. What Raj Brings to QuietStaff (8 focus chips)
6. Why Multi-Model
7. What QuietStaff Does
8. 30-Day Promise (highlighted callout)
9. CTA (Talk to Kira button + email line + Back to Home)

### Navigation label consistency
Any change to the founder's displayed title must be reflected in **all** nav/footer labels and button text on BOTH pages. Previously a change introduced "Founder & CEO" on the founder page but left the homepage nav as just "Founder" — the user caught this. Always grep the whole site for "Founder" / "CEO" after a title change.

---

## 10. SEO & Social Sharing

### Current setup (keep these)
- `<title>`, `<meta name="description">`, `<meta name="keywords">` on both pages
- `<link rel="canonical">` on both pages
- Open Graph: `og:type`, `og:url`, `og:title`, `og:description`, `og:image` (1200×630 JPEG), `og:image:width/height/alt`, `og:locale`, `og:site_name`
- Twitter Card: `twitter:card=summary_large_image`, title, description, image, image:alt
- `robots: index, follow, max-image-preview:large, max-snippet:-1`
- JSON-LD `Organization` schema on homepage (no `founder` or `sameAs` — privacy constraint)
- Founder page uses `og:type=profile`

### Image SEO
- All decorative background images have empty `alt=""` and `aria-hidden="true"` wrappers
- Background images DO NOT need content alt text because they are wrappers without semantic meaning

### Validate social previews with
- Twitter: https://cards-dev.twitter.com/validator
- Facebook: https://developers.facebook.com/tools/debug/
- LinkedIn: https://www.linkedin.com/post-inspector/

---

## 11. Accessibility (WCAG 2.1 AA target)

- **Skip link** at top of `<body>` (visually hidden until focused): `a.skip-link` jumps to `#main-content`
- **Focus states** use `outline: 2px solid var(--accent-secondary); outline-offset: 2px;`
- **Touch targets ≥ 44×44px** on mobile for all interactive elements (hamburger, theme toggle, CTA buttons)
- **Form labels** are explicitly associated with inputs via `for=`
- **Reduced motion** media query disables animations for users who prefer it (`@media (prefers-reduced-motion: reduce)`)
- **Semantic landmarks**: `<nav role="navigation">`, `<main id="main-content">`, `<footer role="contentinfo">`
- **`aria-hidden="true"`** on purely decorative SVG wrappers (background images, flow dots)
- **Inline SVG icons** use `aria-hidden="true"` when next to visible text, or an `aria-label` when standalone

---

## 12. Performance Budget

- **No build step** means no tree-shaking, so keep inline CSS/JS disciplined
- **Tailwind CDN** is loaded but most styles are hand-written — the CDN is a safety net, not a primary stylesheet
- **Google Fonts** preconnect to `fonts.googleapis.com` + `fonts.gstatic.com`
- **Images:** WebP only, `< 100 KB` each on desktop, **hidden on phones entirely** via `display: none`
- **CLS (Cumulative Layout Shift):** explicit `width=`/`height=` on every `<img>`
- **LCP (Largest Contentful Paint):** the hero headline is the LCP candidate — keep the hero canvas + background image out of the critical path via `loading="lazy"`
- **Page weight target:** homepage should be under ~350 KB on desktop, under ~120 KB on mobile (no background images, no hero accent)
- **Never add:** build tools, npm packages, external analytics scripts, third-party trackers, chat widgets from vendors, image hotlinks

---

## 13. Standing QA Rules (never skip these before a push)

These are saved from past bugs. Every change must pass all of them before `git push`:

### Rule 1 — Mobile + Tablet responsive check
Walk through `320 / 375 / 768 / 1024 / 1280` explicitly. List what happens at each width. Fix overflow, word-stacking, touch-target issues, cramped nav.

### Rule 2 — Nav/footer label audit on title changes
When updating a founder/CEO title or role, grep the whole site (`index.html` + `founder/index.html`) for related labels. Fix every stale one before declaring QA done.

### Rule 3 — Logo theme verification
When touching brand colors, theme variables, or adding a mode, audit the logo SVG explicitly:
- Every `fill=`, `stroke=`, `stop-color=` in both pages
- Confirm each color is either theme-aware (CSS variable via class) or works visually in both themes
- Mentally render the logo on both `--bg-primary` dark and light — does it look consistent?

### Rule 4 — Privacy constraint on founder page
Before shipping any founder page content change, grep for the banned terms (surname, IIM, Harvard, EIMT, PMP, ITIL, Airflow, Bengaluru, exact tenure years, "15+ years AWS", sector list) and confirm NONE are present.

### Rule 5 — Git commit hygiene
- Never `git push` without explicit user approval, even if the change looks safe
- Never `git add -A` or `git add .` — always add specific files by name
- Never amend a commit that was pushed
- Commit messages describe the **why**, 1–2 sentences, present tense, no trailing period in subject

### Rule 6 — Preview locally before pushing
Run `python3 -m http.server 8000` and view both pages. Toggle dark/light. Resize browser narrow. Look at the logo. Only after visual confirmation, ask for push approval.

---

## 14. Known Gotchas (things I've hit before)

1. **`.capability-card h2` inherits the global 2.5rem h2 size** → must have an explicit 1.125rem override or titles word-stack on desktop
2. **Inline `var()` in SVG presentation attributes is unreliable** — always use a CSS class to apply `fill` / `stop-color` via `var()` in a CSS rule
3. **`.hero::before` is an empty pseudo element** in the hero section — it's unused but not removable without checking z-index stacks; leave it alone
4. **PNG favicon references** for `brand/logo-package/png/...` don't exist on disk and should not be added back without actual files
5. **The `.nav-right` container used to be hidden on mobile** — this accidentally hid the theme toggle. The fix is to hide only `.nav-right .nav-button`, not the whole container.
6. **Founder page has no hamburger menu** because there are no in-page sections to jump to. Mobile users rely on the "← Home" button to get back to the main site. Don't add a hamburger unless the page grows in-page nav.
7. **The particle canvas on founder page** uses `canvas.parentElement.getBoundingClientRect()` for sizing (not `window.innerWidth/innerHeight`) because the hero is a bounded section, not full viewport. Match this pattern if adding canvases to other bounded sections.
8. **Meta `color-scheme`** is set to `"dark light"` — do NOT hardcode `"dark"` only, or browsers skip user's system-theme detection for form controls and scrollbars.
9. **Do not add `srcset` on the background images** — they're under a 92% dark overlay, extra resolution is invisible, just wastes bytes.
10. **Fastly cache is ~60 seconds** — if a push seems to not show up immediately, wait one minute and hard-refresh (⌘+Shift+R).

---

## 15. How to pick up a task (workflow)

When the user asks for a change:

1. **Read the relevant file first.** Never propose edits to code you haven't read in the current session.
2. **Plan before editing.** For non-trivial changes, write a 5–10 bullet plan and confirm it matches the user's intent.
3. **Make the edits.** Use targeted `Edit` calls with precise `old_string` → `new_string`.
4. **Run all four QA rules** (responsive, label audit, logo theme, privacy constraint) against the change.
5. **Present the QA report** to the user with a clear list of what was verified.
6. **Wait for explicit push approval** before running `git add` / `commit` / `push`. The user will say "push" or "go ahead and push it". Do not assume.
7. **Commit with a descriptive message** (1–2 sentences, describes the why).
8. **Push to `main`** — site goes live in ~60 seconds.
9. **Tell the user the commit SHA and verification URLs.**

### Never do (in this project)
- Push without explicit approval
- `git reset --hard`, `git push --force`, `--no-verify`, or any destructive git operation without user saying "yes do that specific thing"
- Hotlink external images
- Add npm/build tools
- Add third-party trackers or analytics scripts
- Re-introduce any banned privacy term on the founder page
- Make the founder page logo different from the homepage logo
- Hardcode `rgba(3, 7, 16, ...)` colors inline — always use theme variables

---

## 16. Quick reference — where things live

| What | File | Search for |
|---|---|---|
| Hero section | `index.html` | `<section class="hero">` |
| Particle canvas JS | `index.html` | `createHeroCanvas` |
| How It Works | `index.html` | `id="how"` |
| Skills Engine marketing | `index.html` | `id="platform"` |
| Agents list | `index.html` | `id="agents"` |
| Tech / AWS section | `index.html` | `id="technology"` |
| Founder teaser | `index.html` | `id="founder"` |
| CTA section | `index.html` | `id="cta"` |
| Contact modal | `index.html` | `id="contactModal"` |
| Theme toggle button | `index.html` + `founder/index.html` | `id="themeToggle"` |
| Theme toggle JS | `index.html` + `founder/index.html` | `setupThemeToggle` |
| Logo SVG | `index.html` + `founder/index.html` | `<div class="nav-logo">` |
| CSS theme variables | `index.html` + `founder/index.html` | `[data-theme="dark"]`, `[data-theme="light"]` |
| Mobile breakpoints | Both | `@media (max-width: 768px)`, `480px`, `375px`, `767px`, `1024px` |
| Homepage logo gradients | `index.html` | `id="gi"` and `id="gw"` |
| Founder page logo gradients | `founder/index.html` | `id="gi"` and `id="gw"` (same IDs — unified) |
| Background images | `index.html` | `class="section-bg"` |
| Founder page structure | `founder/index.html` | `class="content-card"`, `class="pull-quote-card"`, `class="promise-card"` |

---

## 17. First-time prompt (paste this into a fresh AI chat)

> I'm the owner of `quietstaff.com`. The site is a single-file HTML project (see `docs/website-designer.md` in the repo) — dark theme with optional light mode, inline SVG logo, particle hero, hand-written CSS using theme variables, deployed via GitHub Pages + Cloudflare. Read the full `docs/website-designer.md` before proposing any changes. **Never push without my explicit approval, and always run the four QA rules (responsive / label audit / logo theme / privacy) before asking to push.**
>
> My request: [describe what you want done]

---

**Last updated:** 2026-04-11
**Maintained by:** whoever is holding the keyboard, guided by this doc.
