import { MCPServer } from 'mcp-use';
import { z } from 'zod';
import { GoogleMapsScraperEngine } from './engine/scraper-engine.js';
import { CompanyLeadsEngine } from './engine/company-leads-engine.js';
import {
  ScrapeGoogleMapsInputSchema,
  ScrapeGoogleMapsOutputSchema,
  ScrapeCompanyLeadsInputSchema,
  ScrapeCompanyLeadsOutputSchema,
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

const companyLeadsEngine = new CompanyLeadsEngine(engine);

export const scrapeCompanyLeads = server.tool(
  {
    name: 'scrape_company_leads',
    description:
      'Search Google Maps and generate clean B2B company leads with strictly 3 business fields: Company Name, LinkedIn, and Website. Automatically runs a 5-step LinkedIn discovery fallback pipeline (Maps -> Website -> Public Search -> Verify -> null) and appends deduplicated leads to a Google Sheet.',
    inputSchema: ScrapeCompanyLeadsInputSchema,
    outputSchema: ScrapeCompanyLeadsOutputSchema,
    annotations: { readOnlyHint: false, openWorldHint: true },
  },
  async (args) => {
    try {
      const result = await companyLeadsEngine.scrapeCompanyLeads(args);
      return {
        content: [
          {
            type: 'text',
            text: `${result.summary}\n\n${JSON.stringify(result.results, null, 2)}`,
          },
        ],
        structuredContent: result,
      };
    } catch (err: any) {
      console.error('[MCP Error] Company leads scraping failed:', err);
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error during company leads scraping: ${err.message || String(err)}`,
          },
        ],
      };
    }
  }
);

import { getTestPageHtml } from './ui/test-page.js';

// Global Security & Authentication Middleware
server.use('*', async (c, next) => {
  const path = c.req.path;

  // 1. Always allow health checks without authentication for platform probes (e.g. Render)
  if (path === '/api/health' || path === '/health') {
    return next();
  }

  // 2. Check if an API key or bridge token is configured
  const configuredKey = (process.env.API_KEY || process.env.MCP_API_KEY || '').trim();
  const extensionToken = (process.env.PLAYWRIGHT_MCP_EXTENSION_TOKEN || '').trim();
  if (!configuredKey && !extensionToken) {
    // Open local development mode
    return next();
  }

  // 3. Extract key from Authorization header, x-api-key header, or query parameters
  const authHeader = c.req.header('authorization') || c.req.header('x-api-key') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
  const queryKey = (c.req.query('api_key') || c.req.query('apiKey') || c.req.query('token') || '').trim();

  const providedKey = token || queryKey;
  if (
    (configuredKey && providedKey === configuredKey) ||
    (extensionToken && providedKey === extensionToken)
  ) {
    return next();
  }

  // 4. If accessing browser UI, provide a styled login / unlock screen
  if (path === '/' || path === '/test') {
    return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authentication Required — Google Maps Scraper MCP</title>
  <style>
    body {
      background: #090d16;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 1rem;
      box-sizing: border-box;
    }
    .auth-card {
      background: #131b2e;
      border: 1px solid #22304e;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
    }
    .icon { font-size: 2.5rem; margin-bottom: 1rem; }
    h2 { margin: 0 0 0.5rem 0; font-size: 1.3rem; color: #fff; }
    p { color: #94a3b8; font-size: 0.88rem; line-height: 1.5; margin-bottom: 1.5rem; }
    input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #090d16;
      border: 1px solid #22304e;
      border-radius: 8px;
      color: #fff;
      font-size: 0.95rem;
      box-sizing: border-box;
      margin-bottom: 1rem;
      outline: none;
    }
    input:focus { border-color: #38bdf8; }
    button {
      width: 100%;
      padding: 0.75rem 1rem;
      background: #38bdf8;
      border: none;
      border-radius: 8px;
      color: #090d16;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #0ea5e9; }
    .badge {
      display: inline-block;
      font-size: 0.75rem;
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 9999px;
      padding: 0.2rem 0.6rem;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="auth-card">
    <div class="icon">🔒</div>
    <div class="badge">Protected MCP Endpoint</div>
    <h2>Authentication Required</h2>
    <p>This deployment is private. Please enter your API Key to access the scraper console.</p>
    <form method="GET" action="/test">
      <input type="password" name="api_key" placeholder="Enter API Key" required autofocus />
      <button type="submit">Unlock Console</button>
    </form>
  </div>
</body>
</html>`, 401);
  }

  // 5. For API and MCP endpoints, return standard JSON 401
  return c.json({
    error: 'Unauthorized: Invalid or missing API key. Provide via x-api-key header, Authorization Bearer, or ?api_key= query parameter.',
  }, 401);
});

// Interactive Web UI routes for browser testing
server.get('/test', (c) => {
  const currentPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333;
  const apiKey = (c.req.query('api_key') || c.req.query('apiKey') || c.req.query('token') || '').trim();
  return c.html(getTestPageHtml(currentPort, apiKey));
});

server.get('/', (c) => {
  const currentPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333;
  const apiKey = (c.req.query('api_key') || c.req.query('apiKey') || c.req.query('token') || '').trim();
  return c.html(getTestPageHtml(currentPort, apiKey));
});

server.get('/api/health', async (c) => {
  const health = await engine.checkHealth();
  return c.json(health);
});

server.post('/api/scrape', async (c) => {
  try {
    const body = await c.req.json();
    const result = await companyLeadsEngine.scrapeCompanyLeads(body);
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message || String(err) }, 500);
  }
});

process.on('uncaughtException', (err) => {
  console.error('[FATAL uncaughtException]:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL unhandledRejection]:', reason);
});

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

export async function startHttpServer(
  port: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333,
  host: string = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1')
) {
  const result = await server.listen(port, { host });
  console.error(`[MCP HTTP] Google Maps Scraper MCP Server listening on ${result.url} (port ${result.port}, host ${host})`);
  return result;
}

// If executed directly (e.g. node dist/index.js or tsx src/index.ts)
const isDirectRun = process.argv[1] && (process.argv[1].endsWith('index.ts') || process.argv[1].endsWith('index.js'));
if (isDirectRun) {
  startHttpServer().catch((err) => {
    console.error('[MCP] Failed to start server:', err);
  });
}
