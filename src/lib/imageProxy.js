const PROXY_HOSTS = new Set([
  "vaprabanohjkandbzvba.supabase.co",
  "image.jimcdn.com",
  "jimcdn.com",
]);

function isLocalAppHost() {
  if (typeof window === "undefined") return true;
  return ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
}

function shouldProxyImageUrl(url) {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("/") || url.startsWith("data:") || url.startsWith("blob:")) return false;
  if (isLocalAppHost()) return false;

  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "https:") return false;
    if (PROXY_HOSTS.has(parsedUrl.hostname)) return true;
    return parsedUrl.hostname.endsWith(".jimcdn.com");
  } catch {
    return false;
  }
}

function getOptimizedSupabaseImageUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const publicStoragePrefix = "/storage/v1/object/public/journal/public-hikes/";
    if (
      parsedUrl.hostname !== "vaprabanohjkandbzvba.supabase.co" ||
      !parsedUrl.pathname.startsWith(publicStoragePrefix)
    ) {
      return url;
    }

    parsedUrl.pathname = parsedUrl.pathname.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/"
    );
    parsedUrl.searchParams.set("width", "1200");
    parsedUrl.searchParams.set("quality", "78");
    return parsedUrl.toString();
  } catch {
    return url;
  }
}

export function getDisplayImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  const optimizedUrl = getOptimizedSupabaseImageUrl(url.trim());
  if (!shouldProxyImageUrl(optimizedUrl)) return optimizedUrl;
  return `/api/image-proxy?url=${encodeURIComponent(optimizedUrl)}`;
}
