import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, Calendar, Shield, Star, Truck, Factory, Leaf, Phone, Mail, Award, Filter, Search, Plus, Minus, CreditCard, User, Clock, Package } from 'lucide-react';
import PaystackButton from './Paystack';
import { useAuth } from './AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
autoTable(jsPDF);

const BATCHES_KEY = 'batches';
const ORDERS_KEY = 'orders';

const CustomerOrderDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showOrderForm, setShowOrderForm] = useState(false);
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
  const [products, setProducts] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);

  // Mock product categories
  const categories = [
    { id: 'all', name: 'All Products', count: 15 },
    { id: 'flour', name: 'Flour Products', count: 8 },
    { id: 'organic', name: 'Organic', count: 5 },
    { id: 'bulk', name: 'Bulk Orders', count: 3 },
    { id: 'premium', name: 'Premium', count: 4 }
  ];

  // Mock distributors with products
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
  };



  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="text-3xl">{product.image}</div>
          <div className="text-right">
            <div className="flex items-center space-x-1 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-3 h-3 ${
                    star <= product.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
          
          <button
            onClick={() => addToCart(product)}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors font-medium text-sm"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );

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

  // CSV export utility
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

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'browse', label: 'Browse Products', icon: <Package className="w-4 h-4" /> },
              { id: 'cart', label: `Cart (${cart.length})`, icon: <ShoppingCart className="w-4 h-4" /> },
              { id: 'orders', label: 'My Orders', icon: <Calendar className="w-4 h-4" /> },
              { id: 'distributors', label: 'Distributors', icon: <Truck className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
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
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No orders yet. Place your first order to see it here!</p>
          </div>
        )}
      </main>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowOrderForm(false)}>
          <div className="bg-white h-[80vh] overflow-y-auto rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Complete Your Order</h2>
              <button
                onClick={() => setShowOrderForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="p-6 space-y-6">
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
                      onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      value={orderForm.email}
                      onChange={(e) => setOrderForm({...orderForm, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Delivery Date</label>
                    <input
                      type="date"
                      required
                      value={orderForm.deliveryDate}
                      onChange={(e) => setOrderForm({...orderForm, deliveryDate: e.target.value})}
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
                      onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
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
                        onChange={(e) => setOrderForm({...orderForm, city: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={orderForm.state}
                        onChange={(e) => setOrderForm({...orderForm, state: e.target.value})}
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
                    { id: 'cash', label: 'Cash on Delivery', desc: 'Pay when you receive your order' }
                  ].map(method => (
                    <div key={method.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        id={method.id}
                        name="paymentMethod"
                        value={method.id}
                        checked={orderForm.paymentMethod === method.id}
                        onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value})}
                        className="text-green-600 focus:ring-green-500"
                      />
                      <label htmlFor={method.id} className="flex-1 cursor-pointer">
                        <div className="font-medium text-gray-900">{method.label}</div>
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
                  onChange={(e) => setOrderForm({...orderForm, specialInstructions: e.target.value})}
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
              </div>
            </form>
          </div>
        </div>
      )}
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