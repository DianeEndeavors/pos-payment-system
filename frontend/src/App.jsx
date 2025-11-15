import React, { useState, useEffect } from 'react';
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
  Loader,
  Home,
  Users,
  Search,
  DollarSign,
  UserPlus,
  TrendingUp,
  BarChart3,
  Settings,
  Edit,
  Eye,
  Filter,
  Calendar,
  Download
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const STRIPE_PUBLISHABLE_KEY = 'pk_test_51STOuE5sITCiG5Ocs367wlaxjNXFKBCV3G4uFT4VQo4hPlTiLCtTunGfIIxGm3XBv9Rxv584U9K3yz9w7DgL8Mvm009Ngi8z6c';

const BACKEND_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3001'
  : 'https://pos-payment-system.vercel.app';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Icon mapping for categories
const ICON_MAP = {
  'Tag': Tag,
  'FileText': FileText,
  'Image': ImageIcon,
  'Layers': Layers,
  'Package': Package
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

// Main Application
export default function PrintShopPOS() {
  const [currentPage, setCurrentPage] = useState('home');
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Business Cards');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', email: '', phone: '' });
  const [orderNotes, setOrderNotes] = useState('');
  const [step, setStep] = useState('pos');
  const [clientSecret, setClientSecret] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({ dailySales: '0.00', newCustomers: 0, ordersToday: 0 });

  // Customers page state
  const [allCustomers, setAllCustomers] = useState([]);
  const [customerFilter, setCustomerFilter] = useState('');
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);

  // Orders page state
  const [allOrders, setAllOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Products state
  const [productCategories, setProductCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productCatalog, setProductCatalog] = useState({});
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProductData, setNewProductData] = useState({
    category_id: '',
    name: '',
    base_price: '',
    unit: '',
    options: [{ option_name: '', price_adjustment: 0 }]
  });
  const [productSearch, setProductSearch] = useState('');

  // Fetch dashboard stats
  useEffect(() => {
    if (currentPage === 'home') {
      fetchDashboardStats();
    }
  }, [currentPage]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/dashboard/stats`);
      const data = await response.json();
      setDashboardStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Fetch all customers
  const fetchAllCustomers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/customers/search?query=`);
      const data = await response.json();
      setAllCustomers(data.customers || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  // Fetch all orders
  const fetchAllOrders = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/orders`);
      const data = await response.json();
      setAllOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Fetch customer orders
  const fetchCustomerOrders = async (customerId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/customers/${customerId}/orders`);
      const data = await response.json();
      if (selectedCustomerDetails) {
        setSelectedCustomerDetails({
          ...selectedCustomerDetails,
          orders: data.orders || []
        });
      }
    } catch (error) {
      console.error('Error fetching customer orders:', error);
    }
  };

  // Fetch products from database
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/products`);
      const data = await response.json();

      if (data.products) {
        setProducts(data.products);

        // Transform products into catalog format for POS UI
        const catalog = {};

        data.products.forEach(product => {
          const categoryName = product.category.name;
          const categoryIcon = ICON_MAP[product.category.icon] || Package;

          if (!catalog[categoryName]) {
            catalog[categoryName] = {
              icon: categoryIcon,
              items: []
            };
          }

          // Get option names from product options
          const options = product.options
            .filter(opt => opt.active)
            .sort((a, b) => a.display_order - b.display_order)
            .map(opt => ({
              name: opt.option_name,
              priceAdjustment: parseFloat(opt.price_adjustment || 0)
            }));

          catalog[categoryName].items.push({
            id: product.id,
            name: product.name,
            basePrice: parseFloat(product.base_price),
            unit: product.unit,
            options: options
          });
        });

        setProductCatalog(catalog);

        // Set initial selected category if not set
        const categories = Object.keys(catalog);
        if (categories.length > 0 && !selectedCategory) {
          setSelectedCategory(categories[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Fetch product categories
  const fetchProductCategories = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/product-categories`);
      const data = await response.json();
      setProductCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Load products on initial mount
  useEffect(() => {
    fetchProducts();
    fetchProductCategories();
  }, []);

  // Load data when pages change
  useEffect(() => {
    if (currentPage === 'customers') {
      fetchAllCustomers();
    } else if (currentPage === 'orders') {
      fetchAllOrders();
    } else if (currentPage === 'reports') {
      fetchAllCustomers();
      fetchAllOrders();
    } else if (currentPage === 'catalogue') {
      fetchProducts();
      fetchProductCategories();
    }
  }, [currentPage]);

  // Customer search
  useEffect(() => {
    const searchCustomers = async () => {
      if (customerSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(`${BACKEND_URL}/customers/search?query=${encodeURIComponent(customerSearch)}`);
        const data = await response.json();
        setSearchResults(data.customers || []);
      } catch (error) {
        console.error('Error searching customers:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounce);
  }, [customerSearch]);

  // Handle new sale
  const handleNewSale = (preserveCustomer = false, preserveCart = false) => {
    setCurrentPage('pos');
    setStep('pos');
    if (!preserveCart) {
      setCart([]);
    }
    if (!preserveCustomer) {
      setSelectedCustomer(null);
    }
    setCustomerSearch('');
    setOrderNotes('');
  };

  // Handle customer selection
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setSearchResults([]);
  };

  // Create new customer
  const handleCreateCustomer = async () => {
    if (!newCustomerData.name || !newCustomerData.email) {
      alert('Please enter name and email');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomerData)
      });

      const data = await response.json();
      setSelectedCustomer(data.customer);
      setShowNewCustomerForm(false);
      setNewCustomerData({ name: '', email: '', phone: '' });
      setCustomerSearch('');
      fetchAllCustomers(); // Refresh customer list
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Failed to create customer');
    }
  };

  // Create new product
  const handleCreateProduct = async () => {
    if (!newProductData.category_id || !newProductData.name || !newProductData.base_price || !newProductData.unit) {
      alert('Please fill in all required fields (Category, Name, Price, Unit)');
      return;
    }

    // Validate that at least one option has a name
    const validOptions = newProductData.options.filter(opt => opt.option_name.trim() !== '');
    if (validOptions.length === 0) {
      alert('Please add at least one product option');
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProductData,
          base_price: parseFloat(newProductData.base_price),
          options: validOptions.map(opt => ({
            option_name: opt.option_name,
            price_adjustment: parseFloat(opt.price_adjustment || 0)
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const data = await response.json();
      setShowProductForm(false);
      setNewProductData({
        category_id: '',
        name: '',
        base_price: '',
        unit: '',
        options: [{ option_name: '', price_adjustment: 0 }]
      });

      // Refresh products
      fetchProducts();
      alert('Product created successfully!');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product: ' + error.message);
    }
  };

  // Add option to product form
  const handleAddOption = () => {
    setNewProductData({
      ...newProductData,
      options: [...newProductData.options, { option_name: '', price_adjustment: 0 }]
    });
  };

  // Remove option from product form
  const handleRemoveOption = (index) => {
    const updatedOptions = newProductData.options.filter((_, i) => i !== index);
    setNewProductData({
      ...newProductData,
      options: updatedOptions.length > 0 ? updatedOptions : [{ option_name: '', price_adjustment: 0 }]
    });
  };

  // Update option in product form
  const handleUpdateOption = (index, field, value) => {
    const updatedOptions = [...newProductData.options];
    updatedOptions[index][field] = value;
    setNewProductData({
      ...newProductData,
      options: updatedOptions
    });
  };

  // Cart functions
  const addToCart = (item, option) => {
    // Calculate final price with option adjustment
    const finalPrice = item.basePrice + (option.priceAdjustment || 0);

    const cartItem = {
      id: `${item.id}-${option.name}-${Date.now()}`,
      productId: item.id,
      name: item.name,
      option: option.name,
      unit: item.unit,
      price: finalPrice,
      quantity: 1
    };
    setCart([...cart, cartItem]);
  };

  const updateQuantity = (cartItemId, delta) => {
    setCart(cart.map(item =>
      item.id === cartItemId
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const removeFromCart = (cartItemId) => {
    setCart(cart.filter(item => item.id !== cartItemId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  // Search products across all categories
  const getSearchResults = () => {
    if (!productSearch || productSearch.length < 2) return [];

    const query = productSearch.toLowerCase();
    const results = [];

    Object.entries(productCatalog).forEach(([categoryName, categoryData]) => {
      categoryData.items.forEach(item => {
        if (item.name.toLowerCase().includes(query)) {
          results.push({
            ...item,
            categoryName,
            categoryIcon: categoryData.icon
          });
        }
      });
    });

    return results;
  };

  // Checkout
  const handleProceedToCheckout = () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }
    if (!selectedCustomer) {
      alert('Please select a customer first');
      setCurrentPage('home');
      return;
    }
    setStep('checkout');
  };

  // Submit order
  const handleSubmitOrder = async () => {
    if (!selectedCustomer) {
      alert('Please select or create a customer');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus(null);

    try {
      // Create payment intent
      const paymentResponse = await fetch(`${BACKEND_URL}/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          customerName: selectedCustomer.name,
          customerEmail: selectedCustomer.email
        })
      });

      if (!paymentResponse.ok) throw new Error('Failed to create payment intent');

      const paymentData = await paymentResponse.json();
      setClientSecret(paymentData.clientSecret);
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
  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      // Save order to database
      await fetch(`${BACKEND_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          cart,
          subtotal,
          tax,
          total,
          notes: orderNotes,
          paymentIntentId: paymentIntent.id
        })
      });

      setPaymentStatus({
        type: 'success',
        message: `Payment successful! Order total: $${(paymentIntent.amount / 100).toFixed(2)}`
      });

      setTimeout(() => {
        setCart([]);
        setSelectedCustomer(null);
        setOrderNotes('');
        setStep('pos');
        setClientSecret(null);
        setPaymentStatus(null);
        setCurrentPage('home');
        fetchDashboardStats();
      }, 3000);
    } catch (error) {
      console.error('Error saving order:', error);
    }
  };

  // Test payment (skip Stripe)
  const handleTestPayment = async () => {
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus(null);

    try {
      // Save order directly to database with test payment ID
      const response = await fetch(`${BACKEND_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          cart,
          subtotal,
          tax,
          total,
          notes: orderNotes,
          paymentIntentId: `test_${Date.now()}` // Test payment ID
        })
      });

      if (!response.ok) throw new Error('Failed to create order');

      setPaymentStatus({
        type: 'success',
        message: `Test payment successful! Order total: $${total.toFixed(2)}`
      });

      setTimeout(() => {
        setCart([]);
        setSelectedCustomer(null);
        setOrderNotes('');
        setStep('pos');
        setPaymentStatus(null);
        setCurrentPage('home');
        fetchDashboardStats();
      }, 2000);
    } catch (error) {
      setPaymentStatus({
        type: 'error',
        message: error.message || 'Failed to process test payment'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-indigo-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Print Shop POS</h1>
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                currentPage === 'home' ? 'bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </button>
            <button
              onClick={() => setCurrentPage('pos')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                currentPage === 'pos' ? 'bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.length > 0 ? 'Continue Sale' : 'New Sale'}
            </button>
            <button
              onClick={() => setCurrentPage('customers')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                currentPage === 'customers' ? 'bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              <Users className="w-4 h-4" />
              Customers
            </button>
            <button
              onClick={() => setCurrentPage('orders')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                currentPage === 'orders' ? 'bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              <Package className="w-4 h-4" />
              Orders
            </button>
            <button
              onClick={() => setCurrentPage('reports')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                currentPage === 'reports' ? 'bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Reports
            </button>
            <button
              onClick={() => setCurrentPage('catalogue')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                currentPage === 'catalogue' ? 'bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              <Package className="w-4 h-4" />
              Catalogue
            </button>
            <button
              onClick={() => setCurrentPage('settings')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                currentPage === 'settings' ? 'bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'
              }`}
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </nav>
        </div>
      </header>

      {/* Status Messages */}
      {paymentStatus && (
        <div className="max-w-7xl mx-auto mt-4 px-4">
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

        {/* HOME PAGE */}
        {currentPage === 'home' && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* New Sale Button */}
                <button
                  onClick={() => setCurrentPage('pos')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center gap-3 text-lg"
                >
                  <ShoppingCart className="w-6 h-6" />
                  {cart.length > 0 ? 'Continue Sale' : 'New Sale'}
                </button>

                {/* Customer Search */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search customers by name, email, or phone..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {(searchResults.length > 0 || (customerSearch.length >= 2 && !isSearching && searchResults.length === 0)) && (
                    <div className="absolute z-10 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
                      {searchResults.length > 0 ? (
                        searchResults.map(customer => (
                          <button
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-600">{customer.email}</p>
                            {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
                          </button>
                        ))
                      ) : (
                        <button
                          onClick={() => setShowNewCustomerForm(true)}
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 flex items-center gap-2 text-indigo-600"
                        >
                          <UserPlus className="w-5 h-5" />
                          <span>Add new customer</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Customer Display */}
              {selectedCustomer && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-indigo-900">Selected Customer: {selectedCustomer.name}</p>
                    <p className="text-sm text-indigo-700">{selectedCustomer.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Today's Sales</p>
                    <p className="text-2xl font-bold text-gray-900">${dashboardStats.dailySales}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">New Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.newCustomers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Orders Today</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats.ordersToday}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POS PAGE */}
        {currentPage === 'pos' && step === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Products Section */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                {/* Product Search Bar */}
                <div className="p-4 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search products by name..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {productSearch && (
                      <button
                        onClick={() => setProductSearch('')}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Tabs - Hidden when searching */}
                {!productSearch && (
                  <div className="border-b border-gray-200">
                    <div className="flex overflow-x-auto">
                      {Object.keys(productCatalog).map(category => {
                        const Icon = productCatalog[category].icon;
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
                )}

                {/* Products Grid */}
                <div className="p-6">
                  {productSearch ? (
                    // Search Results
                    (() => {
                      const searchResults = getSearchResults();
                      return searchResults.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 mb-4">
                            Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {searchResults.map(item => {
                              const Icon = item.categoryIcon;
                              return (
                                <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition-colors">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                        <Icon className="w-3 h-3" />
                                        <span>{item.categoryName}</span>
                                        <span className="mx-1">•</span>
                                        <span>{item.unit}</span>
                                      </div>
                                    </div>
                                    <span className="text-lg font-bold text-indigo-600 ml-2">
                                      {item.basePrice === 0 ? 'Quote' : `$${item.basePrice.toFixed(2)}`}
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {item.options.map((option, idx) => (
                                      <button
                                        key={idx}
                                        onClick={() => addToCart(item, option)}
                                        className="w-full px-4 py-2 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded text-sm font-medium transition-colors flex items-center justify-between"
                                      >
                                        <span>
                                          {option.name}
                                          {option.priceAdjustment > 0 && (
                                            <span className="ml-1 text-xs text-green-600">+${option.priceAdjustment.toFixed(2)}</span>
                                          )}
                                        </span>
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No products found for "{productSearch}"</p>
                          <p className="text-sm mt-2">Try a different search term</p>
                        </div>
                      );
                    })()
                  ) : (
                    // Category View
                    productCatalog[selectedCategory] && productCatalog[selectedCategory].items ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {productCatalog[selectedCategory].items.map(item => (
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
                              {item.options.map((option, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => addToCart(item, option)}
                                  className="w-full px-4 py-2 bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 rounded text-sm font-medium transition-colors flex items-center justify-between"
                                >
                                  <span>
                                    {option.name}
                                    {option.priceAdjustment > 0 && (
                                      <span className="ml-1 text-xs text-green-600">+${option.priceAdjustment.toFixed(2)}</span>
                                    )}
                                  </span>
                                  <Plus className="w-4 h-4" />
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No products found</p>
                        <p className="text-sm mt-2">Add products in Settings to get started</p>
                      </div>
                    )
                  )}
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
                  {selectedCustomer ? (
                    <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-indigo-900">{selectedCustomer.name}</p>
                        <p className="text-xs text-indigo-700">{selectedCustomer.email}</p>
                      </div>
                      <button
                        onClick={() => setSelectedCustomer(null)}
                        className="text-indigo-600 hover:text-indigo-700"
                        title="Change customer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          placeholder="Search customer..."
                          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Customer Search Results */}
                      {(searchResults.length > 0 || (customerSearch.length >= 2 && !isSearching && searchResults.length === 0)) && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
                          {searchResults.length > 0 ? (
                            searchResults.map(customer => (
                              <button
                                key={customer.id}
                                onClick={() => handleSelectCustomer(customer)}
                                className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <p className="font-medium text-sm text-gray-900">{customer.name}</p>
                                <p className="text-xs text-gray-600">{customer.email}</p>
                              </button>
                            ))
                          ) : (
                            <button
                              onClick={() => setShowNewCustomerForm(true)}
                              className="w-full px-3 py-2 text-left hover:bg-indigo-50 flex items-center gap-2 text-indigo-600"
                            >
                              <UserPlus className="w-4 h-4" />
                              <span className="text-sm">Add new customer</span>
                            </button>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => setShowNewCustomerForm(true)}
                        className="mt-2 w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        New Customer
                      </button>
                    </div>
                  )}
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

                    <div className="p-4 border-t border-gray-200 space-y-2">
                      <button
                        onClick={handleProceedToCheckout}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-5 h-5" />
                        Proceed to Checkout
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Clear the entire cart and start a new order?')) {
                            setCart([]);
                            setSelectedCustomer(null);
                            setOrderNotes('');
                          }
                        }}
                        className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Clear Cart
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CHECKOUT PAGE */}
        {currentPage === 'pos' && step === 'checkout' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Review Order</h2>
                <button
                  onClick={() => setStep('pos')}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Customer Info */}
                {selectedCustomer ? (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="font-medium text-indigo-900">Customer: {selectedCustomer.name}</p>
                    <p className="text-sm text-indigo-700">{selectedCustomer.email}</p>
                    {selectedCustomer.phone && <p className="text-sm text-indigo-600">{selectedCustomer.phone}</p>}
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800">Please select a customer before checkout</p>
                    <button
                      onClick={() => {
                        setStep('pos');
                        setCurrentPage('home');
                      }}
                      className="mt-2 text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      Go back and select customer
                    </button>
                  </div>
                )}

                {/* Order Notes */}
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

                {/* Order Total */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Order Total</span>
                    <span className="text-2xl font-bold text-indigo-600">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('pos')}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back to Cart
                    </button>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={isProcessing || !selectedCustomer}
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

                  {/* Test Payment Button */}
                  <button
                    onClick={handleTestPayment}
                    disabled={isProcessing || !selectedCustomer}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Test Payment (Skip Stripe)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT PAGE */}
        {currentPage === 'pos' && step === 'payment' && clientSecret && (
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
                  <span className="font-medium">{selectedCustomer?.name}</span>
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

        {/* CUSTOMERS PAGE */}
        {currentPage === 'customers' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
                  <button
                    onClick={() => setShowNewCustomerForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add Customer
                  </button>
                </div>

                {/* Search Filter */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    placeholder="Search customers by name, email, or phone..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Customers Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allCustomers
                      .filter(customer =>
                        customerFilter === '' ||
                        customer.name.toLowerCase().includes(customerFilter.toLowerCase()) ||
                        customer.email.toLowerCase().includes(customerFilter.toLowerCase()) ||
                        (customer.phone && customer.phone.includes(customerFilter))
                      )
                      .map(customer => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{customer.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-600">{customer.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-600">{customer.phone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-600">{new Date(customer.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCustomerDetails(customer);
                                  fetchCustomerOrders(customer.id);
                                }}
                                className="text-indigo-600 hover:text-indigo-700 p-1"
                                title="View Details"
                              >
                                <Eye className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  handleNewSale(true, true);
                                }}
                                className="text-green-600 hover:text-green-700 p-1"
                                title="New Sale"
                              >
                                <ShoppingCart className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {allCustomers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No customers found</p>
                  <button
                    onClick={() => setShowNewCustomerForm(true)}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Add your first customer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ORDERS PAGE */}
        {currentPage === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">Order History</h2>
                  <button
                    onClick={() => setCurrentPage('pos')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cart.length > 0 ? 'Continue Sale' : 'New Sale'}
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                  {['all', 'pending', 'paid', 'completed', 'cancelled'].map(status => (
                    <button
                      key={status}
                      onClick={() => setOrderFilter(status)}
                      className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                        orderFilter === status
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allOrders
                      .filter(order => orderFilter === 'all' || order.status === orderFilter)
                      .map(order => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{order.order_number}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-600">{order.customer_name || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-600">{new Date(order.created_at).toLocaleDateString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-semibold text-gray-900">${parseFloat(order.total).toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              order.status === 'paid' ? 'bg-green-100 text-green-800' :
                              order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="text-indigo-600 hover:text-indigo-700 p-1"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {allOrders.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No orders found</p>
                  <button
                    onClick={() => setCurrentPage('pos')}
                    className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Create your first order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REPORTS PAGE */}
        {currentPage === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sales Reports & Analytics</h2>

              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-green-700 text-sm font-medium">Total Revenue</p>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-900">
                    ${allOrders
                      .filter(o => o.status === 'paid' || o.status === 'completed')
                      .reduce((sum, o) => sum + parseFloat(o.total), 0)
                      .toFixed(2)}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-blue-700 text-sm font-medium">Total Orders</p>
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{allOrders.length}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-purple-700 text-sm font-medium">Total Customers</p>
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-900">{allCustomers.length}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-orange-700 text-sm font-medium">Avg Order Value</p>
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-3xl font-bold text-orange-900">
                    ${allOrders.length > 0
                      ? (allOrders.reduce((sum, o) => sum + parseFloat(o.total), 0) / allOrders.length).toFixed(2)
                      : '0.00'}
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <div className="space-y-3">
                  {allOrders.slice(0, 10).map(order => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-100 rounded">
                          <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.order_number}</p>
                          <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">${parseFloat(order.total).toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          order.status === 'paid' ? 'bg-green-100 text-green-700' :
                          order.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {allOrders.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No data available yet</p>
                    <p className="text-sm mt-2">Start making sales to see reports</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CATALOGUE PAGE */}
        {currentPage === 'catalogue' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Product Catalogue</h2>
                <button
                  onClick={() => setShowProductForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Product
                </button>
              </div>

              {Object.keys(productCatalog).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(productCatalog).map(([category, data]) => (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {React.createElement(data.icon, { className: 'w-5 h-5 text-indigo-600' })}
                          <h4 className="font-semibold text-gray-900">{category}</h4>
                        </div>
                        <span className="text-sm text-gray-600">{data.items.length} items</span>
                      </div>
                      <div className="pl-7 space-y-1">
                        {data.items.map(item => (
                          <div key={item.id} className="flex items-center justify-between text-sm py-1">
                            <span className="text-gray-700">{item.name} - {item.unit}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {item.basePrice === 0 ? 'Quote' : `$${item.basePrice.toFixed(2)}`}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({item.options.length} options)
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 border border-gray-200 rounded-lg">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No products found</p>
                  <p className="text-sm mt-2">Run the products schema SQL to populate your catalog</p>
                  <p className="text-xs mt-1 text-gray-400">See SETUP_PRODUCTS.md for instructions</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS PAGE */}
        {currentPage === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>

              {/* Business Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                    <input
                      type="text"
                      defaultValue="Print Shop POS"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tax Rate (%)</label>
                    <input
                      type="number"
                      defaultValue="8"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Version</span>
                    <span className="font-medium text-gray-900">1.0.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Database</span>
                    <span className="font-medium text-gray-900">Supabase (Connected)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Provider</span>
                    <span className="font-medium text-gray-900">Stripe (Test Mode)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* New Customer Form Modal */}
      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Customer</h2>
              <button
                onClick={() => setShowNewCustomerForm(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newCustomerData.email}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={newCustomerData.phone}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewCustomerForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomer}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Create Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Customer Details</h2>
              <button
                onClick={() => setSelectedCustomerDetails(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Customer Info */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-900 mb-2">{selectedCustomerDetails.name}</h3>
                <p className="text-sm text-indigo-700">{selectedCustomerDetails.email}</p>
                {selectedCustomerDetails.phone && (
                  <p className="text-sm text-indigo-600">{selectedCustomerDetails.phone}</p>
                )}
                <p className="text-xs text-indigo-500 mt-2">
                  Customer since {new Date(selectedCustomerDetails.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Order History */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order History</h3>
                {selectedCustomerDetails.orders && selectedCustomerDetails.orders.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCustomerDetails.orders.map(order => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{order.order_number}</span>
                          <span className="font-semibold text-indigo-600">${parseFloat(order.total).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">{new Date(order.created_at).toLocaleDateString()}</span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'paid' ? 'bg-green-100 text-green-800' :
                            order.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No orders yet</p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedCustomer(selectedCustomerDetails);
                  setSelectedCustomerDetails(null);
                  handleNewSale(true, true);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Create New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Number</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    selectedOrder.status === 'paid' ? 'bg-green-100 text-green-800' :
                    selectedOrder.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium text-gray-900">{selectedOrder.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium text-gray-900">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-2">
                  {selectedOrder.order_items && selectedOrder.order_items.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name}</p>
                          <p className="text-sm text-gray-600">{item.option_selected}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Order Total */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="font-medium">${parseFloat(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Tax</span>
                  <span className="font-medium">${parseFloat(selectedOrder.tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-indigo-300">
                  <span>Total</span>
                  <span className="text-indigo-600">${parseFloat(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setNewProductData({
                    category_id: '',
                    name: '',
                    base_price: '',
                    unit: '',
                    options: [{ option_name: '', price_adjustment: 0 }]
                  });
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Category Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={newProductData.category_id}
                  onChange={(e) => setNewProductData({ ...newProductData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a category</option>
                  {productCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={newProductData.name}
                  onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Standard Business Cards"
                />
              </div>

              {/* Base Price and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Base Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProductData.base_price}
                    onChange={(e) => setNewProductData({ ...newProductData, base_price: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="49.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                  <input
                    type="text"
                    value={newProductData.unit}
                    onChange={(e) => setNewProductData({ ...newProductData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., 500 cards"
                  />
                </div>
              </div>

              {/* Product Options */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Product Options *</label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </button>
                </div>

                <div className="space-y-3">
                  {newProductData.options.map((option, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={option.option_name}
                          onChange={(e) => handleUpdateOption(index, 'option_name', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Option name (e.g., Matte)"
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          step="0.01"
                          value={option.price_adjustment}
                          onChange={(e) => handleUpdateOption(index, 'price_adjustment', e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="+$0.00"
                        />
                      </div>
                      {newProductData.options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(index)}
                          className="p-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add price adjustments for premium options (e.g., +10 for Spot UV)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowProductForm(false);
                    setNewProductData({
                      category_id: '',
                      name: '',
                      base_price: '',
                      unit: '',
                      options: [{ option_name: '', price_adjustment: 0 }]
                    });
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProduct}
                  className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Create Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
