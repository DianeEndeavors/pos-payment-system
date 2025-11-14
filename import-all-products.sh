#!/bin/bash

# This script imports all products from CSV using curl
# It's slower but works when Node.js has connection issues

SUPABASE_URL="https://fogxrcbhexdzfiztncch.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZ3hyY2JoZXhkemZpenRuY2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzE5NTksImV4cCI6MjA3ODcwNzk1OX0.on1CfmJRJyteHAIVDwWyHZU1J509QiiQiuFSDox6U3w"

echo "============================================"
echo "  Importing Products from CSV via curl"
echo "============================================"
echo

# Get category IDs
echo "Fetching category IDs..."
CATEGORIES=$(curl -s "${SUPABASE_URL}/rest/v1/product_categories?select=id,name" \
  -H "apikey: ${SUPABASE_KEY}")

# Extract category IDs (this is a simplified approach)
PRINT_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*","name":"Print"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
MAIL_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*","name":"Mail"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
FOOT_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*","name":"Foot Solutions"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
RETAIL_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*","name":"Retail"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
WHOLESALE_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*","name":"Wholesale Print"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
UV_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*","name":"UV Printer"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
LASER_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*","name":"Laser"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
CLOTHING_ID=$(echo "$CATEGORIES" | grep -o '"id":"[^"]*","name":"Clothing"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

echo "Print: $PRINT_ID"
echo "Mail: $MAIL_ID"
echo "Foot Solutions: $FOOT_ID"
echo "Retail: $RETAIL_ID"
echo "Wholesale Print: $WHOLESALE_ID"
echo "UV Printer: $UV_ID"
echo "Laser: $LASER_ID"
echo "Clothing: $CLOTHING_ID"
echo

# Now use Python to import products (more reliable for CSV parsing)
python3 << 'PYTHON_SCRIPT'
import csv
import json
import subprocess
import os

# Category mapping
category_ids = {
    'Print': os.environ.get('PRINT_ID'),
    'Mail': os.environ.get('MAIL_ID'),
    'Foot Solutions': os.environ.get('FOOT_ID'),
    'Retail': os.environ.get('RETAIL_ID'),
    'Wholesale Print': os.environ.get('WHOLESALE_ID'),
    'UV Printer': os.environ.get('UV_ID'),
    'Laser': os.environ.get('LASER_ID'),
    'Clothing': os.environ.get('CLOTHING_ID')
}

SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY')

imported = 0
skipped = 0

print("Starting product import...\n")

with open('products.csv', 'r') as f:
    reader = csv.DictReader(f)
    for i, row in enumerate(reader):
        # Get values
        name = row.get('Item', '').strip()
        category = row.get('Category', '').strip()
        price_str = row.get('MSRP') or row.get('Price') or '0'
        price_str = price_str.replace('$', '').replace(',', '')

        try:
            price = float(price_str)
        except:
            price = 0

        # Skip if invalid
        if not name or not category or price <= 0:
            skipped += 1
            continue

        # Get category ID
        category_id = category_ids.get(category)
        if not category_id:
            skipped += 1
            continue

        # Determine unit
        unit = 'each'
        if '500' in name:
            unit = '500 count'
        elif '250' in name:
            unit = '250 count'
        elif '100' in name:
            unit = '100 count'
        elif '1000' in name:
            unit = '1000 count'

        # Create product JSON
        product_data = {
            'category_id': category_id,
            'name': name,
            'base_price': price,
            'unit': unit,
            'active': True,
            'display_order': imported
        }

        # Execute curl to create product
        try:
            result = subprocess.run([
                'curl', '-s', '-X', 'POST',
                f'{SUPABASE_URL}/rest/v1/products',
                '-H', f'apikey: {SUPABASE_KEY}',
                '-H', f'Authorization: Bearer {SUPABASE_KEY}',
                '-H', 'Content-Type: application/json',
                '-H', 'Prefer: return=representation',
                '-d', json.dumps(product_data)
            ], capture_output=True, text=True, timeout=10)

            if result.returncode == 0 and result.stdout:
                response = json.loads(result.stdout)
                if isinstance(response, list) and len(response) > 0:
                    product_id = response[0]['id']

                    # Create default option
                    option_data = {
                        'product_id': product_id,
                        'option_name': 'Standard',
                        'price_adjustment': 0,
                        'active': True,
                        'display_order': 0
                    }

                    subprocess.run([
                        'curl', '-s', '-X', 'POST',
                        f'{SUPABASE_URL}/rest/v1/product_options',
                        '-H', f'apikey: {SUPABASE_KEY}',
                        '-H', f'Authorization: Bearer {SUPABASE_KEY}',
                        '-H', 'Content-Type: application/json',
                        '-d', json.dumps(option_data)
                    ], capture_output=True, timeout=10)

                    imported += 1
                    if imported % 25 == 0:
                        print(f"  ... {imported} products imported so far...")
                else:
                    skipped += 1
            else:
                skipped += 1

        except Exception as e:
            skipped += 1

print(f"\n{'='*60}")
print(f"✅ Import complete!")
print(f"{'='*60}")
print(f"   Imported: {imported} products")
print(f"   Skipped: {skipped} products")
print(f"   Total processed: {imported + skipped} products")
print(f"{'='*60}\n")

PYTHON_SCRIPT

echo
echo "Import complete!"
