/**
 * Maps public country URL slugs (lowercase) to default IANA time zones used for tuition scheduling.
 * When a slug is missing, callers should fall back to a default and optionally show a notice.
 * For multi-zone countries, prefer resolving via city (see CITY_HINT_TO_IANA_BY_COUNTRY).
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

/**
 * Countries that span multiple IANA zones — city is especially important for correct local time.
 */
export const MULTI_ZONE_COUNTRY_SLUGS: ReadonlySet<string> = new Set([
  'australia',
  'canada',
  'usa',
  'united-states',
]);

/**
 * City / area hints → IANA zone, keyed by country slug.
 * Matching is fuzzy (normalized substring) against the keys below.
 */
const CITY_HINT_TO_IANA_BY_COUNTRY: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  usa: {
    'new york': 'America/New_York',
    nyc: 'America/New_York',
    boston: 'America/New_York',
    philadelphia: 'America/New_York',
    miami: 'America/New_York',
    washington: 'America/New_York',
    atlanta: 'America/New_York',
    chicago: 'America/Chicago',
    houston: 'America/Chicago',
    dallas: 'America/Chicago',
    austin: 'America/Chicago',
    minneapolis: 'America/Chicago',
    denver: 'America/Denver',
    phoenix: 'America/Phoenix',
    'los angeles': 'America/Los_Angeles',
    'san francisco': 'America/Los_Angeles',
    seattle: 'America/Los_Angeles',
    portland: 'America/Los_Angeles',
    'san diego': 'America/Los_Angeles',
    honolulu: 'Pacific/Honolulu',
    hawaii: 'Pacific/Honolulu',
    anchorage: 'America/Anchorage',
    alaska: 'America/Anchorage',
  },
  'united-states': {
    'new york': 'America/New_York',
    nyc: 'America/New_York',
    boston: 'America/New_York',
    philadelphia: 'America/New_York',
    miami: 'America/New_York',
    washington: 'America/New_York',
    atlanta: 'America/New_York',
    chicago: 'America/Chicago',
    houston: 'America/Chicago',
    dallas: 'America/Chicago',
    austin: 'America/Chicago',
    minneapolis: 'America/Chicago',
    denver: 'America/Denver',
    phoenix: 'America/Phoenix',
    'los angeles': 'America/Los_Angeles',
    'san francisco': 'America/Los_Angeles',
    seattle: 'America/Los_Angeles',
    portland: 'America/Los_Angeles',
    'san diego': 'America/Los_Angeles',
    honolulu: 'Pacific/Honolulu',
    hawaii: 'Pacific/Honolulu',
    anchorage: 'America/Anchorage',
    alaska: 'America/Anchorage',
  },
  canada: {
    toronto: 'America/Toronto',
    ottawa: 'America/Toronto',
    montreal: 'America/Toronto',
    quebec: 'America/Toronto',
    vancouver: 'America/Vancouver',
    victoria: 'America/Vancouver',
    calgary: 'America/Edmonton',
    edmonton: 'America/Edmonton',
    winnipeg: 'America/Winnipeg',
    halifax: 'America/Halifax',
    'st johns': 'America/St_Johns',
    'st. johns': 'America/St_Johns',
  },
  australia: {
    sydney: 'Australia/Sydney',
    melbourne: 'Australia/Melbourne',
    brisbane: 'Australia/Brisbane',
    perth: 'Australia/Perth',
    adelaide: 'Australia/Adelaide',
    hobart: 'Australia/Hobart',
    canberra: 'Australia/Sydney',
    darwin: 'Australia/Darwin',
  },
};

/** Used when the URL slug is not in the map (still a reasonable regional default for this product). */
export const DEFAULT_TUITION_IANA_TIMEZONE = 'Asia/Kathmandu';

function normalizeLocationToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_/]+/g, ' ')
    .replace(/[^a-z0-9.\s-]/g, '')
    .replace(/\s+/g, ' ');
}

function resolveIanaFromCityHints(
  countrySlug: string,
  city: string,
): string | undefined {
  const hints = CITY_HINT_TO_IANA_BY_COUNTRY[countrySlug];
  if (!hints) {
    return undefined;
  }
  const normalizedCity = normalizeLocationToken(city);
  if (normalizedCity.length === 0) {
    return undefined;
  }

  const exact = hints[normalizedCity];
  if (exact) {
    return exact;
  }

  for (const [hint, iana] of Object.entries(hints)) {
    if (normalizedCity.includes(hint) || hint.includes(normalizedCity)) {
      return iana;
    }
  }
  return undefined;
}

export interface IResolveTuitionIanaTimeZoneResult {
  ianaTimeZone: string;
  slugWasRecognized: boolean;
  /** True when the city string matched a known multi-zone city hint. */
  cityMatched: boolean;
}

/**
 * Resolves IANA time zone from country slug, optionally refined by city for multi-zone countries.
 */
export function resolveIanaTimeZoneForCountrySlug(
  countrySlug: string,
  city?: string,
): IResolveTuitionIanaTimeZoneResult {
  const key = countrySlug.trim().toLowerCase();
  const mappedCountry = COUNTRY_SLUG_TO_IANA_TIMEZONE[key];
  const cityMatchedZone =
    city && city.trim().length > 0 ? resolveIanaFromCityHints(key, city) : undefined;

  if (cityMatchedZone) {
    return {
      ianaTimeZone: cityMatchedZone,
      slugWasRecognized: Boolean(mappedCountry),
      cityMatched: true,
    };
  }

  if (mappedCountry) {
    return {
      ianaTimeZone: mappedCountry,
      slugWasRecognized: true,
      cityMatched: false,
    };
  }

  return {
    ianaTimeZone: DEFAULT_TUITION_IANA_TIMEZONE,
    slugWasRecognized: false,
    cityMatched: false,
  };
}

export function isMultiZoneCountrySlug(countrySlug: string): boolean {
  return MULTI_ZONE_COUNTRY_SLUGS.has(countrySlug.trim().toLowerCase());
}
