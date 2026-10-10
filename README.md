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

> **"Find 100 software companies in Chicago and add them to my Google Sheet."**

or:

> **"Scrape supermarkets in New York."**

- **AI automatically calls `scrape_company_leads`** (or `scrape_google_maps` for general local business data).
- **Playwright automates the local browser & MapsScraper extension** to extract businesses.
- **5-Step LinkedIn Fallback Pipeline** discovers official company LinkedIn pages (`/company/...`), strictly rejecting personal `/in/` profiles.
- **Deduplication Engine** checks against existing records in your Google Sheet by domain, name, and LinkedIn slug.
- **Appends strictly 3 fields** to your Google Sheet: `| Company Name | LinkedIn | Website |`.

---

## 🤖 Give This to Your AI Agent

Paste this ready-to-use instruction block into your AI agent's system instructions, project prompt, or chat session:

```markdown
You have access to the Google Maps Scraper MCP server with two primary tools:
1. `scrape_company_leads`: Company lead generation producing strictly 3 business fields (Company Name, LinkedIn, Website) with LinkedIn fallback discovery and Google Sheets sync.
2. `scrape_google_maps`: Full local business scraping (name, phone, address, rating, website, etc.).

When I ask you to find companies, B2B leads, or add businesses to a Google Sheet (e.g. "Scrape supermarkets in New York and add to my Google Sheet" or "Find 50 software companies in Chicago"):
1. Invoke the `scrape_company_leads` tool.
2. Provide:
   - `query`: Business category / keyword (e.g. "supermarkets", "software companies")
   - `location`: City or region (e.g. "New York", "Chicago")
   - `limit`: Number of companies requested (default: 50)
   - `google_sheet`: (Optional) Google Sheet ID or full spreadsheet URL to append leads to
   - `enrich_linkedin`: true (enables automatic multi-tier LinkedIn fallback discovery)
3. Rules:
   - Produce strictly: Company Name, LinkedIn, Website. Never add phone numbers, ratings, or addresses to the company leads output or Google Sheet.
   - Company LinkedIn URLs must be official company pages (https://www.linkedin.com/company/...). Never use /in/ personal profiles.
   - Never fabricate or guess LinkedIn URLs; if not found, it will be null.
   - When Google Sheet is provided, report the number of leads added, duplicates skipped, and provide the Google Sheet URL.
```

---

## 💬 Natural-Language Examples

You do **not** need to manually format JSON. Simply talk to your AI agent:

### B2B Company Leads & Google Sheets:
- *"Scrape supermarkets in New York and add them to my Google Sheet: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"*
- *"Find 100 software companies in Chicago."*
- *"Extract 50 marketing agencies in Austin with their official company LinkedIn and website."*

### General Local Business Data:
- *"Scrape 50 lawyers in Nagpur with name, phone, address, website and rating."*
- *"Find 20 hospitals in Pune with name, phone, address and website."*
- *"Get 25 CA firms in Mumbai with name, phone, address, website and rating."*

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

### 3. `scrape_company_leads`

Searches Google Maps for businesses, extracts clean B2B company leads with **strictly 3 business fields** (`Company Name`, `Company LinkedIn`, `Company Website`), runs a 5-step LinkedIn discovery fallback pipeline, and optionally syncs deduplicated leads into a Google Sheet.

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `query` | `string` | **Yes** | — | Business category / search keyword (e.g. `'supermarkets'`, `'software companies'`, `'lawyers'`) |
| `location` | `string` | **Yes** | — | Target city or region (e.g. `'New York'`, `'Chicago'`, `'San Francisco'`) |
| `limit` | `number` | No | `50` | Maximum number of unique companies to extract |
| `google_sheet` | `string` | No | `null` | Optional Google Sheet ID or full spreadsheet URL to append leads to |
| `sheet_name` | `string` | No | `'Sheet1'` | Worksheet tab name (default: `'Sheet1'`) |
| `enrich_linkedin` | `boolean` | No | `true` | Whether to run the multi-step LinkedIn fallback discovery pipeline |
| `timeout_seconds` | `number` | No | `180` | Overall timeout for scraping and lead enrichment |

#### Output Structure (Strictly 3 Business Fields):
```json
{
  "query": "software companies",
  "location": "Chicago",
  "total_found": 50,
  "unique_companies": 45,
  "companies_with_website": 43,
  "companies_with_linkedin": 39,
  "added_to_google_sheet": 39,
  "duplicates_skipped": 6,
  "google_sheet_url": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit",
  "summary": "Scraping software companies in Chicago...\nFound: 50 businesses\nUnique companies: 45\nCompanies with websites: 43\nCompanies with LinkedIn: 39\nGoogle Sheet: Added 39 new rows (6 duplicates skipped)",
  "results": [
    {
      "company_name": "Acme Software Corp",
      "linkedin": "https://www.linkedin.com/company/acme-software",
      "website": "https://acmesoftware.com",
      "linkedin_source": "website"
    }
  ]
}
```

> **Note**: `linkedin_source` (`'maps'`, `'website'`, `'web_search'`, or `'not_found'`) is kept internally for diagnostics and is **never** added to your Google Sheet.

### 3. `get_scraper_status`

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

## 📊 Google Sheets Setup (Optional)

When you ask the AI to save leads to a Google Sheet, follow these simple steps:

1. **Create a Service Account**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/) $\to$ **IAM & Admin** $\to$ **Service Accounts**.
   - Create a service account and download the JSON key.
   - Enable the **Google Sheets API** for your project.
2. **Add Credentials to `.env`**:
   ```env
   # Option 1: File path to JSON key
   GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account-key.json

   # OR Option 2: Raw JSON string or base64
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```
3. **Share Your Google Sheet**:
   - Open your target Google Sheet.
   - Click **Share** and add your Service Account email (e.g. `your-agent@project-id.iam.gserviceaccount.com`) as **Editor**.
4. **Target Sheet Layout**:
   - The tool automatically verifies or creates the header row: `| Company Name | LinkedIn | Website |`.
   - New unique rows are appended at the bottom, deduplicating against existing entries by website domain, company name, and LinkedIn URL.

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
