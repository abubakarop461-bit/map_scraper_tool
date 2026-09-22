export interface ScraperConfig {
    extensionPath: string;
    playwrightToken?: string;
    chromeChannel: string;
    headless: boolean;
    defaultTimeoutMs: number;
}
export declare function getShortPath(p: string): string;
export declare function getConfig(): ScraperConfig;
