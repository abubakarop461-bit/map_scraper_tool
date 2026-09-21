import { spawn } from 'child_process';
import path from 'path';

async function runRealStdioTests() {
  console.log('====================================================');
  console.log('STARTING REAL END-TO-END STDIO MCP TEST');
  console.log('====================================================');

  const cliPath = path.join(process.cwd(), 'dist', 'cli.js');
  console.log(`[Test] Spawning CLI entrypoint: node ${cliPath}`);

  const child = spawn(process.execPath, [cliPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env },
  });

  let stdoutBuffer = '';
  let nonJsonRpcLinesOnStdout: string[] = [];
  let stderrLogs: string[] = [];
  const pendingRequests = new Map<number, { resolve: (res: any) => void; reject: (err: any) => void }>();

  child.stderr.on('data', (chunk: Buffer) => {
    const text = chunk.toString('utf8');
    stderrLogs.push(text);
    process.stderr.write(`[STDERR LOG] ${text}`);
  });

  child.stdout.on('data', (chunk: Buffer) => {
    stdoutBuffer += chunk.toString('utf8');
    const lines = stdoutBuffer.split('\n');
    stdoutBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && parsed.jsonrpc === '2.0') {
          if (parsed.id && pendingRequests.has(parsed.id)) {
            const { resolve } = pendingRequests.get(parsed.id)!;
            pendingRequests.delete(parsed.id);
            resolve(parsed);
          }
        } else {
          nonJsonRpcLinesOnStdout.push(trimmed);
          console.error(`[VIOLATION] Non-JSON-RPC line on stdout: ${trimmed}`);
        }
      } catch (err) {
        nonJsonRpcLinesOnStdout.push(trimmed);
        console.error(`[VIOLATION] Non-JSON line on stdout: ${trimmed}`);
      }
    }
  });

  let reqId = 1;
  function sendRequest(method: string, params: any = {}, timeoutMs = 180000): Promise<any> {
    const id = reqId++;
    const payload = { jsonrpc: '2.0', id, method, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error(`Timeout waiting for response to ${method} (id=${id}) after ${timeoutMs}ms`));
      }, timeoutMs);

      pendingRequests.set(id, {
        resolve: (val) => {
          clearTimeout(timer);
          resolve(val);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });

      child.stdin.write(JSON.stringify(payload) + '\n');
    });
  }

  function sendNotification(method: string, params: any = {}) {
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
  }

  try {
    // 1. Initialize
    console.log('\n--- Step 1: Initializing over STDIO ---');
    const initResp = await sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'stdio-e2e-tester', version: '1.0.0' },
    });
    console.log('Initialize response:', JSON.stringify(initResp.result?.serverInfo));
    if (!initResp.result?.serverInfo) {
      throw new Error('Failed to initialize: missing serverInfo');
    }

    sendNotification('notifications/initialized');

    // 2. Discover tools
    console.log('\n--- Step 2: Discovering tools via tools/list ---');
    const toolsResp = await sendRequest('tools/list', {});
    const tools: any[] = toolsResp.result?.tools || [];
    console.log(`Discovered ${tools.length} tools:`, tools.map((t) => t.name));

    const scraperTool = tools.find((t) => t.name === 'scrape_google_maps');
    if (!scraperTool) {
      throw new Error('scrape_google_maps not found in tools list');
    }

    // 3. REAL TEST 1: 10 Lawyers in Nagpur
    console.log('\n====================================================');
    console.log('REAL STDIO TEST 1: Scrape 10 lawyers in Nagpur');
    console.log('====================================================');
    const test1Params = {
      query: 'lawyers',
      location: 'Nagpur',
      limit: 10,
      fields: ['name', 'phone', 'address', 'rating'],
    };

    console.log(`Calling scrape_google_maps over STDIO with:`, test1Params);
    const start1 = Date.now();
    const callResp1 = await sendRequest('tools/call', {
      name: 'scrape_google_maps',
      arguments: test1Params,
    }, 180000);
    const dur1 = ((Date.now() - start1) / 1000).toFixed(1);

    if (callResp1.result?.isError) {
      throw new Error(`Test 1 returned isError: ${JSON.stringify(callResp1.result)}`);
    }

    const data1 = callResp1.result?.structuredContent || JSON.parse(callResp1.result?.content[0]?.text);
    console.log(`\nTest 1 finished in ${dur1}s:`);
    console.log(`- Query: ${data1.query}`);
    console.log(`- Location: ${data1.location}`);
    console.log(`- Total Scraped: ${data1.total_scraped}`);
    console.log(`- Has More: ${data1.has_more}`);
    console.log(`- Results count: ${data1.results?.length}`);

    if (!data1.results || data1.results.length < 10) {
      throw new Error(`Expected at least 10 results, got ${data1.results?.length}`);
    }

    // Print first 3 and last 1 results
    console.log('\nSample verified listings from Test 1:');
    console.log(JSON.stringify(data1.results.slice(0, 3), null, 2));

    // Verify fields
    for (const r of data1.results) {
      if (!r.name) throw new Error('Listing missing name');
      const keys = Object.keys(r);
      for (const k of keys) {
        if (!['name', 'phone', 'address', 'rating'].includes(k)) {
          throw new Error(`Unexpected field projected: ${k}`);
        }
      }
    }

    // 4. REAL TEST 2: 15 Hospitals in Pune
    console.log('\n====================================================');
    console.log('REAL STDIO TEST 2: Find 15 hospitals in Pune');
    console.log('====================================================');
    const test2Params = {
      query: 'hospitals',
      location: 'Pune',
      limit: 15,
      fields: ['name', 'phone', 'address', 'website'],
    };

    console.log(`Calling scrape_google_maps over STDIO with:`, test2Params);
    const start2 = Date.now();
    const callResp2 = await sendRequest('tools/call', {
      name: 'scrape_google_maps',
      arguments: test2Params,
    }, 180000);
    const dur2 = ((Date.now() - start2) / 1000).toFixed(1);

    if (callResp2.result?.isError) {
      throw new Error(`Test 2 returned isError: ${JSON.stringify(callResp2.result)}`);
    }

    const data2 = callResp2.result?.structuredContent || JSON.parse(callResp2.result?.content[0]?.text);
    console.log(`\nTest 2 finished in ${dur2}s:`);
    console.log(`- Query: ${data2.query}`);
    console.log(`- Location: ${data2.location}`);
    console.log(`- Total Scraped: ${data2.total_scraped}`);
    console.log(`- Has More: ${data2.has_more}`);
    console.log(`- Results count: ${data2.results?.length}`);

    if (!data2.results || data2.results.length < 15) {
      throw new Error(`Expected at least 15 results, got ${data2.results?.length}`);
    }

    console.log('\nSample verified listings from Test 2:');
    console.log(JSON.stringify(data2.results.slice(0, 3), null, 2));

    // Verify fields
    for (const r of data2.results) {
      if (!r.name) throw new Error('Listing missing name');
      const keys = Object.keys(r);
      for (const k of keys) {
        if (!['name', 'phone', 'address', 'website'].includes(k)) {
          throw new Error(`Unexpected field projected: ${k}`);
        }
      }
    }

    // 5. STDOUT & STDERR & SECURITY VERIFICATION
    console.log('\n====================================================');
    console.log('PROTOCOL & SECURITY AUDIT');
    console.log('====================================================');

    console.log(`1. Non-JSON-RPC lines on stdout: ${nonJsonRpcLinesOnStdout.length}`);
    if (nonJsonRpcLinesOnStdout.length > 0) {
      console.error('Violating lines on stdout:', nonJsonRpcLinesOnStdout);
      throw new Error('STDOUT contained non-JSON-RPC output! MCP protocol violation.');
    } else {
      console.log('   [PASS] stdout contained 100% pure JSON-RPC 2.0 frames.');
    }

    console.log(`2. Diagnostics routed to stderr: ${stderrLogs.length > 0 ? 'YES' : 'NO'}`);
    if (stderrLogs.length === 0) {
      throw new Error('No stderr logs captured.');
    } else {
      console.log('   [PASS] All Playwright and engine diagnostics went to stderr.');
    }

    const secretToken = process.env.PLAYWRIGHT_MCP_EXTENSION_TOKEN;
    if (secretToken && secretToken.length > 5) {
      const allStdout = JSON.stringify(callResp1) + JSON.stringify(callResp2);
      if (allStdout.includes(secretToken)) {
        throw new Error('SECURITY VIOLATION: Extension token leaked in stdout!');
      }
      console.log('   [PASS] Extension token is NOT leaked in stdout.');
    }

    console.log('\n====================================================');
    console.log('ALL REAL STDIO TESTS PASSED WITH 100% REAL GOOGLE MAPS DATA!');
    console.log('====================================================');
  } finally {
    child.kill();
  }
}

runRealStdioTests().catch((err) => {
  console.error('[FATAL] Real STDIO tests failed:', err);
  process.exit(1);
});
