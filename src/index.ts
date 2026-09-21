import { MCPServer } from 'mcp-use';
import { z } from 'zod';
import { GoogleMapsScraperEngine } from './engine/scraper-engine.js';
import {
  ScrapeGoogleMapsInputSchema,
  ScrapeGoogleMapsOutputSchema,
} from './types.js';

const server = new MCPServer({
  name: 'google-maps-scraper',
  version: '1.0.0',
});

const engine = new GoogleMapsScraperEngine();

export const scrapeGoogleMaps = server.tool(
  {
    name: 'scrape_google_maps',
    description:
      'Search and extract structured local business listings from Google Maps using the MapsScraper Chrome extension. Can scrape arbitrary business categories and locations, returning verified data (name, phone, address, website, rating, coordinates, etc.).',
    inputSchema: ScrapeGoogleMapsInputSchema,
    outputSchema: ScrapeGoogleMapsOutputSchema,
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
  async (args) => {
    try {
      const result = await engine.scrape(args);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result,
      };
    } catch (err: any) {
      console.error('[MCP Error] Scraping failed:', err);
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
);

export const getScraperStatus = server.tool(
  {
    name: 'get_scraper_status',
    description: 'Check the health status of the Google Maps Scraper engine, Chrome extension, and backend connectivity.',
    inputSchema: z.object({}),
    outputSchema: z.object({
      status: z.string(),
      extensionLoaded: z.boolean(),
      chromePath: z.boolean(),
      backendReachable: z.boolean(),
    }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async () => {
    const health = await engine.checkHealth();
    return {
      content: [{ type: 'text', text: JSON.stringify(health, null, 2) }],
      structuredContent: health,
    };
  }
);

// Graceful cleanup on exit
process.on('SIGINT', async () => {
  await engine.close();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await engine.close();
  process.exit(0);
});

// Default export for mcp-use CLI / runner
export default server;

export async function startHttpServer(port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000) {
  const result = await server.listen(port);
  console.error(`[MCP HTTP] Google Maps Scraper MCP Server listening on ${result.url} (port ${result.port})`);
  return result;
}

// If executed directly (e.g. node dist/index.js or tsx src/index.ts)
const isDirectRun = process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'));
if (isDirectRun) {
  startHttpServer().catch((err) => {
    console.error('[MCP] Failed to start server:', err);
  });
}
