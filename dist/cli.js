#!/usr/bin/env node
import { startStdioServer } from './stdio.js';
import { startHttpServer } from './index.js';
const args = process.argv.slice(2);
async function main() {
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Google Maps Scraper MCP Server

Usage:
  npx google-maps-scraper-mcp [options]

Options:
  --stdio        Start in standard I/O mode for MCP clients (default)
  --http         Start as HTTP/SSE MCP server on port 3000
  --port <port>  Port for HTTP mode (default: 3000 or PORT env)
  --help, -h     Show this help message

Environment Variables:
  EXTENSION_PATH               Path to unpacked MapsScraper extension directory (required)
  CHROME_CHANNEL               Browser channel ('msedge' or 'chrome', default: 'msedge' on Win)
  HEADLESS                     Headless mode ('false' recommended for extensions, default: false)
  PORT                         Port for HTTP mode (default: 3000)
  BROWSER_TIMEOUT_MS           Timeout for scraping in ms (default: 120000)
  PLAYWRIGHT_MCP_EXTENSION_TOKEN Optional bridge token
`);
        process.exit(0);
    }
    const isHttp = args.includes('--http') || process.env.MCP_TRANSPORT === 'http';
    if (isHttp) {
        let port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
        const portIndex = args.indexOf('--port');
        if (portIndex !== -1 && args[portIndex + 1]) {
            port = parseInt(args[portIndex + 1], 10);
        }
        await startHttpServer(port);
    }
    else {
        // Default to STDIO transport for standard MCP clients (Claude Desktop, Cursor, Cline, etc.)
        await startStdioServer();
    }
}
main().catch((err) => {
    console.error('[CLI Error] Failed to start Google Maps Scraper MCP Server:', err);
    process.exit(1);
});
