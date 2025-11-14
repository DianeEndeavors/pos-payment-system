# Product Import Guide

This guide will help you set up the product database and import your 223 products from the CSV.

## Quick Start (2 Steps)

### Step 1: Create Database Tables

The product tables need to be created in Supabase first.

**Option A: Run SQL in Supabase Dashboard** (Recommended)

1. Go to: https://supabase.com/dashboard/project/fogxrcbhexdzfiztncch
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Copy the entire contents of `supabase-products-schema-empty.sql`
5. Paste into the SQL editor
6. Click **"Run"** to execute

**Option B: Use the Full Schema with Sample Products**

If you want to include some sample products (Business Cards, Flyers, etc.) along with your CSV products, use `supabase-products-schema.sql` instead in the steps above.

### Step 2: Import Your CSV Products

Once the tables are created, import your 223 products:

```bash
# Start the backend server (in one terminal)
cd backend
npm install  # if you haven't already
node server.js

# In another terminal, run the import
node import-products-api.js
```

This will:
- ✓ Create 8 product categories (Print, Mail, Foot Solutions, Retail, etc.)
- ✓ Import all 223 products from your CSV
- ✓ Create default "Standard" options for each product
- ✓ Parse prices and units automatically

## What Gets Created

### Categories (8 total)
- Print
- Mail
- Foot Solutions
- Retail
- Wholesale Print
- UV Printer
- Laser
- Clothing

### Products (223 total)
All products from your CSV including:
- Copy Per Side
- Full Service Mail
- Magnet Calendars
- Brochures
- Envelopes
- Signs
- And 217 more...

## Verification

After import, check your results:

1. **Via Supabase Dashboard:**
   - Go to Table Editor
   - Check `product_categories` - should have 8 rows
   - Check `products` - should have 223 rows
   - Check `product_options` - should have 223+ rows

2. **Via Your POS App:**
   - Open the Catalogue page
   - You should see all 8 categories
   - Click any category to see products

## Troubleshooting

### "No products found" in app
- Make sure you ran Step 1 (SQL schema) first
- Refresh your browser
- Check browser console for errors

### Import script errors
- Make sure backend server is running on port 3001
- Check that Supabase is not paused (free tier projects pause after inactivity)
- Verify .env file has correct SUPABASE_URL and SUPABASE_ANON_KEY

### Connection errors
- If Supabase is paused, visit the dashboard to restore it
- Wait a few moments for the project to activate
- Try the import again

## Files

- `products.csv` - Your 223 products
- `supabase-products-schema-empty.sql` - Creates tables only (recommended for CSV import)
- `supabase-products-schema.sql` - Creates tables + sample products
- `import-products-api.js` - Import script that uses the backend API
- `import-products.js` - Alternative direct Supabase import script
