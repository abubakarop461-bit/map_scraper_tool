import { GoogleMapsScraperEngine } from './scraper-engine.js';
import {
  cleanWebsiteUrl,
  extractNormalizedDomain,
  normalizeCompanyName,
  discoverCompanyLinkedIn,
  buildSalesNavigatorCompanyUrl,
  pMap,
} from './leads-normalizer.js';
import { appendLeadsToGoogleSheet, GoogleSheetsSyncResult } from '../services/google-sheets.js';
import {
  ScrapeCompanyLeadsInput,
  ScrapeCompanyLeadsOutput,
  CompanyLead,
} from '../types.js';

export class CompanyLeadsEngine {
  private scraperEngine: GoogleMapsScraperEngine;

  constructor(scraperEngine: GoogleMapsScraperEngine = new GoogleMapsScraperEngine()) {
    this.scraperEngine = scraperEngine;
  }

  public async scrapeCompanyLeads(input: ScrapeCompanyLeadsInput): Promise<ScrapeCompanyLeadsOutput> {
    const {
      query,
      location,
      limit = 50,
      google_sheet,
      sheet_name = 'Sheet1',
      enrich_linkedin = true,
      sales_navigator = false,
      timeout_seconds = 180,
    } = input;

    console.error(`[Company Leads] Starting scraping for "${query}" in "${location}" (Target limit: ${limit})...`);

    // 1. Fetch raw Google Maps listings using the existing production scraper engine
    // Request a buffer of listings so that after deduplication we still satisfy the requested limit
    const rawLimit = Math.max(limit, Math.min(limit * 2, 200));
    const scrapeResult = await this.scraperEngine.scrape({
      query,
      location,
      limit: rawLimit,
      enrich_leads: false,
      timeout_seconds,
    });

    const rawBusinesses = scrapeResult.results || [];
    const totalFound = rawBusinesses.length;
    console.error(`[Company Leads] Extracted ${totalFound} raw listings from Google Maps.`);

    // 2. Initial deduplication in-memory across the scraped businesses
    const seenDomains = new Set<string>();
    const seenNames = new Set<string>();
    const candidateLeads: {
      companyName: string;
      website: string | null;
      rawSocials: any;
    }[] = [];

    for (const b of rawBusinesses) {
      const rawName = (b.name || b.Name || '').trim();
      if (!rawName) continue;

      const rawWebsite = b.website || b.Website || null;
      const cleanWeb = cleanWebsiteUrl(rawWebsite);
      const domain = extractNormalizedDomain(cleanWeb);
      const normName = normalizeCompanyName(rawName);

      // Check deduplication
      if (domain && seenDomains.has(domain)) {
        continue;
      }
      if (normName && seenNames.has(normName)) {
        continue;
      }

      if (domain) seenDomains.add(domain);
      if (normName) seenNames.add(normName);

      candidateLeads.push({
        companyName: rawName,
        website: cleanWeb,
        rawSocials: b.social_medias || b['Social Medias'] || b.socials || null,
      });

      if (candidateLeads.length >= limit) {
        break;
      }
    }

    const uniqueCompanies = candidateLeads.length;
    console.error(`[Company Leads] Unique deduplicated companies: ${uniqueCompanies}`);

    // 3. Run the 5-step LinkedIn discovery fallback pipeline with controlled concurrency
    console.error(`[Company Leads] Discovering company LinkedIn URLs (enrichment: ${enrich_linkedin})...`);

    const enrichedLeads: CompanyLead[] = await pMap(
      candidateLeads,
      async (candidate) => {
        const { linkedin, source } = await discoverCompanyLinkedIn({
          companyName: candidate.companyName,
          location,
          website: candidate.website,
          rawSocials: candidate.rawSocials,
          enrichEnabled: enrich_linkedin,
        });

        console.error(
          `[Company Leads] ${candidate.companyName} -> LinkedIn: ${linkedin || 'Not Found'} (source: ${source})`
        );

        const salesNavUrl = buildSalesNavigatorCompanyUrl(candidate.companyName, linkedin);
        const finalLinkedIn = sales_navigator ? salesNavUrl : linkedin;

        return {
          company_name: candidate.companyName,
          linkedin: finalLinkedIn,
          website: candidate.website,
          linkedin_source: source,
          sales_navigator_url: salesNavUrl,
        };
      },
      5 // 5 concurrent lookups
    );

    const companiesWithWebsite = enrichedLeads.filter((l) => l.website !== null).length;
    const companiesWithLinkedIn = enrichedLeads.filter((l) => l.linkedin !== null).length;

    // 4. If Google Sheet is specified (or configured via DEFAULT_GOOGLE_SHEET_ID), sync leads
    let addedToSheet = 0;
    let sheetDuplicatesSkipped = 0;
    let sheetUrl: string | null = null;
    let sheetError: string | null = null;

    const targetSheet = (google_sheet && google_sheet.trim().length > 0)
      ? google_sheet.trim()
      : (process.env.DEFAULT_GOOGLE_SHEET_ID ? process.env.DEFAULT_GOOGLE_SHEET_ID.trim() : null);

    if (targetSheet) {
      console.error(`[Company Leads] Syncing ${enrichedLeads.length} leads to Google Sheet (${targetSheet})...`);
      try {
        const syncResult: GoogleSheetsSyncResult = await appendLeadsToGoogleSheet({
          spreadsheetInput: targetSheet,
          sheetName: sheet_name,
          leads: enrichedLeads,
        });
        addedToSheet = syncResult.addedCount;
        sheetDuplicatesSkipped = syncResult.skippedCount;
        sheetUrl = syncResult.sheetUrl;
        console.error(
          `[Company Leads] Successfully appended ${addedToSheet} new rows to Google Sheet (Skipped ${sheetDuplicatesSkipped} existing duplicates).`
        );
      } catch (err: any) {
        console.error(`[Company Leads] Failed to sync to Google Sheet:`, err.message);
        sheetError = err.message;
      }
    }

    // 5. Construct summary
    const summaryLines = [
      `Scraping ${query} in ${location}...`,
      '',
      `Found: ${totalFound} businesses`,
      `Unique companies: ${uniqueCompanies}`,
      `Companies with websites: ${companiesWithWebsite}`,
      `Companies with LinkedIn: ${companiesWithLinkedIn}`,
    ];

    if (targetSheet) {
      if (sheetError) {
        summaryLines.push(`Google Sheet Sync: FAILED (${sheetError})`);
        summaryLines.push(`Note: Leads were successfully extracted and are displayed below.`);
      } else {
        summaryLines.push(`New companies added to Google Sheet: ${addedToSheet}`);
        summaryLines.push(`Duplicates skipped in sheet: ${sheetDuplicatesSkipped}`);
        if (sheetUrl) {
          summaryLines.push(`Google Sheet URL: ${sheetUrl}`);
        }
      }
    } else {
      summaryLines.push(`Google Sheet: Not requested (results returned directly)`);
    }

    const summary = summaryLines.join('\n');

    return {
      query,
      location,
      total_found: totalFound,
      unique_companies: uniqueCompanies,
      companies_with_website: companiesWithWebsite,
      companies_with_linkedin: companiesWithLinkedIn,
      added_to_google_sheet: addedToSheet,
      duplicates_skipped: sheetDuplicatesSkipped,
      google_sheet_url: sheetUrl,
      summary,
      results: enrichedLeads,
    };
  }

  public async close(): Promise<void> {
    await this.scraperEngine.close();
  }
}
