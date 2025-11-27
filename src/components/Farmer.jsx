import React, { useState, useEffect } from 'react';
import { Plus, QrCode, MapPin, Calendar, Package, TrendingUp, Camera, Upload, Eye, CheckCircle, Clock, Truck, ShoppingCart, ClipboardList, BarChart3, History, Shield, Link, ExternalLink } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Marketplace from './Marketplace';
import OrderManager from './OrderManager';
import InventoryManager from './InventoryManager';
import ProductHistory from './ProductHistory';
import KYCVerification from './KYCVerification';
import VerificationBadge from './VerificationBadge';
import SmartContractDashboard from './SmartContractDashboard';
import TraceabilityQRCode from './TraceabilityQRCode';
import NavigationTabs from './NavigationTabs';
import NotificationSystem, { useNotifications } from './NotificationSystem';
import LoadingButton from './LoadingSpinner';
import { initializeInventoryItem } from '../utils/inventoryUtils';
import { addTraceabilityEvent, TRACE_EVENT_TYPES, initializeTraceabilityForExistingBatches } from '../utils/traceabilityUtils';
import { useBlockchainIntegration } from '../hooks/useBlockchainIntegration';
import BlockchainStatus from './BlockchainStatus';
import BlockchainRecordButton from './BlockchainRecordButton';

const BATCHES_KEY = 'batches';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateBatch, setShowCreateBatch] = useState(false);
  const [newBatch, setNewBatch] = useState({
    variety: '',
    quantity: '',
    harvestDate: '',
    qualityNotes: '',
    image: '' // base64 string
  });
  const [batches, setBatches] = useState([]);

  // UI/UX improvements
  const notifications = useNotifications();
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [recordToBlockchain, setRecordToBlockchain] = useState(true);

  // Blockchain integration
  const { 
    isConnected, 
    recordBatchOnChain, 
    registerUser,
    userRole 
  } = useBlockchainIntegration();

  // Load batches from localStorage for this farmer
  useEffect(() => {
    if (!user) return;
    const allBatches = JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
    setBatches(allBatches.filter(b => b.farmerId === user.id));

    // Initialize traceability for existing batches
    initializeTraceabilityForExistingBatches();
  }, [user]);

  // Save batches to localStorage
  const saveBatches = (updatedBatches) => {
    const allBatches = JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
    // Remove this farmer's batches, add updated
    const filtered = allBatches.filter(b => b.farmerId !== user.id);
    const merged = [...filtered, ...updatedBatches];
    localStorage.setItem(BATCHES_KEY, JSON.stringify(merged));
    setBatches(updatedBatches);
  };

  // Create a new batch
  const handleCreateBatch = async () => {
    // Validation
    if (!newBatch.variety || !newBatch.quantity || !newBatch.harvestDate) {
      notifications.showError(
        'Validation Error',
        'Please fill in all required fields (variety, quantity, harvest date)'
      );
      return;
    }

    setIsCreatingBatch(true);

    try {
      const batch = {
        id: 'BTH-' + Date.now(),
        farmerId: user.id,
        variety: newBatch.variety,
        quantity: newBatch.quantity,
        harvestDate: newBatch.harvestDate,
        qualityNotes: newBatch.qualityNotes,
        image: newBatch.image,
        status: 'Ready',
        createdAt: new Date().toISOString()
      };
      const updated = [batch, ...batches];
      saveBatches(updated);

      // Initialize inventory tracking for the new batch
      initializeInventoryItem(
        batch.id,
        'batch',
        batch.quantity,
        user.id,
        'farmer'
      );

      // Initialize traceability tracking
      addTraceabilityEvent(
        batch.id,
        TRACE_EVENT_TYPES.CREATED,
        {
          userName: `${user.firstName} ${user.lastName}`,
          description: `Batch created for ${batch.variety}`,
          location: user.location || 'Farm Location',
          details: {
            variety: batch.variety,
            quantity: batch.quantity,
            harvestDate: batch.harvestDate,
            qualityNotes: batch.qualityNotes
          },
          images: batch.image ? [batch.image] : []
        },
        user.id,
        'farmer'
      );

      // Record on blockchain if enabled and connected
      let blockchainResult = null;
      if (recordToBlockchain && isConnected) {
        blockchainResult = await recordBatchOnChain(batch, user);
        if (blockchainResult.success) {
          // Update batch with blockchain info
          batch.blockchainTxHash = blockchainResult.txHash;
          batch.blockchainBatchId = blockchainResult.batchId;
          saveBatches([batch, ...batches.filter(b => b.id !== batch.id)]);
        }
      }

      // Success notification
      const blockchainMsg = blockchainResult?.success 
        ? ' and recorded on blockchain!' 
        : recordToBlockchain && isConnected 
          ? ' (blockchain recording pending)' 
          : '';
      notifications.showSuccess(
        'Batch Created Successfully!',
        `Batch ${batch.variety} (${batch.quantity} units) has been added to your inventory${blockchainMsg}`
      );

      setShowCreateBatch(false);
      setNewBatch({ variety: '', quantity: '', harvestDate: '', qualityNotes: '', image: '' });

    } catch (error) {
      console.error('Error creating batch:', error);
      notifications.showError(
        'Creation Failed',
        'There was an error creating your batch. Please try again.'
      );
    } finally {
      setIsCreatingBatch(false);
    }
  };

  // Stats
  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => b.status === 'Ready' || b.status === 'Processing').length;
  const thisMonth = batches.filter(b => {
    const d = new Date(b.harvestDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // UI helpers
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

  // Image upload handler
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewBatch(batch => ({ ...batch, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

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

  const navigationTabs = [
    { id: 'overview', label: 'Farm Overview', icon: <Package className="w-4 h-4" /> },
    { id: 'marketplace', label: 'Marketplace', icon: <ShoppingCart className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'traceability', label: 'Traceability', icon: <History className="w-4 h-4" /> },
    { id: 'blockchain', label: 'Smart Contract', icon: <Link className="w-4 h-4" /> },
    { id: 'verification', label: 'KYC/Verification', icon: <Shield className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Navigation Tabs */}
      <NavigationTabs
        tabs={navigationTabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        colorScheme="green"
      />

      {/* Tab Content */}
      {activeTab === 'marketplace' && (
        <Marketplace />
      )}

      {activeTab === 'orders' && (
        <OrderManager userRole="farmer" userId={user?.id} />
      )}

      {activeTab === 'inventory' && (
        <InventoryManager userRole="farmer" userId={user?.id} />
      )}

      {activeTab === 'traceability' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Traceability Management</h2>
            <p className="text-gray-600">Track and manage the journey of your farm products</p>
          </div>

          {batches.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No batches created yet. Create your first batch to start tracking.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {batches.slice(0, 5).map(batch => (
                <ProductHistory
                  key={batch.id}
                  batchId={batch.id}
                  showAddEvent={true}
                />
              ))}

              {batches.length > 5 && (
                <div className="text-center">
                  <p className="text-gray-500">Showing 5 most recent batches</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'blockchain' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <SmartContractDashboard
            user={user}
            products={batches.map(batch => ({
              id: batch.id,
              name: `${batch.variety} - Batch #${batch.id.slice(-6)}`,
              type: batch.variety,
              description: batch.qualityNotes || 'Fresh produce from farm',
              location: user?.location || 'Farm Location',
              origin: user?.location || 'Farm Location',
              harvestDate: batch.harvestDate,
              certifications: batch.certifications || [],
              qualityMetrics: {
                grade: 'A',
                moisture: batch.moisture || 12,
                purity: batch.purity || 95
              },
              traceabilityData: batch.traceabilityData
            }))}
            onTransactionComplete={(data) => {
              console.log('Blockchain transaction completed:', data);
              // Handle transaction completion if needed
            }}
          />
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <KYCVerification />
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Farm Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Farm</h2>
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
                  <p className="text-sm text-gray-500">Farm ID</p>
                  <p className="font-semibold text-gray-900">{user?.farmId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="font-semibold text-green-600">₦{user?.totalRevenue || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{totalBatches}</p>
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
                <p className="text-2xl font-bold text-gray-900">{activeBatches}</p>
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
                <p className="text-2xl font-bold text-gray-900">{thisMonth}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Batches */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Your Batches</h3>

            <div className="flex justify-end space-x-2">
              <button
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                onClick={() => exportToCSV(batches, 'batches.csv')}
                disabled={batches.length === 0}
              >
                Export CSV
              </button>
              <button
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                onClick={() => exportToPDF(batches, 'batches.pdf')}
                disabled={batches.length === 0}
              >
                Export PDF
              </button>
            </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blockchain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traceability</th>
                </tr>
              </thead>
              <tbody>
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-400">No batches yet. Click "Create Batch" to add your first batch.</td>
                  </tr>
                ) : (
                  batches.map(batch => (
                    <tr key={batch.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{batch.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{batch.variety}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{batch.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{batch.harvestDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(batch.status)}`}>
                          {getStatusIcon(batch.status)}
                          <span className="ml-1">{batch.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <BlockchainStatus itemId={batch.id} type="batch" compact={true} />
                        {!batch.blockchainTxHash && isConnected && (
                          <BlockchainRecordButton
                            size="xs"
                            label="Record"
                            onRecord={() => recordBatchOnChain(batch, user)}
                            showConnectPrompt={false}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <TraceabilityQRCode
                          batchId={batch.id}
                          productName={batch.variety}
                          size={60}
                          showDetails={true}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ProductHistory batchId={batch.id} compact={true} showAddEvent={false} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Batch Modal */}
        {showCreateBatch && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Create New Batch</h2>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Plantain Variety</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={newBatch.variety}
                  onChange={e => setNewBatch({ ...newBatch, variety: e.target.value })}
                  required
                >
                  <option value="">Select variety</option>
                  <option value="French Horn">French Horn</option>
                  <option value="Big Ebanga">Big Ebanga</option>
                  <option value="Agbagba">Agbagba</option>
                  <option value="Orishele">Orishele</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Quantity (kg)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  value={newBatch.quantity}
                  onChange={e => setNewBatch({ ...newBatch, quantity: e.target.value })}
                  required
                  placeholder="Enter quantity in kg"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Harvest Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={newBatch.harvestDate}
                  onChange={e => setNewBatch({ ...newBatch, harvestDate: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Quality Notes</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  value={newBatch.qualityNotes}
                  onChange={e => setNewBatch({ ...newBatch, qualityNotes: e.target.value })}
                  rows={2}
                  placeholder="Add quality observations, certifications, etc."
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-1">Upload Harvest Photo</label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
                  <input {...getInputProps()} />
                  {newBatch.image ? (
                    <img src={newBatch.image} alt="Batch" className="mx-auto h-32 object-contain mb-2" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Drag & drop or click to select a photo</p>
                    </>
                  )}
                </div>
              </div>
              {/* Blockchain Recording Option */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recordToBlockchain}
                    onChange={(e) => setRecordToBlockchain(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-blue-800">
                    Record on Blockchain (Sepolia)
                  </span>
                </label>
                <p className="mt-1 text-xs text-blue-600 ml-6">
                  {isConnected 
                    ? 'Your batch will be permanently recorded on the Ethereum blockchain for traceability.'
                    : 'Connect your wallet to enable blockchain recording.'}
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowCreateBatch(false)}
                >
                  Cancel
                </button>
                <LoadingButton
                  isLoading={isCreatingBatch}
                  loadingText="Creating..."
                  disabled={!newBatch.variety || !newBatch.quantity || !newBatch.harvestDate}
                  onClick={handleCreateBatch}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Create Batch
                </LoadingButton>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Notification System */}
      <NotificationSystem
        notifications={notifications.notifications}
        onDismiss={notifications.removeNotification}
      />
    </div>
  );
};

export default FarmerDashboard;

