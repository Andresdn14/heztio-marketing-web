# heztio-marketing-web — rules for this repo

Marketing / landing site for `heztio.com`. **Static HTML + CSS, no build step.**
Part of the Heztio polyrepo.

## Layout

- `index.html` — the whole site.
- `colors_and_type.css` + `fonts/` — vendored Heztio design tokens (Causten, Montserrat, JetBrains Mono).
- `assets/` — logos and lockups (generated from the workspace `VisualIdentity/` brand kit).
- Favicons / touch icons at the root.

## Hard rules

1. **Design system is mandatory** — `design.md` is the source of truth. Use the `--hz-*` tokens; tagline **Gestiónalo simple.**
   with SIMPLE in heavy Montserrat; pillars **CONECTA · GESTIONA · OPTIMIZA** in that order.
2. **Copy is Spanish (Colombia, "tú")**. Calm, capable, modern — no emoji, no hype.
3. Contact details: Heztio S.A.S., NIT 901.455.663, Cartagena de Indias · info@heztio.com · +57 314 595 1905.
4. Regenerate logo derivatives with `VisualIdentity/build_brand_kit.py`; don't hand-export.
5. Check the page at phone width before committing.
