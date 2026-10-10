export function getTestPageHtml(port: number, apiKey: string = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Maps Company Leads Scraper — Test Console</title>
  <style>
    :root {
      --bg: #090d16;
      --card: #131b2e;
      --border: #22304e;
      --text: #f1f5f9;
      --muted: #94a3b8;
      --primary: #38bdf8;
      --primary-hover: #0ea5e9;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      line-height: 1.5;
      padding: 2rem 1rem;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .logo-area h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .logo-area p {
      color: var(--muted);
      font-size: 0.9rem;
      margin-top: 0.2rem;
    }
    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 500;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: var(--success);
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--success);
      box-shadow: 0 0 8px var(--success);
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    @media (min-width: 768px) {
      .grid { grid-template-columns: 360px 1fr; }
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.25);
    }
    .card h2 {
      font-size: 1.15rem;
      font-weight: 600;
      margin-bottom: 1.25rem;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .form-group {
      margin-bottom: 1.1rem;
    }
    label {
      display: block;
      font-size: 0.85rem;
      font-weight: 500;
      color: var(--muted);
      margin-bottom: 0.4rem;
    }
    input[type="text"], input[type="number"] {
      width: 100%;
      padding: 0.65rem 0.85rem;
      background: #0b1220;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: #fff;
      font-size: 0.95rem;
      transition: border-color 0.15s ease;
    }
    input[type="text"]:focus, input[type="number"]:focus {
      outline: none;
      border-color: var(--primary);
    }
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin: 1.25rem 0;
      font-size: 0.9rem;
      color: #cbd5e1;
      cursor: pointer;
    }
    .checkbox-group input {
      accent-color: var(--primary);
      width: 16px;
      height: 16px;
    }
    button.btn-primary {
      width: 100%;
      padding: 0.85rem;
      background: var(--primary);
      color: #030712;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      transition: background 0.15s ease, transform 0.05s ease;
    }
    button.btn-primary:hover:not(:disabled) {
      background: var(--primary-hover);
    }
    button.btn-primary:active:not(:disabled) {
      transform: scale(0.99);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .info-box {
      margin-top: 1.25rem;
      padding: 0.85rem;
      background: #0b1220;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 0.8rem;
      color: var(--muted);
    }
    .info-box code {
      color: var(--primary);
      background: rgba(56, 189, 248, 0.1);
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
    }
    .metrics-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }
    .metric-card {
      background: #0b1220;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      text-align: center;
    }
    .metric-num {
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--primary);
    }
    .metric-label {
      font-size: 0.75rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .results-table-wrap {
      overflow-x: auto;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: #0b1220;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
    }
    th {
      background: #0e172a;
      color: var(--muted);
      font-weight: 600;
      text-align: left;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #1a253c;
      color: #e2e8f0;
      vertical-align: middle;
    }
    tr:last-child td {
      border-bottom: none;
    }
    tr:hover td {
      background: rgba(255,255,255,0.02);
    }
    a.link {
      color: var(--primary);
      text-decoration: none;
      word-break: break-all;
    }
    a.link:hover {
      text-decoration: underline;
    }
    .source-badge {
      display: inline-block;
      font-size: 0.7rem;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      margin-left: 0.4rem;
      font-weight: 500;
      text-transform: uppercase;
    }
    .badge-maps { background: rgba(56, 189, 248, 0.2); color: #38bdf8; }
    .badge-website { background: rgba(16, 185, 129, 0.2); color: #10b981; }
    .badge-search { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
    .badge-notfound { background: rgba(148, 163, 184, 0.15); color: #94a3b8; }
    .sales-nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.65rem;
      background: rgba(14, 165, 233, 0.12);
      border: 1px solid rgba(14, 165, 233, 0.35);
      border-radius: 6px;
      color: #38bdf8;
      font-size: 0.78rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .sales-nav-btn:hover {
      background: rgba(14, 165, 233, 0.25);
      border-color: #38bdf8;
      text-decoration: none;
      color: #fff;
    }
    .status-banner {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .status-banner.running {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #7dd3fc;
    }
    .status-banner.error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(56, 189, 248, 0.3);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .mcp-endpoints {
      margin-top: 2rem;
      padding: 1.25rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      font-size: 0.85rem;
      color: var(--muted);
    }
    .mcp-endpoints h3 {
      color: #fff;
      font-size: 0.95rem;
      margin-bottom: 0.5rem;
    }
    .mcp-endpoints code {
      color: #38bdf8;
      background: #0b1220;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo-area">
        <h1>🗺️ Google Maps Company Lead Scraper</h1>
        <p>Production MCP Server • Strictly 3 Business Fields: Company Name, LinkedIn & Website</p>
      </div>
      <div>
        <span class="badge-status" id="healthBadge">
          <span class="dot"></span>
          <span id="healthText">Checking Server...</span>
        </span>
      </div>
    </header>

    <div class="grid">
      <!-- Input Form Card -->
      <div class="card">
        <h2>⚙️ Scrape Settings</h2>
        <form id="scrapeForm" onsubmit="handleScrape(event)">
          <div class="form-group">
            <label for="query">Business Keyword / Category</label>
            <input type="text" id="query" value="software companies" required placeholder="e.g. software companies, supermarkets, lawyers">
          </div>
          <div class="form-group">
            <label for="location">Location / City</label>
            <input type="text" id="location" value="Nagpur" required placeholder="e.g. New York, Chicago, Nagpur">
          </div>
          <div class="form-group">
            <label for="limit">Target Limit (Companies)</label>
            <input type="number" id="limit" value="3" min="1" max="100" required>
          </div>
          <div class="form-group">
            <label for="sheet">Google Sheet URL or ID (Integrated & Active)</label>
            <input type="text" id="sheet" value="https://docs.google.com/spreadsheets/d/1OZwLheM2N6AaTC2_-_tP7N4iwDPNuOtQawYQAOst0gQ/edit">
            <span style="font-size: 0.75rem; color: #10b981; display: block; margin-top: 0.3rem;">
              ✅ <em>Connected! Appends deduplicated leads into the <strong>Company Leads</strong> tab.</em>
            </span>
          </div>
          <div class="form-group">
            <label for="apiKey">API Key (Required for authenticated production servers)</label>
            <input type="password" id="apiKey" value="${apiKey}" placeholder="Leave blank for open local mode">
          </div>
          <label class="checkbox-group">
            <input type="checkbox" id="enrich" checked>
            <span>Run 5-Tier LinkedIn Fallback (Maps &rarr; Website &rarr; Web Search)</span>
          </label>
          <label class="checkbox-group" style="margin-top: -0.5rem; margin-bottom: 1.25rem;">
            <input type="checkbox" id="salesNav">
            <span>🧭 Sales Navigator Mode (Save direct Sales Nav URLs to Google Sheet)</span>
          </label>
          <button type="submit" id="submitBtn" class="btn-primary">
            <span>🚀 Run Lead Scrape</span>
          </button>
        </form>

        <div class="info-box">
          <strong>Strict 3-Field Output:</strong> Only official <code>Company Name</code>, <code>LinkedIn Company Page</code>, and clean <code>Website</code> are output. Personal <code>/in/</code> profiles are strictly rejected.
        </div>
      </div>

      <!-- Results Display Card -->
      <div class="card">
        <h2>📊 Results & Verification</h2>

        <div id="statusArea"></div>

        <div id="metricsRow" class="metrics-row" style="display: none;">
          <div class="metric-card">
            <div class="metric-num" id="metricTotal">0</div>
            <div class="metric-label">Maps Found</div>
          </div>
          <div class="metric-card">
            <div class="metric-num" id="metricUnique">0</div>
            <div class="metric-label">Unique Co.</div>
          </div>
          <div class="metric-card">
            <div class="metric-num" id="metricWeb">0</div>
            <div class="metric-label">Websites</div>
          </div>
          <div class="metric-card">
            <div class="metric-num" id="metricLinkedin">0</div>
            <div class="metric-label">LinkedIn</div>
          </div>
        </div>

        <div id="resultsTableContainer">
          <p style="color: var(--muted); font-size: 0.9rem; text-align: center; padding: 3rem 0;">
            Configure parameters on the left and click <strong>Run Lead Scrape</strong> to test live.
          </p>
        </div>
      </div>
    </div>

    <!-- MCP Integration Footer -->
    <div class="mcp-endpoints">
      <h3>🔗 MCP Server Endpoints (for Claude, Cursor, or MCP Inspector)</h3>
      <p style="margin-bottom: 0.4rem;">
        • <strong>HTTP SSE Endpoint:</strong> <code>http://localhost:${port}/mcp</code>
      </p>
      <p style="margin-bottom: 0.4rem;">
        • <strong>MCP Inspector Web Tool:</strong> Run <code>npx @modelcontextprotocol/inspector http://localhost:${port}/mcp</code>
      </p>
      <p>
        • <strong>Native STDIO Command:</strong> <code>node dist/cli.js --stdio</code>
      </p>
    </div>
  </div>

  <script>
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        const badge = document.getElementById('healthBadge');
        const text = document.getElementById('healthText');
        if (data.status === 'healthy') {
          text.textContent = 'Server Online & Ready';
          badge.style.color = '#10b981';
          badge.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        } else {
          text.textContent = 'Engine Offline';
          badge.style.color = '#f59e0b';
        }
      } catch (err) {
        document.getElementById('healthText').textContent = 'Connecting...';
      }
    }
    try {
      const urlKey = new URLSearchParams(window.location.search).get('api_key') || new URLSearchParams(window.location.search).get('apiKey');
      const apiKeyInput = document.getElementById('apiKey');
      if (urlKey && apiKeyInput) {
        apiKeyInput.value = urlKey;
        localStorage.setItem('mcp_api_key', urlKey);
      } else if (apiKeyInput && !apiKeyInput.value && localStorage.getItem('mcp_api_key')) {
        apiKeyInput.value = localStorage.getItem('mcp_api_key');
      }
    } catch (e) {}

    checkHealth();

    async function handleScrape(e) {
      e.preventDefault();
      const query = document.getElementById('query').value.trim();
      const location = document.getElementById('location').value.trim();
      const limit = parseInt(document.getElementById('limit').value, 10);
      const sheet = document.getElementById('sheet').value.trim();
      const enrich = document.getElementById('enrich').checked;
      const salesNav = document.getElementById('salesNav').checked;
      const apiKey = document.getElementById('apiKey') ? document.getElementById('apiKey').value.trim() : '';

      if (apiKey) {
        try { localStorage.setItem('mcp_api_key', apiKey); } catch (e) {}
      }

      const submitBtn = document.getElementById('submitBtn');
      const statusArea = document.getElementById('statusArea');
      const metricsRow = document.getElementById('metricsRow');
      const tableContainer = document.getElementById('resultsTableContainer');

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> <span>Scraping & Discovering...</span>';

      statusArea.innerHTML = \`
        <div class="status-banner running">
          <div class="spinner"></div>
          <div>
            <strong>Scraping in progress...</strong>
            <div style="font-size: 0.8rem; margin-top: 0.2rem; opacity: 0.9;">
              Navigating Google Maps, running MapsScraper extension, and executing 5-tier LinkedIn fallback discovery. This takes ~15-25 seconds.
            </div>
          </div>
        </div>
      \`;

      try {
        const reqHeaders = { 'Content-Type': 'application/json' };
        if (apiKey) {
          reqHeaders['x-api-key'] = apiKey;
          reqHeaders['Authorization'] = 'Bearer ' + apiKey;
        }

        const res = await fetch('/api/scrape', {
          method: 'POST',
          headers: reqHeaders,
          body: JSON.stringify({
            query,
            location,
            limit,
            google_sheet: sheet || undefined,
            enrich_linkedin: enrich,
            sales_navigator: salesNav,
            timeout_seconds: 120,
          })
        });

        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Scraping failed');
        }

        // Display Metrics
        document.getElementById('metricTotal').textContent = data.total_found;
        document.getElementById('metricUnique').textContent = data.unique_companies;
        document.getElementById('metricWeb').textContent = data.companies_with_website;
        document.getElementById('metricLinkedin').textContent = data.companies_with_linkedin;
        metricsRow.style.display = 'grid';

        statusArea.innerHTML = \`
          <div class="status-banner" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #6ee7b7;">
            <div>
              <strong>Scraping Completed Successfully!</strong>
              <div style="font-size: 0.8rem; margin-top: 0.2rem;">
                \${data.summary.replace(/\\n/g, '<br>')}
              </div>
            </div>
          </div>
        \`;

        // Render strictly 3 columns table
        const leads = data.results || [];
        if (leads.length === 0) {
          tableContainer.innerHTML = '<p style="color: var(--muted); text-align: center; padding: 2rem;">No leads found.</p>';
        } else {
          let rowsHtml = '';
          for (const lead of leads) {
            const salesNavUrl = lead.sales_navigator_url || \`https://www.linkedin.com/sales/search/company?query=(spellCorrectionEnabled%3Atrue%2Ckeywords%3A\${encodeURIComponent(lead.company_name)})\`;

            let linkedinHtml = '';
            if (lead.linkedin) {
              linkedinHtml = \`
                <div>
                  <a class="link" href="\${lead.linkedin}" target="_blank" rel="noopener">\${lead.linkedin}</a>
                  <span class="source-badge badge-\${lead.linkedin_source === 'website' ? 'website' : lead.linkedin_source === 'maps' ? 'maps' : lead.linkedin_source === 'web_search' ? 'search' : 'notfound'}">\${lead.linkedin_source}</span>
                  <div style="margin-top: 0.35rem;">
                    <a href="\${salesNavUrl}" target="_blank" rel="noopener" class="sales-nav-btn">
                      🧭 Open in Sales Navigator
                    </a>
                  </div>
                </div>
              \`;
            } else {
              linkedinHtml = \`
                <div>
                  <span style="color: var(--muted); font-style: italic;">Not Found on Maps</span>
                  <span class="source-badge badge-notfound">not found</span>
                  <div style="margin-top: 0.35rem;">
                    <a href="\${salesNavUrl}" target="_blank" rel="noopener" class="sales-nav-btn">
                      🧭 Search on Sales Navigator
                    </a>
                  </div>
                </div>
              \`;
            }

            const websiteHtml = lead.website
              ? \`<a class="link" href="\${lead.website}" target="_blank" rel="noopener">\${lead.website}</a>\`
              : \`<span style="color: var(--muted); font-style: italic;">None</span>\`;

            rowsHtml += \`
              <tr>
                <td style="font-weight: 600; color: #fff;">\${lead.company_name}</td>
                <td>\${linkedinHtml}</td>
                <td>\${websiteHtml}</td>
              </tr>
            \`;
          }

          tableContainer.innerHTML = \`
            <div class="results-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Company Name</th>
                    <th>LinkedIn Company Page</th>
                    <th>Company Website</th>
                  </tr>
                </thead>
                <tbody>
                  \${rowsHtml}
                </tbody>
              </table>
            </div>
          \`;
        }

      } catch (err) {
        statusArea.innerHTML = \`
          <div class="status-banner error">
            <div>
              <strong>Error:</strong> \${err.message}
            </div>
          </div>
        \`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>🚀 Run Lead Scrape</span>';
      }
    }
  </script>
</body>
</html>`;
}
