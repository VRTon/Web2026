const CONTENT_SIGNAL = "ai-train=no, search=yes, ai-input=no";

function wantsMarkdown(accept) {
  const ranges = accept.toLowerCase().split(",").map(value => {
    const [type, ...parameters] = value.trim().split(";");
    const quality = parameters.find(value => value.trim().startsWith("q="));
    const q = quality ? Number(quality.trim().slice(2)) : 1;
    return { type: type.trim(), q: Number.isFinite(q) && q >= 0 && q <= 1 ? q : 0 };
  });
  const markdown = Math.max(0, ...ranges.filter(value => value.type === "text/markdown").map(value => value.q));
  const html = ["text/html", "text/*", "*/*"].map(type => ranges.filter(value => value.type === type))
    .find(matches => matches.length > 0);
  return markdown > 0 && markdown >= Math.max(0, ...(html || []).map(value => value.q));
}

function responseHeaders(response) {
  const headers = new Headers(response.headers);
  const vary = headers.get("Vary") || "";
  if (vary !== "*" && !vary.split(",").some(value => value.trim().toLowerCase() === "accept")) {
    headers.set("Vary", vary ? `${vary}, Accept` : "Accept");
  }
  headers.set("Content-Signal", CONTENT_SIGNAL);
  return headers;
}

export default {
  async fetch(request, env) {
    const markdown = ["GET", "HEAD"].includes(request.method)
      && wantsMarkdown(request.headers.get("Accept") || "");
    const upstream = new Request(request);
    if (markdown) {
      upstream.headers.set("Accept", "text/html");
      // Obtain the complete HTML even for conditional, range and HEAD requests.
      for (const name of ["If-None-Match", "If-Modified-Since", "If-Match", "If-Unmodified-Since", "Range", "If-Range"]) {
        upstream.headers.delete(name);
      }
    }
    const origin = await fetch(markdown ? new Request(upstream, { method: "GET", redirect: "manual" }) : upstream);
    const headers = responseHeaders(origin);
    if (!markdown || origin.status !== 200 || !/^text\/html(?:;|$)/i.test(headers.get("Content-Type") || "")) {
      return new Response(origin.body, { status: origin.status, statusText: origin.statusText, headers });
    }

    try {
      const cleaned = new HTMLRewriter()
        .on('main [aria-hidden="true"], main .sr-only, main [data-countdown-units], main .schedule-time-start', {
          element(element) { element.remove(); }
        })
        .on("main [data-schedule-activity]", {
          element(element) {
            const description = element.getAttribute("data-activity-description");
            if (description) element.append(` — ${description}`);
          }
        })
        .transform(origin.clone());
      const result = await env.AI.toMarkdown({ name: "page.html", blob: await cleaned.blob() }, {
        conversionOptions: { html: { hostname: request.url, cssSelector: "main" } }
      });
      if (result.format !== "markdown" || !result.data?.trim()) throw new Error("Empty Markdown conversion");

      for (const name of ["Content-Length", "Content-Encoding", "Content-Range", "Accept-Ranges", "ETag", "Last-Modified", "CDN-Cache-Control", "Cloudflare-CDN-Cache-Control"]) {
        headers.delete(name);
      }
      headers.set("Content-Type", "text/markdown; charset=utf-8");
      // Do not rely on Cloudflare's cache honoring Vary: Accept.
      headers.set("Cache-Control", "no-store");
      if (Number.isFinite(result.tokens) && result.tokens >= 0) headers.set("x-markdown-tokens", String(result.tokens));
      await origin.body?.cancel();
      return new Response(request.method === "HEAD" ? null : result.data, { headers });
    } catch (error) {
      console.error("Markdown conversion failed", error.message);
      headers.set("Cache-Control", "no-store");
      return new Response(request.method === "HEAD" ? null : origin.body, { status: origin.status, headers });
    }
  }
};
