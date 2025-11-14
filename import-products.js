const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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

async function importProducts() {
  try {
    console.log('Starting product import...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, 'products.csv');
    const products = parseCSV(csvPath);
    console.log(`Found ${products.length} products to import\n`);

    // Get unique categories
    const categories = [...new Set(products.map(p => p.Category).filter(c => c))];
    console.log(`Unique categories found: ${categories.length}`);
    console.log(categories.join(', ') + '\n');

    // Create categories
    const categoryMap = {};
    for (const categoryName of categories) {
      console.log(`Processing category: ${categoryName}...`);

      // Check if category exists
      const { data: existing, error: checkError } = await supabase
        .from('product_categories')
        .select('*')
        .eq('name', categoryName)
        .limit(1);

      if (checkError) {
        console.error(`Error checking category "${categoryName}":`, checkError);
        continue;
      }

      if (existing && existing.length > 0) {
        console.log(`  ✓ Category "${categoryName}" already exists`);
        categoryMap[categoryName] = existing[0].id;
      } else {
        // Create new category
        const icon = categoryIcons[categoryName] || 'Package';
        const { data: newCat, error } = await supabase
          .from('product_categories')
          .insert([{
            name: categoryName,
            icon: icon,
            display_order: Object.keys(categoryMap).length + 10,
            active: true
          }])
          .select()
          .single();

        if (error) {
          console.error(`  ✗ Error creating category "${categoryName}":`, error);
          continue;
        }

        console.log(`  ✓ Created category "${categoryName}" with ID: ${newCat.id}`);
        categoryMap[categoryName] = newCat.id;
      }
    }

    console.log('\n--- Starting product import ---\n');

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

      // Check if product already exists by name
      const { data: existingProduct, error: checkError } = await supabase
        .from('products')
        .select('*')
        .eq('name', product.Item)
        .eq('category_id', categoryId)
        .limit(1);

      if (checkError) {
        console.log(`⊗ Error checking product "${product.Item}":`, checkError.message);
        skipped++;
        continue;
      }

      if (existingProduct && existingProduct.length > 0) {
        skipped++;
        continue; // Silently skip existing products
      }

      // Create product
      const { data: newProduct, error: productError } = await supabase
        .from('products')
        .insert([{
          category_id: categoryId,
          name: product.Item,
          base_price: price,
          unit: unit,
          active: true,
          display_order: imported
        }])
        .select()
        .single();

      if (productError) {
        console.log(`⊗ Error creating product "${product.Item}":`, productError.message);
        skipped++;
        continue;
      }

      // Create default option
      const { error: optionError } = await supabase
        .from('product_options')
        .insert([{
          product_id: newProduct.id,
          option_name: 'Standard',
          price_adjustment: 0,
          active: true,
          display_order: 0
        }]);

      if (optionError) {
        console.log(`⊗ Error creating option for "${product.Item}":`, optionError.message);
      }

      imported++;
      if (imported % 25 === 0) {
        console.log(`  ... ${imported} products imported so far...`);
      }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ Import complete!`);
    console.log(`${'='.repeat(50)}`);
    console.log(`   Imported: ${imported} products`);
    console.log(`   Skipped: ${skipped} products (already exist or invalid data)`);
    console.log(`   Total processed: ${imported + skipped} products`);
    console.log(`${'='.repeat(50)}\n`);

  } catch (error) {
    console.error('\n❌ Fatal error during import:', error);
    throw error;
  }
}

// Run the import
console.log('\n' + '='.repeat(50));
console.log('  CSV PRODUCT IMPORT TOOL');
console.log('='.repeat(50) + '\n');

importProducts().then(() => {
  console.log('Import script finished successfully!\n');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Fatal error:', err);
  process.exit(1);
});
