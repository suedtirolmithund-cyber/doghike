import { fetchProxiedImage, sendProxiedImageResult } from "./image-proxy.js";

function decodeMediaSource(value) {
  if (!value || typeof value !== "string") return null;

  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    return Buffer.from(padded, "base64").toString("utf8");
  } catch {
    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }
}

export default async function handler(req, res) {
  const encodedSource = Array.isArray(req.query?.src) ? req.query.src[0] : req.query?.src;
  const rawUrl = decodeMediaSource(encodedSource);
  const result = await fetchProxiedImage(rawUrl, req.method);
  sendProxiedImageResult(res, result);
}
