import { Server } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { GoogleMapsScraperEngine } from './engine/scraper-engine.js';
import { ScrapeGoogleMapsInputSchema } from './types.js';
export function createStdioServer(engine = new GoogleMapsScraperEngine()) {
    const server = new Server({
        name: 'google-maps-scraper',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    server.setRequestHandler('tools/list', async () => {
        return {
            tools: [
                {
                    name: 'scrape_google_maps',
                    description: 'Search and extract structured local business listings from Google Maps using the MapsScraper Chrome extension. Can scrape arbitrary business categories and locations, returning verified data (name, phone, address, website, rating, coordinates, etc.).',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            query: {
                                type: 'string',
                                description: "Business category, service, or keyword to search for (e.g. 'lawyers', 'hospitals', 'dentists', 'restaurants', 'CA firms')",
                            },
                            location: {
                                type: 'string',
                                description: "City, region, or address to search within (e.g. 'Nagpur', 'Pune, Maharashtra', 'Mumbai', 'Chicago, IL')",
                            },
                            limit: {
                                type: 'integer',
                                default: 20,
                                description: 'Maximum number of unique businesses to scrape (e.g. 5, 20, 50, 100)',
                            },
                            fields: {
                                type: 'array',
                                items: { type: 'string' },
                                description: "Optional list of specific fields to return (e.g. ['name', 'phone', 'address', 'rating', 'website']). If omitted, all available fields are returned.",
                            },
                            enrich_leads: {
                                type: 'boolean',
                                default: false,
                                description: 'Whether to wait for email and social media enrichment (takes extra time per lead)',
                            },
                            timeout_seconds: {
                                type: 'integer',
                                default: 120,
                                description: 'Overall timeout for the scraping run in seconds',
                            },
                        },
                        required: ['query', 'location'],
                    },
                },
                {
                    name: 'get_scraper_status',
                    description: 'Check the health status of the Google Maps Scraper engine, Chrome extension, and backend connectivity.',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
            ],
        };
    });
    server.setRequestHandler('tools/call', async (request) => {
        const { name, arguments: args = {} } = request.params || {};
        if (name === 'scrape_google_maps') {
            try {
                const validated = ScrapeGoogleMapsInputSchema.parse(args);
                const result = await engine.scrape(validated);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2),
                        },
                    ],
                    structuredContent: result,
                };
            }
            catch (err) {
                console.error('[MCP Stdio Error] Scraping failed:', err);
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Error during Google Maps scraping: ${err.message || String(err)}`,
                        },
                    ],
                };
            }
        }
        if (name === 'get_scraper_status') {
            try {
                const health = await engine.checkHealth();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(health, null, 2),
                        },
                    ],
                    structuredContent: health,
                };
            }
            catch (err) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Error checking scraper status: ${err.message || String(err)}`,
                        },
                    ],
                };
            }
        }
        return {
            isError: true,
            content: [
                {
                    type: 'text',
                    text: `Unknown tool: ${name}`,
                },
            ],
        };
    });
    return { server, engine };
}
export async function startStdioServer(engine) {
    const { server, engine: activeEngine } = createStdioServer(engine);
    const transport = new StdioServerTransport();
    process.on('SIGINT', async () => {
        await activeEngine.close().catch(() => { });
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        await activeEngine.close().catch(() => { });
        process.exit(0);
    });
    await server.connect(transport);
    console.error('[MCP Stdio] Google Maps Scraper MCP Server running on stdio');
}
