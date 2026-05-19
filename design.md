# Heztio — Design System

> **Hard rule.** Every page, section, component, or asset produced for this
> project **must** follow the design system defined in this document. It is the
> single source of truth, derived from the official **Heztio Brandbook 2026** via
> the Claude Design handoff bundle. No off-brand colors, fonts, or ad-hoc tokens.
> If something here is ambiguous, ask before improvising.

---

## This project — `website/`

`website/` is the **marketing / landing static site** (heztio.com) — sales,
pricing, features, sign-up. Unlike the product apps, this surface is allowed to
run the full brand spectrum:

1. **Daily UI mode** — light, navy text on `--hz-paper`, generous whitespace.
   The default for content sections, pricing tables, forms.
2. **Hero / brand mode** — *dark*: the navy → pink gradient with a **subtle film
   grain** overlay, the white wordmark center-staged. For the top hero, section
   dividers, the footer, deck-style banners.
3. **Pink mode** — full pink (`#f086a8`) surfaces with the H-mark tiled as a
   faint navy pattern. Reserved for campaign moments, stickers, the app-icon
   plate. Use sparingly.

**Layout:** centered max-width **`1200px`**, generous vertical rhythm, page
gutters `64–96px`. Sticky nav may use glass blur (`backdrop-filter: blur(16px)`
over `rgba(255,255,255,0.7)` on light, `rgba(1,46,84,0.6)` on dark).

### Integrating the tokens

The canonical tokens already ship at the project root:

```
colors_and_type.css      ← design tokens (CSS custom properties + @font-face)
fonts/*.otf              ← Causten family (licensed, Thin→Black + obliques)
```

Link it in every HTML page, in `<head>`:

```html
<link rel="stylesheet" href="colors_and_type.css">
```

Then build **only** with the `--hz-*` / `--fg-*` / `--bg-*` / `--space-*` /
`--radius-*` / `--shadow-*` tokens and the `.hz-*` typography classes. The file
also provides `.hz-pattern` / `.hz-pattern--pink` (H-mark tile) and
`.hz-text-gradient` (gradient-clipped text). Never hard-code a hex that already
exists as a token.

> This site is the most on-brand surface in the workspace and should stay that
> way. `colors_and_type.css` here is the canonical full version (all Causten
> weights + obliques) — keep it identical to the copies in the other repos.

---

## Brand essence

- **Promise:** make property management simple.
- **Primary tagline:** `Gestiónalo simple.` — the word **`SIMPLE`** is always set
  in heavy Montserrat (`.hz-tag`).
- **Secondary slogan:** `Haz que pase.` — campaign-grade, stickers, social.
- **Personality:** calm, capable, modern, trustworthy — a fintech, not a
  real-estate brochure. **Anti-personality:** loud, gimmicky, "luxury",
  emoji-heavy.
- **Brand pillars**, always in this order: **CONECTA · GESTIONA · OPTIMIZA** —
  use as eyebrow patterns over feature blocks, section anchors, sticker copy.
  Never break the order.
- **Default language: Colombian Spanish**, `usted` register for marketing copy.

---

## Color

The whole system is **two navies + one pink**, on a cool slate neutral scale.

| Role | Token | Hex | Use |
|---|---|---|---|
| Navy 1 (deep) | `--hz-navy-deep` / `--hz-navy-900` | `#001830` | dark sections, gradient sweep |
| **Navy 2 (★ primary)** | `--hz-navy` / `--hz-navy-800` | `#012e54` | headings, body, primary buttons |
| **Pink (★ accent)** | `--hz-pink` / `--hz-pink-500` | `#f086a8` | accent, pink-mode surfaces, focus ring |
| White | `--hz-white` | `#FFFFFF` | |

Navy scale `--hz-navy-500 … 900`, pink scale `--hz-pink-50 … 900`, neutrals
`--hz-slate-50 … 900`. Semantic roles: `--fg-1 … --fg-4`, `--fg-on-brand`,
`--bg-1 … --bg-4`, `--border-1/-2`, `--border-focus`. Semantic palette
`--hz-success/warning/danger/info-*` — **danger is a deeper pink `#D14868`**,
**info re-uses navy-600**.

**Gradient** — `--hz-gradient-brand` (navy → pink linear, 105°) and
`--hz-gradient-sweep` (radial variant for hero copy). This is where the gradient
**belongs**: hero/brand-mode sections only. Always pair it with the subtle film
grain (1024px noise PNG at 8–12% opacity, or the inline SVG noise filter).
`.hz-text-gradient` clips the gradient to text. **Soft pink wash**
`--hz-gradient-pink` for stickers / badges.

---

## Typography

| Role | Family | Token | Notes |
|---|---|---|---|
| **Primaria (★)** | **Causten** | `--font-primary` | the wordmark font; `fonts/*.otf`, wired via `@font-face` |
| Secundaria | **Montserrat** | `--font-secondary` | eyebrows, the `SIMPLE` chip, sticker copy — heavy 700/800/900 |
| Mono | JetBrains Mono | `--font-mono` | prices, plan codes |

Classes: `.hz-display-1` / `.hz-display-2` (uppercase hero copy) · `.hz-h1 …
.hz-h4` · `.hz-eyebrow` (Montserrat, tracked, uppercase — the pillar/eyebrow
treatment) · `.hz-body-lg/-/-sm` · `.hz-caption` · `.hz-tag` (the `SIMPLE`
chip). Type scale `--text-xs … --text-7xl` (12 → 84px). Display headlines may use
ALL CAPS; never set paragraphs in caps.

---

## Spacing, radii, elevation, motion

- **Spacing** — 4pt base, `--space-1 … --space-20`. Marketing gutters are
  generous: `64–96px`.
- **Radii** — cards `--radius-md`/`--radius-lg`, buttons 8–10px, chips & avatars
  `--radius-pill`. The mark is geometric — don't over-round.
- **Shadows** — `--shadow-xs … --shadow-xl`, soft, navy-tinted. Border *or*
  shadow, rarely both.
- **Focus** — always a visible **pink halo** `--shadow-focus`. Never strip it.
- **Motion** — default `--dur-base` (180ms) `--ease-out`; fast `--dur-fast`
  (120ms). **No bounces, no spring overshoot.** Page/section transitions: fade +
  8px upward slide.

---

## Visual signatures

- **H-mark pattern** — `.hz-pattern` (white-on-navy, 6% opacity) /
  `.hz-pattern--pink` (navy-on-pink, ~16%). Tiled ~110px. Background texture on
  hero / pink-mode / app-icon plates. **Never under body copy.**
- **Sticker pills** — `CONECTA / GESTIONA / OPTIMIZA` and `HAZ QUE PASE` as
  rotated, layered pills in alternating navy/pink. For campaign sections, social.
- **Imagery** — architectural: clean exteriors of modern Latin-American apartment
  buildings, plant-filled common areas, cropped tight, graded slightly **cool**.
  **No** generic stock apartments, **no** AI cityscapes, **no** purple-blue
  tech-bro gradients, **no** warm-orange grading.

---

## Components

- **Button** — `primary` (navy), `secondary` (white + `border-1`), `ghost`,
  `gradient` (brand gradient — fine for the marketing CTA), `danger`. Hover: navy
  steps `800 → deep`, shadow lifts. Press: `translateY(1px)`.
- **Card** — white, `radius-lg`, `border-1`, `shadow-sm`, padding 20–28px.
- **Badge** — pill, tones success/warning/danger/info/neutral.
- **Input** — `radius-md`, `border-1`; focus → pink border + `shadow-focus`.

---

## Iconography & app icon

**Lucide**, stroke-based, stroke `1.75px` (20–24px) / `1.5px` larger,
`currentColor`. Sizes `14, 16, 20, 24, 32, 48`. **No emoji, no Unicode glyphs as
icons.**

**App icon (canonical):** navy `#012e54` rounded square (32px radius at 1024px),
pink mark centered at 60% inner size.

---

## Content & voice

Clear, warm, professional, confident — never hyperbolic. Avoid "revoluciona",
"el mejor", "increíble". Imperative verbs of agency. Colombian formatting
(`$ 1.250.000 COP`, `15 ago 2026`, `14:30`). Always include tildes and `ñ`.
**No emoji** — Heztio is not an emoji brand.

---

## Source & cross-repo

This system is shared across **all** Heztio repos — `backend/`, `web/`,
`frontend/`, `platform/`, `website/`, `tickets/` — each carries its own
`design.md`. The web surfaces share the exact same `colors_and_type.css`; the
mobile app uses a TypeScript port. Keep them in sync. Origin: Heztio Brandbook
2026 → Claude Design handoff (`Heztio Design System` project).
