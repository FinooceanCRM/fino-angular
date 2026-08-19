/** "Today" for every mock dataset across this build — keeps date-range defaults consistent. */
export const MOCK_TODAY = new Date('2026-08-15T23:59:59+05:30');

export function defaultFrom(daysBack = 90): string {
  const date = new Date(MOCK_TODAY);
  date.setDate(date.getDate() - daysBack);
  return date.toISOString().slice(0, 10);
}

export function defaultTo(): string {
  return MOCK_TODAY.toISOString().slice(0, 10);
}

export function inRange(iso: string | null, from: string, to: string): boolean {
  if (!iso) {
    return false;
  }
  const time = new Date(iso).getTime();
  const fromTime = new Date(from + 'T00:00:00').getTime();
  const toTime = new Date(to + 'T23:59:59').getTime();
  return time >= fromTime && time <= toTime;
}

/** Buckets arbitrary dated items into weekly totals between `from` and `to`, inclusive. */
export function bucketByWeek<T>(
  items: T[],
  getDate: (item: T) => string | null,
  from: string,
  to: string,
  aggregate: (bucketItems: T[]) => number = (bucketItems) => bucketItems.length,
): { label: string; value: number }[] {
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T23:59:59');
  const buckets: { label: string; value: number }[] = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    const weekEnd = new Date(cursor);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const boundedEnd = weekEnd < end ? weekEnd : end;

    const inBucket = items.filter((item) => {
      const iso = getDate(item);
      if (!iso) return false;
      const time = new Date(iso).getTime();
      return time >= cursor.getTime() && time <= boundedEnd.getTime();
    });

    buckets.push({
      label: cursor.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      value: aggregate(inBucket),
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  return buckets;
}

/** Buckets arbitrary dated items into totals for the last `months` calendar months, ending with the current month. */
export function bucketByMonth<T>(
  items: T[],
  getDate: (item: T) => string | null,
  months = 6,
  aggregate: (bucketItems: T[]) => number = (bucketItems) => bucketItems.length,
): { label: string; value: number }[] {
  const buckets: { label: string; value: number }[] = [];

  for (let offset = months - 1; offset >= 0; offset--) {
    const monthStart = new Date(MOCK_TODAY.getFullYear(), MOCK_TODAY.getMonth() - offset, 1);
    const monthEnd = new Date(MOCK_TODAY.getFullYear(), MOCK_TODAY.getMonth() - offset + 1, 0, 23, 59, 59, 999);

    const inBucket = items.filter((item) => {
      const iso = getDate(item);
      if (!iso) return false;
      const time = new Date(iso).getTime();
      return time >= monthStart.getTime() && time <= monthEnd.getTime();
    });

    buckets.push({
      label: monthStart.toLocaleDateString('en-IN', { month: 'short' }),
      value: aggregate(inBucket),
    });
  }

  return buckets;
}
