import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingUp, TrendingDown, Plus, Minus, Eye, BarChart3, Clock, CheckCircle } from 'lucide-react';
import {
  getUserInventory,
  getInventoryStats,
  getLowStockItems,
  addStock,
  initializeInventoryItem,
  syncInventoryWithExistingItems,
  LOW_STOCK_THRESHOLD
} from '../utils/inventoryUtils';

const InventoryManager = ({ userRole, userId }) => {
  const [inventory, setInventory] = useState([]);
  const [stats, setStats] = useState({});
  const [lowStockItems, setLowStockItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddStock, setShowAddStock] = useState(false);
  const [addStockForm, setAddStockForm] = useState({
    itemId: '',
    quantity: '',
    reason: 'Manual restock'
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadInventoryData();
    // Sync existing items on component mount
    syncInventoryWithExistingItems();
  }, [userId, userRole]);

  const loadInventoryData = () => {
    const userInventory = getUserInventory(userId, userRole);
    const inventoryStats = getInventoryStats(userId, userRole);
    const lowStock = getLowStockItems(userId, userRole);

    setInventory(userInventory);
    setStats(inventoryStats);
    setLowStockItems(lowStock);
  };

  const handleAddStock = () => {
    if (!addStockForm.itemId || !addStockForm.quantity) return;

    addStock(addStockForm.itemId, Number(addStockForm.quantity), addStockForm.reason);
    setShowAddStock(false);
    setAddStockForm({ itemId: '', quantity: '', reason: 'Manual restock' });
    loadInventoryData();
  };

  const getStockStatusColor = (item) => {
    if (item.currentQuantity === 0) return 'text-red-600 bg-red-50 border-red-200';
    if (item.currentQuantity <= LOW_STOCK_THRESHOLD) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStockStatusText = (item) => {
    if (item.currentQuantity === 0) return 'Out of Stock';
    if (item.currentQuantity <= LOW_STOCK_THRESHOLD) return 'Low Stock';
    return 'In Stock';
  };

  const InventoryCard = ({ item }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{item.itemId}</h3>
            <p className="text-sm text-gray-500 capitalize">{item.itemType}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStockStatusColor(item)}`}>
          {getStockStatusText(item)}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-2xl font-bold text-gray-900">{item.currentQuantity}</p>
          <p className="text-xs text-gray-500">Current Stock</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-orange-600">{item.reservedQuantity}</p>
          <p className="text-xs text-gray-500">Reserved</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-green-600">{item.soldQuantity}</p>
          <p className="text-xs text-gray-500">Sold</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <span>Available: {item.currentQuantity - item.reservedQuantity}</span>
        <span>Updated: {new Date(item.lastUpdated).toLocaleDateString()}</span>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => setSelectedItem(item)}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          <Eye className="w-4 h-4 inline mr-1" />
          View Details
        </button>
        <button
          onClick={() => {
            setAddStockForm({ ...addStockForm, itemId: item.itemId });
            setShowAddStock(true);
          }}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const StatsCard = ({ title, value, icon, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Inventory Management</h2>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md font-medium text-sm ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded-md font-medium text-sm ${
              activeTab === 'items'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items ({inventory.length})
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-md font-medium text-sm relative ${
              activeTab === 'alerts'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alerts
            {lowStockItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {lowStockItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatsCard
              title="Total Items"
              value={stats.totalItems || 0}
              icon={<Package className="w-6 h-6 text-blue-600" />}
              color="blue"
            />
            <StatsCard
              title="Current Stock"
              value={stats.totalCurrentStock || 0}
              icon={<BarChart3 className="w-6 h-6 text-green-600" />}
              color="green"
            />
            <StatsCard
              title="Total Sold"
              value={stats.totalSold || 0}
              icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
              color="purple"
            />
            <StatsCard
              title="Low Stock Alerts"
              value={stats.lowStockItems || 0}
              icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
              color="red"
            />
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            {inventory.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No inventory items yet. Items will appear here when you create batches or products.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inventory.slice(0, 5).map(item => (
                  <div key={item.itemId} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900">{item.itemId}</p>
                      <p className="text-sm text-gray-500">
                        {item.currentQuantity} units • Last updated {new Date(item.lastUpdated).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockStatusColor(item)}`}>
                      {getStockStatusText(item)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* All Items Tab */}
      {activeTab === 'items' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventory.map(item => (
              <InventoryCard key={item.itemId} item={item} />
            ))}
          </div>

          {inventory.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No inventory items found. Create batches or products to start tracking inventory.</p>
            </div>
          )}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>

          {lowStockItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
              <p className="text-gray-500">All items are well-stocked. No alerts at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {lowStockItems.map(item => (
                <div key={item.itemId} className="bg-white rounded-lg shadow-sm border-l-4 border-l-red-500 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{item.itemId}</h4>
                        <p className="text-sm text-red-600">
                          {item.currentQuantity === 0 ? 'Out of stock' : `Only ${item.currentQuantity} units remaining`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setAddStockForm({ ...addStockForm, itemId: item.itemId });
                        setShowAddStock(true);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Restock
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Stock</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item ID</label>
                <input
                  type="text"
                  value={addStockForm.itemId}
                  onChange={(e) => setAddStockForm({ ...addStockForm, itemId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  readOnly={!!addStockForm.itemId}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
                <input
                  type="number"
                  value={addStockForm.quantity}
                  onChange={(e) => setAddStockForm({ ...addStockForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={addStockForm.reason}
                  onChange={(e) => setAddStockForm({ ...addStockForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddStock(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStock}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={!addStockForm.itemId || !addStockForm.quantity}
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Details</h3>

            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-600">Item ID:</span>
                <span className="ml-2 text-sm text-gray-900">{selectedItem.itemId}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Type:</span>
                <span className="ml-2 text-sm text-gray-900 capitalize">{selectedItem.itemType}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Current Stock:</span>
                <span className="ml-2 text-sm font-bold text-gray-900">{selectedItem.currentQuantity}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Reserved:</span>
                <span className="ml-2 text-sm text-gray-900">{selectedItem.reservedQuantity}</span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600">Sold:</span>
                <span className="ml-2 text-sm text-gray-900">{selectedItem.soldQuantity}</span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedItem.stockHistory.slice(-5).reverse().map((activity, index) => (
                  <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">{activity.action}</span>
                      <span>{new Date(activity.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-gray-600">{activity.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
