import { chromium, BrowserContext, Page } from 'playwright';
import path from 'path';
import fs from 'fs';
import Papa from 'papaparse';
import { getConfig, ScraperConfig } from '../config.js';
import { normalizeLeadList } from './normalizer.js';
import { ScrapeGoogleMapsInput, ScrapeGoogleMapsOutput, RawLeadRecord } from '../types.js';

export class GoogleMapsScraperEngine {
  private config: ScraperConfig;
  private context: BrowserContext | null = null;
  private currentProfileDir: string | null = null;
  private isInitializing: boolean = false;

  private lastHealthCheckTime: number = 0;
  private lastBackendOk: boolean = true;

  constructor() {
    this.config = getConfig();
  }

  private async getOrCreateContext(): Promise<BrowserContext> {
    if (this.context) {
      return this.context;
    }

    if (this.isInitializing) {
      while (this.isInitializing) {
        await new Promise(r => setTimeout(r, 200));
      }
      if (this.context) return this.context;
    }

    this.isInitializing = true;
    try {
      const uniqueId = `profile_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const userDataDir = path.join(process.cwd(), '.temp', uniqueId);
      this.currentProfileDir = userDataDir;
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }

      const launchArgs = [
        '--headless=new',
        `--disable-extensions-except=${this.config.extensionPath}`,
        `--load-extension=${this.config.extensionPath}`,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-webgl',
        '--disable-webgl2',
        '--disable-3d-apis',
        '--disable-accelerated-2d-canvas',
        '--disable-canvas-aa',
        '--disable-2d-canvas-clip-aa',
        '--disable-gl-drawing-for-tests',
        '--disable-audio-output',
        '--enable-features=NetworkServiceInProcess',
        '--blink-settings=imagesEnabled=false',
        '--no-zygote',
        '--renderer-process-limit=1',
        '--js-flags=--max-old-space-size=96',
        '--disk-cache-size=1048576',
        '--media-cache-size=1048576',
        '--disable-features=Translate,BackForwardCache,AcceptCHFrame,MediaRouter,OptimizationHints',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-update',
        '--disable-domain-reliability',
        '--disable-renderer-backgrounding',
        '--disable-sync',
        '--mute-audio',
        '--no-default-browser-check',
        '--no-first-run',
        '--window-size=1280,900',
      ];

      // To support Chrome Extensions without display server overhead, we pass '--headless=new'
      // in args and headless: false to Playwright (so it invokes the full Chromium binary instead of headless-shell).
      const launchOptions: any = {
        headless: false,
        args: launchArgs,
        viewport: { width: 1280, height: 900 },
        ignoreDefaultArgs: ['--disable-extensions', '--disable-component-extensions-with-background-pages'],
        acceptDownloads: true,
      };

      if (this.config.chromeChannel && this.config.chromeChannel.trim().length > 0) {
        launchOptions.channel = this.config.chromeChannel.trim();
      }

      // MV3 extensions need persistent context with Chromium
      this.context = await chromium.launchPersistentContext(userDataDir, launchOptions);

      // Pre-seed Google consent cookies to bypass worldwide consent modals and language redirects
      await this.context.addCookies([
        {
          name: 'SOCS',
          value: 'CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjAyX3AwGgJlbiACGgYIgLCnpgY',
          domain: '.google.com',
          path: '/',
        },
        {
          name: 'AEC',
          value: 'AckIdNT',
          domain: '.google.com',
          path: '/',
        },
        {
          name: 'hl',
          value: 'en',
          domain: '.google.com',
          path: '/',
        },
      ]).catch(() => {});

      this.context.on('close', () => {
        this.context = null;
      });

      return this.context;
    } finally {
      this.isInitializing = false;
    }
  }

  public async checkHealth(): Promise<{ status: string; extensionLoaded: boolean; chromePath: boolean; backendReachable: boolean }> {
    const extensionExists = fs.existsSync(this.config.extensionPath);
    const now = Date.now();

    // Cache remote check for 60 seconds to prevent heavy external network polling during frequent platform probes
    if (now - this.lastHealthCheckTime > 60000) {
      try {
        const res = await fetch('https://back.mapsscraper.net/dock/datajsonv2/268723136235-0mrnncma1s1590k1i9apkm5t3c6e10pu.apps.googleusercontent.com/1.0', {
          signal: AbortSignal.timeout(4000),
        });
        this.lastBackendOk = res.ok;
      } catch {
        this.lastBackendOk = false;
      }
      this.lastHealthCheckTime = now;
    }

    return {
      status: extensionExists && this.lastBackendOk ? 'healthy' : 'degraded',
      extensionLoaded: extensionExists,
      chromePath: true,
      backendReachable: this.lastBackendOk,
    };
  }

  public async scrape(input: ScrapeGoogleMapsInput): Promise<ScrapeGoogleMapsOutput> {
    const { query, location, limit = 20, fields, timeout_seconds = 120 } = input;
    const context = await this.getOrCreateContext();
    const page = await context.newPage();

    try {
      // Injects CSV blob capture in page context (ignoring image blobs)
      await page.addInitScript(() => {
        (window as any).__GMAPS_EXPORTED_CSV__ = null;
        const origCreateObjectURL = URL.createObjectURL;
        URL.createObjectURL = function (blob: any) {
          if (blob && !blob.type?.includes('image')) {
            blob.text().then((txt: string) => {
              if (txt && (txt.includes('Name,') || txt.includes('"Name"') || txt.includes('Query,') || txt.includes('Address,') || (txt.includes(',') && !txt.startsWith('\x89PNG')))) {
                (window as any).__GMAPS_EXPORTED_CSV__ = txt;
              }
            }).catch(() => {});
          }
          return origCreateObjectURL.apply(this, arguments as any);
        };
      });

      const searchQuery = location ? `${query} in ${location}` : query;
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}/?hl=en`;

      console.error(`[Scraper] Navigating to: ${searchUrl}`);
      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 35000 });
      } catch (err: any) {
        console.error(`[Scraper] page.goto notice: ${err.message}`);
      }

      // Handle any Google consent modal or redirect if present
      await this.handleConsentModal(page);

      console.error(`[Scraper] Waiting for MapsScraper extension UI (<plasmo-csui>)... (Current URL: ${page.url()})`);
      await page.waitForSelector('plasmo-csui', { state: 'attached', timeout: 45000 });
      console.error('[Scraper] <plasmo-csui> attached to DOM. Waiting for "Start Scraping" button...');

      // Check if Google Maps returned "No results found"
      const noResults = await page.locator('text="Google Maps cannot find"').or(page.locator('text="No results found"')).isVisible().catch(() => false);
      if (noResults) {
        console.error('[Scraper] No results found on Google Maps.');
        return {
          query,
          location,
          requested_limit: limit,
          total_scraped: 0,
          has_more: false,
          results: [],
        };
      }

      // Find and click "Start Scraping" button inside the open shadow DOM
      const startBtn = page.locator('plasmo-csui').locator('button:has-text("Start Scraping")');
      await startBtn.waitFor({ state: 'visible', timeout: 25000 });
      console.error('[Scraper] Clicking "Start Scraping"...');
      await startBtn.click();

      // Monitor lead count and wait until requested limit or end of feed
      const startTime = Date.now();
      const maxDurationMs = timeout_seconds * 1000;
      let lastCount = 0;
      let noProgressCount = 0;
      let hasMore = true;

      while (Date.now() - startTime < maxDurationMs) {
        await page.waitForTimeout(2000);

        // Read current lead count from the floating panel text
        const panelText = await page.locator('plasmo-csui').locator('#hw-top-gtbakz').innerText({ timeout: 1500 }).catch(() => '');
        const searchingMatch = panelText.match(/Searching leads for #(\d+)/i);
        const exportMatch = panelText.match(/Export Lead List[^\d]*(\d+)\s*\/\s*(\d+)/i) || panelText.match(/Export Lead List[^\d]*(\d+)/i);

        let currentCount = 0;
        if (searchingMatch) {
          currentCount = parseInt(searchingMatch[1], 10);
        } else if (exportMatch) {
          currentCount = parseInt(exportMatch[1], 10);
        }

        console.error(`[Scraper] Leads collected: ${currentCount} / ${limit} (raw text: "${panelText.replace(/\n+/g, ' ').slice(0, 100)}")`);

        if (currentCount >= limit) {
          console.error(`[Scraper] Target limit reached (${currentCount} >= ${limit}). Stopping.`);
          break;
        }

        // Check if feed ended (Google Maps reached genuine end or extension finished)
        const isEnd = panelText.includes('Search complete.');
        const gmapsEnd = await page.locator('text="You\'ve reached the end of the list."').isVisible().catch(() => false);

        if (isEnd || gmapsEnd) {
          console.error('[Scraper] End of available results reached on Google Maps.');
          hasMore = false;
          break;
        }

        // Stall detector: give enough time for extension to paginate
        if (currentCount === lastCount && currentCount > 0) {
          noProgressCount++;
          if (noProgressCount >= 10) { // 20 seconds without new leads
            console.error('[Scraper] No new results detected after multiple attempts.');
            hasMore = false;
            break;
          }
        } else {
          lastCount = currentCount;
          noProgressCount = 0;
        }
      }

      // Pause scraping via direct DOM click in shadow root
      await page.evaluate(() => {
        const csui = document.querySelector('plasmo-csui');
        if (!csui || !csui.shadowRoot) return;
        const buttons = csui.shadowRoot.querySelectorAll('button');
        for (const b of Array.from(buttons)) {
          if (b.innerText.includes('Pause')) {
            b.click();
            break;
          }
        }
      }).catch(() => {});
      await page.waitForTimeout(1000);

      // Trigger export and wait for download event
      console.error('[Scraper] Triggering CSV export from extension...');
      const downloadPromise = page.waitForEvent('download', { timeout: 20000 }).catch(() => null);

      const clicked = await page.evaluate(() => {
        const csui = document.querySelector('plasmo-csui');
        if (!csui || !csui.shadowRoot) return false;
        const items = csui.shadowRoot.querySelectorAll('.down-item');
        for (const it of Array.from(items)) {
          if ((it as HTMLElement).innerText.includes('CSV')) {
            (it as HTMLElement).click();
            return true;
          }
        }
        return false;
      });

      if (!clicked) {
        throw new Error('Could not find CSV export element in extension shadow root.');
      }

      let csvData = '';

      // Check in-memory hook first (fast, direct, avoids disk/closed page races)
      for (let i = 0; i < 20; i++) {
        const inMem = await page.evaluate(() => (window as any).__GMAPS_EXPORTED_CSV__).catch(() => null);
        if (inMem && inMem.length > 50 && !inMem.startsWith('\x89PNG') && inMem.includes(',')) {
          csvData = inMem;
          console.error(`[Scraper] Successfully captured CSV via in-memory hook (${csvData.length} chars). Normalizing...`);
          break;
        }
        await page.waitForTimeout(250);
      }

      // If in-memory hook didn't catch it, read from Playwright download stream
      if (!csvData) {
        console.error('[Scraper] Reading CSV from Playwright download stream...');
        const download = await downloadPromise;
        if (download) {
          const stream = await download.createReadStream();
          if (stream) {
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
              chunks.push(Buffer.from(chunk));
            }
            csvData = Buffer.concat(chunks).toString('utf8');
            console.error(`[Scraper] Successfully captured CSV from download stream (${csvData.length} chars). Normalizing...`);
          }
        }
      }

      if (!csvData || csvData.trim().length === 0) {
        throw new Error('Failed to capture CSV data from extension.');
      }

      // Parse CSV
      const parseResult = Papa.parse<RawLeadRecord>(csvData, {
        header: true,
        skipEmptyLines: true,
      });

      const rawRecords = parseResult.data || [];
      const normalizedRecords = normalizeLeadList(rawRecords, fields);
      const finalResults = normalizedRecords.slice(0, limit);

      return {
        query,
        location,
        requested_limit: limit,
        total_scraped: finalResults.length,
        has_more: hasMore && finalResults.length >= limit,
        results: finalResults,
      };
    } finally {
      await page.close().catch(() => {});
      // In cloud container environments with 512MB RAM, immediately close and recycle the browser
      // context so all Chromium renderer memory is freed back to the OS between scrapes.
      if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
        await this.close().catch(() => {});
      }
    }
  }

  private async handleConsentModal(page: Page): Promise<void> {
    try {
      const currentUrl = page.url();
      if (currentUrl.includes('consent.google.com')) {
        console.error('[Scraper] Detected consent.google.com redirect. Accepting consent...');
        const consentBtn = page.locator('button:has-text("Accept all"), button:has-text("Alle akzeptieren"), button:has-text("Tout accepter"), form[action*="consent"] button').first();
        if (await consentBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
            consentBtn.click().catch(() => {}),
          ]);
        }
      } else {
        const consentButtons = [
          'button:has-text("Accept all")',
          'button:has-text("Reject all")',
          'button:has-text("I agree")',
          'button:has-text("Before you continue to Google")',
          'button[aria-label*="Accept all"]',
          'button[aria-label*="Reject all"]',
          'form[action*="consent"] button',
        ];
        for (const selector of consentButtons) {
          const btn = page.locator(selector).first();
          if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
            console.error(`[Scraper] Dismissed Google consent dialog using "${selector}".`);
            await btn.click().catch(() => {});
            await page.waitForTimeout(1000);
            break;
          }
        }
      }
    } catch {
      // Ignore consent errors
    }
  }

  public async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
    }
    if (this.currentProfileDir && fs.existsSync(this.currentProfileDir)) {
      try {
        fs.rmSync(this.currentProfileDir, { recursive: true, force: true });
      } catch {}
      this.currentProfileDir = null;
    }
  }
}
