# VRTon Website - Asset Directory

This directory contains all the assets for the VRTon website.

## Required Assets

### Logo
- `logo.webp` - Main VRTon logo (recommended size: 180x180px or higher resolution)

### Event Images (3 images per year)
**2023 Event:**
- `event-2023-1.webp`
- `event-2023-2.webp`
- `event-2023-3.webp`

**2024 Event:**
- `event-2024-1.webp`
- `event-2024-2.webp`
- `event-2024-3.webp`

**2025 Event:**
- `event-2025-1.webp`
- `event-2025-2.webp`
- `event-2025-3.webp`

## Image Specifications

- **Logo**: WebP format with transparent background
- **Event Images**: Landscape orientation recommended (4:3 or 16:9 aspect ratio)
- **Format**: WebP
- **Quality**: High resolution for retina displays

## Notes

Page images use WebP where available. The hero logo and itinerary illustration
were converted losslessly, preserving their original dimensions and RGBA pixels.

`2026/Manual de Marca/` contains the editable brand sources. The build packages
that directory as `/assets/downloads/VRTon-brand-kit-2026.zip`; the unpacked
directory is excluded from the published site. The poster originals are likewise
available in the existing promotional ZIP. `shapes/` contains the four unchanged
SVG exports used as CSS masks by the homepage.

`thumbnails/` contains display variants for the homepage, event archive, galleries,
community logos, Resources, and Links. Responsive photographs have 480/960px
variants, plus 1920px versions for event headers. `_includes/responsive-image.html`
provides their shared `srcset` markup. Community logos retain enough resolution
for the circular homepage crops and contained archive logos.

The full-size originals remain available when opening gallery photos and in the
download kits. Metadata also retains the original image URLs. Regenerate variants
with `python scripts/prepare_home_images.py` (requires Pillow locally; no new build
or browser dependency). Photos, community logos and homepage illustration variants
use WebP quality 85. The hearts reuse existing event previews. The homepage logo
has 800/1100/1600px candidates so mobile pixel densities do not unnecessarily jump
to the full original; the schedule and FAQ illustrations are responsive too.
Brand/logo variants remain lossless. `2026/participation-mask.webp` retains the
original alpha channel exactly while discarding RGB that CSS masks do not use.
The homepage background prefers `2026/hero-background.avif` (quality 65) with
the original WebP as a CSS fallback. Only AVIF is preloaded, avoiding downloading
both formats in supporting browsers. Decorative hearts use native low-priority
lazy images, preserving their existing masks and animations.
Obsolete lossless heart previews and the former 800px edition preview were removed.
Run the generated-site check after adding
images: it also validates every `srcset` URL and gallery original.
