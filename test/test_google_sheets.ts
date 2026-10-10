import { extractSpreadsheetId } from '../src/services/google-sheets.js';
import { CompanyLead } from '../src/types.js';
import { extractNormalizedDomain, normalizeCompanyName, extractLinkedInSlug } from '../src/engine/leads-normalizer.js';

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

function testGoogleSheetsLogic() {
  console.log('=== TEST SUITE 1: Spreadsheet ID Extraction ===');

  assert(
    extractSpreadsheetId('1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms') === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'Extracts raw sheet ID'
  );

  assert(
    extractSpreadsheetId('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0') === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'Extracts ID from full Google Sheets URL with edit#gid'
  );

  assert(
    extractSpreadsheetId('https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing') === '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
    'Extracts ID from sharing URL'
  );

  console.log('\n=== TEST SUITE 2: Google Sheets 3-Field Row Format & Deduplication ===');

  const existingRows = [
    ['Company Name', 'LinkedIn', 'Website'],
    ['Existing Corp', 'https://www.linkedin.com/company/existing-corp', 'https://existingcorp.com'],
  ];

  const existingDomains = new Set<string>();
  const existingNames = new Set<string>();
  const existingLinkedInSlugs = new Set<string>();

  for (const row of existingRows.slice(1)) {
    const normName = normalizeCompanyName(row[0]);
    if (normName) existingNames.add(normName);
    const normDomain = extractNormalizedDomain(row[2]);
    if (normDomain) existingDomains.add(normDomain);
    const slug = extractLinkedInSlug(row[1]);
    if (slug) existingLinkedInSlugs.add(slug);
  }

  const incomingLeads: CompanyLead[] = [
    {
      company_name: 'Existing Corp Inc.', // Duplicate name & domain
      linkedin: 'https://www.linkedin.com/company/existing-corp',
      website: 'https://www.existingcorp.com',
      linkedin_source: 'maps',
    },
    {
      company_name: 'New Acme LLC',
      linkedin: 'https://www.linkedin.com/company/new-acme',
      website: 'https://newacme.io',
      linkedin_source: 'website',
    },
    {
      company_name: 'Another Business',
      linkedin: null,
      website: 'https://anotherbusiness.org',
      linkedin_source: 'not_found',
    },
  ];

  const newRows: string[][] = [];
  let skipped = 0;

  for (const lead of incomingLeads) {
    const leadName = normalizeCompanyName(lead.company_name);
    const leadDomain = extractNormalizedDomain(lead.website);
    const leadSlug = extractLinkedInSlug(lead.linkedin);

    let isDup = false;
    if (leadDomain && existingDomains.has(leadDomain)) isDup = true;
    if (!isDup && leadName && existingNames.has(leadName)) isDup = true;
    if (!isDup && leadSlug && existingLinkedInSlugs.has(leadSlug)) isDup = true;

    if (isDup) {
      skipped++;
      continue;
    }

    if (leadDomain) existingDomains.add(leadDomain);
    if (leadName) existingNames.add(leadName);
    if (leadSlug) existingLinkedInSlugs.add(leadSlug);

    newRows.push([
      lead.company_name,
      lead.linkedin || '',
      lead.website || '',
    ]);
  }

  assert(skipped === 1, 'Duplicate record correctly skipped');
  assert(newRows.length === 2, '2 new unique records accepted');
  assert(
    newRows[0].length === 3 && newRows[1].length === 3,
    'Strictly 3 columns formatted: [Company Name, LinkedIn, Website]'
  );
  assert(
    newRows[0][0] === 'New Acme LLC' &&
    newRows[0][1] === 'https://www.linkedin.com/company/new-acme' &&
    newRows[0][2] === 'https://newacme.io',
    'First row values match strictly'
  );
  assert(
    newRows[1][1] === '',
    'Null LinkedIn is formatted as empty string in sheet row'
  );

  console.log(`\nTests finished: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

testGoogleSheetsLogic();
