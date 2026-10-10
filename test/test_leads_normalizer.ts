import {
  cleanWebsiteUrl,
  extractNormalizedDomain,
  normalizeCompanyName,
  isValidCompanyLinkedIn,
  cleanLinkedInUrl,
  discoverCompanyLinkedIn,
} from '../src/engine/leads-normalizer.js';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('=== TEST SUITE 1: Website URL Normalization & Cleaning ===');

  assert(
    cleanWebsiteUrl('https://www.example.com/?utm_source=google&utm_medium=cpc') === 'https://www.example.com',
    'Strips utm query parameters'
  );

  assert(
    cleanWebsiteUrl('http://example.com/shop?gclid=12345&fbclid=67890#section1') === 'http://example.com/shop',
    'Strips gclid, fbclid and hash fragment'
  );

  assert(
    cleanWebsiteUrl('https://example.com///') === 'https://example.com',
    'Trims trailing slashes'
  );

  assert(
    cleanWebsiteUrl(null) === null && cleanWebsiteUrl('') === null,
    'Handles null and empty strings gracefully'
  );

  console.log('\n=== TEST SUITE 2: Domain Extraction for Deduplication ===');

  assert(
    extractNormalizedDomain('https://www.example.com/about-us') === 'example.com',
    'Extracts domain and strips www'
  );

  assert(
    extractNormalizedDomain('http://sub.domain.co.uk/store?id=1') === 'sub.domain.co.uk',
    'Extracts subdomain'
  );

  assert(
    extractNormalizedDomain('invalid-url') === null,
    'Returns null for invalid URLs'
  );

  console.log('\n=== TEST SUITE 3: Company Name Normalization ===');

  assert(
    normalizeCompanyName('Acme Technologies, Inc.') === 'acme technologies',
    'Strips Inc. and punctuation'
  );

  assert(
    normalizeCompanyName('Global Logistics LLC') === 'global logistics',
    'Strips LLC'
  );

  assert(
    normalizeCompanyName('Summit Solutions Pvt. Ltd.') === 'summit solutions',
    'Strips Pvt. Ltd.'
  );

  assert(
    normalizeCompanyName('Best   Retail   Corporation  ') === 'best retail',
    'Normalizes whitespace and strips Corporation'
  );

  console.log('\n=== TEST SUITE 4: LinkedIn Validation (Company vs Personal Profile) ===');

  assert(
    isValidCompanyLinkedIn('https://www.linkedin.com/company/google') === true,
    'Validates standard company URL'
  );

  assert(
    isValidCompanyLinkedIn('https://linkedin.com/company/microsoft-corporation/') === true,
    'Validates company URL with trailing slash and no www'
  );

  assert(
    isValidCompanyLinkedIn('https://in.linkedin.com/company/infosys') === true,
    'Validates regional subdomains (e.g. in.linkedin.com)'
  );

  assert(
    isValidCompanyLinkedIn('https://www.linkedin.com/in/john-doe-12345') === false,
    'STRICTLY REJECTS /in/ personal profile'
  );

  assert(
    isValidCompanyLinkedIn('https://www.linkedin.com/jobs/view/123456') === false,
    'Rejects /jobs/ links'
  );

  assert(
    isValidCompanyLinkedIn('https://www.linkedin.com/feed') === false,
    'Rejects /feed link'
  );

  assert(
    cleanLinkedInUrl('https://www.linkedin.com/company/apple/?trk=nav') === 'https://www.linkedin.com/company/apple',
    'Cleans tracking parameters from company LinkedIn URL'
  );

  console.log('\n=== TEST SUITE 5: 5-Tier Discovery Fallback Sequence ===');

  // Tier 1: Maps metadata already has company LinkedIn
  const tier1Res = await discoverCompanyLinkedIn({
    companyName: 'Stripe, Inc.',
    location: 'San Francisco',
    website: 'https://stripe.com',
    rawSocials: {
      linkedin: 'https://www.linkedin.com/company/stripe',
    },
  });
  assert(
    tier1Res.linkedin === 'https://www.linkedin.com/company/stripe' && tier1Res.source === 'maps',
    'Tier 1 (Maps): Extracts company LinkedIn directly from Maps metadata'
  );

  // Tier 1 Rejection: Maps metadata has personal profile (/in/)
  const tier1RejectRes = await discoverCompanyLinkedIn({
    companyName: 'Acme Services',
    location: 'Chicago',
    website: 'https://acme-services-fake-domain-1234.com',
    rawSocials: {
      linkedin: 'https://www.linkedin.com/in/acme-founder',
    },
  });
  assert(
    tier1RejectRes.linkedin === null || tier1RejectRes.linkedin !== 'https://www.linkedin.com/in/acme-founder',
    'Tier 1 (Rejection): Never accepts /in/ profile from Maps metadata'
  );

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
