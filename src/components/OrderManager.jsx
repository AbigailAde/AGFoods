import React, { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, Truck, AlertCircle, MapPin, Calendar, User, Phone, DollarSign, Hash } from 'lucide-react';

const ORDER_TYPES = {
  PROCESSING: 'processing', // Farmer -> Processor
  DISTRIBUTION: 'distribution', // Processor -> Distributor
  CONSUMER: 'consumer' // Distributor -> Consumer
};

const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  READY: 'ready',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

const ORDERS_KEY = 'all_orders';

const OrderManager = ({ userRole, userId }) => {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('incoming');

  useEffect(() => {
    loadOrders();
  }, [userId]);

  const loadOrders = () => {
    const allOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    setOrders(allOrders);
  };

  const saveOrders = (updatedOrders) => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(updatedOrders));
    setOrders(updatedOrders);
  };

  const getIncomingOrders = () => {
    return orders.filter(order => {
      switch (userRole) {
        case 'farmer':
          // Farmers don't typically receive orders, they create processing requests
          return [];
        case 'processor':
          return order.type === ORDER_TYPES.PROCESSING && order.processorId === userId;
        case 'distributor':
          return order.type === ORDER_TYPES.DISTRIBUTION && order.distributorId === userId;
        case 'consumer':
          return order.type === ORDER_TYPES.CONSUMER && order.consumerId === userId;
        default:
          return [];
      }
    });
  };

  const getOutgoingOrders = () => {
    return orders.filter(order => {
      switch (userRole) {
        case 'farmer':
          return order.type === ORDER_TYPES.PROCESSING && order.farmerId === userId;
        case 'processor':
          return order.type === ORDER_TYPES.DISTRIBUTION && order.processorId === userId;
        case 'distributor':
          return order.type === ORDER_TYPES.CONSUMER && order.distributorId === userId;
        case 'consumer':
          // Consumers don't create outgoing orders, only receive their purchases
          return [];
        default:
          return [];
      }
    });
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order
    );
    saveOrders(updatedOrders);
  };

  const generateTrackingNumber = () => {
    return 'TRK-' + Date.now().toString(36).toUpperCase();
  };

  const addTrackingInfo = (orderId, trackingNumber, estimatedDelivery) => {
    const updatedOrders = orders.map(order =>
      order.id === orderId
        ? {
            ...order,
            trackingNumber,
            estimatedDelivery,
            status: ORDER_STATUS.SHIPPED,
            updatedAt: new Date().toISOString()
          }
        : order
    );
    saveOrders(updatedOrders);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING: return <Clock className="w-5 h-5 text-yellow-500" />;
      case ORDER_STATUS.CONFIRMED: return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case ORDER_STATUS.PROCESSING: return <Package className="w-5 h-5 text-orange-500" />;
      case ORDER_STATUS.READY: return <CheckCircle className="w-5 h-5 text-green-500" />;
      case ORDER_STATUS.SHIPPED: return <Truck className="w-5 h-5 text-purple-500" />;
      case ORDER_STATUS.DELIVERED: return <CheckCircle className="w-5 h-5 text-green-600" />;
      case ORDER_STATUS.CANCELLED: return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case ORDER_STATUS.PENDING: return 'bg-yellow-100 text-yellow-800';
      case ORDER_STATUS.CONFIRMED: return 'bg-blue-100 text-blue-800';
      case ORDER_STATUS.PROCESSING: return 'bg-orange-100 text-orange-800';
      case ORDER_STATUS.READY: return 'bg-green-100 text-green-800';
      case ORDER_STATUS.SHIPPED: return 'bg-purple-100 text-purple-800';
      case ORDER_STATUS.DELIVERED: return 'bg-green-100 text-green-800';
      case ORDER_STATUS.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatusActions = (order) => {
    const actions = [];

    switch (order.status) {
      case ORDER_STATUS.PENDING:
        if ((userRole === 'processor' && order.type === ORDER_TYPES.PROCESSING) ||
            (userRole === 'distributor' && order.type === ORDER_TYPES.DISTRIBUTION)) {
          actions.push({ status: ORDER_STATUS.CONFIRMED, label: 'Confirm Order', color: 'bg-blue-600' });
          actions.push({ status: ORDER_STATUS.CANCELLED, label: 'Reject', color: 'bg-red-600' });
        }
        break;
      case ORDER_STATUS.CONFIRMED:
        if ((userRole === 'processor' && order.type === ORDER_TYPES.PROCESSING) ||
            (userRole === 'distributor' && order.type === ORDER_TYPES.DISTRIBUTION)) {
          actions.push({ status: ORDER_STATUS.PROCESSING, label: 'Start Processing', color: 'bg-orange-600' });
        }
        break;
      case ORDER_STATUS.PROCESSING:
        if ((userRole === 'processor' && order.type === ORDER_TYPES.PROCESSING) ||
            (userRole === 'distributor' && order.type === ORDER_TYPES.DISTRIBUTION)) {
          actions.push({ status: ORDER_STATUS.READY, label: 'Mark Ready', color: 'bg-green-600' });
        }
        break;
      case ORDER_STATUS.READY:
        if ((userRole === 'processor' && order.type === ORDER_TYPES.PROCESSING) ||
            (userRole === 'distributor' && order.type === ORDER_TYPES.DISTRIBUTION)) {
          actions.push({
            status: ORDER_STATUS.SHIPPED,
            label: 'Ship Order',
            color: 'bg-purple-600',
            requiresTracking: true
          });
        }
        break;
      case ORDER_STATUS.SHIPPED:
        if ((userRole === 'processor' && order.type === ORDER_TYPES.PROCESSING) ||
            (userRole === 'distributor' && order.type === ORDER_TYPES.DISTRIBUTION)) {
          actions.push({ status: ORDER_STATUS.DELIVERED, label: 'Mark Delivered', color: 'bg-green-700' });
        }
        break;
    }

    return actions;
  };

  const OrderCard = ({ order, isIncoming = true }) => {
    const [showTrackingForm, setShowTrackingForm] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState('');
    const [estimatedDelivery, setEstimatedDelivery] = useState('');

    const handleStatusUpdate = (newStatus, requiresTracking = false) => {
      if (requiresTracking) {
        setShowTrackingForm(true);
        return;
      }
      updateOrderStatus(order.id, newStatus);
    };

    const handleAddTracking = () => {
      if (trackingNumber && estimatedDelivery) {
        addTrackingInfo(order.id, trackingNumber, estimatedDelivery);
        setShowTrackingForm(false);
        setTrackingNumber('');
        setEstimatedDelivery('');
      }
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(order.status)}
            <div>
              <h3 className="font-semibold text-gray-900">Order #{order.id}</h3>
              <p className="text-sm text-gray-500">{order.type} order</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
              {order.status.toUpperCase()}
            </span>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Order Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <Package className="w-4 h-4 text-gray-400 mr-2" />
                <span>{order.productName || order.batchName || 'Product'}</span>
              </div>
              <div className="flex items-center">
                <Hash className="w-4 h-4 text-gray-400 mr-2" />
                <span>Qty: {order.quantity}</span>
              </div>
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                <span>₦{order.totalAmount?.toLocaleString() || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">
              {isIncoming ? 'From' : 'To'}
            </h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span>{order.customerName || order.supplierName || 'N/A'}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <span>{order.deliveryAddress || 'N/A'}</span>
              </div>
              {order.contactPhone && (
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <span>{order.contactPhone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {order.trackingNumber && (
          <div className="bg-gray-50 rounded p-3 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Tracking Information</h4>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <Truck className="w-4 h-4 text-gray-400 mr-2" />
                <span>Tracking: {order.trackingNumber}</span>
              </div>
              {order.estimatedDelivery && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span>Expected: {new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {showTrackingForm && (
          <div className="bg-blue-50 rounded p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-3">Add Tracking Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Tracking Number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
              <input
                type="date"
                placeholder="Estimated Delivery"
                value={estimatedDelivery}
                onChange={(e) => setEstimatedDelivery(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleAddTracking}
                className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                disabled={!trackingNumber || !estimatedDelivery}
              >
                Add Tracking
              </button>
              <button
                onClick={() => setShowTrackingForm(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {getNextStatusActions(order).map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusUpdate(action.status, action.requiresTracking)}
              className={`px-4 py-2 text-white rounded text-sm hover:opacity-90 ${action.color}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const incomingOrders = getIncomingOrders();
  const outgoingOrders = getOutgoingOrders();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Management</h2>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-2 rounded-md font-medium text-sm ${
              activeTab === 'incoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Incoming Orders ({incomingOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`px-4 py-2 rounded-md font-medium text-sm ${
              activeTab === 'outgoing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Outgoing Orders ({outgoingOrders.length})
          </button>
        </div>
      </div>

      <div>
        {activeTab === 'incoming' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Incoming Orders</h3>
            {incomingOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No incoming orders yet.</p>
              </div>
            ) : (
              incomingOrders.map(order => (
                <OrderCard key={order.id} order={order} isIncoming={true} />
              ))
            )}
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Outgoing Orders</h3>
            {outgoingOrders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No outgoing orders yet.</p>
              </div>
            ) : (
              outgoingOrders.map(order => (
                <OrderCard key={order.id} order={order} isIncoming={false} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManager;
