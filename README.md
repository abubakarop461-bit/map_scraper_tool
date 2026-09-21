# Google Maps Scraper MCP

Turn natural-language Google Maps requests into structured business data using MCP, Playwright, and the MapsScraper Chrome extension.

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Standard%202026-blue.svg)](https://modelcontextprotocol.io)
[![Agent: Agnostic](https://img.shields.io/badge/Agent-Agnostic-purple.svg)](#connect-your-ai-agent)
[![Playwright](https://img.shields.io/badge/Playwright-Automation-orange.svg)](https://playwright.dev)
[![Status](https://img.shields.io/badge/Status-Verified%20Open--Source-brightgreen.svg)](#verified-tests)

</div>

The MCP server has been tested end-to-end with real Google Maps scraping and is ready for open-source publication.

This project controls your existing unpacked [MapsScraper](https://mapsscraper.net) Manifest V3 Chrome extension via Playwright automation rather than attempting to reverse-engineer Google Maps internal protobuf endpoints. It exposes the scraper through the Model Context Protocol (MCP) so that any AI coding assistant or agent can trigger verified lead generation on demand.

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Outgrow-Intelligence-Studios/google-maps-scraper-mcp.git
cd google-maps-scraper-mcp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure `.env`

```bash
# Windows (PowerShell):
Copy-Item .env.example .env

# macOS / Linux:
cp .env.example .env
```

Open `.env` and set `EXTENSION_PATH` to the folder containing your unpacked MapsScraper extension:

```env
EXTENSION_PATH=C:\path\to\google-maps-scraper-v2.6.0
CHROME_CHANNEL=msedge
HEADLESS=false
PORT=3000
```

> **Windows Tip**: We recommend `CHROME_CHANNEL=msedge` to avoid profile lock conflicts with active Chrome windows.

### 4. Build and start the server

```bash
npm run build
npm start
```

Your MCP server is now active and listening at:
```text
http://localhost:3000/mcp
```

### 5. Connect an MCP-compatible AI client

Add the server endpoint `http://localhost:3000/mcp` to your MCP client configuration (see [Connect Your AI Agent](#connect-your-ai-agent)).

---

## Connect Your AI Agent

The Google Maps Scraper MCP server exposes an HTTP/SSE endpoint at:

```text
http://localhost:3000/mcp
```

### Generic MCP Client Configuration

Add this block to your MCP client's configuration file:

```json
{
  "mcpServers": {
    "google-maps-scraper": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Client-Specific Setup Notes

- **Claude Desktop**: Paste into your `claude_desktop_config.json` (`%APPDATA%\Claude\claude_desktop_config.json` on Windows or `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS).
- **Cursor**: Navigate to **Settings** $\to$ **Features** $\to$ **MCP Servers** $\to$ **Add New MCP Server** and enter `Type: SSE` (or `HTTP`) with URL `http://localhost:3000/mcp`.
- **Cline / Roo Code**: Paste into `cline_mcp_settings.json`.
- **Other MCP Clients**: Use the MCP server URL above (`http://localhost:3000/mcp`) in your client's MCP configuration.

---

## Give This to Your AI Agent

Copy and paste this exact prompt into your AI agent's system instructions, project prompt, or chat session:

```markdown
You have access to the Google Maps Scraper MCP server.

When I ask you to find, scrape, or extract businesses, professionals, organizations, or places from Google Maps, use the `scrape_google_maps` tool.

Translate my natural-language request into:

- query
- location
- limit
- fields
- enrich_leads when appropriate
- timeout_seconds when appropriate

Rules:

1. Always use the actual `scrape_google_maps` MCP tool.
2. Never fabricate, invent, or mock results.
3. Respect the requested result limit.
4. Respect the requested fields.
5. Return the actual number of results returned.
6. Report `has_more` when available.
7. If fewer results are available than requested, clearly say so.
8. Present the results in a clean Markdown table when appropriate.
```

---

## Try It

Once connected, you do **not** need to manually construct JSON arguments. Simply prompt your AI agent naturally:

- *"Scrape 50 lawyers in Nagpur."*
- *"Find 20 hospitals in Pune with name, phone, address and website."*
- *"Get 100 restaurants in Mumbai with name, address, phone and rating."*
- *"Find 30 CA firms in Mumbai with name, phone, address, website and rating."*
- *"Find 50 dentists in Bangalore with name, phone and website."*

The AI agent will automatically detect your intent, map the query to `scrape_google_maps`, drive the browser extension, extract the listings, and format the verified data in your chat.

---

## MCP Tools

### `scrape_google_maps`

Extracts structured business listings from Google Maps using the MapsScraper Chrome extension.

#### Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | `string` | **Yes** | — | Business category, service, or keyword (e.g. `'lawyers'`, `'hospitals'`, `'dentists'`, `'restaurants'`) |
| `location` | `string` | **Yes** | — | City, region, or address to search within (e.g. `'Nagpur'`, `'Pune'`, `'Mumbai'`) |
| `limit` | `number` | No | `20` | Maximum number of unique businesses to scrape |
| `fields` | `string[]` | No | `all` | Specific fields to project (e.g. `['name', 'phone', 'address', 'website', 'rating']`) |
| `enrich_leads` | `boolean` | No | `false` | Whether to wait for email and social media enrichment (takes extra time) |
| `timeout_seconds` | `number` | No | `120` | Maximum timeout for the scraping run in seconds |

#### Example Tool Input

```json
{
  "query": "hospitals",
  "location": "Pune",
  "limit": 15,
  "fields": ["name", "phone", "address", "website"],
  "enrich_leads": false,
  "timeout_seconds": 180
}
```

#### Example Response

```json
{
  "query": "hospitals",
  "location": "Pune",
  "requested_limit": 15,
  "total_scraped": 15,
  "has_more": true,
  "results": [
    {
      "name": "Jehangir Hospital",
      "phone": "020 6681 8801",
      "address": "32, Sasoon Rd, opposite Railway Station, Sangamvadi, Pune, Maharashtra 411001",
      "website": "http://www.jehangirhospital.com/"
    }
  ]
}
```

### `get_scraper_status`

Performs an instantaneous health check verifying:
- Extension folder existence on disk
- Browser executable availability
- Reachability of the MapsScraper backend service

#### Output

```json
{
  "status": "healthy",
  "extensionLoaded": true,
  "chromePath": true,
  "backendReachable": true
}
```

---

## Architecture

```text
User
  ↓ (Prompt: "Scrape 50 lawyers in Nagpur")
AI Agent
  ↓ (Translates to scrape_google_maps tool call)
MCP Client
  ↓ (JSON-RPC 2.0 / HTTP / SSE)
Google Maps Scraper MCP Server
  ↓ (Launches persistent context)
Playwright
  ↓ (Loads unpacked MV3 extension)
MapsScraper Chrome Extension
  ↓ (Injects XHR interceptor & triggers search)
Google Maps
  ↓ (Emits lead events from DOM & network)
CSV / Scraped Data
  ↓ (Captured via memory hook & download stream)
Normalizer
  ↓ (Cleans placeholders, applies field aliases & filters)
Structured MCP Response
```

### Layer Details

- **AI Agent / Client**: Translates conversational language into MCP JSON-RPC tool calls.
- **MCP Server (`mcp-use`)**: Implements standard tools and schemas, managing request lifecycles statelessly.
- **Playwright Automation**: Spawns isolated, ephemeral browser instances with the extension preloaded, navigating Google Maps and managing consent dialogs.
- **MapsScraper Chrome Extension**: Intercepts Google Maps search results in the page and aggregates business data.
- **Normalizer**: Transforms raw extension CSV headers to canonical `snake_case`, cleans placeholder values, strips internal protobuf hash IDs, and filters to requested fields.

---

## Verified Tests

The following 3 real end-to-end test scenarios were executed against live Google Maps searches:

### Test 1: 10 Lawyers in Nagpur
- **Command**: `npm test`
- **Fields Requested**: `name`, `phone`, `address`, `rating`
- **Result**: **10 listings returned** (`total_scraped: 10`, `has_more: true`).
- **Verified Data**: Returned real Nagpur legal practices (e.g. *Trisheel Khobragade & Associates*, *Adv.Renuka Damani*, *Adv. Ashwinie Tagde*) with verified phone numbers and star ratings.

### Test 2: 15 Hospitals in Pune
- **Command**: `npm test`
- **Fields Requested**: `name`, `phone`, `address`, `website`
- **Result**: **15 listings returned** (`total_scraped: 15`, `has_more: true`).
- **Verified Data**: Returned real Pune healthcare centers (e.g. *Jehangir Hospital*, *Apollo Hospitals Pune*, *Sahyadri Super Speciality Hospital*, *Manipal Hospital*) with verified addresses and websites.

### Test 3: 25 CA Firms in Mumbai
- **Command**: `npm test`
- **Fields Requested**: `name`, `phone`, `address`, `website`, `rating`
- **Result**: **25 listings returned** (`total_scraped: 25`, `has_more: true`).
- **Verified Data**: Successfully executed multi-batch virtual scrolling past 20 items to capture 25 real Chartered Accountant firms in Mumbai (e.g. *R J Gala & Associates*, *CACP Pandey*, *Mohit S. Shah & Co.*).

### Verification Commands

```bash
# Build the TypeScript codebase
npm run build

# Perform strict type checking
npm run typecheck

# Verify the MCP server protocol and tool discovery
npm run test:server

# Execute the 3 end-to-end production scraping tests
npm test
```

---

## Security

- **Never Commit `.env`**: The `.env` file is strictly listed in `.gitignore` to prevent leaking local directories or environment settings.
- **Extension Token Protection**: `PLAYWRIGHT_MCP_EXTENSION_TOKEN` is loaded strictly from environment variables. It is never committed, never logged, never printed to console, and never returned in tool outputs.
- **No Credentials in Documentation**: `.env.example` contains only generic template placeholders.
- **Credential Rotation**: If any credential or extension token is ever accidentally exposed, immediately revoke and rotate it.
- **Isolated Browser Profiles**: Each scraping session uses an ephemeral temporary profile directory that is cleaned up after execution to prevent session or cookie leakage.
- **Safe Path Normalization**: Automatically converts Windows file paths to 8.3 short paths via Windows API to prevent space-splitting command-line injection when passing `--load-extension` flags.

---

## Troubleshooting

| Problem | Cause | Solution |
|---|---|---|
| **Extension not found** | `EXTENSION_PATH` not configured in `.env` | Copy `.env.example` to `.env` and set `EXTENSION_PATH` to the folder containing `manifest.json`. |
| **Browser fails to launch** | Profile collision with active browser | Set `CHROME_CHANNEL=msedge` in `.env` (recommended on Windows), or close any active Google Chrome windows. |
| **Extension not loaded** | Headless mode enabled | Set `HEADLESS=false` in `.env`. Manifest V3 extensions require headful browser mode. |
| **MCP server unavailable** | Port conflict | Change `PORT=3001` in `.env` and update the port in your MCP client configuration. |
| **Google Maps consent dialog** | Regional cookie consent popup | The scraper automatically detects and clicks "Accept all" / "I agree". If unresolved, verify regional system locale settings. |
| **Scraping timeout** | Network latency or large limit | Increase `timeout_seconds` in your tool call (e.g. `180` or `240` seconds for 50+ leads). |
| **Fewer results than requested** | Google Maps reached end of listings | The tool accurately returns all available listings and reports `has_more: false`. |
| **Browser/profile lock** | Stale browser process from previous abrupt termination | Run `taskkill /F /IM msedge.exe` (or `chrome.exe`) or restart the terminal session. |
| **MapsScraper backend unavailable** | Network outage connecting to `mapsscraper.net` | Run `npm run test:server` or call `get_scraper_status` to verify backend reachability. |

---

## Limitations

- **Requires Local Extension**: Requires the unpacked MapsScraper Chrome extension folder locally on disk.
- **Requires Compatible Browser**: Requires Microsoft Edge or Google Chrome installed on the host machine.
- **Dynamic Google Maps Layout**: Google Maps periodically updates its frontend selectors and DOM hierarchy.
- **Listing Availability**: Business density depends on the location and category on Google Maps; the tool accurately reports what Google Maps provides.
- **Third-Party Service Dependence**: The MapsScraper extension communicates with its backend for lead decryption; availability may be affected by network outages.
- **Execution Time for Large Datasets**: Scraping 50–100+ businesses involves virtual scrolling and batching, which naturally takes 30–90 seconds.
- **No Data Fabrication**: The server will never fabricate missing contact info or mock data if a business listing lacks a website or phone number.

---

## Project Structure

```text
google-maps-scraper-mcp/
├── .env.example              # Environment variables template (no secrets)
├── .gitignore                # Protects secrets, node_modules, and temp profiles
├── LICENSE                   # MIT License
├── package.json              # Project scripts and dependencies
├── README.md                 # Documentation and user guide
├── tsconfig.json             # Strict TypeScript compiler settings
├── src/
│   ├── index.ts              # MCP Server entry, tool registrations, and HTTP listener
│   ├── config.ts             # Safe environment loader and Windows short-path helper
│   ├── types.ts              # Zod input & output schemas and TypeScript definitions
│   └── engine/
│       ├── scraper-engine.ts # Playwright automation, shadow DOM interaction, and stream capture
│       └── normalizer.ts     # Data cleansing, field aliases, and projection pipeline
└── test/
    ├── run_production_tests.ts # Full automated test suite verifying all 3 real scenarios
    ├── test-scrape.ts          # 5-lead lawyer test
    ├── test-scrape-hospitals.ts# 20-lead hospital test with field projection
    └── test_mcp_server.ts      # MCP JSON-RPC protocol and tool listing verification
```

---

## Package Scripts

All commands documented in this guide match the scripts in `package.json`:

```bash
# Build the TypeScript project into dist/
npm run build

# Start the server in production mode (requires prior build)
npm start

# Run the server in development mode with hot reload
npm run dev

# Run strict TypeScript type checking without emitting files
npm run typecheck

# Run the full 3-scenario end-to-end production test suite
npm test

# Run the MCP server protocol and health verification test
npm run test:server
```

---

## License

[MIT](LICENSE) © 2026 Outgrow Intelligence Studios
