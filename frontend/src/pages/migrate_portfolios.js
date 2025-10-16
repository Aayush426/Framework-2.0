// migrate_portfolios.js
const { MongoClient } = require('mongodb');

const MONGO_URL = 'mongodb://127.0.0.1:27017'; // replace if different
const DB_NAME = 'test_database';

async function migratePortfolios() {
  const client = new MongoClient(MONGO_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);

    const photographers = await db.collection('photographer_profiles').find({}).toArray();

    for (const photographer of photographers) {
      const items = await db.collection('portfolio_items').find({ photographer_id: photographer.user_id }).toArray();

      // Map to the structure for frontend
      const portfolios = items.map(item => ({
        url: item.image_url,
        title: item.title
      }));

      if (portfolios.length > 0) {
        await db.collection('photographer_profiles').updateOne(
          { user_id: photographer.user_id },
          { $set: { portfolios } }
        );
        console.log(`Updated portfolios for photographer ${photographer.user_id}`);
      } else {
        console.log(`No portfolio items found for photographer ${photographer.user_id}`);
      }
    }

    console.log('Migration complete.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

migratePortfolios();
