"""Regenerate site image variants: install Pillow, then run this script."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def resize(source, destination, size, *, by_width=False, lossless=True):
    with Image.open(ROOT / source) as image:
        if by_width:
            assert size <= image.width, f"Do not upscale {source} to {size}px"
            image = image.resize((size, round(image.height * size / image.width)), Image.Resampling.LANCZOS)
        else:
            image.thumbnail((size, size), Image.Resampling.LANCZOS)
        output = ROOT / destination
        output.parent.mkdir(parents=True, exist_ok=True)
        image.save(output, format="WEBP", lossless=lossless, method=6,
                   **({"quality": 85} if not lossless else {}))
        print(f"{destination}: {image.width}x{image.height}, {output.stat().st_size} bytes")


if __name__ == "__main__":
    resize("assets/logo.webp", "assets/thumbnails/logo-128.webp", 128)
    with Image.open(ROOT / "assets/2026/cielos-de-cristal-hero-background.webp") as background:
        background.save(ROOT / "assets/thumbnails/2026/hero-background.avif", format="AVIF", quality=65, speed=6)
    for name, widths in (("vrton-cielos-de-cristal", (800, 1100, 1600)),
                         ("itinerario-listo", (480, 960, 1440)),
                         ("cielos-de-cristal-faq-mascot", (400, 800))):
        for width in widths:
            resize(f"assets/2026/{name}.webp", f"assets/thumbnails/2026/{name}-{width}.webp",
                   width, by_width=True, lossless=False)

    # This CSS mask consumes only alpha; discard RGB without changing its silhouette.
    with Image.open(ROOT / "assets/2026/cielos-de-cristal-participation-city.webp") as original:
        mask = Image.new("RGBA", original.size, "white")
        mask.putalpha(original.getchannel("A"))
        mask_path = ROOT / "assets/thumbnails/2026/participation-mask.webp"
        mask.save(mask_path, format="WEBP", lossless=True, method=6)
        with Image.open(mask_path) as saved:
            assert saved.getchannel("A").tobytes() == original.getchannel("A").tobytes()
        print(f"{mask_path.relative_to(ROOT)}: {mask_path.stat().st_size} bytes")

    # Paths mirror the originals so identical filenames in different folders do not collide.
    for source in sorted((ROOT / "assets/Eventos").glob("*/*.webp")):
        for width in ((480, 960, 1920) if source.stem.endswith("-1") else (480, 960)):
            relative = source.relative_to(ROOT / "assets")
            destination = Path("assets/thumbnails") / relative.parent / f"{source.stem}-{width}.webp"
            resize(source.relative_to(ROOT), destination, width, by_width=True, lossless=False)

    # Include every community logo, including groups outside the homepage selection.
    logos = (path.relative_to(ROOT).as_posix() for path in (ROOT / "assets/Comunidades").glob("*.webp"))
    for source in sorted(logos):
        # Enough pixels for both contained archive logos and circular homepage crops.
        with Image.open(ROOT / source.lstrip("/")) as image:
            width = min(image.width, round(240 * image.width / min(image.size)))
        resize(source.lstrip("/"), source.lstrip("/").replace("assets/", "assets/thumbnails/", 1),
               width, by_width=True, lossless=False)

    for width in (280, 560):
        resize("assets/logo.webp", f"assets/thumbnails/logo-{width}.webp", width, by_width=True)
        resize("assets/2026/Logo.png", f"assets/thumbnails/2026/Logo-{width}.webp", width, by_width=True)
