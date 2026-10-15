import { LinkedInSource, CompanyLead } from '../types.js';

// Common tracking query parameters to strip
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
  'fbclid',
  'ref',
  'ref_src',
  'source',
  'tracking_id',
  'yclid',
  '_hsenc',
  '_hsmi',
  'mc_cid',
  'mc_eid',
]);

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

/**
 * Normalizes a website URL:
 * - Trims whitespace
 * - Adds https:// protocol if missing
 * - Strips all tracking/marketing query parameters
 * - Strips trailing slash on root domains
 */
export function cleanWebsiteUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  let urlStr = rawUrl.trim();
  if (
    urlStr === '' ||
    urlStr === 'null' ||
    urlStr === 'undefined' ||
    urlStr.startsWith('javascript:') ||
    urlStr.startsWith('mailto:')
  ) {
    return null;
  }

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = 'https://' + urlStr;
  }

  try {
    const parsed = new URL(urlStr);

    // Keep only http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    // Strip known tracking params
    const keysToDelete: string[] = [];
    for (const key of parsed.searchParams.keys()) {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        keysToDelete.push(key);
      }
    }
    for (const key of keysToDelete) {
      parsed.searchParams.delete(key);
    }

    // Strip hash fragment
    parsed.hash = '';

    // Standardize root path and trailing slashes
    let res = parsed.toString();
    if (parsed.pathname === '/' && !parsed.search) {
      res = res.replace(/\/+$/, '');
    } else if (res.endsWith('/') && !parsed.search) {
      res = res.replace(/\/+$/, '');
    }

    return res;
  } catch {
    return null;
  }
}

/**
 * Extracts a normalized domain for deduplication.
 * E.g., "https://www.company.com/about?ref=1" -> "company.com"
 */
export function extractNormalizedDomain(rawUrl: string | null | undefined): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const cleaned = cleanWebsiteUrl(rawUrl);
  if (!cleaned) return null;

  try {
    const parsed = new URL(cleaned);
    let host = parsed.hostname.toLowerCase();
    if (!host.includes('.')) {
      return null;
    }
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    return host;
  } catch {
    return null;
  }
}

/**
 * Normalizes a company name for deduplication.
 * Lowercases, strips punctuation, and removes legal corporate suffixes.
 */
export function normalizeCompanyName(name: string): string {
  if (!name) return '';
  let clean = name.toLowerCase();

  // Replace & with and
  clean = clean.replace(/&/g, ' and ');

  // Remove common corporate suffixes
  clean = clean.replace(
    /\b(inc|incorporated|llc|ltd|limited|corp|corporation|co|company|pvt|private|plc|gmbh|sa|srl)\b\.?/gi,
    ' '
  );

  // Strip non-alphanumeric characters (except spaces)
  clean = clean.replace(/[^a-z0-9\s]/g, ' ');

  // Collapse multiple spaces
  return clean.replace(/\s+/g, ' ').trim();
}

/**
 * Verifies if a given string is a valid company LinkedIn URL.
 * Rejects personal /in/ profiles, jobs, posts, pulse, etc.
 */
export function isValidCompanyLinkedIn(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();

  // Reject personal profiles strictly
  if (/\/in\//i.test(trimmed)) {
    return false;
  }

  // Reject non-company routes
  if (/\/(pulse|posts|jobs|school|learning|feed|groups)\//i.test(trimmed) || /\/feed(?:\/|$)/i.test(trimmed)) {
    return false;
  }

  // Must contain /company/<slug>
  const match = trimmed.match(/linkedin\.com\/company\/([a-zA-Z0-9_\-\.%]+)/i);
  return Boolean(match && match[1] && match[1].length > 1);
}

/**
 * Cleans and canonicalizes a company LinkedIn URL into:
 * https://www.linkedin.com/company/<slug>
 */
export function cleanLinkedInUrl(rawUrl: string | null | undefined): string | null {
  if (!isValidCompanyLinkedIn(rawUrl)) return null;

  const match = rawUrl!.match(/linkedin\.com\/company\/([a-zA-Z0-9_\-\.%]+)/i);
  if (!match || !match[1]) return null;

  const slug = match[1].toLowerCase().replace(/[#?].*$/, '').replace(/\/+$/, '');
  if (!slug || slug === 'company') return null;

  return `https://www.linkedin.com/company/${slug}`;
}

/**
 * Extracts company slug from normalized company LinkedIn URL
 */
export function extractLinkedInSlug(linkedinUrl: string | null | undefined): string | null {
  const cleaned = cleanLinkedInUrl(linkedinUrl);
  if (!cleaned) return null;
  const match = cleaned.match(/linkedin\.com\/company\/([a-zA-Z0-9_\-\.%]+)/i);
  return match && match[1] ? match[1].toLowerCase() : null;
}

/**
 * Step 1: Check Google Maps metadata for company LinkedIn
 */
export function extractLinkedInFromMapsMetadata(rawSocials: any): string | null {
  if (!rawSocials) return null;

  const candidates: string[] = [];

  if (typeof rawSocials === 'string') {
    // Check if it's a JSON string
    try {
      const parsed = JSON.parse(rawSocials);
      return extractLinkedInFromMapsMetadata(parsed);
    } catch {
      // Find all URL matches
      const matches = rawSocials.match(/https?:\/\/[^\s"',;]+/g) || [rawSocials];
      candidates.push(...matches);
    }
  } else if (Array.isArray(rawSocials)) {
    for (const item of rawSocials) {
      if (typeof item === 'string') {
        candidates.push(item);
      } else if (item && typeof item === 'object') {
        if (item.url) candidates.push(item.url);
        if (item.link) candidates.push(item.link);
        if (item.linkedin) candidates.push(item.linkedin);
      }
    }
  } else if (typeof rawSocials === 'object') {
    for (const [k, v] of Object.entries(rawSocials)) {
      if (k.toLowerCase().includes('linkedin') && typeof v === 'string') {
        candidates.push(v);
      } else if (typeof v === 'string') {
        candidates.push(v);
      }
    }
  }

  for (const c of candidates) {
    const cleaned = cleanLinkedInUrl(c);
    if (cleaned) {
      return cleaned;
    }
  }

  return null;
}

/**
 * Step 2: Crawl company website (homepage and common pages) for company LinkedIn
 */
export async function findLinkedInOnWebsite(websiteUrl: string, timeoutMs: number = 6000): Promise<string | null> {
  const cleanUrl = cleanWebsiteUrl(websiteUrl);
  if (!cleanUrl) return null;

  const targetPages = [cleanUrl];
  try {
    const parsed = new URL(cleanUrl);
    // Add common sub-paths
    targetPages.push(new URL('/contact', parsed.origin).toString());
    targetPages.push(new URL('/about', parsed.origin).toString());
    targetPages.push(new URL('/about-us', parsed.origin).toString());
  } catch {}

  for (const pageUrl of targetPages) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(pageUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const html = await res.text();

      // Look for anchor links or URLs in HTML
      const matches = html.match(/https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/company\/[a-zA-Z0-9_\-\.%]+/gi);
      if (matches && matches.length > 0) {
        for (const m of matches) {
          const cleaned = cleanLinkedInUrl(m);
          if (cleaned) {
            return cleaned;
          }
        }
      }
    } catch {
      // Ignore network errors/timeouts
    }
  }

  return null;
}

/**
 * Verifies if candidate LinkedIn slug reasonably matches the company name
 */
export function verifySlugMatchesCompany(slug: string, companyName: string): boolean {
  if (!slug || !companyName) return false;
  const normName = normalizeCompanyName(companyName);
  const nameTokens = normName.split(' ').filter((t) => t.length > 2);
  const normSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (nameTokens.length === 0) return true;

  // Exact or contains match
  const joinedName = nameTokens.join('');
  if (normSlug.includes(joinedName) || joinedName.includes(normSlug)) {
    return true;
  }

  // Token overlap match
  let matches = 0;
  for (const token of nameTokens) {
    if (normSlug.includes(token)) {
      matches++;
    }
  }

  return matches >= 1;
}

/**
 * Step 3: Public web search fallback for company LinkedIn
 */
export async function searchPublicWebForLinkedIn(
  companyName: string,
  location: string,
  timeoutMs: number = 7000
): Promise<string | null> {
  const queries = [
    `site:linkedin.com/company "${companyName}" "${location}"`,
    `"${companyName}" "${location}" LinkedIn company`,
    `site:linkedin.com/company "${companyName}"`,
  ];

  for (const q of queries) {
    try {
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(searchUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const html = await res.text();

      // Extract all candidate LinkedIn URLs
      const matches = html.match(/linkedin\.com\/company\/([a-zA-Z0-9_\-\.%]+)/gi) || [];

      for (const raw of matches) {
        const fullUrl = raw.startsWith('http') ? raw : `https://${raw}`;
        const cleaned = cleanLinkedInUrl(fullUrl);
        if (cleaned) {
          const slug = extractLinkedInSlug(cleaned);
          if (slug && verifySlugMatchesCompany(slug, companyName)) {
            return cleaned;
          }
        }
      }
    } catch {
      // Continue to next query
    }
  }

  return null;
}

/**
 * Verifies if a LinkedIn company URL actually exists and is active on standard LinkedIn platform.
 * Executes an HTTP HEAD request to https://www.linkedin.com/company/<slug>.
 * Standard LinkedIn returns 200, 301, or 302 for active company profiles, and 404/999 for non-existent/invalid pages.
 */
export async function verifyLiveLinkedInCompanyUrl(
  candidateUrlOrSlug: string,
  timeoutMs: number = 4000
): Promise<string | null> {
  if (!candidateUrlOrSlug) return null;

  let slug: string | null = null;
  if (candidateUrlOrSlug.includes('linkedin.com/')) {
    slug = extractLinkedInSlug(candidateUrlOrSlug);
  } else {
    slug = candidateUrlOrSlug.toLowerCase().replace(/[^a-z0-9_\-\.%]/g, '');
  }

  if (!slug || slug.length < 2 || slug === 'company') {
    return null;
  }

  const targetUrl = `https://www.linkedin.com/company/${slug}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(targetUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      redirect: 'manual',
    });
    clearTimeout(timer);

    if (res.status === 200 || res.status === 301 || res.status === 302) {
      return targetUrl;
    }
  } catch {
    // Ignore timeout / network errors
  }

  return null;
}

/**
 * Generates high-confidence candidate company slugs for direct LinkedIn verification
 */
export function generateCandidateCompanySlugs(companyName: string, website?: string | null): string[] {
  const slugs = new Set<string>();

  const strippedApostrophes = companyName.replace(/['’]/g, '');

  const fullSlug = strippedApostrophes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (fullSlug && fullSlug.length > 2) slugs.add(fullSlug);

  const cleanBase = strippedApostrophes
    .replace(/\b(pvt|ltd|llc|inc|corp|corporation|private|limited|plc|gmbh|sa|srl|co|company)\b\.?/gi, ' ')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (cleanBase && cleanBase.length > 2) slugs.add(cleanBase);

  if (website) {
    const domain = extractNormalizedDomain(website);
    if (domain) {
      const brandPart = domain.split('.')[0].toLowerCase().replace(/[^a-z0-9\-]/g, '');
      if (brandPart && brandPart.length > 2 && !['google', 'facebook', 'instagram', 'twitter'].includes(brandPart)) {
        slugs.add(brandPart);
      }
    }
  }

  return Array.from(slugs);
}

/**
 * Complete 5-Step Exhaustive LinkedIn Discovery Pipeline
 * Step 1: Maps metadata
 * Step 2: Company website
 * Step 3: Candidate slug verification
 * Step 4: Public web search
 * Step 5: If not found -> null
 */
export async function discoverCompanyLinkedIn(params: {
  companyName: string;
  location: string;
  website: string | null;
  rawSocials?: any;
  enrichEnabled?: boolean;
}): Promise<{ linkedin: string | null; source: LinkedInSource }> {
  const { companyName, location, website, rawSocials, enrichEnabled = true } = params;

  // Step 1: Google Maps metadata
  const fromMaps = extractLinkedInFromMapsMetadata(rawSocials);
  if (fromMaps) {
    const slug = extractLinkedInSlug(fromMaps);
    if (slug && verifySlugMatchesCompany(slug, companyName)) {
      const verified = await verifyLiveLinkedInCompanyUrl(fromMaps);
      if (verified) {
        return { linkedin: verified, source: 'maps' };
      }
    }
  }

  if (!enrichEnabled) {
    return { linkedin: null, source: 'not_found' };
  }

  // Step 2: Company Website (official site footer/header/about/contact)
  if (website) {
    const fromWebsite = await findLinkedInOnWebsite(website);
    if (fromWebsite) {
      const verified = await verifyLiveLinkedInCompanyUrl(fromWebsite);
      if (verified) {
        return { linkedin: verified, source: 'website' };
      }
    }
  }

  // Step 3: Candidate Slug Verification (direct verification of deterministic company slugs on LinkedIn)
  const candidateSlugs = generateCandidateCompanySlugs(companyName, website);
  for (const candidateSlug of candidateSlugs) {
    if (verifySlugMatchesCompany(candidateSlug, companyName)) {
      const verified = await verifyLiveLinkedInCompanyUrl(candidateSlug);
      if (verified) {
        return { linkedin: verified, source: 'website' };
      }
    }
  }

  // Step 4: Public Web / Google Search Fallback
  const fromWebSearch = await searchPublicWebForLinkedIn(companyName, location);
  if (fromWebSearch) {
    const verified = await verifyLiveLinkedInCompanyUrl(fromWebSearch);
    if (verified) {
      return { linkedin: verified, source: 'web_search' };
    }
  }

  // Step 5: Strictly return null if unverified or not found
  return { linkedin: null, source: 'not_found' };
}

/**
 * Concurrency runner: processes items concurrently with a fixed pool size
 */
export async function pMap<T, R>(items: T[], fn: (item: T, index: number) => Promise<R>, concurrency = 5): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Builds a direct LinkedIn Sales Navigator URL for a company.
 * If a numeric LinkedIn company ID exists, links directly to the Sales Navigator company account page:
 *   https://www.linkedin.com/sales/company/<id>
 * If a company slug or name exists, links to the targeted Sales Navigator account search:
 *   https://www.linkedin.com/sales/search/company?query=(spellCorrectionEnabled%3Atrue%2Ckeywords%3A<query>)
 */
export function buildSalesNavigatorCompanyUrl(companyName: string, linkedinUrl?: string | null): string {
  const slug = extractLinkedInSlug(linkedinUrl);
  if (slug && /^\d+$/.test(slug)) {
    return `https://www.linkedin.com/sales/company/${slug}`;
  }
  const queryTerm = slug || companyName.trim();
  return `https://www.linkedin.com/sales/search/company?query=(spellCorrectionEnabled%3Atrue%2Ckeywords%3A${encodeURIComponent(queryTerm)})`;
}

