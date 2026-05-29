const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL?.replace(/\/+$/, "") ||
  "https://vaprabanohjkandbzvba.supabase.co";
const PUBLIC_HIKE_PREFIX = "public-hikes/";
const JOURNAL_BUCKET = "journal";
const DEFAULT_CONTENT_IMAGE_WIDTH = 1200;
const MAX_CONTENT_IMAGE_WIDTH = 1800;

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

function getTargetContentWidth(options = {}) {
  const requestedWidth = Number(options.width);

  if (!Number.isFinite(requestedWidth) || requestedWidth <= 0) {
    return DEFAULT_CONTENT_IMAGE_WIDTH;
  }

  if (requestedWidth < 300) {
    return Math.round(requestedWidth);
  }

  return Math.min(
    MAX_CONTENT_IMAGE_WIDTH,
    Math.max(DEFAULT_CONTENT_IMAGE_WIDTH, Math.round(requestedWidth))
  );
}

function upgradeKnownThumbnailUrl(url, options = {}) {
  if (!url || typeof url !== "string") return url;

  const targetWidth = getTargetContentWidth(options);
  if (!Number.isFinite(targetWidth) || targetWidth <= 0 || targetWidth < 300) return url;

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();

    if (host === "image.jimcdn.com" || host === "jimcdn.com" || host.endsWith(".jimcdn.com")) {
      const nextPath = parsedUrl.pathname.replace(
        /dimension=\d+x\d+/,
        `dimension=${targetWidth}x10000`
      );
      parsedUrl.pathname = nextPath;
      return parsedUrl.toString();
    }

    if (host.includes("googleusercontent.com")) {
      return url.replace(/=(?:s|w)\d+(?:-[^/?#]+)?(?=([?#]|$))/, `=s${targetWidth}`);
    }

    if (host === "drive.google.com" || host === "lh3.googleusercontent.com") {
      if (parsedUrl.searchParams.has("sz")) {
        parsedUrl.searchParams.set("sz", `w${targetWidth}`);
      }
      return parsedUrl.toString();
    }
  } catch {
    return url;
  }

  return url;
}

export function getDisplayImageUrl(url, options = {}) {
  if (!url || typeof url !== "string") return url;

  const normalizedUrl = unwrapProxyUrl(url.trim());
  const managedStorageUrl = normalizeManagedStoragePath(normalizedUrl);
  return upgradeKnownThumbnailUrl(managedStorageUrl || normalizedUrl, options);
}
