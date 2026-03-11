type RateRecord = { count1m: number; reset1m: number; count1d: number; reset1d: number };
const store = new Map<string, RateRecord>();

export function checkRateLimit(key: string) {
  const now = Date.now();
  let rec = store.get(key);
  if (!rec || rec.reset1d <= now) {
    rec = { count1m: 0, reset1m: 0, count1d: 0, reset1d: now + 24 * 3600 * 1000 };
  }

  if (rec.reset1m <= now) {
    rec.count1m = 0;
    rec.reset1m = now + 60 * 1000;
  }

  rec.count1m += 1;
  rec.count1d += 1;

  store.set(key, rec);

  if (rec.count1m > 30) return { ok: false, message: "Rate limit exceeded: 30 requests/min" };
  if (rec.count1d > 1000) return { ok: false, message: "Rate limit exceeded: 1000 requests/day" };

  return { ok: true, message: "ok" };
}
