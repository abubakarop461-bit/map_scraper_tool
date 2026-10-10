import { z } from 'zod';

export const ScrapeGoogleMapsInputSchema = z.object({
  query: z.string().describe("Business category, service, or keyword to search for (e.g. 'lawyers', 'hospitals', 'dentists', 'restaurants', 'CA firms')"),
  location: z.string().describe("City, region, or address to search within (e.g. 'Nagpur', 'Pune, Maharashtra', 'Mumbai', 'Chicago, IL')"),
  limit: z.number().int().positive().default(20).describe("Maximum number of unique businesses to scrape (e.g. 5, 20, 50, 100)"),
  fields: z.array(z.string()).optional().describe("Optional list of specific fields to return (e.g. ['name', 'phone', 'address', 'rating', 'website']). If omitted, all available fields are returned."),
  enrich_leads: z.boolean().default(false).describe("Whether to wait for email and social media enrichment (takes extra time per lead)"),
  timeout_seconds: z.number().int().positive().default(120).describe("Overall timeout for the scraping run in seconds"),
});

export type ScrapeGoogleMapsInput = z.infer<typeof ScrapeGoogleMapsInputSchema>;

export const ScrapedBusinessSchema = z.record(z.string(), z.any());

export const ScrapeGoogleMapsOutputSchema = z.object({
  query: z.string(),
  location: z.string(),
  requested_limit: z.number().int(),
  total_scraped: z.number().int(),
  has_more: z.boolean(),
  results: z.array(ScrapedBusinessSchema),
});

export type ScrapeGoogleMapsOutput = z.infer<typeof ScrapeGoogleMapsOutputSchema>;

export interface RawLeadRecord {
  [key: string]: any;
}

export const ScrapeCompanyLeadsInputSchema = z.object({
  query: z.string().describe("Business category or search keyword (e.g. 'supermarkets', 'software companies', 'lawyers', 'dentists')"),
  location: z.string().describe("Target city, state, or region (e.g. 'New York', 'Chicago', 'San Francisco', 'Nagpur')"),
  limit: z.number().int().positive().default(50).describe("Number of unique company leads to extract (e.g. 20, 50, 100, 200)"),
  google_sheet: z.string().optional().describe("Optional Google Sheet ID or full spreadsheet URL to append leads to (e.g. '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' or 'https://docs.google.com/spreadsheets/d/.../edit')"),
  sheet_name: z.string().default("Sheet1").describe("Worksheet tab name (default: 'Sheet1')"),
  enrich_linkedin: z.boolean().default(true).describe("Whether to run the multi-step LinkedIn discovery fallback pipeline for missing LinkedIn company pages (default: true)"),
  sales_navigator: z.boolean().default(false).describe("Whether to format LinkedIn output links for LinkedIn Sales Navigator"),
  timeout_seconds: z.number().int().positive().default(180).describe("Overall timeout for scraping and lead enrichment in seconds"),
});

export type ScrapeCompanyLeadsInput = z.infer<typeof ScrapeCompanyLeadsInputSchema>;

export const LinkedInSourceSchema = z.enum(['maps', 'website', 'web_search', 'not_found']);
export type LinkedInSource = z.infer<typeof LinkedInSourceSchema>;

export const CompanyLeadSchema = z.object({
  company_name: z.string().describe("Official company or business name"),
  linkedin: z.string().nullable().describe("Company official LinkedIn page URL (e.g. https://www.linkedin.com/company/example/)"),
  website: z.string().nullable().describe("Clean normalized company website URL"),
  linkedin_source: LinkedInSourceSchema.describe("Internal discovery source: 'maps', 'website', 'web_search', or 'not_found'"),
  sales_navigator_url: z.string().optional().describe("Direct LinkedIn Sales Navigator company search URL"),
});

export type CompanyLead = z.infer<typeof CompanyLeadSchema>;

export const ScrapeCompanyLeadsOutputSchema = z.object({
  query: z.string(),
  location: z.string(),
  total_found: z.number().int().describe("Total raw businesses found on Google Maps"),
  unique_companies: z.number().int().describe("Number of unique companies after deduplication"),
  companies_with_website: z.number().int().describe("Number of companies with verified websites"),
  companies_with_linkedin: z.number().int().describe("Number of companies with official LinkedIn company pages"),
  added_to_google_sheet: z.number().int().describe("Number of new unique rows appended to Google Sheets"),
  duplicates_skipped: z.number().int().describe("Number of duplicate companies skipped"),
  google_sheet_url: z.string().nullable().describe("Link to the updated Google Sheet (if provided)"),
  summary: z.string().describe("Concise human-readable text summary of the scraping and sync run"),
  results: z.array(CompanyLeadSchema).describe("Extracted company leads (strictly Company Name, LinkedIn, Website)"),
});

export type ScrapeCompanyLeadsOutput = z.infer<typeof ScrapeCompanyLeadsOutputSchema>;
