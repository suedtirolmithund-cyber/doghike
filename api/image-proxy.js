const ALLOWED_HOSTS = new Set([
  "vaprabanohjkandbzvba.supabase.co",
  "image.jimcdn.com",
  "jimcdn.com",
]);

function isAllowedImageUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:") return false;
    if (ALLOWED_HOSTS.has(url.hostname)) return true;
    return url.hostname.endsWith(".jimcdn.com");
  } catch {
    return false;
  }
}

export async function fetchProxiedImage(rawUrl, method = "GET") {
  if (method !== "GET" && method !== "HEAD") {
    return {
      status: 405,
      headers: { Allow: "GET, HEAD" },
      body: "Method not allowed",
    };
  }

  if (!rawUrl || !isAllowedImageUrl(rawUrl)) {
    return {
      status: 400,
      body: "Invalid image URL",
    };
  }

  let upstream;
  try {
    upstream = await fetch(rawUrl, {
      headers: {
        accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "user-agent": "DogTrails image proxy",
      },
      signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    const message = String(error?.message ?? "");
    const isTimeout =
      error?.name === "TimeoutError" ||
      error?.name === "AbortError" ||
      message.toLowerCase().includes("timeout");

    return {
      status: isTimeout ? 504 : 502,
      body: isTimeout ? "Image upstream timeout" : "Image upstream unavailable",
    };
  }

  if (!upstream.ok) {
    return {
      status: upstream.status,
      body: "Image not available",
    };
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  if (!contentType.toLowerCase().startsWith("image/")) {
    return {
      status: 415,
      body: "Unsupported media type",
    };
  }

  const headers = {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
  };

  if (method === "HEAD") {
    return {
      status: 200,
      headers,
      body: null,
    };
  }

  const imageBuffer = Buffer.from(await upstream.arrayBuffer());
  return {
    status: 200,
    headers,
    body: imageBuffer,
  };
}

export function sendProxiedImageResult(res, result) {
  for (const [name, value] of Object.entries(result.headers ?? {})) {
    res.setHeader(name, value);
  }

  res.status(result.status);

  if (result.body === null || result.body === undefined) {
    res.end();
    return;
  }

  res.send(result.body);
}

export default async function handler(req, res) {
  const rawUrl = Array.isArray(req.query?.url) ? req.query.url[0] : req.query?.url;
  const result = await fetchProxiedImage(rawUrl, req.method);
  sendProxiedImageResult(res, result);
}
