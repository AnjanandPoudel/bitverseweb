import { DateTime } from 'luxon';

/**
 * Interprets `date` (YYYY-MM-DD) and `time` (HH:mm or HH:mm:ss) as wall-clock time in `ianaTimeZone`,
 * then returns an ISO-8601 string in UTC, or null if invalid.
 */
export function combineLocalDateTimeToUtcIso(
  date: string,
  time: string,
  ianaTimeZone: string,
): string | null {
  const trimmedDate = date.trim();
  const trimmedTime = time.trim();
  if (trimmedDate.length === 0 || trimmedTime.length === 0) {
    return null;
  }
  const normalizedTime = trimmedTime.length === 5 ? `${trimmedTime}:00` : trimmedTime;
  const combined = `${trimmedDate}T${normalizedTime}`;
  const wall = DateTime.fromISO(combined, { zone: ianaTimeZone });
  if (!wall.isValid) {
    return null;
  }
  const utc = wall.toUTC();
  const iso = utc.toISO();
  return iso;
}
