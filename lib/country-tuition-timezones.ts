/**
 * Maps public country URL slugs (lowercase) to IANA time zones used for tuition scheduling.
 * When a slug is missing, callers should fall back to a default and optionally show a notice.
 */
export const COUNTRY_SLUG_TO_IANA_TIMEZONE: Readonly<Record<string, string>> = {
  australia: 'Australia/Sydney',
  canada: 'America/Toronto',
  france: 'Europe/Paris',
  germany: 'Europe/Berlin',
  india: 'Asia/Kolkata',
  japan: 'Asia/Tokyo',
  korea: 'Asia/Seoul',
  malaysia: 'Asia/Kuala_Lumpur',
  nepal: 'Asia/Kathmandu',
  'new-zealand': 'Pacific/Auckland',
  newzealand: 'Pacific/Auckland',
  qatar: 'Asia/Qatar',
  singapore: 'Asia/Singapore',
  'south-korea': 'Asia/Seoul',
  thailand: 'Asia/Bangkok',
  taiwan: 'Asia/Taipei',
  uae: 'Asia/Dubai',
  uk: 'Europe/London',
  'united-kingdom': 'Europe/London',
  usa: 'America/New_York',
  'united-states': 'America/New_York',
  'hong-kong': 'Asia/Hong_Kong',
  hongkong: 'Asia/Hong_Kong',
};

/** Used when the URL slug is not in the map (still a reasonable regional default for this product). */
export const DEFAULT_TUITION_IANA_TIMEZONE = 'Asia/Kathmandu';

export function resolveIanaTimeZoneForCountrySlug(countrySlug: string): { ianaTimeZone: string; slugWasRecognized: boolean } {
  const key = countrySlug.trim().toLowerCase();
  const mapped = COUNTRY_SLUG_TO_IANA_TIMEZONE[key];
  if (mapped) {
    return { ianaTimeZone: mapped, slugWasRecognized: true };
  }
  return { ianaTimeZone: DEFAULT_TUITION_IANA_TIMEZONE, slugWasRecognized: false };
}
