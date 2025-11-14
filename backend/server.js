const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const stripe = require('stripe');

dotenv.config();

const app = express();

// Initialize Stripe with secret key
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

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
