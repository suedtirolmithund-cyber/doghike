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

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    res.status(405).end("Method not allowed");
    return;
  }

  const rawUrl = Array.isArray(req.query?.url) ? req.query.url[0] : req.query?.url;
  if (!rawUrl || !isAllowedImageUrl(rawUrl)) {
    res.status(400).end("Invalid image URL");
    return;
  }

  const upstream = await fetch(rawUrl, {
    headers: {
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "user-agent": "DogTrails image proxy",
    },
  });

  if (!upstream.ok) {
    res.status(upstream.status).end("Image not available");
    return;
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  if (!contentType.toLowerCase().startsWith("image/")) {
    res.status(415).end("Unsupported media type");
    return;
  }

  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800");

  if (req.method === "HEAD") {
    res.status(200).end();
    return;
  }

  const imageBuffer = Buffer.from(await upstream.arrayBuffer());
  res.status(200).send(imageBuffer);
}
