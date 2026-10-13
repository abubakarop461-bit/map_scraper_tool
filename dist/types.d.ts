import { z } from 'zod';
export declare const ScrapeGoogleMapsInputSchema: z.ZodObject<{
    query: z.ZodString;
    location: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    fields: z.ZodOptional<z.ZodArray<z.ZodString>>;
    enrich_leads: z.ZodDefault<z.ZodBoolean>;
    timeout_seconds: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type ScrapeGoogleMapsInput = z.infer<typeof ScrapeGoogleMapsInputSchema>;
export declare const ScrapedBusinessSchema: z.ZodRecord<z.ZodString, z.ZodAny>;
export declare const ScrapeGoogleMapsOutputSchema: z.ZodObject<{
    query: z.ZodString;
    location: z.ZodString;
    requested_limit: z.ZodNumber;
    total_scraped: z.ZodNumber;
    has_more: z.ZodBoolean;
    results: z.ZodArray<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, z.core.$strip>;
export type ScrapeGoogleMapsOutput = z.infer<typeof ScrapeGoogleMapsOutputSchema>;
export interface RawLeadRecord {
    [key: string]: any;
}
export declare const ScrapeCompanyLeadsInputSchema: z.ZodObject<{
    query: z.ZodString;
    location: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    google_sheet: z.ZodOptional<z.ZodString>;
    sheet_name: z.ZodDefault<z.ZodString>;
    enrich_linkedin: z.ZodDefault<z.ZodBoolean>;
    sales_navigator: z.ZodDefault<z.ZodBoolean>;
    timeout_seconds: z.ZodDefault<z.ZodNumber>;
}, z.core.$strip>;
export type ScrapeCompanyLeadsInput = z.infer<typeof ScrapeCompanyLeadsInputSchema>;
export declare const LinkedInSourceSchema: z.ZodEnum<{
    maps: "maps";
    website: "website";
    web_search: "web_search";
    not_found: "not_found";
}>;
export type LinkedInSource = z.infer<typeof LinkedInSourceSchema>;
export declare const CompanyLeadSchema: z.ZodObject<{
    company_name: z.ZodString;
    linkedin: z.ZodNullable<z.ZodString>;
    website: z.ZodNullable<z.ZodString>;
    linkedin_source: z.ZodEnum<{
        maps: "maps";
        website: "website";
        web_search: "web_search";
        not_found: "not_found";
    }>;
    sales_navigator_url: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type CompanyLead = z.infer<typeof CompanyLeadSchema>;
export declare const ScrapeCompanyLeadsOutputSchema: z.ZodObject<{
    query: z.ZodString;
    location: z.ZodString;
    total_found: z.ZodNumber;
    unique_companies: z.ZodNumber;
    companies_with_website: z.ZodNumber;
    companies_with_linkedin: z.ZodNumber;
    added_to_google_sheet: z.ZodNumber;
    duplicates_skipped: z.ZodNumber;
    google_sheet_url: z.ZodNullable<z.ZodString>;
    summary: z.ZodString;
    results: z.ZodArray<z.ZodObject<{
        company_name: z.ZodString;
        linkedin: z.ZodNullable<z.ZodString>;
        website: z.ZodNullable<z.ZodString>;
        linkedin_source: z.ZodEnum<{
            maps: "maps";
            website: "website";
            web_search: "web_search";
            not_found: "not_found";
        }>;
        sales_navigator_url: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type ScrapeCompanyLeadsOutput = z.infer<typeof ScrapeCompanyLeadsOutputSchema>;
export interface ScrapeProgressEvent {
    stage: 'navigating' | 'scrolling' | 'deduping' | 'enriching' | 'syncing' | 'completed' | 'error';
    message: string;
    collected: number;
    target: number;
    currentLead?: CompanyLead;
    batch?: number;
    totalBatches?: number;
}
export type ScrapeProgressCallback = (event: ScrapeProgressEvent) => void;
