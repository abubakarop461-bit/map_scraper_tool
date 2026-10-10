import { spawn } from 'child_process';
import path from 'path';

async function testLiveCompanyLeads() {
  console.log('Running Live End-to-End Test for scrape_company_leads...');

  const cliPath = path.join(process.cwd(), 'dist', 'cli.js');
  const child = spawn(process.execPath, [cliPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: process.env,
  });

  let buffer = '';

  function send(msg: any) {
    const jsonStr = JSON.stringify(msg);
    child.stdin.write(jsonStr + '\n');
  }

  function waitForMessage(predicate: (msg: any) => boolean, timeoutMs: number = 60000): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout waiting for message matching predicate after ${timeoutMs}ms`));
      }, timeoutMs);

      const onData = (chunk: Buffer) => {
        buffer += chunk.toString('utf8');
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed);
            if (predicate(parsed)) {
              clearTimeout(timer);
              child.stdout.off('data', onData);
              resolve(parsed);
              return;
            }
          } catch {}
        }
      };

      child.stdout.on('data', onData);
    });
  }

  try {
    // 1. Initialize
    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'live-test-client', version: '1.0.0' },
      },
    });

    await waitForMessage((m) => m.id === 1);

    send({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    });

    // 2. Call scrape_company_leads
    console.log('Sending scrape_company_leads tool call (query: "software companies", location: "Nagpur", limit: 3)...');
    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'scrape_company_leads',
        arguments: {
          query: 'software companies',
          location: 'Nagpur',
          limit: 3,
          enrich_linkedin: true,
          timeout_seconds: 60,
        },
      },
    });

    const callResp = await waitForMessage((m) => m.id === 2, 90000);
    console.log('\n--- Tool Call Response Received ---');
    const result = callResp.result?.structuredContent;

    if (!result) {
      throw new Error(`No structuredContent returned: ${JSON.stringify(callResp)}`);
    }

    console.log(`Summary:\n${result.summary}\n`);
    console.log(`Total Found: ${result.total_found}`);
    console.log(`Unique Companies: ${result.unique_companies}`);
    console.log(`Companies with Website: ${result.companies_with_website}`);
    console.log(`Companies with LinkedIn: ${result.companies_with_linkedin}`);
    console.log('\nLeads Extracted:');
    console.log(JSON.stringify(result.results, null, 2));

    // Validations:
    if (!Array.isArray(result.results) || result.results.length === 0) {
      throw new Error('Expected at least 1 company lead in results');
    }

    for (const lead of result.results) {
      // 1. Must have company_name
      if (!lead.company_name || typeof lead.company_name !== 'string') {
        throw new Error(`Lead missing company_name: ${JSON.stringify(lead)}`);
      }

      // 2. Must NOT leak extra fields (phone, address, rating, reviews, etc.)
      const allowedKeys = new Set(['company_name', 'linkedin', 'website', 'linkedin_source']);
      for (const key of Object.keys(lead)) {
        if (!allowedKeys.has(key)) {
          throw new Error(`Lead leaked forbidden field '${key}': ${JSON.stringify(lead)}`);
        }
      }

      // 3. If linkedin is present, it MUST be an official /company/ page, never /in/
      if (lead.linkedin) {
        if (!lead.linkedin.includes('linkedin.com/company/')) {
          throw new Error(`Invalid company LinkedIn URL: ${lead.linkedin}`);
        }
        if (lead.linkedin.includes('/in/')) {
          throw new Error(`Personal profile /in/ detected in company LinkedIn: ${lead.linkedin}`);
        }
      }

      // 4. linkedin_source must be valid enum
      const validSources = ['maps', 'website', 'web_search', 'not_found'];
      if (!validSources.includes(lead.linkedin_source)) {
        throw new Error(`Invalid linkedin_source '${lead.linkedin_source}' in lead: ${JSON.stringify(lead)}`);
      }
    }

    console.log('\n[PASS] Live company lead scraping and 3-field output contract verified perfectly!');
  } finally {
    child.kill();
  }
}

testLiveCompanyLeads().catch((err) => {
  console.error('[FAIL] Live test error:', err);
  process.exit(1);
});
