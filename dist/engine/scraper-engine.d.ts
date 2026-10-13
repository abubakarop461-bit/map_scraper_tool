import { ScrapeGoogleMapsInput, ScrapeGoogleMapsOutput } from '../types.js';
export declare class GoogleMapsScraperEngine {
    private config;
    private context;
    private currentProfileDir;
    private isInitializing;
    private lastHealthCheckTime;
    private lastBackendOk;
    constructor();
    private getOrCreateContext;
    checkHealth(): Promise<{
        status: string;
        extensionLoaded: boolean;
        chromePath: boolean;
        backendReachable: boolean;
    }>;
    scrape(input: ScrapeGoogleMapsInput, onProgress?: (event: {
        stage: string;
        message: string;
        collected: number;
        target: number;
    }) => void): Promise<ScrapeGoogleMapsOutput>;
    private handleConsentModal;
    close(): Promise<void>;
}
