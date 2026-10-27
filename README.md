# VRTon website

Bilingual Jekyll site. Edit shared styles in `styles.scss`; Jekyll compiles them
to compressed `/styles.css` using Dart Sass. Page behavior lives in `script.js`,
and translations live in `_data/i18n/{es,en}.yml`.

The homepage countdown uses `current_event.start_date` in `_data/site.yml`
(ISO 8601 including time and UTC offset, e.g. `2026-11-06T20:00:00-03:00`).
It shows days, hours, minutes and seconds to the same instant worldwide, updating
once per second while the tab is visible. Keep `home_v2.date_compact` in both
translation files aligned with the event dates when changing editions.
When the countdown ends, a LIVE banner replaces the counter and date, with links
configured in `current_event.streaming.youtube_url` and `twitch_url` in the same
data file. These links open the stream channels without loading video players.

## Build and check

```powershell
docker compose build
docker compose run --rm -e JEKYLL_ENV=production jekyll bundle exec jekyll build
python scripts/check_site.py
node scripts/check-schedule.cjs
```

Docker and CI use Ruby 4.0. A local build requires Bundler, Node.js (for the
JavaScript minifier). `Gemfile.lock` records the
dependency versions for Linux and Alpine.

Images and downloads are shared between languages at `/assets/`. The ready-made
brand kit and promotional poster ZIPs are stored in `assets/downloads/` and served
directly. Replace those ZIPs when updating the packs; the build copies them without
generating archives. Their links are configured in `_data/resources.yml`.
The original brand and poster folders stay in the repository; their downloadable
archives are published instead of duplicating all source files in the site.

The generated-site check validates local links, fragments, IDs, CSS resources,
responsive image candidates and original gallery images.
The schedule check covers timezone conversion and Chilean daylight saving.
Browser checks and a deployed Lighthouse run are separate from these checks.

## Team page

The team page lives at `/equipo/` and `/en/equipo/`. Edit `_data/team.yml` to
add directors, team leaders, artists, and affiliated creators/sellers. Each person
has a public `name`, a translated `role` (`es` / `en`), and a `photo` path. Use
square photos, ideally 480 × 480 px; a missing photo displays the VRTon logo.
For logos, set `logo: true` to display the complete image on a dark background,
preserving transparent white artwork and avoiding cropping.
The `volunteers` list contains names only. Empty categories show a translated
pending message; historical rosters are not reused as the current team.

Collaborating groups reuse `_data/communities_2026.yml`. At the next edition,
update the year in `team.yml` and the community data source in `equipo/index.html`.
Use `thumbnail` for an existing smaller logo, or `logo` for the original. Leave
`logo` empty when no file is available. Avoid checking `site.static_files` in
localized templates: Polyglot excludes shared assets while processing English.

Display image variants are committed under `assets/thumbnails/`. After changing
event photos, community logos or brand previews, install Pillow locally and run
`python scripts/prepare_home_images.py`. Jekyll does not need Pillow. Keep gallery
`data-gallery-image` paths and downloadable archives pointed at the originals.
