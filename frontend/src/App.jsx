import React, { useState } from 'react';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  X,
  Package,
  FileText,
  Image as ImageIcon,
  Layers,
  Tag,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51STOuE5sITCiG5Ocs367wlaxjNXFKBCV3G4uFT4VQo4hPlTiLCtTunGfIIxGm3XBv9Rxv584U9K3yz9w7DgL8Mvm009Ngi8z6c';

const BACKEND_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3001'
  : 'https://pos-payment-system.vercel.app';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Product catalog for print shop
const PRODUCT_CATALOG = {
  'Business Cards': {
    icon: Tag,
    items: [
      { id: 'bc-standard-500', name: 'Standard Business Cards', basePrice: 49.99, unit: '500 cards', options: ['Matte', 'Glossy', 'Uncoated'] },
      { id: 'bc-standard-1000', name: 'Standard Business Cards', basePrice: 79.99, unit: '1000 cards', options: ['Matte', 'Glossy', 'Uncoated'] },
      { id: 'bc-premium-500', name: 'Premium Business Cards', basePrice: 89.99, unit: '500 cards', options: ['Silk Laminate', 'Spot UV', 'Raised Foil'] },
    ]
  },
  'Flyers': {
    icon: FileText,
    items: [
      { id: 'fly-85x11-100', name: 'Flyers 8.5" x 11"', basePrice: 59.99, unit: '100 flyers', options: ['100lb Gloss', '80lb Matte', '100lb Cardstock'] },
      { id: 'fly-85x11-500', name: 'Flyers 8.5" x 11"', basePrice: 149.99, unit: '500 flyers', options: ['100lb Gloss', '80lb Matte', '100lb Cardstock'] },
      { id: 'fly-55x85-250', name: 'Half Sheet Flyers 5.5" x 8.5"', basePrice: 79.99, unit: '250 flyers', options: ['100lb Gloss', '80lb Matte'] },
    ]
  },
  'Posters': {
    icon: ImageIcon,
    items: [
      { id: 'post-18x24', name: 'Poster 18" x 24"', basePrice: 24.99, unit: 'per poster', options: ['Glossy Photo Paper', 'Matte', 'Canvas'] },
      { id: 'post-24x36', name: 'Poster 24" x 36"', basePrice: 39.99, unit: 'per poster', options: ['Glossy Photo Paper', 'Matte', 'Canvas'] },
      { id: 'post-36x48', name: 'Poster 36" x 48"', basePrice: 79.99, unit: 'per poster', options: ['Glossy Photo Paper', 'Matte', 'Canvas'] },
    ]
  },
  'Banners': {
    icon: Layers,
    items: [
      { id: 'ban-2x4', name: 'Banner 2\' x 4\'', basePrice: 49.99, unit: 'per banner', options: ['Vinyl 13oz', 'Mesh', 'Fabric'] },
      { id: 'ban-3x6', name: 'Banner 3\' x 6\'', basePrice: 89.99, unit: 'per banner', options: ['Vinyl 13oz', 'Mesh', 'Fabric'] },
      { id: 'ban-4x8', name: 'Banner 4\' x 8\'', basePrice: 149.99, unit: 'per banner', options: ['Vinyl 13oz', 'Mesh', 'Fabric'] },
    ]
  },
  'Custom Order': {
    icon: Package,
    items: [
      { id: 'custom', name: 'Custom Print Order', basePrice: 0, unit: 'custom pricing', options: ['Quote Required'] },
    ]
  }
};

// Payment form component
function PaymentForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (!stripe || !elements) {
      setErrorMessage('Payment system not ready');
      setIsSubmitting(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}?payment_intent=${paymentIntent?.id}`,
        },
        redirect: 'if_required'
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (err) {
      setErrorMessage('Payment failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !stripe}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            Complete Payment
          </>
        )}
      </button>
    </form>
  );
}

// Main POS Application
export default function PrintShopPOS() {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Business Cards');
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '' });
  const [orderNotes, setOrderNotes] = useState('');
  const [step, setStep] = useState('pos'); // 'pos', 'checkout', 'payment'
  const [clientSecret, setClientSecret] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Add item to cart
  const addToCart = (item, option) => {
    const cartItem = {
      id: `${item.id}-${option}-${Date.now()}`,
      productId: item.id,
      name: item.name,
      option: option,
      unit: item.unit,
      price: item.basePrice,
      quantity: 1
    };
    setCart([...cart, cartItem]);
  };

  // Update quantity
  const updateQuantity = (cartItemId, delta) => {
    setCart(cart.map(item =>
      item.id === cartItemId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  // Remove from cart
  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.id !== cartItemId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  // Proceed to checkout
  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }
    setStep('checkout');
  };

  // Submit order and create payment intent
  const handleSubmitOrder = async () => {
    if (!customerInfo.name || !customerInfo.email) {
      alert('Please enter customer name and email');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus(null);

    try {
      const response = await fetch(`${BACKEND_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email
        })
      });

      if (!response.ok) throw new Error('Failed to create payment intent');

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setStep('payment');
    } catch (error) {
      setPaymentStatus({
        type: 'error',
        message: error.message || 'Failed to initialize payment'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment success
  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentStatus({
      type: 'success',
      message: `Payment successful! Order total: $${(paymentIntent.amount / 100).toFixed(2)}`
    });

    setTimeout(() => {
      // Reset everything
      setCart([]);
      setCustomerInfo({ name: '', email: '', phone: '' });
      setOrderNotes('');
      setStep('pos');
      setClientSecret(null);
      setPaymentStatus(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Print Shop POS</h1>
          <div className="flex items-center gap-4">
            <span className="text-indigo-100">Employee Terminal</span>
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Status Messages */}
      {paymentStatus && (
        <div className={`max-w-7xl mx-auto mt-4 px-4`}>
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            paymentStatus.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {paymentStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p className={paymentStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {paymentStatus.message}
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">

        {/* POS View */}
        {step === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Products Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">

                {/* Category Tabs */}
                <div className="border-b border-gray-200">
                  <div className="flex overflow-x-auto">
                    {Object.keys(PRODUCT_CATALOG).map(category => {
                      const Icon = PRODUCT_CATALOG[category].icon;
                      return (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-6 py-4 font-medium text-sm whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                            selectedCategory === category
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Products Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {PRODUCT_CATALOG[selectedCategory].items.map(item => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-500">{item.unit}</p>
                          </div>
                          <span className="text-lg font-bold text-indigo-600">
                            {item.basePrice === 0 ? 'Quote' : `$${item.basePrice.toFixed(2)}`}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {item.options.map(option => (
                            <button
                              key={option}
                              onClick={() => addToCart(item, option)}
                              className="w-full px-4 py-2 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded text-sm font-medium transition-colors flex items-center justify-between"
                            >
                              <span>{option}</span>
                              <Plus className="w-4 h-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow sticky top-4">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Current Order
                  </h2>
                </div>

                <div className="p-4">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Cart is empty</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {cart.map(item => (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.option}</p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="p-1 bg-white rounded hover:bg-gray-100"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="p-1 bg-white rounded hover:bg-gray-100"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-semibold text-indigo-600">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cart.length > 0 && (
                  <>
                    <div className="px-4 py-3 border-t border-gray-200 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax (8%)</span>
                        <span className="font-medium">${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
                        <span>Total</span>
                        <span className="text-indigo-600">${total.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="p-4 border-t border-gray-200">
                      <button
                        onClick={handleProceedToCheckout}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-5 h-5" />
                        Proceed to Checkout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Checkout View */}
        {step === 'checkout' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Customer Information</h2>
                <button
                  onClick={() => setStep('pos')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order Notes
                  </label>
                  <textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Special instructions, rush order, etc."
                  />
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Order Total</span>
                    <span className="text-2xl font-bold text-indigo-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep('pos')}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Back to Cart
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        Proceed to Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment View */}
        {step === 'payment' && clientSecret && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
                <button
                  onClick={() => {
                    setStep('checkout');
                    setClientSecret(null);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Customer:</span>
                  <span className="font-medium">{customerInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Amount Due:</span>
                  <span className="text-xl font-bold text-indigo-600">${total.toFixed(2)}</span>
                </div>
              </div>

              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
              </Elements>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
