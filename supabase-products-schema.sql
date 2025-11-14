-- Create product_categories table
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  unit TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_options table (for material/finish options)
CREATE TABLE product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  option_name TEXT NOT NULL,
  price_adjustment DECIMAL(10, 2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_product_options_product ON product_options(product_id);
CREATE INDEX idx_product_categories_active ON product_categories(active);

-- Enable Row Level Security
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_options ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Allow all operations on product_categories" ON product_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on product_options" ON product_options FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO product_categories (name, icon, display_order) VALUES
('Business Cards', 'Tag', 1),
('Flyers', 'FileText', 2),
('Posters', 'Image', 3),
('Banners', 'Layers', 4),
('Custom Order', 'Package', 5);

-- Insert default products for Business Cards
INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Standard Business Cards', 49.99, '500 cards', 1
FROM product_categories WHERE name = 'Business Cards';

INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Standard Business Cards', 79.99, '1000 cards', 2
FROM product_categories WHERE name = 'Business Cards';

INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Premium Business Cards', 89.99, '500 cards', 3
FROM product_categories WHERE name = 'Business Cards';

-- Insert options for Standard Business Cards (500)
INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Matte', 0, 1
FROM products WHERE name = 'Standard Business Cards' AND unit = '500 cards';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Glossy', 0, 2
FROM products WHERE name = 'Standard Business Cards' AND unit = '500 cards';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Uncoated', 0, 3
FROM products WHERE name = 'Standard Business Cards' AND unit = '500 cards';

-- Insert options for Standard Business Cards (1000)
INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Matte', 0, 1
FROM products WHERE name = 'Standard Business Cards' AND unit = '1000 cards';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Glossy', 0, 2
FROM products WHERE name = 'Standard Business Cards' AND unit = '1000 cards';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Uncoated', 0, 3
FROM products WHERE name = 'Standard Business Cards' AND unit = '1000 cards';

-- Insert options for Premium Business Cards
INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Silk Laminate', 0, 1
FROM products WHERE name = 'Premium Business Cards';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Spot UV', 10, 2
FROM products WHERE name = 'Premium Business Cards';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Raised Foil', 20, 3
FROM products WHERE name = 'Premium Business Cards';

-- Insert products for Flyers
INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Flyers 8.5" x 11"', 59.99, '100 flyers', 1
FROM product_categories WHERE name = 'Flyers';

INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Flyers 8.5" x 11"', 149.99, '500 flyers', 2
FROM product_categories WHERE name = 'Flyers';

INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Half Sheet Flyers 5.5" x 8.5"', 79.99, '250 flyers', 3
FROM product_categories WHERE name = 'Flyers';

-- Insert options for Flyers 8.5" x 11" (100)
INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, '100lb Gloss', 0, 1
FROM products WHERE name = 'Flyers 8.5" x 11"' AND unit = '100 flyers';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, '80lb Matte', 0, 2
FROM products WHERE name = 'Flyers 8.5" x 11"' AND unit = '100 flyers';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, '100lb Cardstock', 5, 3
FROM products WHERE name = 'Flyers 8.5" x 11"' AND unit = '100 flyers';

-- Insert options for Flyers 8.5" x 11" (500)
INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, '100lb Gloss', 0, 1
FROM products WHERE name = 'Flyers 8.5" x 11"' AND unit = '500 flyers';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, '80lb Matte', 0, 2
FROM products WHERE name = 'Flyers 8.5" x 11"' AND unit = '500 flyers';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, '100lb Cardstock', 20, 3
FROM products WHERE name = 'Flyers 8.5" x 11"' AND unit = '500 flyers';

-- Insert options for Half Sheet Flyers
INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, '100lb Gloss', 0, 1
FROM products WHERE name = 'Half Sheet Flyers 5.5" x 8.5"';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, '80lb Matte', 0, 2
FROM products WHERE name = 'Half Sheet Flyers 5.5" x 8.5"';

-- Insert products for Posters
INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Poster 18" x 24"', 24.99, 'per poster', 1
FROM product_categories WHERE name = 'Posters';

INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Poster 24" x 36"', 39.99, 'per poster', 2
FROM product_categories WHERE name = 'Posters';

INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Poster 36" x 48"', 79.99, 'per poster', 3
FROM product_categories WHERE name = 'Posters';

-- Insert options for all posters
INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Glossy Photo Paper', 0, 1
FROM products WHERE name LIKE 'Poster%';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Matte', 0, 2
FROM products WHERE name LIKE 'Poster%';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Canvas', 15, 3
FROM products WHERE name LIKE 'Poster%';

-- Insert products for Banners
INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Banner 2'' x 4''', 49.99, 'per banner', 1
FROM product_categories WHERE name = 'Banners';

INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Banner 3'' x 6''', 89.99, 'per banner', 2
FROM product_categories WHERE name = 'Banners';

INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Banner 4'' x 8''', 149.99, 'per banner', 3
FROM product_categories WHERE name = 'Banners';

-- Insert options for all banners
INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Vinyl 13oz', 0, 1
FROM products WHERE name LIKE 'Banner%';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Mesh', 0, 2
FROM products WHERE name LIKE 'Banner%';

INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Fabric', 25, 3
FROM products WHERE name LIKE 'Banner%';

-- Insert products for Custom Order
INSERT INTO products (category_id, name, base_price, unit, display_order)
SELECT id, 'Custom Print Order', 0, 'custom pricing', 1
FROM product_categories WHERE name = 'Custom Order';

-- Insert option for custom order
INSERT INTO product_options (product_id, option_name, price_adjustment, display_order)
SELECT id, 'Quote Required', 0, 1
FROM products WHERE name = 'Custom Print Order';
