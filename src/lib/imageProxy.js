// jimcdn.com needs proxying for CORS (Google Sheets image CDN).
// Supabase public storage URLs are directly accessible — no proxy needed.
const PROXY_HOSTS = new Set([
  "image.jimcdn.com",
  "jimcdn.com",
]);

const MEDIA_ENDPOINT = "/api/media";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "") || "";
const PUBLIC_HIKE_PREFIX = "public-hikes/";
const JOURNAL_BUCKET = "journal";

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

function normalizeManagedStoragePath(url) {
  if (!url || typeof url !== "string") return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith(PUBLIC_HIKE_PREFIX)) {
    return `${SUPABASE_URL}/storage/v1/object/public/${JOURNAL_BUCKET}/${trimmed}`;
  }

  const bucketScopedPrefix = `${JOURNAL_BUCKET}/${PUBLIC_HIKE_PREFIX}`;
  if (trimmed.startsWith(bucketScopedPrefix)) {
    const normalizedPath = trimmed.slice(`${JOURNAL_BUCKET}/`.length);
    return `${SUPABASE_URL}/storage/v1/object/public/${JOURNAL_BUCKET}/${normalizedPath}`;
  }

  return null;
}

export function getDisplayImageUrl(url, options = {}) {
  if (!url || typeof url !== "string") return url;

  const normalizedUrl = unwrapProxyUrl(url.trim());
  const managedStorageUrl = normalizeManagedStoragePath(normalizedUrl);
  const finalUrl = managedStorageUrl || normalizedUrl;

  if (shouldProxyImageUrl(finalUrl)) {
    return `${MEDIA_ENDPOINT}?src=${encodeMediaSource(finalUrl)}`;
  }

  return finalUrl;
}
