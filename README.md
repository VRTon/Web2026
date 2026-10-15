# VRTon website

Bilingual Jekyll site. Edit shared styles in `styles.scss`; Jekyll compiles them
to compressed `/styles.css` using Dart Sass. Page behavior lives in `script.js`,
and translations live in `_data/i18n/{es,en}.yml`.

## Build and check

```powershell
docker compose build
docker compose run --rm -e JEKYLL_ENV=production jekyll bundle exec jekyll build
python scripts/check_site.py
node scripts/check-schedule.cjs
```

Docker and CI use Ruby 4.0. A local build requires Bundler, Node.js (for the
JavaScript minifier) and `zip` (for the brand kit). `Gemfile.lock` records the
dependency versions for Linux and Alpine.

Images and downloads are shared between languages at `/assets/`. The brand kit
ZIP is generated from `assets/2026/Manual de Marca/` after both language builds.
The original brand and poster folders stay in the repository; their downloadable
archives are published instead of duplicating all source files in the site.

The generated-site check validates local links, fragments, IDs, CSS resources,
responsive image candidates and original gallery images.
The schedule check covers timezone conversion and Chilean daylight saving.
Browser checks and a deployed Lighthouse run are separate from these checks.

Display image variants are committed under `assets/thumbnails/`. After changing
event photos, community logos or brand previews, install Pillow locally and run
`python scripts/prepare_home_images.py`. Jekyll does not need Pillow. Keep gallery
`data-gallery-image` paths and downloadable archives pointed at the originals.
