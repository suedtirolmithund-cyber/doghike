export function hasActivePremiumAccess(profile) {
  if (profile?.role === "admin") return true;
  if (profile?.is_premium !== true) return false;

  const periodEnd = profile?.premium_current_period_end;
  if (!periodEnd) return false;

  const endTimestamp = new Date(periodEnd).getTime();
  return Number.isFinite(endTimestamp) && endTimestamp > Date.now();
}
