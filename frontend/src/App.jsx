import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51STOuE5sITCiG5Ocs367wlaxjNXFKBCV3G4uFT4VQo4hPlTiLCtTunGfIIxGm3XBv9Rxv584U9K3yz9w7DgL8Mvm009Ngi8z6c';

// For local development
const BACKEND_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3001'
  : 'https://pos-payment-system.vercel.app'; // Backend URL

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Payment form component (inside Stripe Elements provider)
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
            Processing...
          </>
        ) : (
          'Complete Payment'
        )}
      </button>
    </form>
  );
}

// Main POS app component
export default function POSPaymentApp() {
  const [step, setStep] = useState('form'); // 'form' or 'payment'
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    amount: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }

    if (!formData.customerEmail.trim()) {
      errors.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email';
    }

    if (!formData.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      errors.amount = 'Please enter a valid amount';
    }

    return errors;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setPaymentStatus(null);

    try {
      // Call backend to create Payment Intent
      const response = await fetch(`${BACKEND_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          customerName: formData.customerName,
          customerEmail: formData.customerEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      setStep('payment');

    } catch (error) {
      setPaymentStatus({
        type: 'error',
        message: error.message || 'Failed to initialize payment. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = (paymentIntent) => {
    setPaymentStatus({
      type: 'success',
      message: `Payment successful! Amount: $${(paymentIntent.amount / 100).toFixed(2)}`
    });

    setTimeout(() => {
      setStep('form');
      setFormData({
        customerName: '',
        customerEmail: '',
        amount: ''
      });
      setClientSecret(null);
      setPaymentStatus(null);
    }, 3000);
  };

  const formattedAmount = formData.amount ? `$${parseFloat(formData.amount).toFixed(2)}` : '$0.00';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 md:p-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Processing</h1>
          <p className="text-gray-600">
            {step === 'form' ? 'Enter customer details' : 'Enter payment information'}
          </p>
        </div>

        {/* Status Messages */}
        {paymentStatus && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
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
        )}

        {/* Form Step */}
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-5">

            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Name
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="John Doe"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  formErrors.customerName
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {formErrors.customerName && (
                <p className="text-red-600 text-sm mt-1">{formErrors.customerName}</p>
              )}
            </div>

            {/* Customer Email */}
            <div>
              <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Customer Email
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  formErrors.customerEmail
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300'
                }`}
                disabled={isSubmitting}
              />
              {formErrors.customerEmail && (
                <p className="text-red-600 text-sm mt-1">{formErrors.customerEmail}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2 text-gray-500 font-semibold">$</span>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    formErrors.amount
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
              </div>
              {formErrors.amount && (
                <p className="text-red-600 text-sm mt-1">{formErrors.amount}</p>
              )}
            </div>

            {/* Amount Display */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-3xl font-bold text-indigo-600">{formattedAmount}</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Initializing Payment...
                </>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </form>
        )}

        {/* Payment Step */}
        {step === 'payment' && clientSecret && (
          <div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm clientSecret={clientSecret} onSuccess={handlePaymentSuccess} />
            </Elements>

            <button
              onClick={() => {
                setStep('form');
                setClientSecret(null);
              }}
              className="w-full mt-4 text-indigo-600 hover:text-indigo-700 font-semibold py-2"
            >
              Back to Details
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
