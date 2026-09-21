import { RawLeadRecord } from '../types.js';

const HEADER_MAP: Record<string, string> = {
  'Name': 'name',
  'Fulladdress': 'full_address',
  'Street': 'street',
  'Municipality': 'municipality',
  'Categories': 'categories',
  'Phone': 'phone',
  'Phones': 'phones',
  'Claimed': 'claimed',
  'Review Count': 'review_count',
  'Average Rating': 'average_rating',
  'Review URL': 'review_url',
  'Google Maps URL': 'google_maps_url',
  'Latitude': 'latitude',
  'Longitude': 'longitude',
  'Website': 'website',
  'Domain': 'domain',
  'Opening hours': 'opening_hours',
  'Featured image': 'featured_image',
  'Cid': 'cid',
  'Place Id': 'place_id',
  'Kgmid': 'kgmid',
  'Plus code': 'plus_code',
  'Google Knowledge URL': 'google_knowledge_url',
  'Email': 'email',
  'Social Medias': 'social_medias',
  'Facebook': 'facebook',
  'Instagram': 'instagram',
  'Twitter': 'twitter',
  'Yelp': 'yelp',
};

// Aliases for user-requested field names
const ALIAS_MAP: Record<string, string[]> = {
  'address': ['full_address', 'street'],
  'rating': ['average_rating'],
  'reviews': ['review_count'],
  'city': ['municipality'],
  'url': ['google_maps_url'],
  'image': ['featured_image'],
  'socials': ['social_medias'],
};

function cleanValue(key: string, val: any): any {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (
      trimmed === '' ||
      trimmed === '*** Visible after upgrade ***' ||
      trimmed === '*** Waiting for processing ***' ||
      trimmed === '*** Search failed ***' ||
      trimmed === 'undefined' ||
      trimmed === 'null'
    ) {
      return null;
    }
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;

    // Check for encoded Google hash tokens in phone field (e.g. "hfuwavX_FOethvcPxpinsA0")
    if (key === 'phone' || key === 'phones') {
      const digitCount = (trimmed.match(/\d/g) || []).length;
      if (digitCount < 5) {
        return null;
      }
    }

    return trimmed;
  }
  return val;
}

export function normalizeRecord(raw: RawLeadRecord, requestedFields?: string[]): Record<string, any> {
  const normalized: Record<string, any> = {};

  // First, map all raw fields to canonical snake_case
  for (const [rawKey, rawVal] of Object.entries(raw)) {
    const trimmedKey = rawKey.trim();
    const canonicalKey = HEADER_MAP[trimmedKey] || trimmedKey.toLowerCase().replace(/\s+/g, '_');
    normalized[canonicalKey] = cleanValue(canonicalKey, rawVal);
  }

  // Provide convenience aliases on normalized object
  if (normalized['full_address'] && !normalized['address']) {
    normalized['address'] = normalized['full_address'];
  }
  if (normalized['average_rating'] !== undefined && normalized['rating'] === undefined) {
    normalized['rating'] = normalized['average_rating'];
  }
  if (normalized['municipality'] && !normalized['city']) {
    normalized['city'] = normalized['municipality'];
  }

  // If specific fields were requested, project down to only those fields
  if (requestedFields && requestedFields.length > 0) {
    const filtered: Record<string, any> = {};
    for (const reqField of requestedFields) {
      const fieldKey = reqField.toLowerCase().trim();
      
      // Direct match
      if (normalized[fieldKey] !== undefined) {
        filtered[fieldKey] = normalized[fieldKey];
        continue;
      }

      // Check aliases
      const aliases = ALIAS_MAP[fieldKey] || [];
      let found = false;
      for (const alias of aliases) {
        if (normalized[alias] !== undefined) {
          filtered[fieldKey] = normalized[alias];
          found = true;
          break;
        }
      }

      if (!found) {
        filtered[fieldKey] = null;
      }
    }
    return filtered;
  }

  return normalized;
}

export function normalizeLeadList(rawList: RawLeadRecord[], requestedFields?: string[]): Record<string, any>[] {
  const seenPlaceIds = new Set<string>();
  const results: Record<string, any>[] = [];

  for (const raw of rawList) {
    // Basic deduplication check using place_id or name+address
    const placeId = raw['Place Id'] || raw['place_id'];
    const fallbackId = `${raw['Name'] || raw['name']}_${raw['Fulladdress'] || raw['full_address']}`;
    const dedupeKey = placeId || fallbackId;

    if (dedupeKey && seenPlaceIds.has(dedupeKey)) {
      continue;
    }
    if (dedupeKey) {
      seenPlaceIds.add(dedupeKey);
    }

    results.push(normalizeRecord(raw, requestedFields));
  }

  return results;
}
