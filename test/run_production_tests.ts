import server from '../src/index.js';

interface TestCase {
  name: string;
  query: string;
  location: string;
  limit: number;
  fields: string[];
}

const testCases: TestCase[] = [
  {
    name: 'TEST 1: 10 Lawyers in Nagpur',
    query: 'lawyers',
    location: 'Nagpur',
    limit: 10,
    fields: ['name', 'phone', 'address', 'rating'],
  },
  {
    name: 'TEST 2: 15 Hospitals in Pune',
    query: 'hospitals',
    location: 'Pune',
    limit: 15,
    fields: ['name', 'phone', 'address', 'website'],
  },
  {
    name: 'TEST 3: 25 CA Firms in Mumbai',
    query: 'CA firms',
    location: 'Mumbai',
    limit: 25,
    fields: ['name', 'phone', 'address', 'website', 'rating'],
  },
];

async function callMcpTool(port: number, toolName: string, args: Record<string, any>) {
  const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP error: ${res.status} ${res.statusText}`);
  }

  const rawText = await res.text();
  // Parse SSE data line
  const lines = rawText.split('\n');
  let dataJson: any = null;
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        dataJson = JSON.parse(line.slice(6));
        break;
      } catch {}
    }
  }

  if (!dataJson) {
    try {
      dataJson = JSON.parse(rawText);
    } catch {}
  }

  return dataJson;
}

async function runProductionTests() {
  console.log('====================================================');
  console.log('STARTING MCP PRODUCTION VERIFICATION SUITE');
  console.log('====================================================\n');

  const { port, url } = await server.listen(0);
  console.log(`[Suite] MCP Server live on ${url} (port ${port})`);

  try {
    // 0. Health check tool test
    console.log('\n[Suite] Checking Scraper Health Status...');
    const healthResp = await callMcpTool(port, 'get_scraper_status', {});
    console.log('[Suite] Health response:', JSON.stringify(healthResp?.result?.structuredContent, null, 2));

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      console.log(`\n----------------------------------------------------`);
      console.log(`RUNNING ${tc.name}`);
      console.log(`Parameters: query="${tc.query}", location="${tc.location}", limit=${tc.limit}`);
      console.log(`Requested Fields: ${JSON.stringify(tc.fields)}`);
      console.log(`----------------------------------------------------`);

      const startTime = Date.now();
      const response = await callMcpTool(port, 'scrape_google_maps', {
        query: tc.query,
        location: tc.location,
        limit: tc.limit,
        fields: tc.fields,
        enrich_leads: false,
        timeout_seconds: 180,
      });
      const durationMs = Date.now() - startTime;

      if (response?.error || response?.result?.isError) {
        console.error(`FAILED: ${tc.name}`, response.error || response.result);
        throw new Error(`Test failed: ${tc.name}`);
      }

      const structured = response?.result?.structuredContent;
      if (!structured) {
        console.error('No structuredContent returned in MCP response!');
        console.error('Raw response:', JSON.stringify(response, null, 2));
        throw new Error(`Test failed: ${tc.name} missing structuredContent`);
      }

      console.log(`\n[SUCCESS] ${tc.name} finished in ${(durationMs / 1000).toFixed(1)}s`);
      console.log(`Requested Limit: ${structured.requested_limit}`);
      console.log(`Total Scraped:   ${structured.total_scraped}`);
      console.log(`Has More:        ${structured.has_more}`);
      console.log(`First 3 Results Sample:`);
      console.log(JSON.stringify(structured.results.slice(0, 3), null, 2));
      console.log(`Total listings in array: ${structured.results.length}`);

      // Verification checks
      if (structured.results.length !== structured.total_scraped) {
        throw new Error(`Mismatch: results.length (${structured.results.length}) != total_scraped (${structured.total_scraped})`);
      }
      if (structured.total_scraped > tc.limit) {
        throw new Error(`Limit exceeded: ${structured.total_scraped} > ${tc.limit}`);
      }

      // Check field projection
      for (const item of structured.results) {
        const itemKeys = Object.keys(item);
        for (const reqField of tc.fields) {
          if (!(reqField in item)) {
            console.warn(`Warning: expected key "${reqField}" in result item keys:`, itemKeys);
          }
        }
      }

      // Check token leakage
      const rawString = JSON.stringify(response);
      if (process.env.PLAYWRIGHT_MCP_EXTENSION_TOKEN && rawString.includes(process.env.PLAYWRIGHT_MCP_EXTENSION_TOKEN)) {
        throw new Error('CRITICAL SECURITY VIOLATION: PLAYWRIGHT_MCP_EXTENSION_TOKEN leaked in response!');
      }
    }

    console.log('\n====================================================');
    console.log('ALL 3 PRODUCTION TESTS COMPLETED AND VERIFIED SUCCESSFULLY!');
    console.log('====================================================\n');
  } finally {
    await server.close();
    console.log('[Suite] MCP Server closed cleanly.');
  }
}

runProductionTests().catch((err) => {
  console.error('[Suite] Verification failed:', err);
  process.exit(1);
});
