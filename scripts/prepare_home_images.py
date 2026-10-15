"""Regenerate site image variants: install Pillow, then run this script."""
import re
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
    resize("assets/2026/vrton-cielos-de-cristal.webp",
           "assets/thumbnails/vrton-cielos-de-cristal-800.webp", 800)
    for year, numbers in ((2023, (1, 2)), (2024, (1, 2)), (2025, (1, 2))):
        for number in numbers:
            name = f"event-{year}-{number}.webp"
            resize(f"assets/Eventos/{year}/{name}", f"assets/thumbnails/{name}", 320)

    # Paths mirror the originals so identical filenames in different folders do not collide.
    for source in sorted((ROOT / "assets/Eventos").glob("*/*.webp")):
        for width in ((480, 960, 1920) if source.stem.endswith("-1") else (480, 960)):
            relative = source.relative_to(ROOT / "assets")
            destination = Path("assets/thumbnails") / relative.parent / f"{source.stem}-{width}.webp"
            resize(source.relative_to(ROOT), destination, width, by_width=True, lossless=False)

    # Only logos referenced by current or archived event data need display variants.
    logos = set()
    for name, limit in (("events.yml", None), ("communities_2026.yml", 12)):
        data = "\n".join(line for line in (ROOT / "_data" / name).read_text(encoding="utf-8").splitlines()
                         if not line.lstrip().startswith("#"))
        logos.update(re.findall(r'logo:\s*"(/assets/Comunidades/[^\"]+)"', data)[:limit])
    for source in sorted(logos):
        # Enough pixels for both contained archive logos and circular homepage crops.
        with Image.open(ROOT / source.lstrip("/")) as image:
            width = round(240 * image.width / min(image.size))
        resize(source.lstrip("/"), source.lstrip("/").replace("assets/", "assets/thumbnails/", 1),
               width, by_width=True, lossless=False)

    for width in (280, 560):
        resize("assets/logo.webp", f"assets/thumbnails/logo-{width}.webp", width, by_width=True)
        resize("assets/2026/Logo.png", f"assets/thumbnails/2026/Logo-{width}.webp", width, by_width=True)
