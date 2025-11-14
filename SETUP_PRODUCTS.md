# Products Database Setup

This guide explains how to set up the products database in Supabase.

## Step 1: Run the Products Schema

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `fogxrcbhexdzfiztncch`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the entire contents of `supabase-products-schema.sql`
6. Click "Run" to execute the SQL

## What This Creates

### Tables:
- **product_categories**: Categories like Business Cards, Flyers, etc.
- **products**: Individual products with prices and units
- **product_options**: Material/finish options for each product (Matte, Glossy, etc.)

### Default Data:
The schema includes all your current products:
- Business Cards (Standard 500/1000, Premium 500)
- Flyers (8.5"x11" in 100/500, Half Sheet 250)
- Posters (18"x24", 24"x36", 36"x48")
- Banners (2'x4', 3'x6', 4'x8')
- Custom Orders

## Step 2: Verify Setup

After running the SQL, verify the data was created:

```sql
SELECT COUNT(*) FROM product_categories;  -- Should return 5
SELECT COUNT(*) FROM products;            -- Should return ~15
SELECT COUNT(*) FROM product_options;     -- Should return ~40+
```

## Step 3: Deploy Backend

The backend now has endpoints for product management:
- `GET /product-categories` - List all categories
- `GET /products` - List all products with options
- `POST /products` - Create new product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Soft delete product
- Similar endpoints for product options

Make sure to redeploy your backend on Vercel after committing these changes!

## Managing Products

Once set up, you can manage products through:
1. The Settings page in your POS app (UI coming soon)
2. Directly via API calls
3. Supabase Table Editor

## Troubleshooting

If you get an error about `update_updated_at_column` not existing, make sure you ran the original `supabase-schema.sql` first, as it creates this function.
