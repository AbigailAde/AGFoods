import React, { useState, useEffect } from 'react';
import { Plus, QrCode, MapPin, Calendar, Package, TrendingUp, Camera, Upload, Eye, CheckCircle, Clock, Truck, Factory, ShoppingCart, AlertCircle, Info, Building, Store, BarChart3, Users, History, Shield, Link } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Marketplace from './Marketplace';
import ProductHistory from './ProductHistory';
import KYCVerification from './KYCVerification';
import VerificationBadge from './VerificationBadge';
import SmartContractDashboard from './SmartContractDashboard';
import TraceabilityQRCode from './TraceabilityQRCode';
import NavigationTabs from './NavigationTabs';
import { addTraceabilityEvent, TRACE_EVENT_TYPES, getBatchTraceability } from '../utils/traceabilityUtils';

const ORDERS_KEY = 'orders';
const BATCHES_KEY = 'batches';
const PRODUCTS_KEY = 'products';

const DistributorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [distributorType, setDistributorType] = useState('wholesaler'); // 'wholesaler' or 'retailer'
  const [newOrder, setNewOrder] = useState({
    batchId: '',
    orderType: '',
    quantity: '',
    destination: '',
    deliveryDate: '',
    specialInstructions: ''
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    quantity: '',
    price: '',
    description: '',
    image: ''
  });
  const [orders, setOrders] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [products, setProducts] = useState([]);

  // Load orders, batches, and products from localStorage for this distributor
  useEffect(() => {
    if (!user) return;
    const allOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    setOrders(allOrders.filter(o => o.distributorId === user.id));
    const allBatches = JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
    setAvailableBatches(allBatches.filter(b => b.status === 'Ready' || b.status === 'Processing'));
    const allProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    setProducts(allProducts.filter(p => p.distributorId === user.id));
  }, [user]);

  // Save orders to localStorage
  const saveOrders = (updatedOrders) => {
    const allOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    // Remove this distributor's orders, add updated
    const filtered = allOrders.filter(o => o.distributorId !== user.id);
    const merged = [...filtered, ...updatedOrders];
    localStorage.setItem(ORDERS_KEY, JSON.stringify(merged));
    setOrders(updatedOrders);
  };

  // Save products to localStorage
  const saveProducts = (updatedProducts) => {
    const allProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    // Remove this distributor's products, add updated
    const filtered = allProducts.filter(p => p.distributorId !== user.id);
    const merged = [...filtered, ...updatedProducts];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(merged));
    setProducts(updatedProducts);
  };

  // Create a new product
  const handleCreateProduct = () => {
    const product = {
      id: 'DPROD-' + Date.now(),
      distributorId: user.id,
      name: newProduct.name,
      category: newProduct.category,
      quantity: newProduct.quantity,
      price: newProduct.price,
      description: newProduct.description,
      image: newProduct.image,
      status: 'Available',
      createdAt: new Date().toISOString()
    };
    const updated = [product, ...products];
    saveProducts(updated);
    setShowCreateProduct(false);
    setNewProduct({ name: '', category: '', quantity: '', price: '', description: '', image: '' });
  };

  // Image upload handler
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewProduct(product => ({ ...product, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  // Create a new order
  const handleCreateOrder = () => {
    const batch = availableBatches.find(b => b.id === newOrder.batchId);
    const order = {
      id: 'ORD-' + Date.now(),
      distributorId: user.id,
      batchId: newOrder.batchId,
      productType: batch ? batch.variety : '',
      orderType: newOrder.orderType,
      quantity: newOrder.quantity,
      destination: newOrder.destination,
      deliveryDate: newOrder.deliveryDate,
      specialInstructions: newOrder.specialInstructions,
      status: 'Preparing',
      createdAt: new Date().toISOString()
    };
    const updated = [order, ...orders];
    saveOrders(updated);

    // Add traceability event for distribution order creation
    if (batch) {
      addTraceabilityEvent(
        newOrder.batchId,
        TRACE_EVENT_TYPES.DISTRIBUTED,
        {
          userName: `${user.firstName} ${user.lastName}`,
          description: `Distribution order created: ${newOrder.orderType}`,
          location: user.location || 'Distribution Center',
          details: {
            orderType: newOrder.orderType,
            quantity: newOrder.quantity,
            destination: newOrder.destination,
            deliveryDate: newOrder.deliveryDate,
            specialInstructions: newOrder.specialInstructions,
            orderId: order.id,
            distributorCompany: user.companyName || 'Distribution Company'
          }
        },
        user.id,
        'distributor'
      );
    }

    setShowCreateOrder(false);
    setNewOrder({ batchId: '', orderType: '', quantity: '', destination: '', deliveryDate: '', specialInstructions: '' });
  };

  const markOrderShipped = (orderId) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        const shippedOrder = {
          ...order,
          status: 'In Transit',
          shippedDate: new Date().toISOString()
        };

        // Add traceability event for shipment
        addTraceabilityEvent(
          order.batchId,
          TRACE_EVENT_TYPES.DISTRIBUTED,
          {
            userName: `${user.firstName} ${user.lastName}`,
            description: `Product shipped to ${order.destination}`,
            location: user.location || 'Distribution Center',
            details: {
              orderType: order.orderType,
              quantity: order.quantity,
              destination: order.destination,
              trackingInfo: `Shipped from ${user.location || 'Distribution Center'}`,
              orderId: order.id,
              distributorCompany: user.companyName || 'Distribution Company',
              shippedDate: new Date().toISOString()
            }
          },
          user.id,
          'distributor'
        );

        return shippedOrder;
      }
      return order;
    });
    saveOrders(updated);
  };

  const markOrderDelivered = (orderId) => {
    const updated = orders.map(order => {
      if (order.id === orderId) {
        const deliveredOrder = {
          ...order,
          status: 'Delivered',
          deliveredDate: new Date().toISOString()
        };

        // Add traceability event for delivery
        addTraceabilityEvent(
          order.batchId,
          TRACE_EVENT_TYPES.DISTRIBUTED,
          {
            userName: `${user.firstName} ${user.lastName}`,
            description: `Product delivered to ${order.destination}`,
            location: order.destination,
            details: {
              orderType: order.orderType,
              quantity: order.quantity,
              destination: order.destination,
              deliveryConfirmation: 'Product successfully delivered',
              orderId: order.id,
              distributorCompany: user.companyName || 'Distribution Company',
              deliveredDate: new Date().toISOString()
            }
          },
          user.id,
          'distributor'
        );

        return deliveredOrder;
      }
      return order;
    });
    saveOrders(updated);
  };

  // Stats
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.status === 'Preparing' || o.status === 'In Transit').length;
  const thisMonth = orders.filter(o => {
    const d = new Date(o.deliveryDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // UI helpers
  const getStatusColor = (status) => {
    switch(status) {
      case 'Ready for Distribution': return 'bg-green-100 text-green-800';
      case 'In Transit': return 'bg-blue-100 text-blue-800';
      case 'Preparing': return 'bg-yellow-100 text-yellow-800';
      case 'Delivered': return 'bg-gray-100 text-gray-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  const getStatusIcon = (status) => {
    switch(status) {
      case 'Ready for Distribution': return <Package className="w-4 h-4" />;
      case 'In Transit': return <Truck className="w-4 h-4" />;
      case 'Preparing': return <Clock className="w-4 h-4" />;
      case 'Delivered': return <CheckCircle className="w-4 h-4" />;
      case 'Delayed': return <AlertCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  // Order type information for wholesalers vs retailers
  const orderTypeInfo = {
    wholesaler: {
      'Bulk Distribution': 'Large quantity orders (500kg+) for retail chains and food service companies. Best margins for high-volume sales.',
      'Regional Supply': 'Multi-location distribution across states. Coordinated logistics for widespread market penetration.',
      'Export Orders': 'International shipments with export documentation. Premium pricing for overseas markets.',
      'Contract Fulfillment': 'Long-term supply agreements with guaranteed volumes. Stable revenue with committed buyers.'
    },
    retailer: {
      'Store Inventory': 'Regular stock replenishment for shelf display. Standard retail packaging in consumer-friendly sizes.',
      'Promotional Orders': 'Special quantity purchases for sales events and promotions. Discounted pricing for bulk purchases.',
      'Private Label': 'Custom branded products for store brands. Higher margins with exclusive packaging.',
      'Online Orders': 'E-commerce fulfillment for online customers. Individual packaging and direct delivery.'
    }
  };

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
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AGFoods</h1>
                <p className="text-sm text-gray-600">Distributor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Distributor Type Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setDistributorType('wholesaler')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    distributorType === 'wholesaler'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Building className="w-4 h-4 inline mr-1" />
                  Wholesaler
                </button>
                <button
                  onClick={() => setDistributorType('retailer')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    distributorType === 'retailer'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Store className="w-4 h-4 inline mr-1" />
                  Retailer
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">Welcome back, {user?.firstName} {user?.lastName}</span>
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {distributorType === 'wholesaler' ? 'C' : 'F'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <NavigationTabs
        tabs={[
          { id: 'overview', label: 'Distribution Overview', icon: <Factory className="w-4 h-4" /> },
          { id: 'marketplace', label: 'Marketplace', icon: <ShoppingCart className="w-4 h-4" /> },
          { id: 'traceability', label: 'Traceability', icon: <History className="w-4 h-4" /> },
          { id: 'verification', label: 'KYC/Verification', icon: <Shield className="w-4 h-4" /> },
          { id: 'blockchain', label: 'Smart Contract', icon: <Link className="w-4 h-4" /> }
        ]}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        colorScheme="orange"
      />

      {/* Main Content */}
      {activeTab === 'overview' && (
      <div>
        {/* Company Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {user?.companyName || 'Your Company Name'}
              </h2>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{user?.location || 'Your Location'}</span>
              </div>
              <div className="mb-4">
                <VerificationBadge
                  status={user?.verification?.status}
                  level={user?.verification?.level}
                  size="md"
                />
              </div>
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm text-gray-500">Distributor ID</p>
                  <p className="font-semibold text-gray-900">
                    {user?.id || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="font-semibold text-orange-600">
                    {products.length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {distributorType === 'wholesaler' ? 'Clients Served' : 'Customers Served'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    0
                  </p>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateProduct(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Product</span>
              </button>
              <button
                onClick={() => setShowCreateOrder(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Order</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{activeOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{thisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Your Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Special Instructions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-400">No orders yet. Click "Create Order" to add your first order.</td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{order.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.batchId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.productType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.orderType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.destination}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.deliveryDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.specialInstructions}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          {order.status === 'Preparing' && (
                            <button
                              onClick={() => markOrderShipped(order.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              title="Mark as Shipped"
                            >
                              <Truck className="w-4 h-4" />
                            </button>
                          )}
                          {order.status === 'In Transit' && (
                            <button
                              onClick={() => markOrderDelivered(order.id)}
                              className="text-green-600 hover:text-green-800 text-sm"
                              title="Mark as Delivered"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {order.status === 'Delivered' && (
                            <span className="text-green-600 text-sm">
                              <CheckCircle className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Your Products</h3>
            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                onClick={() => exportToCSV(products, 'products.csv')}
                disabled={products.length === 0}
              >
                Export CSV
              </button>
              <button
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                onClick={() => exportToPDF(products, 'products.pdf')}
                disabled={products.length === 0}
              >
                Export PDF
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₦)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">No products yet. Click "Create Product" to add your first product.</td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{product.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">₦{product.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          <Package className="w-3 h-3 mr-1" />
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TraceabilityQRCode
                          batchId={product.id}
                          productName={product.name}
                          size={60}
                          showDetails={true}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Product Modal */}
        {showCreateProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Product</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select category</option>
                    <option value="Plantain Flour">Plantain Flour</option>
                    <option value="Plantain Chips">Plantain Chips</option>
                    <option value="Dried Plantain">Dried Plantain</option>
                    <option value="Plantain Puree">Plantain Puree</option>
                    <option value="Raw Plantain">Raw Plantain</option>
                    <option value="Processed Foods">Processed Foods</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity Available
                  </label>
                  <input
                    type="text"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., 500kg, 200 packs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Unit (₦)
                  </label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter price"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows="3"
                    placeholder="Product description, specifications, availability..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Product Photo</label>
                  <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${isDragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300'}`}>
                    <input {...getInputProps()} />
                    {newProduct.image ? (
                      <img src={newProduct.image} alt="Product" className="mx-auto h-32 object-contain mb-2" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Drag & drop or click to select a photo</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateProduct(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProduct}
                  disabled={!newProduct.name || !newProduct.category || !newProduct.quantity || !newProduct.price}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Product
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Order Modal */}
        {showCreateOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Order</h2>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Batch</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newOrder.batchId}
                  onChange={e => setNewOrder({ ...newOrder, batchId: e.target.value })}
                  required
                >
                  <option value="">Select batch</option>
                  {availableBatches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.id} - {batch.variety || batch.productType} ({batch.quantity})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Order Type</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newOrder.orderType}
                  onChange={e => setNewOrder({ ...newOrder, orderType: e.target.value })}
                  required
                >
                  <option value="">Select order type</option>
                  {Object.keys(orderTypeInfo[distributorType]).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Quantity</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={newOrder.quantity}
                  onChange={e => setNewOrder({ ...newOrder, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Destination</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={newOrder.destination}
                  onChange={e => setNewOrder({ ...newOrder, destination: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Delivery Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={newOrder.deliveryDate}
                  onChange={e => setNewOrder({ ...newOrder, deliveryDate: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Special Instructions</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={newOrder.specialInstructions}
                  onChange={e => setNewOrder({ ...newOrder, specialInstructions: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowCreateOrder(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  onClick={handleCreateOrder}
                  disabled={!newOrder.batchId || !newOrder.orderType || !newOrder.quantity || !newOrder.destination || !newOrder.deliveryDate}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* Marketplace Tab */}
      {activeTab === 'marketplace' && (
        <Marketplace />
      )}

      {/* Traceability Tab */}
      {activeTab === 'traceability' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Product Traceability</h2>
              <p className="text-gray-600 mt-1">
                Track and add to the journey of products through the supply chain
              </p>
            </div>
            <div className="p-6">
              <ProductHistory
                batchId={availableBatches[0]?.id || ''}
                compact={false}
                showAddEvent={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Verification Tab */}
      {activeTab === 'verification' && (
        <div className="space-y-6">
          <KYCVerification />
        </div>
      )}

      {/* Blockchain Tab */}
      {activeTab === 'blockchain' && (
        <div className="space-y-6">
          <SmartContractDashboard
            user={user}
            products={[...availableBatches, ...products]}
            onTransactionComplete={(data) => {
              // Handle blockchain transaction completion
              console.log('Blockchain transaction completed:', data);

              // If it's a traceability creation, update the relevant data
              if (data.type === 'traceability_created' && data.product) {
                // Update products if they contain the product
                const updatedProducts = products.map(p =>
                  p.id === data.product.id
                    ? { ...p, traceabilityData: data.traceabilityData }
                    : p
                );
                setProducts(updatedProducts);
                localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default DistributorDashboard;
