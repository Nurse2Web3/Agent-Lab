const DEVICE_ID_KEY = "trial_device_id";
const BROWSER_FP_KEY = "trial_browser_fp";

function simpleHash(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

function computeBrowserFingerprint(): string {
  const signals = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(",") ?? "",
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    navigator.platform ?? "",
    String(navigator.hardwareConcurrency ?? 0),
    String((navigator as any).deviceMemory ?? 0),
  ].join("|");
  return simpleHash(signals);
}

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = generateUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

export function getBrowserFingerprint(): string {
  let fp = sessionStorage.getItem(BROWSER_FP_KEY);
  if (!fp) {
    fp = computeBrowserFingerprint();
    sessionStorage.setItem(BROWSER_FP_KEY, fp);
  }
  return fp;
}

export function getCompositeFingerprint(): string {
  const deviceId = getDeviceId();
  const browserFp = getBrowserFingerprint();
  return `${deviceId}:${browserFp}`;
}
