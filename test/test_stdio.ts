import { spawn } from 'child_process';
import path from 'path';

async function testStdioTransport() {
  console.log('Testing MCP STDIO Transport...');

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
    console.log('1. Sending initialize...');
    send({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-stdio-client', version: '1.0.0' },
      },
    });

    const initResp = await waitForMessage((m) => m.id === 1);
    console.log('Initialize response received:', initResp.result.serverInfo);

    // 2. Send initialized notification
    send({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
      params: {},
    });

    // 3. Send tools/list
    console.log('2. Sending tools/list...');
    send({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });

    const toolsResp = await waitForMessage((m) => m.id === 2);
    const tools = toolsResp.result.tools || [];
    console.log('Tools discovered over stdio:', tools.map((t: any) => t.name));

    if (!tools.find((t: any) => t.name === 'scrape_google_maps')) {
      throw new Error('scrape_google_maps tool missing in tools/list response!');
    }
    if (!tools.find((t: any) => t.name === 'get_scraper_status')) {
      throw new Error('get_scraper_status tool missing in tools/list response!');
    }

    // 4. Send tools/call for get_scraper_status
    console.log('3. Sending tools/call for get_scraper_status...');
    send({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_scraper_status',
        arguments: {},
      },
    });

    const callResp = await waitForMessage((m) => m.id === 3);
    console.log('Health check result over stdio:', callResp.result.structuredContent);

    if (callResp.result.structuredContent?.status !== 'healthy') {
      throw new Error(`Expected healthy status, got: ${callResp.result.structuredContent?.status}`);
    }

    console.log('\n[PASS] MCP STDIO Transport verified successfully!');
  } finally {
    child.kill();
  }
}

testStdioTransport().catch((err) => {
  console.error('STDIO test failed:', err);
  process.exit(1);
});
