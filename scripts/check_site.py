"""Check a Jekyll build: python scripts/check_site.py [_site]."""
import gzip
import json
import re
import sys
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urljoin, urlsplit
from urllib.robotparser import RobotFileParser
from xml.etree import ElementTree


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids, self.links, self.headings = [], [], 0
        self.canonical, self.open_graph = None, None
        self.noindex = False
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
        if tag == "meta" and attrs.get("name", "").lower() == "robots":
            self.noindex = "noindex" in attrs.get("content", "").lower()
        for key in ("href", "src", "data-gallery-image"):
            if attrs.get(key):
                self.links.append(attrs[key])
        for candidate in attrs.get("srcset", "").split(","):
            if candidate.strip():
                self.links.append(candidate.strip().split()[0])


def check_crawl_files(root, pages, errors):
    indexable = {page.canonical for path, page in pages.items()
                 if page.canonical and not page.noindex and path.name != "404.html"}
    try:
        sitemap = ElementTree.parse(root / "sitemap.xml").getroot()
        namespace = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
        if sitemap.tag != namespace + "urlset":
            errors.append("sitemap.xml: expected a sitemap URL set")
        urls = [node.text for node in sitemap.findall(f"{namespace}url/{namespace}loc")]
        if len(urls) != len(set(urls)):
            errors.append("sitemap.xml: duplicate URLs")
        for url in indexable - set(urls):
            errors.append(f"sitemap.xml: missing canonical URL {url}")
        for url in set(urls) - indexable:
            errors.append(f"sitemap.xml: noncanonical or nonindexable URL {url}")
        if any(path.parent != root for path in root.rglob("sitemap.xml")):
            errors.append("sitemap.xml: unexpected localized copy of the root sitemap")
    except (OSError, ElementTree.ParseError) as error:
        errors.append(f"sitemap.xml: {error}")
    try:
        robots = RobotFileParser()
        robots.parse((root / "robots.txt").read_text(encoding="utf-8").splitlines())
        if robots.site_maps() != ["https://vrton.org/sitemap.xml"]:
            errors.append("robots.txt: missing or malformed root Sitemap directive")
        if not all(robots.can_fetch("*", url) for url in indexable):
            errors.append("robots.txt: canonical pages are blocked from crawling")
    except OSError as error:
        errors.append(f"robots.txt: {error}")


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
    check_crawl_files(root, pages, errors)
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
