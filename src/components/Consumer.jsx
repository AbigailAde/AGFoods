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
  const [activeTab, setActiveTab] = useState('shop'); // Default to Shop
  const [productRequests, setProductRequests] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    productName: '',
    category: '',
    quantity: '',
    maxPrice: '',
    description: '',
    urgency: 'normal'
  });

  // Blockchain integration
  const { isConnected, recordOrderOnChain, confirmDeliveryOnChain } = useBlockchainIntegration();
  const [walletData, setWalletData] = useState(null);
  const [accountId, setAccountId] = useState('');

  // UI/UX improvements
  const notifications = useNotifications();
  const { ConfirmationDialog } = useConfirmation();


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



  // Load products and orders from localStorage for this consumer
  useEffect(() => {
    const allBatches = JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
    setProducts(allBatches.filter(b => b.status === 'Ready' || b.status === 'Delivered'));
    const allOrders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    setOrderHistory(allOrders.filter(o => o.consumerId === user?.id));
  }, [user]);



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
    { id: 'shop', label: 'Shop Products', icon: <Package className="w-4 h-4" /> },
    { id: 'orders', label: 'My Orders', icon: <Calendar className="w-4 h-4" /> },
    { id: 'requests', label: `Requests (${productRequests.length})`, icon: <Plus className="w-4 h-4" /> },
    { id: 'traceability', label: 'Product History', icon: <History className="w-4 h-4" /> },
    { id: 'verification', label: 'KYC/Verification', icon: <Shield className="w-4 h-4" /> },
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
        {activeTab === 'shop' && (
          <Marketplace initialRole="distributor" lockRole={true} showLayout={true} />
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



      {/* Create Request Modal */}
      {
        showCreateRequest && (
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
        )
      }

      {/* Traceability Tab */}
      {
        activeTab === 'traceability' && (
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
        )
      }

      {/* Verification Tab */}
      {
        activeTab === 'verification' && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <KYCVerification />
          </div>
        )
      }



      {/* Blockchain Tab */}
      {
        activeTab === 'blockchain' && (
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
        )
      }

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications.notifications}
        onDismiss={notifications.removeNotification}
      />

      {/* Confirmation Dialog */}
      {ConfirmationDialog}
    </div >
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
