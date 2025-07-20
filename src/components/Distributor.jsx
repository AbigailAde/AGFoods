import React, { useState, useEffect } from 'react';
import { Plus, QrCode, MapPin, Calendar, Package, TrendingUp, Camera, Upload, Eye, CheckCircle, Clock, Truck, Factory, ShoppingCart, AlertCircle, Info, Building, Store, BarChart3, Users } from 'lucide-react';
import { useAuth } from './AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ORDERS_KEY = 'orders';
const BATCHES_KEY = 'batches';

const DistributorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [distributorType, setDistributorType] = useState('wholesaler'); // 'wholesaler' or 'retailer'
  const [newOrder, setNewOrder] = useState({
    batchId: '',
    orderType: '',
    quantity: '',
    destination: '',
    deliveryDate: '',
    specialInstructions: ''
  });
  const [orders, setOrders] = useState([]);
  const [availableBatches, setAvailableBatches] = useState([]);

  // Load orders and batches from localStorage for this distributor
  useEffect(() => {
    if (!user) return;
    const allOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    setOrders(allOrders.filter(o => o.distributorId === user.id));
    const allBatches = JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
    setAvailableBatches(allBatches.filter(b => b.status === 'Ready' || b.status === 'Processing'));
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
    setShowCreateOrder(false);
    setNewOrder({ batchId: '', orderType: '', quantity: '', destination: '', deliveryDate: '', specialInstructions: '' });
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm text-gray-500">Distributor ID</p>
                  <p className="font-semibold text-gray-900">
                    {user?.id || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Revenue</p>
                  <p className="font-semibold text-orange-600">
                    ₦0
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
            <button 
              onClick={() => setShowCreateOrder(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Order</span>
            </button>
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
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-gray-400">No orders yet. Click "Create Order" to add your first order.</td>
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
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

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
    </div>
  );
};

export default DistributorDashboard;