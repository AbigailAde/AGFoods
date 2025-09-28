import React, { useState, useEffect } from 'react';
import { Plus, QrCode, MapPin, Calendar, Package, TrendingUp, Camera, Upload, Eye, CheckCircle, Clock, Truck, Factory, ShoppingCart, AlertCircle, Info, Thermometer, Scale, ClipboardList } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useDropzone } from 'react-dropzone';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Marketplace from './Marketplace';
import OrderManager from './OrderManager';

const BATCHES_KEY = 'batches';
const PROCESSING_KEY = 'processing';
const PRODUCTS_KEY = 'products';

const ProcessorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showProcessBatch, setShowProcessBatch] = useState(false);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProcessing, setNewProcessing] = useState({
    batchId: '',
    processType: '',
    expectedYield: '',
    qualityGrade: '',
    processingNotes: '',
    image: ''
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    processType: '',
    quantity: '',
    price: '',
    qualityGrade: '',
    description: '',
    image: ''
  });

  const [incomingBatches, setIncomingBatches] = useState([]);
  const [processingJobs, setProcessingJobs] = useState([]);
  const [products, setProducts] = useState([]);

  // Add processTypeInfo definition
  const processTypeInfo = {
    'Plantain Flour': 'High-quality flour for baking and food production. Gluten-free alternative with 85-90% yield rate.',
    'Plantain Chips': 'Crispy snack chips with extended shelf life. Popular retail product with 70-75% yield rate.',
    'Dried Plantain': 'Dehydrated slices for export and wholesale. Premium product with 25-30% yield rate.',
    'Plantain Puree': 'Smooth paste for baby food and industrial use. High-value processing with 60-65% yield rate.'
  };

  // Load incoming batches, processing jobs, and products from localStorage
  useEffect(() => {
    if (!user) return;
    const allBatches = JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
    setIncomingBatches(allBatches.filter(b => b.status === 'Ready' || b.status === 'Incoming'));
    const allProcessing = JSON.parse(localStorage.getItem(PROCESSING_KEY) || '[]');
    setProcessingJobs(allProcessing.filter(p => p.processorId === user.id));
    const allProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    setProducts(allProducts.filter(p => p.processorId === user.id));
  }, [user]);

  // Save processing jobs to localStorage
  const saveProcessingJobs = (updatedJobs) => {
    const allProcessing = JSON.parse(localStorage.getItem(PROCESSING_KEY) || '[]');
    // Remove this processor's jobs, add updated
    const filtered = allProcessing.filter(p => p.processorId !== user.id);
    const merged = [...filtered, ...updatedJobs];
    localStorage.setItem(PROCESSING_KEY, JSON.stringify(merged));
    setProcessingJobs(updatedJobs);
  };

  // Save products to localStorage
  const saveProducts = (updatedProducts) => {
    const allProducts = JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]');
    // Remove this processor's products, add updated
    const filtered = allProducts.filter(p => p.processorId !== user.id);
    const merged = [...filtered, ...updatedProducts];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(merged));
    setProducts(updatedProducts);
  };

  // Image upload handler for products
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

  // Image upload handler for processing
  const onProcessingImageDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewProcessing(processing => ({ ...processing, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };
  const { getRootProps: getProcessingRootProps, getInputProps: getProcessingInputProps, isDragActive: isProcessingDragActive } = useDropzone({ onDrop: onProcessingImageDrop, accept: { 'image/*': [] } });

  // Start a new processing job
  const handleStartProcessing = () => {
    const batch = incomingBatches.find(b => b.id === newProcessing.batchId);
    const job = {
      id: 'PROC-' + Date.now(),
      processorId: user.id,
      batchId: newProcessing.batchId,
      processType: newProcessing.processType,
      expectedYield: newProcessing.expectedYield,
      qualityGrade: newProcessing.qualityGrade,
      processingNotes: newProcessing.processingNotes,
      image: newProcessing.image,
      status: 'Processing',
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    const updated = [job, ...processingJobs];
    saveProcessingJobs(updated);
    setShowProcessBatch(false);
    setNewProcessing({ batchId: '', processType: '', expectedYield: '', qualityGrade: '', processingNotes: '', image: '' });
  };

  // Create a new product
  const handleCreateProduct = () => {
    const product = {
      id: 'PROD-' + Date.now(),
      processorId: user.id,
      name: newProduct.name,
      processType: newProduct.processType,
      quantity: newProduct.quantity,
      price: newProduct.price,
      qualityGrade: newProduct.qualityGrade,
      description: newProduct.description,
      image: newProduct.image,
      status: 'Available',
      createdAt: new Date().toISOString()
    };
    const updated = [product, ...products];
    saveProducts(updated);
    setShowCreateProduct(false);
    setNewProduct({ name: '', processType: '', quantity: '', price: '', qualityGrade: '', description: '', image: '' });
  };

  // Stats
  const totalProcessed = processingJobs.length;
  const activeProcessing = processingJobs.filter(j => j.status === 'Processing').length;
  const completed = processingJobs.filter(j => j.status === 'Completed').length;
  const thisMonth = processingJobs.filter(j => {
    const d = new Date(j.startDate);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

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

  // UI helpers (getStatusColor, getStatusIcon, getQualityColor) remain unchanged
  const getStatusColor = (status) => {
    switch(status) {
      case 'Incoming': return 'bg-blue-100 text-blue-800';
      case 'Quality Check': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-purple-100 text-purple-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Shipped': return 'bg-gray-100 text-gray-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Incoming': return <Truck className="w-4 h-4" />;
      case 'Quality Check': return <AlertCircle className="w-4 h-4" />;
      case 'Processing': return <Factory className="w-4 h-4" />;
      case 'Completed': return <CheckCircle className="w-4 h-4" />;
      case 'Shipped': return <Package className="w-4 h-4" />;
      case 'Rejected': return <AlertCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getQualityColor = (grade) => {
    switch(grade) {
      case 'A+': return 'text-green-600 bg-green-50';
      case 'A': return 'text-green-600 bg-green-50';
      case 'B+': return 'text-yellow-600 bg-yellow-50';
      case 'B': return 'text-yellow-600 bg-yellow-50';
      case 'C': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Processing Overview', icon: <Factory className="w-4 h-4" /> },
              { id: 'marketplace', label: 'Marketplace', icon: <ShoppingCart className="w-4 h-4" /> },
              { id: 'orders', label: 'Orders', icon: <ClipboardList className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
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

      {/* Tab Content */}
      {activeTab === 'marketplace' && (
        <Marketplace />
      )}

      {activeTab === 'orders' && (
        <OrderManager userRole="processor" userId={user?.id} />
      )}

      {activeTab === 'overview' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Company Info Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Processing Facility</h2>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{user?.location || 'Your Location'}</span>
              </div>
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm text-gray-500">Processor ID</p>
                  <p className="font-semibold text-gray-900">{user?.id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="font-semibold text-purple-600">{products.length}</p>
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
                onClick={() => setShowProcessBatch(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Start Processing</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Processed</p>
                <p className="text-2xl font-bold text-gray-900">{totalProcessed}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Factory className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Batches</p>
                <p className="text-2xl font-bold text-gray-900">{activeProcessing}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Quality Score</p>
                <p className="text-2xl font-bold text-gray-900">N/A</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
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

        {/* Active Processing */}
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Active Processing</h3>
          </div>
          <div className="p-6">
            <div className="flex justify-end mb-2 space-x-2">
              <button
                className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                onClick={() => exportToCSV(processingJobs, 'processing.csv')}
                disabled={processingJobs.length === 0}
              >
                Export CSV
              </button>
              <button
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                onClick={() => exportToPDF(processingJobs, 'processing.pdf')}
                disabled={processingJobs.length === 0}
              >
                Export PDF
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {processingJobs.map((process) => (
                <div key={process.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{process.processType}</h4>
                      <p className="text-sm text-gray-500">Batch: {process.batchId}</p>
                    </div>
                    <span className="text-sm font-medium text-purple-600">{process.progress}%</span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${process.progress}%` }}
                    ></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Current Stage</p>
                      <p className="font-medium">{process.currentStage}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Expected Yield</p>
                      <p className="font-medium">{process.currentYield} / {process.expectedYield}</p>
                    </div>
                  </div>

                  <div className="mt-3 text-sm">
                    <p className="text-gray-500">Expected Completion</p>
                    <p className="font-medium">{new Date(process.expectedCompletion).toLocaleDateString()}</p>
                  </div>

                  {process.image && (
                    <div className="mt-3">
                      <p className="text-gray-500 text-sm mb-2">Processing Setup</p>
                      <img src={process.image} alt="Processing Setup" className="w-full h-24 object-cover rounded-md" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Incoming Batches */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Incoming & Processing Batches</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Farmer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Variety</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QR Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incomingBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {batch.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        <p className="font-medium">{batch.farmerName}</p>
                        <p className="text-xs text-gray-400">{batch.farmerId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.variety}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {batch.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualityColor(batch.qualityScore)}`}>
                        {batch.qualityScore}
                      </span>
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
                        <span>Scan</span>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (₦)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">{product.processType}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{product.quantity} kg</td>
                      <td className="px-6 py-4 whitespace-nowrap">₦{product.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getQualityColor(product.qualityGrade)}`}>
                          {product.qualityGrade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                          <Package className="w-3 h-3 mr-1" />
                          {product.status}
                        </span>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Process Type
                </label>
                <select
                  value={newProduct.processType}
                  onChange={(e) => setNewProduct({...newProduct, processType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select type</option>
                  <option value="Plantain Flour">Plantain Flour</option>
                  <option value="Plantain Chips">Plantain Chips</option>
                  <option value="Dried Plantain">Dried Plantain</option>
                  <option value="Plantain Puree">Plantain Puree</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity (kg)
                </label>
                <input
                  type="number"
                  value={newProduct.quantity}
                  onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter quantity"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per kg (₦)
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter price"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Grade
                </label>
                <select
                  value={newProduct.qualityGrade}
                  onChange={(e) => setNewProduct({...newProduct, qualityGrade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select quality grade</option>
                  <option value="A+">A+ - Premium Quality</option>
                  <option value="A">A - High Quality</option>
                  <option value="B+">B+ - Good Quality</option>
                  <option value="B">B - Standard Quality</option>
                  <option value="C">C - Below Standard</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows="3"
                  placeholder="Product description, features, certifications..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload Product Photo</label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
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
                disabled={!newProduct.name || !newProduct.processType || !newProduct.quantity || !newProduct.price}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Processing Modal */}
      {showProcessBatch && (
        <div
          className="fixed overflow-y-auto inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProcessBatch(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full h-[80vh] p-6 overflow-y-auto shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Start New Processing</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Batch
                </label>
                <select
                  value={newProcessing.batchId}
                  onChange={(e) => setNewProcessing({...newProcessing, batchId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select batch to process</option>
                  {incomingBatches.filter(b => b.status === 'Ready' || b.status === 'Incoming').map(batch => (
                    <option key={batch.id} value={batch.id}>
                      {batch.id} - {batch.variety} ({batch.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Type
                </label>
                <select
                  value={newProcessing.processType}
                  onChange={(e) => setNewProcessing({...newProcessing, processType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select processing type</option>
                  <option value="Plantain Flour">Plantain Flour</option>
                  <option value="Plantain Chips">Plantain Chips</option>
                  <option value="Dried Plantain">Dried Plantain</option>
                  <option value="Plantain Puree">Plantain Puree</option>
                </select>
                {newProcessing.processType && (
                  <div className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-purple-700">{processTypeInfo[newProcessing.processType]}</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Yield (kg)
                </label>
                <input
                  type="number"
                  value={newProcessing.expectedYield}
                  onChange={(e) => setNewProcessing({...newProcessing, expectedYield: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Enter expected yield"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Grade
                </label>
                <select
                  value={newProcessing.qualityGrade}
                  onChange={(e) => setNewProcessing({...newProcessing, qualityGrade: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Assign quality grade</option>
                  <option value="A+">A+ - Premium Quality</option>
                  <option value="A">A - High Quality</option>
                  <option value="B+">B+ - Good Quality</option>
                  <option value="B">B - Standard Quality</option>
                  <option value="C">C - Below Standard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Notes
                </label>
                <textarea
                  value={newProcessing.processingNotes}
                  onChange={(e) => setNewProcessing({...newProcessing, processingNotes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows="3"
                  placeholder="Add processing specifications, special requirements, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Processing Setup Photos
                </label>
                <div {...getProcessingRootProps()} className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer ${isProcessingDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-300'}`}>
                  <input {...getProcessingInputProps()} />
                  {newProcessing.image ? (
                    <img src={newProcessing.image} alt="Processing Setup" className="mx-auto h-32 object-contain mb-2" />
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">Drag & drop or click to select a photo</p>
                      <p className="text-xs text-gray-500">Upload photos of your processing setup</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowProcessBatch(!showProcessBatch)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartProcessing}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Start Processing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessorDashboard;
