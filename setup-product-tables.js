require('dotenv').config({ path: './backend/.env' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setupProductTables() {
  console.log('\n' + '='.repeat(60));
  console.log('  SUPABASE PRODUCT TABLES SETUP');
  console.log('='.repeat(60) + '\n');

  try {
    // Read the SQL schema file
    const sql = fs.readFileSync('./supabase-products-schema.sql', 'utf-8');

    console.log('📄 SQL schema file loaded');
    console.log('📊 Setting up product tables in Supabase...\n');

    console.log('⚠️  IMPORTANT: The SQL contains CREATE TABLE statements that cannot');
    console.log('   be executed via the JavaScript client.\n');
    console.log('Please follow these steps:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/fogxrcbhexdzfiztncch');
    console.log('2. Click "SQL Editor" in the left sidebar');
    console.log('3. Click "New Query"');
    console.log('4. Copy the entire contents of: supabase-products-schema.sql');
    console.log('5. Paste into the SQL editor');
    console.log('6. Click "Run" to execute\n');

    console.log('This will create:');
    console.log('  ✓ product_categories table');
    console.log('  ✓ products table');
    console.log('  ✓ product_options table');
    console.log('  ✓ 5 default categories (Business Cards, Flyers, Posters, Banners, Custom Order)');
    console.log('  ✓ ~15 default products');
    console.log('  ✓ ~40+ product options\n');

    console.log('After running the SQL, you can import your CSV products by running:');
    console.log('  node import-products-api.js\n');

    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupProductTables().then(() => {
  console.log('Instructions displayed. Please follow the steps above.\n');
  process.exit(0);
});
