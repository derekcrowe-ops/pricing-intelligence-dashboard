# Rinkline Pricing Intelligence

A static, interactive competitive pricing dashboard for the proposed hockey equipment bag with integrated stick holders. It summarizes the Mission 1 research, compares sourced competitor offers, and lets a user explore price positions against observed complete ice-hockey gear bags.

## Run locally

Requirements: Node.js 20.19+ or 22.12+ (the build itself uses only Node's standard library).

```sh
npm test
npm run build
```

The static site is generated in `dist/`. For a local browser preview, serve that directory with any static file server. No API, server-side application, API key, or installed frontend package is required after build.

## Dashboard sections

- Executive overview and calculated competitive benchmarks.
- Competitor search, classification and positioning filters, sorting, expandable details, and selection comparison.
- Representative complete-bag price chart, observed benchmark range, all-offer table, and an all-USD offer ladder.
- Price Position Explorer with slider, numeric entry, three scenario presets, median comparison, and evidence-based position language.
- Research opportunity notes, preliminary recommendation, sources, verification status, method, and limitations.

## Data provenance and calculation scope

`data.json` is the separated source dataset from Mission 1. The dashboard checks competitor and offer IDs and re-computes the comparable price summary on load. The price benchmark includes three USD complete ice-hockey bags: BAUER Premium Carry Bag S24, Pacific Rink Junior Player Bag, and Pacific Rink Player Bag. The CCM and Warrior observations are separate stick bags. TK Sports P7 is an EUR field-hockey duffle with an integrated holder. These unlike products/currencies remain visible in the offer register but are excluded from the complete ice-hockey bag price statistics.

Prices are research snapshots checked October 27, 2026, not live feeds. The source set is small and selected. No demand forecasts, costs, margins, sales, or profitability are estimated. The $119–$149 range is the preliminary Mission 1 hypothesis and remains subject to cost and demand analysis.

External source URLs are stored with each offer in `data.json`; source links open in a separate tab. Fonts load from Google Fonts when available; system sans-serif fallbacks are provided.

## GitHub Pages

The GitHub Actions workflow builds the dependency-free static site and publishes `dist/` to Pages on pushes to `main`. Enable Pages with **GitHub Actions** as the deployment source in repository settings if it is not already enabled.
