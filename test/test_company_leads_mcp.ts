import { spawn } from 'child_process';
import path from 'path';

async function testCompanyLeadsMcp() {
  console.log('Testing MCP Discovery for scrape_company_leads over STDIO...');

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

  function waitForMessage(predicate: (msg: any) => boolean, timeoutMs: number = 10000): Promise<any> {
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
    // 1. Send initialize
    console.log('1. Initializing client...');
    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-leads-client', version: '1.0.0' },
      },
    });

    const initResp = await waitForMessage((m) => m.id === 1);
    console.log('Initialized successfully:', initResp.result.serverInfo);

    // 2. Send initialized notification
    send({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    });

    // 3. Send tools/list
    console.log('2. Requesting tools/list...');
    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });

    const toolsResp = await waitForMessage((m) => m.id === 2);
    const tools = toolsResp.result.tools || [];
    console.log('Discovered tools:', tools.map((t: any) => t.name));

    const leadsTool = tools.find((t: any) => t.name === 'scrape_company_leads');
    if (!leadsTool) {
      throw new Error('[FAIL] scrape_company_leads tool NOT found in tools/list!');
    }
    console.log('  [PASS] scrape_company_leads tool discovered.');
    console.log('  Tool description:', leadsTool.description);

    // Validate parameters of scrape_company_leads
    const schemaProps = leadsTool.inputSchema?.properties || {};
    const requiredProps = leadsTool.inputSchema?.required || [];
    console.log('  Parameters:', Object.keys(schemaProps));
    console.log('  Required:', requiredProps);

    if (!schemaProps.query || !schemaProps.location) {
      throw new Error('[FAIL] query and location should be defined in inputSchema!');
    }
    if (!schemaProps.google_sheet) {
      throw new Error('[FAIL] google_sheet parameter missing from inputSchema!');
    }
    if (!schemaProps.enrich_linkedin) {
      throw new Error('[FAIL] enrich_linkedin parameter missing from inputSchema!');
    }

    console.log('\n[PASS] scrape_company_leads tool registration and schema verified over STDIO!');
  } finally {
    child.kill();
  }
}

testCompanyLeadsMcp().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
