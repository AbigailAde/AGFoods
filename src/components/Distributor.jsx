import React, { useState } from 'react';
import { Plus, QrCode, MapPin, Calendar, Package, TrendingUp, Camera, Upload, Eye, CheckCircle, Clock, Truck, Factory, ShoppingCart, AlertCircle, Info, Building, Store, BarChart3, Users } from 'lucide-react';

const DistributorDashboard = () => {
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

  // Sample data - in real app, this would come from blockchain/API
  const distributorData = {
    wholesaler: {
      name: "Mr. Chukwuma Ogbonna",
      companyName: "West African Food Distributors Ltd",
      location: "Trade Fair Complex, Lagos State",
      distributorId: "WSL-003-891",
      totalOrders: 342,
      activeOrders: 18,
      monthlyRevenue: "₦12,500,000",
      clientsServed: 45
    },
    retailer: {
      name: "Mrs. Fatima Abdullahi",
      companyName: "Golden Gate Supermarket",
      location: "Victoria Island, Lagos State",
      distributorId: "RTL-005-234",
      totalOrders: 89,
      activeOrders: 7,
      monthlyRevenue: "₦3,200,000",
      clientsServed: 850
    }
  };

  const currentData = distributorData[distributorType];

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

  const availableBatches = [
    {
      id: "PROC-001",
      processorId: "PRC-002-567",
      processorName: "Golden Flour Mills Ltd",
      productType: "Plantain Flour",
      quantity: "2,500kg",
      qualityGrade: "A+",
      processingDate: "2025-06-12",
      status: "Ready for Distribution",
      unitPrice: "₦850/kg",
      totalValue: "₦2,125,000"
    },
    {
      id: "PROC-002",
      processorId: "PRC-004-123",
      processorName: "Premium Foods Ltd",
      productType: "Plantain Chips",
      quantity: "500kg",
      qualityGrade: "A",
      processingDate: "2025-06-10",
      status: "Ready for Distribution",
      unitPrice: "₦1,200/kg",
      totalValue: "₦600,000"
    },
    {
      id: "PROC-003",
      processorId: "PRC-002-567",
      processorName: "Golden Flour Mills Ltd",
      productType: "Dried Plantain",
      quantity: "150kg",
      qualityGrade: "A+",
      processingDate: "2025-06-11",
      status: "Ready for Distribution",
      unitPrice: "₦2,500/kg",
      totalValue: "₦375,000"
    }
  ];

  const activeOrders = [
    {
      id: "ORD-001",
      batchId: "PROC-001",
      productType: "Plantain Flour",
      orderType: distributorType === 'wholesaler' ? 'Bulk Distribution' : 'Store Inventory',
      quantity: distributorType === 'wholesaler' ? "1,000kg" : "100kg",
      destination: distributorType === 'wholesaler' ? "ShopRite Distribution Center" : "Store Shelf - Aisle 3",
      status: "In Transit",
      deliveryDate: "2025-06-15",
      customer: distributorType === 'wholesaler' ? "ShopRite Nigeria" : "Walk-in Customer",
      trackingId: "TRK-001-456"
    },
    {
      id: "ORD-002",
      batchId: "PROC-002",
      productType: "Plantain Chips",
      orderType: distributorType === 'wholesaler' ? 'Regional Supply' : 'Promotional Orders',
      quantity: distributorType === 'wholesaler' ? "300kg" : "50kg",
      destination: distributorType === 'wholesaler' ? "Multiple Locations - Abuja" : "Promo Display - Front End",
      status: "Preparing",
      deliveryDate: "2025-06-16",
      customer: distributorType === 'wholesaler' ? "Metro Foods Chain" : "Bulk Sale Customer",
      trackingId: "TRK-002-789"
    }
  ];

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

  const handleCreateOrder = () => {
    console.log('Creating order:', newOrder);
    setShowCreateOrder(false);
    setNewOrder({ batchId: '', orderType: '', quantity: '', destination: '', deliveryDate: '', specialInstructions: '' });
  };

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
                <span className="text-sm text-gray-600">Welcome back, {currentData.name}</span>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentData.companyName}</h2>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{currentData.location}</span>
              </div>
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm text-gray-500">Distributor ID</p>
                  <p className="font-semibold text-gray-900">{currentData.distributorId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Revenue</p>
                  <p className="font-semibold text-orange-600">{currentData.monthlyRevenue}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {distributorType === 'wholesaler' ? 'Clients Served' : 'Customers Served'}
                  </p>
                  <p className="font-semibold text-gray-900">{currentData.clientsServed}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{currentData.totalOrders}</p>
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
                <p className="text-2xl font-bold text-gray-900">{currentData.activeOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {distributorType === 'wholesaler' ? 'Volume Moved' : 'Items Sold'}
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {distributorType === 'wholesaler' ? '45.2T' : '2,340'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                {distributorType === 'wholesaler' ? 
                  <BarChart3 className="w-6 h-6 text-green-600" /> :
                  <Package className="w-6 h-6 text-green-600" />
                }
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {distributorType === 'wholesaler' ? '23' : '156'}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Available Batches from Processors */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Available Batches from Processors</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Processor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {batch.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p className="font-medium">{batch.processorName}</p>
                        <p className="text-xs text-gray-400">{batch.processorId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.productType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${batch.qualityGrade === 'A+' ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}`}>
                        {batch.qualityGrade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.unitPrice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {batch.totalValue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-orange-600 hover:text-orange-800 mr-3">
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-800">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Active Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.productType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.orderType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.deliveryDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-800 mr-3">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-800">
                        <Truck className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateOrder(false)}>
          <div className="bg-white rounded-xl max-w-md w-full h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create New {distributorType === 'wholesaler' ? 'Distribution' : 'Retail'} Order
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Batch
                </label>
                <select 
                  value={newOrder.batchId}
                  onChange={(e) => setNewOrder({...newOrder, batchId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select available batch</option>
                  {availableBatches.map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.id} - {batch.productType} ({batch.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Type
                </label>
                <select 
                  value={newOrder.orderType}
                  onChange={(e) => setNewOrder({...newOrder, orderType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select order type</option>
                  {Object.keys(orderTypeInfo[distributorType]).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {newOrder.orderType && (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-orange-700">{orderTypeInfo[distributorType][newOrder.orderType]}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  value={newOrder.quantity}
                  onChange={(e) => setNewOrder({...newOrder, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder={distributorType === 'wholesaler' ? "Enter bulk quantity" : "Enter retail quantity"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination
                </label>
                <input
                  type="text"
                  value={newOrder.destination}
                  onChange={(e) => setNewOrder({...newOrder, destination: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder={distributorType === 'wholesaler' ? "Client warehouse/distribution center" : "Store location/customer address"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  value={newOrder.deliveryDate}
                  onChange={(e) => setNewOrder({...newOrder, deliveryDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions
                </label>
                <textarea
                  value={newOrder.specialInstructions}
                  onChange={(e) => setNewOrder({...newOrder, specialInstructions: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows="3"
                  placeholder={distributorType === 'wholesaler' ? "Delivery requirements, packaging specifications, etc." : "Display preferences, promotion details, etc."}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateOrder(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateOrder} 
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributorDashboard;