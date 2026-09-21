# 🗺️ Google Maps Scraper MCP

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Standard%202026-blue.svg)](https://modelcontextprotocol.io)
[![Transport](https://img.shields.io/badge/Transport-STDIO%20%7C%20HTTP-orange.svg)](#mcp-configuration)
[![Agent: Agnostic](https://img.shields.io/badge/Agent-Agnostic-purple.svg)](#quick-connect)
[![Playwright](https://img.shields.io/badge/Playwright-Automation-red.svg)](https://playwright.dev)
[![Status](https://img.shields.io/badge/Status-Verified%20Open--Source-brightgreen.svg)](#verified-tests)

</div>

Scrape real Google Maps business data directly from your AI agent using MCP, Playwright, and the MapsScraper extension.

```text
COPY MCP CONFIG  ──▶  PASTE INTO AI AGENT  ──▶  ASK FOR GOOGLE MAPS DATA  ──▶  AI CALLS scrape_google_maps  ──▶  REAL SCRAPED DATA
```

---

## 🚀 Quick Connect

### 1. Install the MapsScraper Extension

Download and extract the unpacked [MapsScraper Chrome extension](https://mapsscraper.net) to a local directory (e.g. `C:\extensions\google-maps-scraper-v2.6.0` or `/Users/you/extensions/google-maps-scraper`).

> **Why is local installation required?** This MCP automates your local browser and extension via Playwright to fetch authentic Google Maps results without reverse-engineering internal protobufs or risking IP blocks.

### 2. Add This to Your MCP Client

Paste this configuration into your MCP client:

```json
{
  "mcpServers": {
    "google-maps-scraper": {
      "command": "npx",
      "args": ["-y", "google-maps-scraper-mcp"],
      "env": {
        "EXTENSION_PATH": "YOUR_EXTENSION_PATH",
        "CHROME_CHANNEL": "msedge",
        "HEADLESS": "false"
      }
    }
  }
}
```

*(Set `EXTENSION_PATH` to the absolute path of your unpacked extension folder, e.g. `C:\\extensions\\google-maps-scraper-v2.6.0`).*

#### Client Setup Quick Reference:
- **Claude Desktop**: Paste into `claude_desktop_config.json` (`%APPDATA%\Claude\claude_desktop_config.json` on Windows, `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS).
- **Cursor**: Navigate to **Settings** $\to$ **Features** $\to$ **MCP Servers** $\to$ **Add New MCP Server** (`Command`: `npx -y google-maps-scraper-mcp`, and add the environment variables).
- **Cline / Roo Code**: Paste into `cline_mcp_settings.json`.
- **Local Clone (Alternative)**: If running from a local clone instead of npx, replace `command` and `args` with:
  ```json
  "command": "node",
  "args": ["C:\\path\\to\\google-maps-scraper-mcp\\dist\\cli.js"]
  ```

#### Option B: HTTP / SSE Mode (Persistent Background Server)

If you prefer running the MCP server as a standalone local web service:

1. Clone and build:
   ```bash
   git clone https://github.com/Outgrow-Intelligence-Studios/google-maps-scraper-mcp.git
   cd google-maps-scraper-mcp
   npm install && npm run build
   ```
2. Start server:
   ```bash
   npm start
   ```
   *(Server starts at `http://localhost:3000/mcp`)*
3. Add to any MCP client:
   ```json
   {
     "mcpServers": {
       "google-maps-scraper": {
         "url": "http://localhost:3000/mcp"
       }
     }
   }
   ```

---

### 3. Ask Your AI Agent!

Simply ask naturally:

> **"Scrape 50 lawyers in Nagpur with name, phone, address, website and rating."**

- **AI automatically calls `scrape_google_maps`** with structured arguments.
- **Playwright controls the local browser/extension** to query Google Maps.
- **Real Google Maps results returned** directly into your AI chat as a structured Markdown table.

---

## 🤖 Give This to Your AI Agent

Paste this ready-to-use instruction block into your AI agent's system instructions, project prompt, or chat session:

```markdown
You have access to the Google Maps Scraper MCP server via the `scrape_google_maps` tool.

When I ask you to find, scrape, or extract businesses, professionals, clinics, services, or locations from Google Maps:

1. Automatically invoke the `scrape_google_maps` tool.
2. Translate my natural request into appropriate arguments:
   - `query`: Business category or search term (e.g. "lawyers", "hospitals", "dentists", "CA firms")
   - `location`: Target city, area, or region (e.g. "Nagpur", "Pune", "Mumbai")
   - `limit`: Number of listings requested (e.g. 10, 25, 50, 100)
   - `fields`: Projected fields requested (e.g. ["name", "phone", "address", "website", "rating"])
3. Rules:
   - Always execute real tool calls. Never fabricate, invent, or mock listings.
   - Respect the requested limits and fields.
   - If fewer results are available than requested, accurately report the count and state `has_more: false`.
   - Format the final data in a clean Markdown table with clickable websites and formatted phone numbers.
```

---

## 💬 Natural-Language Examples

You do **not** need to manually format JSON. Simply talk to your AI agent:

- *"Scrape 50 lawyers in Nagpur."*
- *"Find 20 hospitals in Pune with name, phone, address and website."*
- *"Get 25 CA firms in Mumbai with name, phone, address, website and rating."*
- *"Find 40 restaurants in Connaught Place, New Delhi with rating and phone."*
- *"Extract 15 dental clinics in Bangalore with address and website."*

The AI translates your prompt, triggers `scrape_google_maps`, and presents structured results.

---

## 🛠️ MCP Tools Reference

### 1. `scrape_google_maps`

Extracts structured business listings from Google Maps using the MapsScraper extension.

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | `string` | **Yes** | — | Business category, service, or keyword (e.g. `'lawyers'`, `'hospitals'`, `'dentists'`, `'CA firms'`) |
| `location` | `string` | **Yes** | — | City, region, or address to search within (e.g. `'Nagpur'`, `'Pune'`, `'Mumbai'`) |
| `limit` | `number` | No | `20` | Maximum number of unique businesses to scrape (e.g. `10`, `25`, `50`) |
| `fields` | `string[]` | No | `all` | Specific fields to project (e.g. `['name', 'phone', 'address', 'website', 'rating']`) |
| `enrich_leads` | `boolean` | No | `false` | Whether to wait for email and social media enrichment (takes extra time) |
| `timeout_seconds` | `number` | No | `120` | Maximum timeout for the scraping run in seconds |

#### Example Tool Input:
```json
{
  "query": "hospitals",
  "location": "Pune",
  "limit": 15,
  "fields": ["name", "phone", "address", "website"]
}
```

#### Example Output:
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

### 2. `get_scraper_status`

Checks the real-time operational status of the scraper engine, browser binary, extension folder, and backend reachability.

#### Example Output:
```json
{
  "status": "healthy",
  "extensionLoaded": true,
  "chromePath": true,
  "backendReachable": true
}
```

---

## 🏗️ Architecture

```text
                           ┌───────────────────────────────┐
                           │      User Natural Prompt      │
                           │ ("Scrape 50 lawyers in Pune") │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │      AI Agent / MCP Host      │
                           │  (Claude, Cursor, Cline, etc) │
                           └───────────────┬───────────────┘
                                           │
                       ┌───────────────────┴───────────────────┐
                       │                                       │
            STDIO Transport (Default)               HTTP / SSE Transport
           (Child Process / npx / CLI)             (http://localhost:3000/mcp)
                       │                                       │
                       └───────────────────┬───────────────────┘
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │ Google Maps Scraper MCP Server│
                           │   (src/cli.ts & src/stdio.ts) │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │      Playwright Automation    │
                           │ (Ephemeral browser context)   │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │  MapsScraper Chrome Extension │
                           │   (Manifest V3 local folder)  │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │       Google Maps Engine      │
                           │ (Live search & DOM hydration) │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │      Response Normalizer      │
                           │  (snake_case, alias, filter)  │
                           └───────────────┬───────────────┘
                                           │
                                           ▼
                           ┌───────────────────────────────┐
                           │   Structured JSON Response    │
                           │ (Table presented to the user) │
                           └───────────────────────────────┘
```

---

## 🧪 Verified Tests

The MCP server is tested end-to-end with real Google Maps scraping across multiple categories and cities:

### Test 1: 10 Lawyers in Nagpur
- **Command**: `npm test`
- **Fields**: `name`, `phone`, `address`, `rating`
- **Result**: **10 listings verified** (`total_scraped: 10`, `has_more: true`).
- **Verified Data**: Returned real Nagpur legal practices (e.g. *Trisheel Khobragade & Associates*, *Adv.Renuka Damani*, *Adv. Ashwinie Tagde*) with valid phone numbers and star ratings.

### Test 2: 15 Hospitals in Pune
- **Command**: `npm test`
- **Fields**: `name`, `phone`, `address`, `website`
- **Result**: **15 listings verified** (`total_scraped: 15`, `has_more: true`).
- **Verified Data**: Returned real Pune hospitals (e.g. *Jehangir Hospital*, *Apollo Hospitals Pune*, *Sahyadri Super Speciality Hospital*, *Manipal Hospital*) with valid addresses and hospital websites.

### Test 3: 25 CA Firms in Mumbai
- **Command**: `npm test`
- **Fields**: `name`, `phone`, `address`, `website`, `rating`
- **Result**: **25 listings verified** (`total_scraped: 25`, `has_more: true`).
- **Verified Data**: Successfully executed multi-batch virtual scrolling past the initial 20-item viewport to extract 25 verified Chartered Accountant firms in Mumbai.

### Test Suite Commands:
```bash
# Build TypeScript
npm run build

# Type check
npm run typecheck

# Verify STDIO transport (initialize, tools/list, tools/call)
npm run test:stdio

# Verify HTTP/SSE transport
npm run test:server

# Run all 3 live end-to-end scraping tests
npm test
```

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `EXTENSION_PATH` | **Yes** | — | Absolute path to the unpacked MapsScraper extension directory |
| `CHROME_CHANNEL` | No | `msedge` on Win / `chrome` | Browser channel to use (`msedge`, `chrome`) |
| `HEADLESS` | No | `false` | Headless mode (`false` is required for Chrome Manifest V3 extensions) |
| `PORT` | No | `3000` | Port for HTTP/SSE server mode |
| `BROWSER_TIMEOUT_MS` | No | `120000` | Playwright operation timeout in milliseconds |
| `PLAYWRIGHT_MCP_EXTENSION_TOKEN` | No | — | Optional extension bridge token |

> **Windows Tip**: We recommend `CHROME_CHANNEL=msedge` on Windows to avoid browser profile lock conflicts if you already have Google Chrome open.

---

## 🔒 Security & Privacy

- **No Stored Credentials**: `.env` is strictly excluded in `.gitignore`.
- **Safe Path Normalization**: Automatically converts Windows file paths to 8.3 short paths via Windows API, preventing space-splitting command-line injection when passing browser flags.
- **Token Protection**: `PLAYWRIGHT_MCP_EXTENSION_TOKEN` is loaded strictly from environment variables and is never committed, logged, or exposed in tool outputs.
- **Ephemeral Browser Profiles**: Every scraping session creates an isolated temporary user-data-dir that is cleaned up upon exit.

---

## ⚠️ Requirements & Limitations

- **Local Execution Required**: Because this MCP automates a local browser and Chrome extension, the MCP server must execute on the machine where Google Chrome or Microsoft Edge is installed.
- **Extension Dependency**: You must have the unpacked MapsScraper extension folder locally on disk.
- **Headful Browser**: Manifest V3 Chrome extensions require `HEADLESS=false` to execute background service workers and content scripts.
- **Rate & Listing Limits**: Google Maps search results vary by geographic business density; the tool accurately reports all results provided by Google Maps and flags `has_more: false` when exhausted.

---

## 📁 Repository Structure

```text
google-maps-scraper-mcp/
├── .env.example              # Environment variables template
├── .gitignore                # Protects secrets, node_modules, and temp profiles
├── LICENSE                   # MIT License
├── package.json              # CLI bin entry, dependencies, and test scripts
├── README.md                 # User guide and documentation
├── tsconfig.json             # Strict TypeScript compiler settings
├── src/
│   ├── cli.ts                # Executable CLI entry (supports --stdio and --http)
│   ├── stdio.ts              # Native MCP STDIO transport implementation
│   ├── index.ts              # MCP HTTP/SSE transport implementation
│   ├── config.ts             # Safe environment loader and Windows short-path helper
│   ├── types.ts              # Zod input/output schemas
│   └── engine/
│       ├── scraper-engine.ts # Playwright automation, shadow DOM interaction, stream capture
│       └── normalizer.ts     # Data cleansing, field aliases, and projection pipeline
└── test/
    ├── test_stdio.ts         # Automated STDIO protocol and health verification
    ├── test_mcp_server.ts    # HTTP/SSE protocol and tool listing verification
    ├── run_production_tests.ts # Full 3-scenario end-to-end production test suite
    ├── test-scrape.ts        # 5-lead lawyer test
    └── test-scrape-hospitals.ts # 20-lead hospital test
```

---

## 📜 License

[MIT](LICENSE) © 2026 Outgrow Intelligence Studios
