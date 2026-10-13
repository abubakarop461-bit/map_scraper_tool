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
  ScrapeProgressCallback,
} from '../types.js';

export class CompanyLeadsEngine {
  private scraperEngine: GoogleMapsScraperEngine;

  constructor(scraperEngine: GoogleMapsScraperEngine = new GoogleMapsScraperEngine()) {
    this.scraperEngine = scraperEngine;
  }

  public async scrapeCompanyLeads(
    input: ScrapeCompanyLeadsInput,
    onProgress?: ScrapeProgressCallback
  ): Promise<ScrapeCompanyLeadsOutput> {
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
    onProgress?.({
      stage: 'navigating',
      message: `Connecting to Google Maps for "${query}" in "${location}"...`,
      collected: 0,
      target: limit,
    });

    // 1. Fetch raw Google Maps listings using the scraper engine
    // Add a 20% buffer to account for possible raw duplicates
    const rawLimit = limit <= 5 ? limit : Math.min(Math.ceil(limit * 1.25), 250);
    const scrapeResult = await this.scraperEngine.scrape(
      {
        query,
        location,
        limit: rawLimit,
        enrich_leads: false,
        timeout_seconds,
      },
      (p) => {
        onProgress?.({
          stage: p.stage as any,
          message: p.message,
          collected: p.collected,
          target: limit,
        });
      }
    );

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
    onProgress?.({
      stage: 'deduping',
      message: `Deduplicated to ${uniqueCompanies} unique candidate companies...`,
      collected: uniqueCompanies,
      target: limit,
    });

    // 3. Run the 5-step LinkedIn discovery fallback pipeline with controlled concurrency
    console.error(`[Company Leads] Discovering company LinkedIn URLs (enrichment: ${enrich_linkedin})...`);
    let enrichedCount = 0;

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

        const lead: CompanyLead = {
          company_name: candidate.companyName,
          linkedin: finalLinkedIn,
          website: candidate.website,
          linkedin_source: source,
          sales_navigator_url: salesNavUrl,
        };

        enrichedCount++;
        onProgress?.({
          stage: 'enriching',
          message: `[${enrichedCount}/${candidateLeads.length}] Verified ${candidate.companyName} (${source})...`,
          collected: enrichedCount,
          target: candidateLeads.length,
          currentLead: lead,
        });

        return lead;
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
      onProgress?.({
        stage: 'syncing',
        message: `Syncing ${enrichedLeads.length} leads to Google Sheet (${targetSheet})...`,
        collected: enrichedLeads.length,
        target: limit,
      });
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

    onProgress?.({
      stage: 'completed',
      message: `Completed! Extracted ${enrichedLeads.length} leads (${companiesWithWebsite} websites, ${companiesWithLinkedIn} LinkedIn).`,
      collected: enrichedLeads.length,
      target: limit,
    });

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
