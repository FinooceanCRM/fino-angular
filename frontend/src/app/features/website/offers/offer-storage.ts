/**
 * Browser-side memory for the offer system. Nothing personal is kept: a random visitor id (so the funnel can tell
 * "one visitor, many page views" from "many visitors") and a few counters / flags. Every access is guarded because
 * storage can be blocked (private mode, strict settings) — the site must work, and the popup simply stays quiet.
 */
const KEY = {
  visitor: 'fw.visitor',
  first: 'fw.offer.first_seen',
  shown: 'fw.offer.shown',
  closed: 'fw.offer.closed',
  claimed: 'fw.offer.claimed',
  callback: 'fw.offer.callback',
} as const;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

/** crypto.randomUUID needs a secure context; fall back for plain-http hosts. */
function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  const hex = (n: number): string => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return `${hex(8)}-${hex(4)}-4${hex(3)}-a${hex(3)}-${hex(12)}`;
}

/** The anonymous id of this browser, created on first use. */
export function visitorId(): string | null {
  const existing = read(KEY.visitor);
  if (existing && /^[0-9a-fA-F-]{16,64}$/.test(existing)) return existing;
  const fresh = uuid();
  write(KEY.visitor, fresh);

  return read(KEY.visitor) === fresh ? fresh : null;
}

export const offerStore = {
  /** When this browser first opened the site (the first popup is timed from here). */
  firstSeen: (): number => Number(read(KEY.first)) || 0,
  setFirstSeen: (t: number): void => write(KEY.first, String(t)),
  /** How many times the popup has been shown to this browser. */
  shownCount: (): number => Math.max(0, Number(read(KEY.shown)) || 0),
  setShownCount: (n: number): void => write(KEY.shown, String(n)),
  /** When the popup was last shown or closed (later popups are timed from here). */
  closedAt: (): number => Number(read(KEY.closed)) || 0,
  setClosedAt: (t: number): void => write(KEY.closed, String(t)),
  /** The "call me back" modal is shown to a browser once. */
  callbackShown: (): boolean => read(KEY.callback) === '1',
  markCallbackShown: (): void => write(KEY.callback, '1'),
  claimed: (): boolean => read(KEY.claimed) === '1' || document.cookie.includes(`${KEY.claimed}=1`),
  /** After a lead is submitted the popup never appears again on this browser (a one-year cookie backs up localStorage). */
  markClaimed: (): void => {
    write(KEY.claimed, '1');
    try {
      document.cookie = `${KEY.claimed}=1; max-age=31536000; path=/; SameSite=Lax`;
    } catch {
      /* cookies unavailable */
    }
  },
};
