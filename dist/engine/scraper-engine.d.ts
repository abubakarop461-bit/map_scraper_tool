import { ScrapeGoogleMapsInput, ScrapeGoogleMapsOutput } from '../types.js';
export declare class GoogleMapsScraperEngine {
    private config;
    private context;
    private currentProfileDir;
    private isInitializing;
    constructor();
    private getOrCreateContext;
    checkHealth(): Promise<{
        status: string;
        extensionLoaded: boolean;
        chromePath: boolean;
        backendReachable: boolean;
    }>;
    scrape(input: ScrapeGoogleMapsInput): Promise<ScrapeGoogleMapsOutput>;
    private handleConsentModal;
    close(): Promise<void>;
}
