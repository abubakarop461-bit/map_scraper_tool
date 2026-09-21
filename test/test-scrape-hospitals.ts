import { GoogleMapsScraperEngine } from '../src/engine/scraper-engine.js';

async function main() {
  console.log('--- STARTING 20-RESULT TEST ---');
  console.log('Query: hospitals, Location: Pune, Limit: 20, Fields: [name, phone, address, website]');
  const engine = new GoogleMapsScraperEngine();

  try {
    const result = await engine.scrape({
      query: 'hospitals',
      location: 'Pune',
      limit: 20,
      fields: ['name', 'phone', 'address', 'website'],
      enrich_leads: false,
      timeout_seconds: 120,
    });

    console.log('\n--- SCRAPED RESULTS OUTPUT (COUNT: ' + result.results.length + ') ---');
    console.log(JSON.stringify(result, null, 2));

    await engine.close();
  } catch (err) {
    console.error('Test failed with error:', err);
    await engine.close();
    process.exit(1);
  }
}

main();
