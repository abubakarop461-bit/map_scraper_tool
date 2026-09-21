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
