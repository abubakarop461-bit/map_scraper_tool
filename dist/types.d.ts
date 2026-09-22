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
