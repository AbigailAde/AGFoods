import React, { useState } from 'react';
import { Plus, QrCode, MapPin, Calendar, Package, TrendingUp, Camera, Upload, Eye, CheckCircle, Clock, Truck } from 'lucide-react';

const FarmerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [newBatch, setNewBatch] = useState({
    variety: '',
    quantity: '',
    harvestDate: '',
    qualityNotes: ''
  });

  // Sample data - in real app, this would come from blockchain/API
  const farmerData = {
    name: "Samuel Okafor",
    farmName: "Green Valley Plantain Farm",
    location: "Onitsha, Anambra State",
    farmId: "AGF-001-234",
    totalBatches: 24,
    activeBatches: 6,
    revenue: "₦450,000"
  };

  const recentBatches = [
    {
      id: "BTH-001",
      variety: "French Horn",
      quantity: "500kg",
      harvestDate: "2025-06-10",
      status: "Processing",
      qrCode: "QR-001-456",
      processor: "Golden Flour Mills"
    },
    {
      id: "BTH-002", 
      variety: "Big Ebanga",
      quantity: "750kg",
      harvestDate: "2025-06-08",
      status: "Delivered",
      qrCode: "QR-002-789",
      processor: "Premium Foods Ltd"
    },
    {
      id: "BTH-003",
      variety: "French Horn",
      quantity: "300kg", 
      harvestDate: "2025-06-12",
      status: "Ready",
      qrCode: "QR-003-123",
      processor: "Pending Collection"
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Ready': return 'bg-green-100 text-green-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-gray-100 text-gray-800';
      case 'In Transit': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Ready': return <Package className="w-4 h-4" />;
      case 'Processing': return <Clock className="w-4 h-4" />;
      case 'Delivered': return <CheckCircle className="w-4 h-4" />;
      case 'In Transit': return <Truck className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const handleCreateBatch = () => {
    // In real app, this would interact with smart contract
    console.log('Creating batch:', newBatch);
    setShowCreateBatch(false);
    setNewBatch({ variety: '', quantity: '', harvestDate: '', qualityNotes: '' });
    // Would refresh batch list here
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AGFoods</h1>
                <p className="text-sm text-gray-600">Farmer Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Welcome back, {farmerData.name}</span>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">S</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Farm Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{farmerData.farmName}</h2>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{farmerData.location}</span>
              </div>
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm text-gray-500">Farm ID</p>
                  <p className="font-semibold text-gray-900">{farmerData.farmId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="font-semibold text-green-600">{farmerData.revenue}</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowCreateBatch(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Batch</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Batches</p>
                <p className="text-2xl font-bold text-gray-900">{farmerData.totalBatches}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Batches</p>
                <p className="text-2xl font-bold text-gray-900">{farmerData.activeBatches}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">This Month</p>
                <p className="text-2xl font-bold text-gray-900">8</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Batches */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recent Batches</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variety</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harvest Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {batch.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.variety}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(batch.harvestDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                        {getStatusIcon(batch.status)}
                        <span className="ml-1">{batch.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="flex items-center space-x-1 text-blue-600 hover:text-blue-800">
                        <QrCode className="w-4 h-4" />
                        <span>View QR</span>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button className="text-blue-600 hover:text-blue-800 mr-3">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Batch Modal */}
      {showCreateBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateBatch(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 h-[80vh] overflow-y-auto shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Batch</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plantain Variety
                </label>
                <select 
                  value={newBatch.variety}
                  onChange={(e) => setNewBatch({...newBatch, variety: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select variety</option>
                  <option value="French Horn">French Horn</option>
                  <option value="Big Ebanga">Big Ebanga</option>
                  <option value="Agbagba">Agbagba</option>
                  <option value="Orishele">Orishele</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  value={newBatch.quantity}
                  onChange={(e) => setNewBatch({...newBatch, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter quantity in kg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harvest Date
                </label>
                <input
                  type="date"
                  value={newBatch.harvestDate}
                  onChange={(e) => setNewBatch({...newBatch, harvestDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Notes
                </label>
                <textarea
                  value={newBatch.qualityNotes}
                  onChange={(e) => setNewBatch({...newBatch, qualityNotes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows="3"
                  placeholder="Add quality observations, certifications, etc."
                />
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload harvest photos</p>
                <button type="button" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Choose files
                </button>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateBatch(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBatch} 
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;


// import React, { useState } from 'react';
// import { Plus, QrCode, MapPin, Calendar, Package, TrendingUp, Camera, Upload, Eye, CheckCircle, Clock, Truck, Info } from 'lucide-react';

