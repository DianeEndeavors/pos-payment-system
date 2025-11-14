#!/usr/bin/env python3

import csv
import json
import subprocess
import time

SUPABASE_URL = "https://fogxrcbhexdzfiztncch.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvZ3hyY2JoZXhkemZpenRuY2NoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxMzE5NTksImV4cCI6MjA3ODcwNzk1OX0.on1CfmJRJyteHAIVDwWyHZU1J509QiiQiuFSDox6U3w"

def curl_request(method, endpoint, data=None):
    """Make a curl request to Supabase"""
    cmd = [
        'curl', '-s', '-X', method,
        f'{SUPABASE_URL}{endpoint}',
        '-H', f'apikey: {SUPABASE_KEY}',
        '-H', f'Authorization: Bearer {SUPABASE_KEY}',
        '-H', 'Content-Type: application/json',
        '-H', 'Prefer: return=representation'
    ]

    if data:
        cmd.extend(['-d', json.dumps(data)])

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if result.returncode == 0 and result.stdout:
            try:
                return json.loads(result.stdout)
            except:
                return None
        return None
    except:
        return None

print("="*60)
print("  PRODUCT IMPORT (Python + curl)")
print("="*60)
print()

# Get categories
print("Fetching categories...")
categories = curl_request('GET', '/rest/v1/product_categories?select=id,name')

if not categories:
    print("❌ Failed to fetch categories")
    exit(1)

category_map = {cat['name']: cat['id'] for cat in categories}
print(f"Found {len(category_map)} categories:")
for name, id in category_map.items():
    print(f"  ✓ {name}: {id}")
print()

# Read and import products
print("Importing products from CSV...")
print()

imported = 0
skipped = 0
errors = 0

with open('products.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)

    for row in reader:
        # Get values
        name = row.get('Item', '').strip()
        category = row.get('Category', '').strip()
        price_str = (row.get('MSRP') or row.get('Price') or '0').replace('$', '').replace(',', '')

        try:
            price = float(price_str)
        except:
            price = 0

        # Skip if invalid
        if not name or not category or price <= 0:
            skipped += 1
            continue

        # Get category ID
        category_id = category_map.get(category)
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

        # Create product
        product_data = {
            'category_id': category_id,
            'name': name,
            'base_price': price,
            'unit': unit,
            'active': True,
            'display_order': imported
        }

        product = curl_request('POST', '/rest/v1/products', product_data)

        if product and isinstance(product, list) and len(product) > 0:
            product_id = product[0]['id']

            # Create default option
            option_data = {
                'product_id': product_id,
                'option_name': 'Standard',
                'price_adjustment': 0,
                'active': True,
                'display_order': 0
            }

            curl_request('POST', '/rest/v1/product_options', option_data)

            imported += 1
            if imported % 25 == 0:
                print(f"  ... {imported} products imported so far...")
        else:
            errors += 1
            if errors <= 3:  # Show first few errors
                print(f"  ⚠ Failed to import: {name}")

print()
print("="*60)
print("✅ Import complete!")
print("="*60)
print(f"   Imported: {imported} products")
print(f"   Skipped: {skipped} products (invalid data)")
print(f"   Errors: {errors} errors")
print(f"   Total processed: {imported + skipped + errors} products")
print("="*60)
print()
