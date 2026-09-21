import { GoogleMapsScraperEngine } from '../src/engine/scraper-engine.js';

async function main() {
  console.log('--- STARTING 5-RESULT TEST ---');
  console.log('Query: lawyers, Location: Nagpur, Limit: 5, Fields: [name, phone, average_rating]');
  const engine = new GoogleMapsScraperEngine();

  try {
    const result = await engine.scrape({
      query: 'lawyers',
      location: 'Nagpur',
      limit: 5,
      fields: ['name', 'phone', 'average_rating'],
      enrich_leads: false,
      timeout_seconds: 90,
    });

    console.log('\n--- SCRAPED RESULTS OUTPUT ---');
    console.log(JSON.stringify(result, null, 2));

    await engine.close();
  } catch (err) {
    console.error('Test failed with error:', err);
    await engine.close();
    process.exit(1);
  }
}

main();
