"""Check a Jekyll build: python scripts/check_site.py [_site]."""
import gzip
import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.links, self.headings = [], [], 0
        self.canonical, self.open_graph = None, None
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.append(attrs["id"])
        if tag == "h1":
            self.headings += 1
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical = attrs.get("href")
        if tag == "meta" and attrs.get("property") == "og:url":
            self.open_graph = attrs.get("content")
        for key in ("href", "src"):
            if attrs.get(key):
                self.links.append(attrs[key])


def check(root):
    pages = {p: Page(p) for p in root.rglob("*.html")}
    errors = []
    for path, page in pages.items():
        route = "/" + path.relative_to(root).as_posix()
        for name, count in Counter(page.ids).items():
            if count > 1:
                errors.append(f"{route}: duplicate id {name}")
        if page.headings > 1:
            errors.append(f"{route}: multiple h1 elements")
        if page.canonical:
            expected = "https://vrton.org" + route.removesuffix("index.html")
            if page.canonical != expected or page.open_graph != expected:
                errors.append(f"{route}: incorrect canonical or Open Graph URL")
        for link in page.links:
            url = urlsplit(urljoin("https://vrton.org" + route, link))
            if url.scheme not in ("http", "https") or url.netloc != "vrton.org":
                continue
            target = root / unquote(url.path).lstrip("/")
            if target.is_dir():
                target /= "index.html"
            if not target.exists() and not target.suffix:
                target = target.with_suffix(".html")
            if not target.is_file():
                errors.append(f"{route}: missing {url.path}")
            elif url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                errors.append(f"{route}: missing fragment {link}")
    css = (root / "styles.css").read_text(encoding="utf-8")
    for asset in re.findall(r"url\(['\"]?([^)'\"]+)", css):
        if asset.startswith("/") and not (root / unquote(asset).lstrip("/")).is_file():
            errors.append(f"styles.css: missing {asset}")
    if "safe - area" in css:
        errors.append("styles.css: corrupted safe-area function")
    files = [p for p in root.rglob("*") if p.is_file()]
    print(json.dumps({"pages": len(pages), "files": len(files),
                      "bytes": sum(p.stat().st_size for p in files),
                      "css_bytes": (root / "styles.css").stat().st_size,
                      "css_gzip": len(gzip.compress((root / "styles.css").read_bytes())),
                      "js_bytes": (root / "script.js").stat().st_size,
                      "js_gzip": len(gzip.compress((root / "script.js").read_bytes()))}))
    for error in sorted(set(errors)):
        print(error)
    return not errors


if __name__ == "__main__":
    sys.exit(0 if check(Path(sys.argv[1] if len(sys.argv) > 1 else "_site")) else 1)
