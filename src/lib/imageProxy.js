// Supabase images are proxied through Vercel CDN to reduce Supabase egress
// (free tier: 5 GB/month). Vercel caches responses at edge for 7 days.
// jimcdn.com also needs proxying for CORS (Google Sheets image CDN).
const PROXY_HOSTS = new Set([
  "vaprabanohjkandbzvba.supabase.co",
  "image.jimcdn.com",
  "jimcdn.com",
]);

const MEDIA_ENDPOINT = "/api/media";

function unwrapProxyUrl(url) {
  if (!url || typeof url !== "string") return url;

  if (url.startsWith("/api/image-proxy?")) {
    const proxiedUrl = new URLSearchParams(url.slice(url.indexOf("?") + 1)).get("url");
    return proxiedUrl ? decodeURIComponent(proxiedUrl) : url;
  }

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.pathname !== "/api/image-proxy") return url;
    const proxiedUrl = parsedUrl.searchParams.get("url");
    return proxiedUrl ? decodeURIComponent(proxiedUrl) : url;
  } catch {
    return url;
  }
}

function shouldProxyImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) return false;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:") return false;
    if (PROXY_HOSTS.has(parsedUrl.hostname)) return true;
    return parsedUrl.hostname.endsWith(".jimcdn.com");
  } catch {
    return false;
  }
}

function encodeMediaSource(url) {
  if (typeof globalThis.btoa === "function") {
    return globalThis
      .btoa(url)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  return encodeURIComponent(url);
}

export function getDisplayImageUrl(url, options = {}) {
  if (!url || typeof url !== "string") return url;

  const rawUrl = unwrapProxyUrl(url.trim());

  if (!shouldProxyImageUrl(rawUrl)) return rawUrl;
  return `${MEDIA_ENDPOINT}?src=${encodeMediaSource(rawUrl)}`;
}
