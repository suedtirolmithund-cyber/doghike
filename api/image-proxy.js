const ALLOWED_HOSTS = new Set([
  "vaprabanohjkandbzvba.supabase.co",
  "image.jimcdn.com",
  "jimcdn.com",
]);
const ALLOWED_IMAGE_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
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

function normalizeContentType(value) {
  return String(value || "image/jpeg").split(";")[0].trim().toLowerCase();
}

function bufferMatchesImageContentType(buffer, contentType) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;

  if (contentType === "image/jpeg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (contentType === "image/png") {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (contentType === "image/gif") {
    return buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a";
  }

  if (contentType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  if (contentType === "image/avif") {
    return buffer.subarray(4, 8).toString("ascii") === "ftyp" && buffer.subarray(8, 12).toString("ascii").startsWith("avi");
  }

  return false;
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

  const contentType = normalizeContentType(upstream.headers.get("content-type"));
  if (!ALLOWED_IMAGE_CONTENT_TYPES.has(contentType)) {
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
  if (!bufferMatchesImageContentType(imageBuffer, contentType)) {
    return {
      status: 415,
      body: "Invalid image payload",
    };
  }

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
