const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'fogxrcbhexdzfiztncch.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZ3hyY2JoZXhkemZpenRuY2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzE5NTksImV4cCI6MjA3ODcwNzk1OX0.on1CfmJRJyteHAIVDwWyHZU1J509QiiQiuFSDox6U3w';

// Make HTTPS request
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: SUPABASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(responseData || '[]'));
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (e) {
          reject(new Error(`Parse error: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Parse CSV file
function parseCSV(csvFilePath) {
  console.log(`Reading CSV from: ${csvFilePath}`);
  const csvData = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split('","').map(h => h.replace(/^"|"$/g, ''));

  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split('","').map(v => v.replace(/^"|"$/g, ''));
    const product = {};
    headers.forEach((header, index) => {
      product[header] = values[index] || '';
    });

    // Only include if it has a name, category, and valid price
    const msrp = parseFloat((product.MSRP || product.Price || '0').replace(/[$,]/g, ''));
    if (product.Item && product.Category && msrp > 0) {
      products.push(product);
    }
  }

  console.log(`Parsed ${products.length} valid products from CSV`);
  return products;
}

async function importProducts() {
  console.log('\n' + '='.repeat(60));
  console.log('  PRODUCT IMPORT (Direct HTTPS)');
  console.log('='.repeat(60) + '\n');

  try {
    // Get all categories
    console.log('Fetching categories from database...');
    const categories = await makeRequest('GET', '/rest/v1/product_categories?select=*');
    console.log(`Found ${categories.length} categories\n`);

    // Create category map
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.name] = cat.id;
      console.log(`  ✓ ${cat.name} (${cat.id})`);
    });

    // Parse CSV
    console.log('\nParsing CSV...');
    const products = parseCSV('./products.csv');
    console.log(`Found ${products.length} products to import\n`);

    // Import products
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    console.log('Starting product import...\n');

    for (const product of products) {
      const categoryId = categoryMap[product.Category];
      if (!categoryId) {
        skipped++;
        continue;
      }

      // Parse price
      const priceStr = product.MSRP || product.Price || '0';
      const price = parseFloat(priceStr.replace(/[$,]/g, ''));

      if (isNaN(price) || price === 0) {
        skipped++;
        continue;
      }

      // Determine unit
      let unit = 'each';
      if (product.Item.includes('500')) unit = '500 count';
      else if (product.Item.includes('250')) unit = '250 count';
      else if (product.Item.includes('100')) unit = '100 count';
      else if (product.Item.includes('1000')) unit = '1000 count';

      try {
        // Create product
        const newProducts = await makeRequest('POST', '/rest/v1/products', {
          category_id: categoryId,
          name: product.Item,
          base_price: price,
          unit: unit,
          active: true,
          display_order: imported
        });

        if (newProducts && newProducts.length > 0) {
          const newProduct = newProducts[0];

          // Create default option
          await makeRequest('POST', '/rest/v1/product_options', {
            product_id: newProduct.id,
            option_name: 'Standard',
            price_adjustment: 0,
            active: true,
            display_order: 0
          });

          imported++;
          if (imported % 25 === 0) {
            console.log(`  ... ${imported} products imported so far...`);
          }
        }
      } catch (error) {
        // Silently skip duplicates
        if (error.message && (error.message.includes('duplicate') || error.message.includes('unique'))) {
          skipped++;
        } else {
          errors++;
          if (errors < 5) {  // Only show first few errors
            console.log(`  ⚠ Error importing "${product.Item}": ${error.message}`);
          }
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Import complete!');
    console.log('='.repeat(60));
    console.log(`   Imported: ${imported} products`);
    console.log(`   Skipped: ${skipped} products`);
    console.log(`   Errors: ${errors} errors`);
    console.log(`   Total processed: ${imported + skipped + errors} products`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the import
importProducts().then(() => {
  console.log('Import finished!\n');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
