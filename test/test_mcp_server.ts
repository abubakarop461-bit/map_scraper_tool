import server, { scrapeGoogleMaps, getScraperStatus } from '../src/index.js';

async function testServer() {
  console.log('Testing MCP Server initialization...');
  console.log('Tools registered:', {
    scrapeGoogleMaps: scrapeGoogleMaps.name,
    getScraperStatus: getScraperStatus.name,
  });

  const { port, url } = await server.listen(0);
  console.log(`Server successfully started on ephemeral port: ${port}`);
  console.log(`MCP URL: ${url}`);

  const res = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {}
    })
  });

  console.log('Response status:', res.status);
  const rawText = await res.text();
  console.log('Tools list raw response:\n', rawText);

  console.log('\nTesting tools/call for get_scraper_status...');
  const callRes = await fetch(`http://127.0.0.1:${port}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_scraper_status',
        arguments: {},
      },
    }),
  });

  const callText = await callRes.text();
  console.log('tools/call status:', callRes.status);
  console.log('tools/call response:\n', callText);

  await server.close();
  console.log('Server closed cleanly.');
}

testServer().catch((err) => {
  console.error('Server test error:', err);
  process.exit(1);
});
