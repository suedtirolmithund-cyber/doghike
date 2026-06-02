const LOCAL_REDIRECT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function splitOrigins(value: string | null | undefined) {
  return String(value ?? "")
    .split(",")
    .map((entry) => normalizeOrigin(entry.trim()))
    .filter((origin): origin is string => Boolean(origin));
}

export function getAllowedRedirectOrigins() {
  return Array.from(
    new Set([
      ...splitOrigins(Deno.env.get("APP_ORIGIN")),
      ...splitOrigins(Deno.env.get("APP_URL")),
      ...splitOrigins(Deno.env.get("SITE_URL")),
      ...splitOrigins(Deno.env.get("PUBLIC_SITE_URL")),
      ...splitOrigins(Deno.env.get("ALLOWED_REDIRECT_ORIGINS")),
      ...LOCAL_REDIRECT_ORIGINS,
    ])
  );
}

export function getAppOrigin() {
  const configuredOrigin =
    normalizeOrigin(Deno.env.get("APP_ORIGIN"))
    ?? normalizeOrigin(Deno.env.get("APP_URL"))
    ?? normalizeOrigin(Deno.env.get("SITE_URL"))
    ?? normalizeOrigin(Deno.env.get("PUBLIC_SITE_URL"));

  return configuredOrigin ?? LOCAL_REDIRECT_ORIGINS[0];
}

export function safeAppRedirectUrl(value: unknown, fallbackPath: string) {
  const appOrigin = getAppOrigin();
  const fallback = new URL(fallbackPath, appOrigin).toString();

  if (typeof value !== "string") return fallback;

  try {
    const url = new URL(value, appOrigin);
    const allowedOrigins = getAllowedRedirectOrigins();
    return allowedOrigins.includes(url.origin) ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}
