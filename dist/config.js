import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();
export function getShortPath(p) {
    try {
        if (process.platform === 'win32' && fs.existsSync(p)) {
            const short = execSync(`cmd.exe /c "for %I in ("${p}") do @echo %~sI"`).toString().trim();
            if (short && fs.existsSync(short)) {
                return short;
            }
        }
    }
    catch {
        // fallback
    }
    return p;
}
export function getConfig() {
    const rawPath = process.env.EXTENSION_PATH;
    if (!rawPath) {
        throw new Error('[Config Error] EXTENSION_PATH is not set. Please configure EXTENSION_PATH in your .env file pointing to the unpacked Google Maps Scraper extension directory.');
    }
    const extensionPath = getShortPath(rawPath);
    if (!fs.existsSync(extensionPath)) {
        console.warn(`[Config] Warning: Extension path not found: ${extensionPath}`);
    }
    // Use msedge by default on Windows to avoid Chrome profile locks with running Chrome
    const channel = process.env.CHROME_CHANNEL || 'msedge';
    return {
        extensionPath,
        playwrightToken: process.env.PLAYWRIGHT_MCP_EXTENSION_TOKEN || undefined,
        chromeChannel: channel,
        headless: process.env.HEADLESS === 'true',
        defaultTimeoutMs: parseInt(process.env.BROWSER_TIMEOUT_MS || '120000', 10),
    };
}
