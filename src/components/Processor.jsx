import React, { useState, useEffect } from 'react';
import { Plus, QrCode, MapPin, Calendar, Package, TrendingUp, Camera, Upload, Eye, CheckCircle, Clock, Truck, Factory, ShoppingCart, AlertCircle, Info, Thermometer, Scale } from 'lucide-react';
import { useAuth } from './AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BATCHES_KEY = 'batches';
const PROCESSING_KEY = 'processing';

const ProcessorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [showProcessBatch, setShowProcessBatch] = useState(false);
  const [newProcessing, setNewProcessing] = useState({
    batchId: '',
    processType: '',
    expectedYield: '',
    qualityGrade: '',
    processingNotes: ''
  });
  const [incomingBatches, setIncomingBatches] = useState([]);
  const [processingJobs, setProcessingJobs] = useState([]);

  // Add processTypeInfo definition
  const processTypeInfo = {
    'Plantain Flour': 'High-quality flour for baking and food production. Gluten-free alternative with 85-90% yield rate.',
    'Plantain Chips': 'Crispy snack chips with extended shelf life. Popular retail product with 70-75% yield rate.',
    'Dried Plantain': 'Dehydrated slices for export and wholesale. Premium product with 25-30% yield rate.',
    'Plantain Puree': 'Smooth paste for baby food and industrial use. High-value processing with 60-65% yield rate.'
  };

  // Load incoming batches and processing jobs from localStorage
  useEffect(() => {
    if (!user) return;
    const allBatches = JSON.parse(localStorage.getItem(BATCHES_KEY) || '[]');
    setIncomingBatches(allBatches.filter(b => b.status === 'Ready' || b.status === 'Incoming'));
    const allProcessing = JSON.parse(localStorage.getItem(PROCESSING_KEY) || '[]');
    setProcessingJobs(allProcessing.filter(p => p.processorId === user.id));
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
      status: 'Processing',
      startDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    const updated = [job, ...processingJobs];
    saveProcessingJobs(updated);
    setShowProcessBatch(false);
    setNewProcessing({ batchId: '', processType: '', expectedYield: '', qualityGrade: '', processingNotes: '' });
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

  // In the JSX, use processingJobs for the main table, and incomingBatches for selection
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Factory className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AGFoods</h1>
                <p className="text-sm text-gray-600">Processor Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Welcome back, {user?.firstName} {user?.lastName}</span>
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-semibold">A</span>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Company Name</h2>
              <div className="flex items-center text-gray-600 mb-4">
                <MapPin className="w-4 h-4 mr-2" />
                <span>Your Location</span>
              </div>
              <div className="flex items-center space-x-6">
                <div>
                  <p className="text-sm text-gray-500">Processor ID</p>
                  <p className="font-semibold text-gray-900">Your Processor ID</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Monthly Revenue</p>
                  <p className="font-semibold text-purple-600">₦0</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowProcessBatch(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Start Processing</span>
            </button>
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
      </div>

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

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload processing setup photos</p>
                <button type="button" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  Choose files
                </button>
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