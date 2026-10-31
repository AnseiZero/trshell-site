# TRShell — website

The marketing site for **TRShell**, a desktop terminal with an AI agent built in.
Static HTML/CSS/JS with no build step, served by GitHub Pages from `main`.

Live: https://anseizero.github.io/trshell-site/

## Structure
- `index.html` — the page (hero, features, trailer, control, early access)
- `styles.css` — Ember design tokens and layout
- `main.js` — reveal-on-scroll and the hero video's play/pause, both respecting `prefers-reduced-motion`
- `assets/img/` — product UI panels (WebP), posters, social preview
- `assets/video/` — hero loop, trailer, trailer captions (`.vtt`)

## Design
Follows TRShell's own design system, *Ember*: graphite `#1a1917`, warm text `#ece7df`,
a single amber accent `#f0a03c` that marks the primary action only, green/yellow/red
reserved for succeeded/warning/failed, 4px corners, flat surfaces, sentence case,
system sans for prose and monospace for code. No web fonts, trackers or third-party
requests.

The product screens show a fictional target (`staging.acme.test`).
