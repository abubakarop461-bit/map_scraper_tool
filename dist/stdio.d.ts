import { Server } from '@modelcontextprotocol/server';
import { GoogleMapsScraperEngine } from './engine/scraper-engine.js';
export declare function createStdioServer(engine?: GoogleMapsScraperEngine): {
    server: Server;
    engine: GoogleMapsScraperEngine;
};
export declare function startStdioServer(engine?: GoogleMapsScraperEngine): Promise<void>;
