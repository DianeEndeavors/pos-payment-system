const fs = require('fs');
const path = require('path');
const http = require('http');

// Backend API base URL
const API_HOST = 'localhost';
const API_PORT = 3001;

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

    // Simple CSV parsing - split by ","
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

// Icon mapping for categories
const categoryIcons = {
  'Print': 'FileText',
  'Mail': 'Package',
  'Wholesale Print': 'Image',
  'UV Printer': 'Layers',
  'Retail': 'Tag',
  'Foot Solutions': 'Package',
  'New Agent Packages': 'Package',
  'Co-Op Marketing Bill': 'FileText',
  'Design': 'Edit',
  'Clothing': 'Tag',
  'T-Shirts': 'Tag',
  'Shipping': 'Package',
  'Laser': 'Layers'
};

// Make HTTP POST request
function makePostRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${parsed.error || responseData}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function importProducts() {
  try {
    console.log('Starting product import via API...\\n');

    // Read CSV file
    const csvPath = path.join(__dirname, 'products.csv');
    const products = parseCSV(csvPath);
    console.log(`Found ${products.length} products to import\\n`);

    // Get unique categories
    const categories = [...new Set(products.map(p => p.Category).filter(c => c))];
    console.log(`Unique categories found: ${categories.length}`);
    console.log(categories.join(', ') + '\\n');

    // Create categories via API
    const categoryMap = {};
    for (let i = 0; i < categories.length; i++) {
      const categoryName = categories[i];
      console.log(`Processing category: ${categoryName}...`);

      try {
        const icon = categoryIcons[categoryName] || 'Package';
        const response = await makePostRequest('/product-categories', {
          name: categoryName,
          icon: icon,
          display_order: i + 10
        });

        if (response.existing) {
          console.log(`  ✓ Category "${categoryName}" already exists`);
        } else {
          console.log(`  ✓ Created category "${categoryName}" with ID: ${response.category.id}`);
        }
        categoryMap[categoryName] = response.category.id;
      } catch (error) {
        console.error(`  ✗ Error creating category "${categoryName}":`, error.message);
      }
    }

    console.log('\\n--- Starting product import ---\\n');

    // Import products
    let imported = 0;
    let skipped = 0;

    for (const product of products) {
      const categoryId = categoryMap[product.Category];
      if (!categoryId) {
        console.log(`⊗ Skipping "${product.Item}" - no category ID`);
        skipped++;
        continue;
      }

      // Parse price
      const priceStr = product.MSRP || product.Price || '0';
      const price = parseFloat(priceStr.replace(/[$,]/g, ''));

      if (isNaN(price) || price === 0) {
        console.log(`⊗ Skipping "${product.Item}" - invalid price: ${priceStr}`);
        skipped++;
        continue;
      }

      // Determine unit - default to "each" or extract from name
      let unit = 'each';
      if (product.Item.includes('500')) unit = '500 count';
      else if (product.Item.includes('250')) unit = '250 count';
      else if (product.Item.includes('100')) unit = '100 count';
      else if (product.Item.includes('1000')) unit = '1000 count';

      try {
        // Create product with default "Standard" option
        const response = await makePostRequest('/products', {
          category_id: categoryId,
          name: product.Item,
          base_price: price,
          unit: unit,
          options: [
            {
              option_name: 'Standard',
              price_adjustment: 0
            }
          ]
        });

        imported++;
        if (imported % 25 === 0) {
          console.log(`  ... ${imported} products imported so far...`);
        }
      } catch (error) {
        // Check if it's a duplicate error
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          skipped++;
          continue; // Silently skip duplicates
        }
        console.log(`⊗ Error creating product "${product.Item}":`, error.message);
        skipped++;
      }
    }

    console.log(`\\n${'='.repeat(50)}`);
    console.log(`✅ Import complete!`);
    console.log(`${'='.repeat(50)}`);
    console.log(`   Imported: ${imported} products`);
    console.log(`   Skipped: ${skipped} products (already exist or invalid data)`);
    console.log(`   Total processed: ${imported + skipped} products`);
    console.log(`${'='.repeat(50)}\\n`);

  } catch (error) {
    console.error('\\n❌ Fatal error during import:', error);
    throw error;
  }
}

// Run the import
console.log('\\n' + '='.repeat(50));
console.log('  CSV PRODUCT IMPORT TOOL (API Version)');
console.log('='.repeat(50) + '\\n');

importProducts().then(() => {
  console.log('Import script finished successfully!\\n');
  process.exit(0);
}).catch(err => {
  console.error('\\n❌ Fatal error:', err);
  process.exit(1);
});
