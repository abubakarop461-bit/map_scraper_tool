import { MCPServer } from 'mcp-use';
declare const server: MCPServer<never, import("hono").Env>;
export declare const scrapeGoogleMaps: import("mcp-use").ToolRef<"scrape_google_maps", {
    query: string;
    location: string;
    limit: number;
    fields?: string[] | undefined;
    enrich_leads: boolean;
    timeout_seconds: number;
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
export default server;
export declare function startHttpServer(port?: number): Promise<{
    port: number;
    url: string;
}>;
