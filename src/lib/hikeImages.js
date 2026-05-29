import { HIKE_PLACEHOLDER_IMAGE } from "@/lib/fallbackImages";
import { getDisplayImageUrl } from "@/lib/imageProxy";

const INVALID_IMAGE_VALUES = new Set([
  "-",
  "--",
  "/",
  "null",
  "undefined",
  "none",
  "n/a",
  "na",
  "kein foto",
  "keine fotos",
  "no photo",
  "no image",
]);

export function normalizeHikeImageSource(value) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();
  if (INVALID_IMAGE_VALUES.has(normalized)) return null;
  if (/^https?:\/?\/?$/i.test(trimmed)) return null;

  return trimmed;
}

export function getUniqueHikeImageSources(...sources) {
  return Array.from(
    new Set(
      sources
        .flatMap((source) => (Array.isArray(source) ? source : [source]))
        .map(normalizeHikeImageSource)
        .filter(Boolean)
    )
  );
}

export function resolveHikeImageUrl(source, options = {}) {
  const normalizedSource = normalizeHikeImageSource(source);
  if (!normalizedSource) return HIKE_PLACEHOLDER_IMAGE;

  if (normalizedSource.startsWith("data:") || normalizedSource.startsWith("blob:")) {
    return normalizedSource;
  }

  if (normalizedSource.startsWith("/") && !normalizedSource.startsWith("/api/image-proxy?")) {
    return normalizedSource;
  }

  return getDisplayImageUrl(normalizedSource, options) || normalizedSource || HIKE_PLACEHOLDER_IMAGE;
}
