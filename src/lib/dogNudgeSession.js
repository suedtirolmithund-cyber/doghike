const DOG_NUDGE_SESSION_KEY_PREFIX = "doghike:dog-nudge-session";

export function getDogNudgeSessionKey(userId) {
  return `${DOG_NUDGE_SESSION_KEY_PREFIX}:${userId}`;
}

export function hasSeenDogNudgeThisSession(userId) {
  if (typeof window === "undefined" || !userId) return false;
  return window.sessionStorage.getItem(getDogNudgeSessionKey(userId)) === "1";
}

export function markDogNudgeSeenThisSession(userId) {
  if (typeof window === "undefined" || !userId) return;
  window.sessionStorage.setItem(getDogNudgeSessionKey(userId), "1");
}

export function clearDogNudgeSession(userId) {
  if (typeof window === "undefined" || !userId) return;
  window.sessionStorage.removeItem(getDogNudgeSessionKey(userId));
}
