import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, Calendar, Shield, Star, Truck, Factory, Filter, Search, Plus, Minus, CreditCard, User, Package, History, MessageCircle, Link, Phone, ExternalLink } from 'lucide-react';
import PaystackButton from './Paystack';
import { useAuth } from './AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Marketplace from './Marketplace';
import ProductHistory from './ProductHistory';
import KYCVerification from './KYCVerification';
import VerificationBadge from './VerificationBadge';
import SmartContractDashboard from './SmartContractDashboard';
import BlockchainPayment from './BlockchainPayment';
import TraceabilityQRCode from './TraceabilityQRCode';
import NavigationTabs from './NavigationTabs';
import NotificationSystem, { useNotifications } from './NotificationSystem';
import ConfirmationDialog, { useConfirmation } from './ConfirmationDialog';
import { addTraceabilityEvent, TRACE_EVENT_TYPES } from '../utils/traceabilityUtils';
import { useBlockchainIntegration } from '../hooks/useBlockchainIntegration';
import BlockchainStatus from './BlockchainStatus';

const BATCHES_KEY = 'batches';
const ORDERS_KEY = 'orders';
const REQUESTS_KEY = 'consumer_requests';

const CustomerOrderDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [showCreateRequest, setShowCreateRequest] = useState(false);

  // Blockchain integration
  const { isConnected, recordOrderOnChain, confirmDeliveryOnChain } = useBlockchainIntegration();
  const [selectedDistributor, setSelectedDistributor] = useState(null);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    deliveryDate: '',
    paymentMethod: 'card',
    specialInstructions: ''
  });
  const [newRequest, setNewRequest] = useState({
    productName: '',
    category: '',
    quantity: '',
    maxPrice: '',
    description: '',
    urgency: 'normal'
  });
  const [products, setProducts] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [productRequests, setProductRequests] = useState([]);

  // Blockchain wallet state
  const [walletData, setWalletData] = useState(null);
  const [accountId, setAccountId] = useState('');

  // UI/UX improvements
  const notifications = useNotifications();
  const { ConfirmationDialog } = useConfirmation();  // Mock product categories
  const categories = [
    { id: 'all', name: 'All Products', count: 15 },
    { id: 'flour', name: 'Flour Products', count: 8 },
    { id: 'organic', name: 'Organic', count: 5 },
    { id: 'bulk', name: 'Bulk Orders', count: 3 },
    { id: 'premium', name: 'Premium', count: 4 }
  ];

  const distributors = [
    {
      id: 'dist-001',
      name: 'Fresh Foods Distribution',
      location: 'Lagos, Nigeria',
      rating: 4.7,
      deliveryTime: '24-48 hours',
      minOrder: 5000,
      contact: '+234-801-555-0123',
      email: 'orders@freshfoods.ng',
      specialties: ['Organic Products', 'Quick Delivery'],
      deliveryFee: 1500,
      products: [
        {
          id: 'prod-001',
          name: 'Premium Plantain Flour',
          brand: 'AGFoods Certified',
          price: 2500,
          unit: '1kg',
          stock: 150,
          farm: 'Green Valley Farm',
          category: 'premium',
          image: '🌾',
          rating: 4.8,
          description: 'High-quality plantain flour from certified organic farms',
          nutritionInfo: {
            calories: '350 per 100g',
            protein: '4.2g',
            carbs: '88g',
            fiber: '2.1g'
          }
        },
        {
          id: 'prod-002',
          name: 'Organic Plantain Flour',
          brand: 'AGFoods Premium',
          price: 3200,
          unit: '1kg',
          stock: 89,
          farm: 'Sunshine Organic Farm',
          category: 'organic',
          image: '🌱',
          rating: 4.9,
          description: 'Certified organic plantain flour with no pesticides',
          nutritionInfo: {
            calories: '340 per 100g',
            protein: '4.5g',
            carbs: '86g',
            fiber: '2.8g'
          }
        },
        {
          id: 'prod-003',
          name: 'Bulk Plantain Flour',
          brand: 'AGFoods Standard',
          price: 8500,
          unit: '5kg',
          stock: 45,
          farm: 'Valley Green Cooperative',
          category: 'bulk',
          image: '📦',
          rating: 4.6,
          description: 'Economical bulk packaging for large families and businesses',
          nutritionInfo: {
            calories: '355 per 100g',
            protein: '4.0g',
            carbs: '89g',
            fiber: '2.0g'
          }
        }
      ]
    },
    {
      id: 'dist-002',
      name: 'Northern Foods Network',
      location: 'Abuja, Nigeria',
      rating: 4.5,
      deliveryTime: '48-72 hours',
      minOrder: 3000,
      contact: '+234-803-555-0456',
      email: 'sales@northernfoods.ng',
      specialties: ['Bulk Orders', 'Fair Trade'],
      deliveryFee: 2000,
      products: [
        {
          id: 'prod-004',
          name: 'Fair Trade Plantain Flour',
          brand: 'AGFoods Ethical',
          price: 2800,
          unit: '1kg',
          stock: 120,
          farm: 'Community Farm Co-op',
          category: 'organic',
          image: '🤝',
          rating: 4.7,
          description: 'Ethically sourced flour supporting local farming communities',
          nutritionInfo: {
            calories: '345 per 100g',
            protein: '4.3g',
            carbs: '87g',
            fiber: '2.4g'
          }
        },
        {
          id: 'prod-005',
          name: 'Traditional Plantain Flour',
          brand: 'AGFoods Heritage',
          price: 2200,
          unit: '1kg',
          stock: 200,
          farm: 'Heritage Farms',
          category: 'flour',
          image: '🏛️',
          rating: 4.5,
          description: 'Traditional processing methods for authentic taste',
          nutritionInfo: {
            calories: '360 per 100g',
            protein: '3.8g',
            carbs: '90g',
            fiber: '1.9g'
          }
        }
      ]
    }
  ];

  // Load product requests from localStorage for this consumer
  useEffect(() => {
    if (!user) return;
    const allRequests = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
    setProductRequests(allRequests.filter(r => r.consumerId === user.id));
  }, [user]);

  // Save product requests to localStorage
  const saveProductRequests = (updatedRequests) => {
    const allRequests = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
    // Remove this consumer's requests, add updated
    const filtered = allRequests.filter(r => r.consumerId !== user.id);
    const merged = [...filtered, ...updatedRequests];
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(merged));
    setProductRequests(updatedRequests);
  };

  // Create a new product request
  const handleCreateRequest = () => {
    const request = {
      id: 'REQ-' + Date.now(),
      consumerId: user.id,
      productName: newRequest.productName,
      category: newRequest.category,
      quantity: newRequest.quantity,
      maxPrice: newRequest.maxPrice,
      description: newRequest.description,
      urgency: newRequest.urgency,
      status: 'Open',
      createdAt: new Date().toISOString()
    };
    const updated = [request, ...productRequests];
    saveProductRequests(updated);
    setShowCreateRequest(false);
    setNewRequest({ productName: '', category: '', quantity: '', maxPrice: '', description: '', urgency: 'normal' });
  };

  // Get all products from all distributors
  const allProducts = distributors.flatMap(dist =>
    dist.products.map(product => ({ ...product, distributor: dist }))
  );

  // Filter products based on category and search
  const filteredProducts = allProducts.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { ...product, quantity }];
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== productId));
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.id === productId ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDeliveryFee = () => {
    if (cart.length === 0) return 0;
    const distributorIds = [...new Set(cart.map(item => item.distributor.id))];
    return distributorIds.reduce((total, distId) => {
      const distributor = distributors.find(d => d.id === distId);
      return total + (distributor?.deliveryFee || 0);
    }, 0);
  };

  // Load products and orders from localStorage for this consumer
  useEffect(() => {
    const allBatches = JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
    setProducts(allBatches.filter(b => b.status === 'Ready' || b.status === 'Delivered'));
    const allOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    setOrderHistory(allOrders.filter(o => o.consumerId === user?.id));
  }, [user]);

  // When placing an order, save to localStorage
  const handleOrderSubmit = (orderData) => {
    const order = {
      ...orderData,
      id: 'ORD-' + Date.now(),
      consumerId: user.id,
      createdAt: new Date().toISOString(),
      status: 'Placed'
    };
    const allOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const updated = [order, ...allOrders];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updated));
    setOrderHistory([order, ...orderHistory]);

    // Add traceability events for each product in the cart
    cart.forEach(item => {
      if (item.batchId) {
        addTraceabilityEvent(
          item.batchId,
          TRACE_EVENT_TYPES.CONSUMER_FEEDBACK,
          {
            userName: `${user.firstName} ${user.lastName}`,
            description: `Product ordered by consumer`,
            location: orderData.address,
            details: {
              productName: item.name,
              quantity: item.quantity,
              orderValue: item.price * item.quantity,
              customerInfo: {
                name: orderData.customerName,
                email: orderData.email,
                phone: orderData.phone,
                address: orderData.address
              },
              orderId: order.id,
              orderDate: new Date().toISOString()
            }
          },
          user.id,
          'consumer'
        );
      }
    });
  };

  const confirmDelivery = (orderId, batchId, rating = 5, feedback = '') => {
    // Update order status
    const allOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const updatedOrders = allOrders.map(order =>
      order.id === orderId ? { ...order, status: 'Delivered', deliveredDate: new Date().toISOString() } : order
    );
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));

    // Update local state
    setOrderHistory(prev => prev.map(order =>
      order.id === orderId ? { ...order, status: 'Delivered', deliveredDate: new Date().toISOString() } : order
    ));

    // Add delivery confirmation traceability event
    if (batchId) {
      addTraceabilityEvent(
        batchId,
        TRACE_EVENT_TYPES.CONSUMER_FEEDBACK,
        {
          userName: `${user.firstName} ${user.lastName}`,
          description: `Delivery confirmed with ${rating}/5 stars`,
          location: user.address || 'Consumer Location',
          details: {
            deliveryConfirmed: true,
            rating: rating,
            feedback: feedback,
            orderId: orderId,
            deliveryDate: new Date().toISOString(),
            customerSatisfaction: rating >= 4 ? 'Satisfied' : rating >= 3 ? 'Average' : 'Needs Improvement'
          }
        },
        user.id,
        'consumer'
      );
    }
  };

  const addProductFeedback = (batchId, rating, feedback) => {
    addTraceabilityEvent(
      batchId,
      TRACE_EVENT_TYPES.CONSUMER_FEEDBACK,
      {
        userName: `${user.firstName} ${user.lastName}`,
        description: `Consumer feedback: ${rating}/5 stars`,
        location: user.address || 'Consumer Location',
        details: {
          rating: rating,
          feedback: feedback,
          feedbackDate: new Date().toISOString(),
          customerSatisfaction: rating >= 4 ? 'Satisfied' : rating >= 3 ? 'Average' : 'Needs Improvement'
        }
      },
      user.id,
      'consumer'
    );
  };



  const ProductCard = ({ product }) => {
    const isInCart = cart.some(item => item.id === product.id);

    return (
      <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="text-3xl">{product.image}</div>
            <div className="text-right">
              <div className="flex items-center space-x-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 ${star <= product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                  />
                ))}
                <span className="text-xs text-gray-600 ml-1">{product.rating}</span>
              </div>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                {product.stock} in stock
              </span>
            </div>
          </div>

          <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
          <p className="text-xs text-gray-500 mb-3">{product.description}</p>

          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-lg font-bold text-gray-900">₦{product.price.toLocaleString()}</span>
              <span className="text-sm text-gray-500">/{product.unit}</span>
            </div>
            <div className="text-xs text-gray-500">
              <MapPin className="w-3 h-3 inline mr-1" />
              {product.distributor.location}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Farm: {product.farm}</span>
              <span className="flex items-center">
                <Truck className="w-3 h-3 mr-1" />
                {product.distributor.deliveryTime}
              </span>
            </div>

            {/* Traceability QR Code */}
            <div className="flex items-center justify-between text-xs bg-blue-50 p-2 rounded-md">
              <div>
                <p className="font-medium text-blue-800">Batch Traceability</p>
                <p className="text-blue-600">Batch: {product.batchId || `BT${product.id.slice(-6)}`}</p>
              </div>
              <TraceabilityQRCode
                batchId={product.batchId || `BT${product.id.slice(-6)}`}
                productName={product.name}
                size={50}
                showDetails={false}
              />
            </div>

            <button
              onClick={() => addToCart(product)}
              className={`w-full py-2 px-4 rounded-md transition-colors font-medium text-sm ${isInCart
                ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              disabled={isInCart}
            >
              {isInCart ? 'Added to Cart' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CartItem = ({ item }) => (
    <div className="flex items-center space-x-4 py-3 border-b">
      <div className="text-2xl">{item.image}</div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
        <p className="text-sm text-gray-600">{item.brand}</p>
        <p className="text-xs text-gray-500">{item.distributor.name}</p>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <div className="text-right">
        <p className="font-medium text-gray-900">₦{(item.price * item.quantity).toLocaleString()}</p>
        <p className="text-xs text-gray-500">₦{item.price.toLocaleString()}/unit</p>
      </div>
    </div>
  );

  function exportToCSV(data, filename) {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
      csvRows.push(headers.map(h => '"' + (row[h] ?? '') + '"').join(','));
    }
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
  // PDF export utility
  function exportToPDF(data, filename) {
    if (!data.length) return;
    const doc = new jsPDF();
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => row[h] ?? ''));
    autoTable({ head: [headers], body: rows });
    doc.save(filename);
  }

  const navigationTabs = [
    { id: 'browse', label: 'Browse Products', icon: <Package className="w-4 h-4" /> },
    { id: 'cart', label: `Cart (${cart.length})`, icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'orders', label: 'My Orders', icon: <Calendar className="w-4 h-4" /> },
    { id: 'requests', label: `Requests (${productRequests.length})`, icon: <Plus className="w-4 h-4" /> },
    { id: 'distributors', label: 'Distributors', icon: <Truck className="w-4 h-4" /> },
    { id: 'traceability', label: 'Product History', icon: <History className="w-4 h-4" /> },
    { id: 'verification', label: 'KYC/Verification', icon: <Shield className="w-4 h-4" /> },
    { id: 'marketplace', label: 'Marketplace', icon: <Factory className="w-4 h-4" /> },
    { id: 'blockchain', label: 'Smart Contract', icon: <Link className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <NavigationTabs
        tabs={navigationTabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        colorScheme="green"
      />

      {/* User Profile Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-sm text-gray-600">Consumer Account</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <VerificationBadge
                status={user?.verification?.status}
                level={user?.verification?.level}
                size="md"
              />
              <div className="text-right">
                <p className="text-sm text-gray-500">Member since</p>
                <p className="text-sm font-medium text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name} ({category.count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No products found matching your criteria</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold text-gray-900">Shopping Cart</h2>
                </div>

                {cart.length > 0 ? (
                  <div className="p-4">
                    {cart.map(item => (
                      <CartItem key={item.id} item={item} />
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Your cart is empty</p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            {cart.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>₦{getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee:</span>
                    <span>₦{getDeliveryFee().toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₦{(getTotalPrice() + getDeliveryFee()).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowOrderForm(true)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'distributors' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Distributors</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {distributors.map(distributor => (
                <div key={distributor.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{distributor.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {distributor.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1 mb-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium">{distributor.rating}</span>
                      </div>
                      <p className="text-xs text-gray-500">{distributor.products.length} products</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Time:</span>
                      <span className="font-medium">{distributor.deliveryTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Order:</span>
                      <span className="font-medium">₦{distributor.minOrder.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee:</span>
                      <span className="font-medium">₦{distributor.deliveryFee.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {distributor.specialties.map((specialty, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {specialty}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span>{distributor.contact}</span>
                    </div>
                    <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                      View Products
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900">Order History</h2>
                <p className="text-gray-600">Track your orders and provide feedback</p>
              </div>

              {orderHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders yet. Place your first order to see it here!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {orderHistory.map(order => (
                    <div key={order.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-gray-900">Order #{order.id}</h4>
                          <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                            {order.status}
                          </span>
                          {order.deliveredDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Delivered {new Date(order.deliveredDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          <strong>Delivery Address:</strong> {order.address}, {order.city}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Phone:</strong> {order.phone}
                        </p>
                      </div>

                      <div className="flex space-x-3">
                        {order.status === 'In Transit' && (
                          <button
                            onClick={() => confirmDelivery(order.id, order.batchId || '', 5, 'Product delivered successfully')}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center space-x-1"
                          >
                            <Package className="w-4 h-4" />
                            <span>Confirm Delivery</span>
                          </button>
                        )}
                        {order.status === 'Delivered' && (
                          <button
                            onClick={() => addProductFeedback(order.batchId || '', 5, 'Great product quality!')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center space-x-1"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Leave Feedback</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (order.batchId) {
                              setActiveTab('traceability');
                            }
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center space-x-1"
                        >
                          <History className="w-4 h-4" />
                          <span>View Product History</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="space-y-6">
            {/* Header with Create Request Button */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Product Requests</h2>
                  <p className="text-gray-600">Request specific products from suppliers</p>
                </div>
                <button
                  onClick={() => setShowCreateRequest(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Request</span>
                </button>
              </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Your Requests</h3>
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                    onClick={() => exportToCSV(productRequests, 'product-requests.csv')}
                    disabled={productRequests.length === 0}
                  >
                    Export CSV
                  </button>
                  <button
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                    onClick={() => exportToPDF(productRequests, 'product-requests.pdf')}
                    disabled={productRequests.length === 0}
                  >
                    Export PDF
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Request ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Price (₦)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productRequests.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-gray-400">No requests yet. Click "Create Request" to add your first request.</td>
                      </tr>
                    ) : (
                      productRequests.map(request => (
                        <tr key={request.id}>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{request.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium">{request.productName}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{request.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{request.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap">₦{request.maxPrice}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${request.urgency === 'urgent' ? 'bg-red-100 text-red-800' :
                              request.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                              {request.urgency}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${request.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                              request.status === 'Matched' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]" onClick={() => setShowOrderForm(false)}>
          <div className="bg-white h-[80vh] overflow-y-auto rounded-xl max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Complete Your Order</h2>
              <button
                onClick={() => setShowOrderForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleOrderSubmit(orderForm);
            }} className="p-6 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={orderForm.email}
                      onChange={(e) => setOrderForm({ ...orderForm, email: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Delivery Date</label>
                    <input
                      type="date"
                      required
                      value={orderForm.deliveryDate}
                      onChange={(e) => setOrderForm({ ...orderForm, deliveryDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Delivery Address
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <textarea
                      required
                      rows={3}
                      value={orderForm.address}
                      onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={orderForm.city}
                        onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={orderForm.state}
                        onChange={(e) => setOrderForm({ ...orderForm, state: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Method
                </h3>
                <div className="space-y-2">
                  {[
                    { id: 'card', label: 'Credit/Debit Card', desc: 'Pay securely with your card' },
                    { id: 'transfer', label: 'Bank Transfer', desc: 'Direct bank transfer' },
                    { id: 'cash', label: 'Cash on Delivery', desc: 'Pay when you receive your order' },
                    { id: 'hbar', label: 'HBAR (Blockchain)', desc: 'Pay with HBAR cryptocurrency', icon: '⚡' },
                    { id: 'escrow', label: 'HBAR Escrow', desc: 'Secure escrow payment with HBAR', icon: '🔒' }
                  ].map(method => (
                    <div key={method.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        id={method.id}
                        name="paymentMethod"
                        value={method.id}
                        checked={orderForm.paymentMethod === method.id}
                        onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <label htmlFor={method.id} className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900 flex items-center">
                          {method.icon && <span className="mr-2">{method.icon}</span>}
                          {method.label}
                        </div>
                        <div className="text-sm text-gray-600">{method.desc}</div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions (Optional)</label>
                <textarea
                  rows={3}
                  value={orderForm.specialInstructions}
                  onChange={(e) => setOrderForm({ ...orderForm, specialInstructions: e.target.value })}
                  placeholder="Any special delivery instructions or notes..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>₦{getTotalPrice().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Delivery Fee:</span>
                      <span>₦{getDeliveryFee().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base mt-2 pt-2 border-t">
                      <span>Total:</span>
                      <span>₦{(getTotalPrice() + getDeliveryFee()).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowOrderForm(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                {/* Conditional Payment Rendering */}
                {(orderForm.paymentMethod === 'hbar' || orderForm.paymentMethod === 'escrow') ? (
                  <div className="flex-2">
                    <BlockchainPayment
                      amount={getTotalPrice() + getDeliveryFee()}
                      orderId={`ORD-${Date.now()}`}
                      paymentMethod={orderForm.paymentMethod}
                      onSuccess={(paymentResult) => {
                        // Handle successful blockchain payment
                        const orderData = {
                          ...orderForm,
                          items: cart,
                          total: getTotalPrice() + getDeliveryFee(),
                          paymentReference: paymentResult.transactionId,
                          blockchainPayment: true,
                          paymentResult: paymentResult
                        };
                        handleOrderSubmit(orderData);
                        notifications.showSuccess(
                          'Payment Successful!',
                          `Your blockchain payment has been processed. Transaction ID: ${paymentResult.transactionId}`
                        );
                        setCart([]);
                        setShowOrderForm(false);
                        setOrderForm({
                          customerName: '',
                          email: '',
                          phone: '',
                          address: '',
                          city: '',
                          state: '',
                          deliveryDate: '',
                          paymentMethod: 'card',
                          specialInstructions: ''
                        });
                      }}
                      onError={(error) => {
                        notifications.showError(
                          'Payment Failed',
                          `There was an issue processing your blockchain payment: ${error}`
                        );
                      }}
                      walletData={walletData}
                      accountId={accountId}
                    />
                  </div>
                ) : (
                  <>
                    <button
                      type="submit"
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Place Order
                    </button>
                    <PaystackButton
                      email={orderForm.email}
                      amount={getTotalPrice() + getDeliveryFee()}
                      onSuccessCallback={(reference) => {
                        alert(`Order placed successfully! Ref: ${reference.reference}`);
                        setCart([]);
                        setShowOrderForm(false);
                        setOrderForm({
                          customerName: '',
                          email: '',
                          phone: '',
                          address: '',
                          city: '',
                          state: '',
                          deliveryDate: '',
                          paymentMethod: 'card',
                          specialInstructions: ''
                        });
                      }}
                    />
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Create Product Request</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={newRequest.productName}
                  onChange={(e) => setNewRequest({ ...newRequest, productName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="What product are you looking for?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={newRequest.category}
                  onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select category</option>
                  <option value="Plantain Flour">Plantain Flour</option>
                  <option value="Plantain Chips">Plantain Chips</option>
                  <option value="Dried Plantain">Dried Plantain</option>
                  <option value="Plantain Puree">Plantain Puree</option>
                  <option value="Raw Plantain">Raw Plantain</option>
                  <option value="Processed Foods">Processed Foods</option>
                  <option value="Organic Products">Organic Products</option>
                  <option value="Bulk Items">Bulk Items</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity Needed
                </label>
                <input
                  type="text"
                  value={newRequest.quantity}
                  onChange={(e) => setNewRequest({ ...newRequest, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 100kg, 50 packs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Price (₦)
                </label>
                <input
                  type="number"
                  value={newRequest.maxPrice}
                  onChange={(e) => setNewRequest({ ...newRequest, maxPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Your maximum budget"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Urgency
                </label>
                <select
                  value={newRequest.urgency}
                  onChange={(e) => setNewRequest({ ...newRequest, urgency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description & Requirements
                </label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows="3"
                  placeholder="Specify quality requirements, delivery preferences, certifications needed..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateRequest(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                disabled={!newRequest.productName || !newRequest.category || !newRequest.quantity || !newRequest.maxPrice}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Traceability Tab */}
      {activeTab === 'traceability' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Product Traceability & History</h2>
              <p className="text-gray-600 mt-1">
                Track your products and leave feedback about your experience
              </p>
            </div>
            <div className="p-6">
              <ProductHistory
                batchId={products[0]?.batchId || ''}
                compact={false}
                showAddEvent={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Verification Tab */}
      {activeTab === 'verification' && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <KYCVerification />
        </div>
      )}

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <Marketplace />
      )}

      {/* Blockchain Tab */}
      {activeTab === 'blockchain' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SmartContractDashboard
            user={user}
            products={cart}
            onWalletConnect={(walletData, accountId) => {
              setWalletData(walletData);
              setAccountId(accountId);
            }}
            onTransactionComplete={(data) => {
              // Handle blockchain transaction completion
              console.log('Blockchain transaction completed:', data);

              // If it's a payment processing, handle completion
              if (data.type === 'payment_processed') {
                alert('Payment processed successfully on blockchain!');
                // Clear cart after successful payment
                setCart([]);
                localStorage.removeItem('cart');

                // Add to orders
                const newOrder = {
                  id: Date.now().toString(),
                  items: cart,
                  total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
                  status: 'Processing',
                  date: new Date().toISOString(),
                  transactionId: data.result?.transactionId,
                  paymentMethod: 'HBAR'
                };

                const updatedOrders = [...orderHistory, newOrder];
                setOrderHistory(updatedOrders);
                localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
              }
            }}
          />
        </div>
      )}

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications.notifications}
        onDismiss={notifications.removeNotification}
      />

      {/* Confirmation Dialog */}
      {ConfirmationDialog}
    </div>
  );
};

export default CustomerOrderDashboard;

// import PaystackButton from './components/PaystackButton';

// const Consumer = () => {
// const handleOrderSuccess = (reference) => {
//     // TODO: Call smart contract OR update backend DB with order info
//     alert(`Order placed successfully! Ref: ${reference.reference}`);
// };

// return (
//     <div className="p-6">
//     <h1 className="text-xl mb-4">Place Order</h1>
//     <PaystackButton
//         email="user@example.com"
//         amount={5000} // ₦5000
//         onSuccessCallback={handleOrderSuccess}
//     />
//     </div>
// );
// };

// export default Consumer;
