import { MCPServer } from 'mcp-use';
declare const server: MCPServer<never, import("hono").Env>;
export declare const scrapeGoogleMaps: import("mcp-use").ToolRef<"scrape_google_maps", {
    query: string;
    location: string;
    limit: number;
    enrich_leads: boolean;
    timeout_seconds: number;
    fields?: string[] | undefined;
}, {
    query: string;
    location: string;
    requested_limit: number;
    total_scraped: number;
    has_more: boolean;
    results: Record<string, any>[];
}>;
export declare const getScraperStatus: import("mcp-use").ToolRef<"get_scraper_status", Record<string, never>, {
    status: string;
    extensionLoaded: boolean;
    chromePath: boolean;
    backendReachable: boolean;
}>;
export declare const scrapeCompanyLeads: import("mcp-use").ToolRef<"scrape_company_leads", {
    query: string;
    location: string;
    limit: number;
    sheet_name: string;
    enrich_linkedin: boolean;
    sales_navigator: boolean;
    timeout_seconds: number;
    google_sheet?: string | undefined;
}, {
    query: string;
    location: string;
    total_found: number;
    unique_companies: number;
    companies_with_website: number;
    companies_with_linkedin: number;
    added_to_google_sheet: number;
    duplicates_skipped: number;
    google_sheet_url: string | null;
    summary: string;
    results: {
        company_name: string;
        linkedin: string | null;
        website: string | null;
        linkedin_source: "maps" | "website" | "web_search" | "not_found";
        sales_navigator_url?: string | undefined;
    }[];
}>;
export default server;
export declare function startHttpServer(port?: number, host?: string): Promise<{
    port: number;
    url: string;
}>;
