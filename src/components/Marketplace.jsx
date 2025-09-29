import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, Star, MapPin, Truck, Package, CreditCard, Plus, Minus, User, Phone, Mail, Shield } from 'lucide-react';
import { useAuth } from './AuthContext';
import PaystackButton from './Paystack';
import VerificationBadge from './VerificationBadge';
import { createConsumerOrder, createDistributionOrder, createProcessingOrder } from '../utils/orderUtils';
import { getUserVerification } from '../utils/kycUtils';

const BATCHES_KEY = 'batches';
const PRODUCTS_KEY = 'products';
const ORDERS_KEY = 'orders';
const CART_KEY = 'cart';

const Marketplace = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: user?.firstName + ' ' + user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    deliveryDate: '',
    specialInstructions: ''
  });

  const categories = [
    { id: 'all', name: 'All Products', count: 0 },
    { id: 'flour', name: 'Plantain Flour', count: 0 },
    { id: 'chips', name: 'Plantain Chips', count: 0 },
    { id: 'dried', name: 'Dried Plantain', count: 0 },
    { id: 'puree', name: 'Plantain Puree', count: 0 },
    { id: 'raw', name: 'Raw Plantain', count: 0 },
    { id: 'processed', name: 'Processed Foods', count: 0 }
  ];

  const roles = [
    { id: 'all', name: 'All Sellers' },
    { id: 'farmer', name: 'Farmers' },
    { id: 'processor', name: 'Processors' },
    { id: 'distributor', name: 'Distributors' }
  ];

  // Load all available products from all roles
  useEffect(() => {
    const allProducts = [];

    // Load farmer batches as products
    const allBatches = JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
    allBatches.forEach(batch => {
      if (batch.status === 'Ready' && batch.farmerId !== user?.id) {
        const farmerVerification = getUserVerification(batch.farmerId);
        allProducts.push({
          id: batch.id,
          name: `Fresh ${batch.variety}`,
          category: 'raw',
          price: 2000, // Default price for raw plantain per kg
          quantity: batch.quantity,
          description: batch.qualityNotes || 'Fresh plantain from verified farm',
          image: batch.image || '🍌',
          seller: {
            id: batch.farmerId,
            name: 'Farm',
            role: 'farmer',
            location: 'Farm Location',
            rating: 4.5,
            verification: farmerVerification
          },
          type: 'batch',
          unit: 'kg'
        });
      }
    });

    // Load processor products
    const allProcessorProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    allProcessorProducts.forEach(product => {
      if (product.status === 'Available' && product.processorId !== user?.id) {
        const processorVerification = getUserVerification(product.processorId);
        allProducts.push({
          id: product.id,
          name: product.name,
          category: product.processType?.toLowerCase().replace(' ', '') || 'processed',
          price: product.price,
          quantity: product.quantity,
          description: product.description,
          image: product.image || '📦',
          seller: {
            id: product.processorId,
            name: 'Processing Facility',
            role: 'processor',
            location: 'Processing Location',
            rating: 4.3,
            verification: processorVerification
          },
          type: 'processed',
          unit: 'kg',
          qualityGrade: product.qualityGrade
        });
      }
    });

    // Load distributor products (stored with different key pattern)
    const allDistributorProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    allDistributorProducts.forEach(product => {
      if (product.status === 'Available' && product.distributorId && product.distributorId !== user?.id) {
        const distributorVerification = getUserVerification(product.distributorId);
        allProducts.push({
          id: product.id,
          name: product.name,
          category: product.category?.toLowerCase().replace(' ', '') || 'processed',
          price: product.price,
          quantity: product.quantity,
          description: product.description,
          image: product.image || '🚚',
          seller: {
            id: product.distributorId,
            name: 'Distribution Center',
            role: 'distributor',
            location: 'Distribution Location',
            rating: 4.4,
            verification: distributorVerification
          },
          type: 'distribution',
          unit: product.quantity?.includes('kg') ? 'kg' : 'pack'
        });
      }
    });

    setProducts(allProducts);

    // Load cart from localStorage
    const savedCart = JSON.parse(localStorage.getItem(`${CART_KEY}_${user?.id}`) || '[]');
    setCart(savedCart);
  }, [user]);

  // Save cart to localStorage
  const saveCart = (updatedCart) => {
    localStorage.setItem(`${CART_KEY}_${user?.id}`, JSON.stringify(updatedCart));
    setCart(updatedCart);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesRole = selectedRole === 'all' || product.seller.role === selectedRole;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesRole && matchesSearch;
  });

  // Add to cart
  const addToCart = (product, quantity = 1) => {
    const existingItem = cart.find(item => item.id === product.id);
    let updatedCart;

    if (existingItem) {
      updatedCart = cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updatedCart = [...cart, { ...product, quantity }];
    }

    saveCart(updatedCart);
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    saveCart(updatedCart);
  };

  // Update cart quantity
  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      const updatedCart = cart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
      saveCart(updatedCart);
    }
  };

  // Calculate total price
  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Handle order success
  const handleOrderSuccess = (reference) => {
    // Create delivery info object
    const deliveryInfo = {
      customerName: orderForm.customerName,
      address: `${orderForm.address}, ${orderForm.city}, ${orderForm.state}`,
      phone: orderForm.phone,
      instructions: orderForm.specialInstructions
    };

    // Create orders based on the type of transaction
    const createdOrders = [];

    cart.forEach(item => {
      let order;

      if (item.type === 'batch' && user.role === 'processor') {
        // Processor buying from farmer
        order = createProcessingOrder(
          item.farmerId,
          user.id,
          item,
          item.price * item.quantity,
          deliveryInfo
        );
      } else if (item.type === 'product' && item.source === 'processor' && user.role === 'distributor') {
        // Distributor buying from processor
        order = createDistributionOrder(
          item.processorId,
          user.id,
          item,
          item.price * item.quantity,
          deliveryInfo
        );
      } else if ((item.type === 'product' && item.source === 'distributor') || user.role === 'consumer') {
        // Consumer buying from distributor
        order = createConsumerOrder(
          item.distributorId,
          user.id,
          [item],
          item.price * item.quantity,
          deliveryInfo,
          reference.reference
        );
      }

      if (order) {
        if (Array.isArray(order)) {
          createdOrders.push(...order);
        } else {
          createdOrders.push(order);
        }
      }
    });

    // Clear cart
    saveCart([]);
    setShowCheckout(false);
    setShowCart(false);

    alert(`Order placed successfully! ${createdOrders.length} order(s) created. Payment Reference: ${reference.reference}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AGFoods Marketplace</h1>
              <p className="text-gray-600">Discover quality plantain products from verified sellers</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart ({cart.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
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
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-4">
                {/* Product Image */}
                <div className="w-full h-48 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                  {product.image && product.image.startsWith('data:image') ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{product.image}</span>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                    {product.qualityGrade && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        {product.qualityGrade}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-green-600">
                      ₦{product.price?.toLocaleString()}/{product.unit}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.quantity} available
                    </span>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${
                        product.seller.role === 'farmer' ? 'bg-green-500' :
                        product.seller.role === 'processor' ? 'bg-purple-500' : 'bg-orange-500'
                      }`}>
                        {product.seller.role[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">{product.seller.name}</p>
                          <VerificationBadge
                            status={product.seller.verification?.status}
                            level={product.seller.verification?.level}
                            size="xs"
                            showText={false}
                          />
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-500">{product.seller.rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No products found matching your criteria</p>
          </div>
        )}
      </div>

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto max-h-96 p-6">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {item.image && item.image.startsWith('data:image') ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-2xl">{item.image}</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">₦{item.price?.toLocaleString()}/{item.unit}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₦{(item.price * item.quantity).toLocaleString()}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 text-sm hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    ₦{getTotalPrice().toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Proceed to Checkout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Checkout</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
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
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={orderForm.email}
                      onChange={(e) => setOrderForm({...orderForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={orderForm.phone}
                      onChange={(e) => setOrderForm({...orderForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                    <input
                      type="date"
                      value={orderForm.deliveryDate}
                      onChange={(e) => setOrderForm({...orderForm, deliveryDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
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
                    <input
                      type="text"
                      value={orderForm.address}
                      onChange={(e) => setOrderForm({...orderForm, address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter delivery address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={orderForm.city}
                        onChange={(e) => setOrderForm({...orderForm, city: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input
                        type="text"
                        value={orderForm.state}
                        onChange={(e) => setOrderForm({...orderForm, state: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                <textarea
                  value={orderForm.specialInstructions}
                  onChange={(e) => setOrderForm({...orderForm, specialInstructions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  rows="3"
                  placeholder="Any special delivery instructions..."
                />
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
                <div className="space-y-2 mb-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span className="text-green-600">₦{getTotalPrice().toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Button */}
              <div className="pt-4">
                <PaystackButton
                  email={orderForm.email}
                  amount={getTotalPrice()}
                  onSuccessCallback={handleOrderSuccess}
                  orderInfo={{
                    type: 'marketplace_purchase',
                    itemsCount: cart.length,
                    totalAmount: getTotalPrice(),
                    items: cart.map(item => ({
                      id: item.id,
                      name: item.name,
                      quantity: item.quantity,
                      price: item.price
                    }))
                  }}
                  customerInfo={{
                    role: user.role,
                    name: orderForm.customerName,
                    id: user.id
                  }}
                  label={`Pay ₦${getTotalPrice().toLocaleString()}`}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
