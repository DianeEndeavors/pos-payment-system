const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();

// Initialize Stripe with secret key
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://pos-payment-system-q4vp.vercel.app'
  ],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Create Payment Intent endpoint
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, customerName, customerEmail } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email is required' });
    }

    // Amount should be in cents for Stripe
    const amountInCents = Math.round(amount * 100);

    // Create Payment Intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      description: `Payment from ${customerName || 'Customer'}`,
      receipt_email: customerEmail,
      metadata: {
        customerName: customerName || 'Unknown',
        customerEmail: customerEmail
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({
      error: error.message || 'Failed to create payment intent'
    });
  }
});

// Confirm Payment endpoint (for checking payment status)
app.post('/confirm-payment', async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment Intent ID is required' });
    }

    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

    res.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({
      error: error.message || 'Failed to confirm payment'
    });
  }
});

// Search customers endpoint
app.get('/customers/search', async (req, res) => {
  try {
    const { query } = req.query;

    // If no query or empty query, return all customers
    if (!query || query.length === 0) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return res.json({ customers: data || [] });
    }

    // If query is too short, return empty
    if (query.length < 2) {
      return res.json({ customers: [] });
    }

    // Search with query
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    res.json({ customers: data || [] });
  } catch (error) {
    console.error('Error searching customers:', error);
    res.status(500).json({ error: error.message || 'Failed to search customers' });
  }
});

// Get customer by ID
app.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ customer: data });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch customer' });
  }
});

// Create customer
app.post('/customers', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if customer already exists (don't use .single() as it throws error when not found)
    const { data: existingCustomers, error: checkError } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .limit(1);

    if (checkError) {
      console.error('Error checking existing customer:', checkError);
      throw checkError;
    }

    if (existingCustomers && existingCustomers.length > 0) {
      return res.json({ customer: existingCustomers[0], existing: true });
    }

    // Create new customer
    const { data, error } = await supabase
      .from('customers')
      .insert([{ name, email, phone }])
      .select()
      .single();

    if (error) {
      console.error('Error inserting customer:', error);
      throw error;
    }

    res.json({ customer: data, existing: false });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message || 'Failed to create customer' });
  }
});

// Update customer
app.put('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, stripe_customer_id } = req.body;

    const { data, error } = await supabase
      .from('customers')
      .update({ name, email, phone, stripe_customer_id })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ customer: data });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: error.message || 'Failed to update customer' });
  }
});

// Create order with items
app.post('/orders', async (req, res) => {
  try {
    const { customerId, cart, subtotal, tax, total, notes, paymentIntentId } = req.body;

    if (!customerId || !cart || cart.length === 0) {
      return res.status(400).json({ error: 'Customer ID and cart items are required' });
    }

    // Generate order number
    const { data: orderNumberData } = await supabase.rpc('generate_order_number');
    const orderNumber = orderNumberData || `ORD-${Date.now()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: customerId,
        order_number: orderNumber,
        subtotal,
        tax,
        total,
        notes,
        payment_intent_id: paymentIntentId,
        status: paymentIntentId ? 'paid' : 'pending'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = cart.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.name,
      option_selected: item.option,
      unit: item.unit,
      price: item.price,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    res.json({ order, orderNumber });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Get orders for a customer
app.get('/customers/:id/orders', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ orders: data || [] });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch orders' });
  }
});

// Get dashboard stats
app.get('/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's sales
    const { data: todaySales, error: salesError } = await supabase
      .from('orders')
      .select('total')
      .gte('created_at', today.toISOString())
      .eq('status', 'paid');

    if (salesError) throw salesError;

    const dailySales = todaySales.reduce((sum, order) => sum + parseFloat(order.total), 0);

    // Get new customers today
    const { data: newCustomers, error: customersError } = await supabase
      .from('customers')
      .select('id')
      .gte('created_at', today.toISOString());

    if (customersError) throw customersError;

    // Get total orders today
    const { data: todayOrders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .gte('created_at', today.toISOString());

    if (ordersError) throw ordersError;

    res.json({
      dailySales: dailySales.toFixed(2),
      newCustomers: newCustomers.length,
      ordersToday: todayOrders.length
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch stats' });
  }
});

// Get all orders with customer info
app.get('/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers (
          id,
          name,
          email
        ),
        order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the response to include customer_name
    const formattedOrders = data.map(order => ({
      ...order,
      customer_name: order.customer?.name || 'Unknown'
    }));

    res.json({ orders: formattedOrders || [] });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch orders' });
  }
});

// ===== PRODUCT MANAGEMENT ENDPOINTS =====

// Get all product categories
app.get('/product-categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.json({ categories: data || [] });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
});

// Create product category
app.post('/product-categories', async (req, res) => {
  try {
    const { name, icon, display_order } = req.body;

    if (!name || !icon) {
      return res.status(400).json({ error: 'Name and icon are required' });
    }

    // Check if category already exists
    const { data: existing, error: checkError } = await supabase
      .from('product_categories')
      .select('*')
      .eq('name', name)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.json({ category: existing[0], existing: true });
    }

    // Create new category
    const { data, error } = await supabase
      .from('product_categories')
      .insert([{ name, icon, display_order: display_order || 0 }])
      .select()
      .single();

    if (error) throw error;

    res.json({ category: data, existing: false });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: error.message || 'Failed to create category' });
  }
});

// Get all products with their options and category info
app.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories (
          id,
          name,
          icon
        ),
        options:product_options (*)
      `)
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.json({ products: data || [] });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch products' });
  }
});

// Get products by category
app.get('/products/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        options:product_options (*)
      `)
      .eq('category_id', categoryId)
      .eq('active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;

    res.json({ products: data || [] });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch products' });
  }
});

// Create new product
app.post('/products', async (req, res) => {
  try {
    const { category_id, name, base_price, unit, options } = req.body;

    if (!category_id || !name || base_price === undefined || !unit) {
      return res.status(400).json({ error: 'Category, name, base price, and unit are required' });
    }

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert([{ category_id, name, base_price, unit }])
      .select()
      .single();

    if (productError) throw productError;

    // Create options if provided
    if (options && options.length > 0) {
      const optionsToInsert = options.map((opt, index) => ({
        product_id: product.id,
        option_name: opt.option_name,
        price_adjustment: opt.price_adjustment || 0,
        display_order: index
      }));

      const { error: optionsError } = await supabase
        .from('product_options')
        .insert(optionsToInsert);

      if (optionsError) throw optionsError;
    }

    res.json({ product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: error.message || 'Failed to create product' });
  }
});

// Update product
app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, base_price, unit, active } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (base_price !== undefined) updateData.base_price = base_price;
    if (unit !== undefined) updateData.unit = unit;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ product: data });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message || 'Failed to update product' });
  }
});

// Delete product (soft delete by setting active = false)
app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('products')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ product: data });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message || 'Failed to delete product' });
  }
});

// Create product option
app.post('/product-options', async (req, res) => {
  try {
    const { product_id, option_name, price_adjustment } = req.body;

    if (!product_id || !option_name) {
      return res.status(400).json({ error: 'Product ID and option name are required' });
    }

    const { data, error } = await supabase
      .from('product_options')
      .insert([{ product_id, option_name, price_adjustment: price_adjustment || 0 }])
      .select()
      .single();

    if (error) throw error;

    res.json({ option: data });
  } catch (error) {
    console.error('Error creating option:', error);
    res.status(500).json({ error: error.message || 'Failed to create option' });
  }
});

// Update product option
app.put('/product-options/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { option_name, price_adjustment, active } = req.body;

    const updateData = {};
    if (option_name !== undefined) updateData.option_name = option_name;
    if (price_adjustment !== undefined) updateData.price_adjustment = price_adjustment;
    if (active !== undefined) updateData.active = active;

    const { data, error } = await supabase
      .from('product_options')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ option: data });
  } catch (error) {
    console.error('Error updating option:', error);
    res.status(500).json({ error: error.message || 'Failed to update option' });
  }
});

// Delete product option
app.delete('/product-options/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('product_options')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ option: data });
  } catch (error) {
    console.error('Error deleting option:', error);
    res.status(500).json({ error: error.message || 'Failed to delete option' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.PORT || 3001;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`POS Payment Server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = app;
