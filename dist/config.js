import path from 'path';
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
    let rawPath = process.env.EXTENSION_PATH;
    if (!rawPath || !fs.existsSync(rawPath)) {
        const defaultLocal = path.join(process.cwd(), 'extension');
        if (fs.existsSync(defaultLocal)) {
            rawPath = defaultLocal;
        }
        else if (!rawPath) {
            throw new Error('[Config Error] EXTENSION_PATH is not set and no ./extension directory was found. Please configure EXTENSION_PATH in your environment.');
        }
    }
    const extensionPath = getShortPath(rawPath);
    if (!fs.existsSync(extensionPath)) {
        console.warn(`[Config] Warning: Extension path not found: ${extensionPath}`);
    }
    // Use msedge by default on Windows to avoid Chrome profile locks with running Chrome.
    // On Linux/Docker, default to empty string so Playwright uses bundled Chromium.
    const defaultChannel = process.platform === 'win32' ? 'msedge' : '';
    const channel = process.env.CHROME_CHANNEL !== undefined ? process.env.CHROME_CHANNEL : defaultChannel;
    return {
        extensionPath,
        playwrightToken: process.env.PLAYWRIGHT_MCP_EXTENSION_TOKEN || undefined,
        chromeChannel: channel,
        headless: process.env.HEADLESS === 'true',
        defaultTimeoutMs: parseInt(process.env.BROWSER_TIMEOUT_MS || '120000', 10),
    };
}
