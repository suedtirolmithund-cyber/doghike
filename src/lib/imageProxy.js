const PROXY_HOSTS = new Set([
  "vaprabanohjkandbzvba.supabase.co",
  "image.jimcdn.com",
  "jimcdn.com",
]);

const SUPABASE_PUBLIC_OBJECT_MARKER = "/storage/v1/object/public/";
const SUPABASE_PUBLIC_RENDER_MARKER = "/storage/v1/render/image/public/";
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

function getOptimizedSupabaseImageUrl(url, options = {}) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== "vaprabanohjkandbzvba.supabase.co") {
      return url;
    }

    if (!parsedUrl.pathname.startsWith(SUPABASE_PUBLIC_OBJECT_MARKER)) {
      return url;
    }

    const width = Number(options.width);
    const height = Number(options.height);
    const quality = Number(options.quality);

    parsedUrl.pathname = parsedUrl.pathname.replace(SUPABASE_PUBLIC_OBJECT_MARKER, SUPABASE_PUBLIC_RENDER_MARKER);

    if (Number.isFinite(width) && width > 0) {
      parsedUrl.searchParams.set("width", String(Math.round(width)));
    }

    if (Number.isFinite(height) && height > 0) {
      parsedUrl.searchParams.set("height", String(Math.round(height)));
    }

    if (Number.isFinite(quality) && quality > 0) {
      parsedUrl.searchParams.set("quality", String(Math.round(quality)));
    }

    return parsedUrl.toString();
  } catch {
    return url;
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
  const optimizedUrl = getOptimizedSupabaseImageUrl(rawUrl, options);

  if (!shouldProxyImageUrl(optimizedUrl)) return optimizedUrl;
  return `${MEDIA_ENDPOINT}?src=${encodeMediaSource(optimizedUrl)}`;
}
