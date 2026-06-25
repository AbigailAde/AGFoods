import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import SmartContractUtils from './smartContractUtils';

const TraceabilityComponent = ({ product, onTraceabilityCreated, smartContractIntegration }) => {
  const [traceabilityData, setTraceabilityData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [traceabilityHistory, setTraceabilityHistory] = useState([]);
  const [contractUtils] = useState(new SmartContractUtils());

  // Generate traceability record for a product
  const generateTraceability = async () => {
    if (!product || !smartContractIntegration?.isConnected) {
      alert('Please connect your wallet first.');
      return;
    }

    setIsGenerating(true);
    try {
      const batchData = {
        batchId: product.batchId || `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        productType: product.type || product.name,
        origin: product.origin || product.location || 'Unknown',
        processingLocation: product.processingLocation || '',
        harvestDate: product.harvestDate || Date.now(),
        certifications: product.certifications || [],
        qualityMetrics: {
          moisture: product.moisture || 0,
          purity: product.purity || 0,
          grade: product.grade || 'A',
          ...product.qualityMetrics
        },
        environmentalData: {
          temperature: product.temperature || 0,
          humidity: product.humidity || 0,
          soilType: product.soilType || '',
          ...product.environmentalData
        },
        processingSteps: product.processingSteps || []
      };

      const result = await smartContractIntegration.createTraceabilityRecord(batchData);

      if (result && result.success) {
        const traceabilityUrl = contractUtils.generateTraceabilityQR(result.batchId, result.transactionId);

        const traceData = {
          batchId: result.batchId,
          transactionId: result.transactionId,
          blockchainHash: result.blockchainHash,
          traceabilityUrl: traceabilityUrl,
          createdAt: new Date().toISOString(),
          product: batchData
        };

        setTraceabilityData(traceData);

        // Store in localStorage for persistence
        const existingTraceability = JSON.parse(localStorage.getItem('productTraceability') || '{}');
        existingTraceability[product.id] = traceData;
        localStorage.setItem('productTraceability', JSON.stringify(existingTraceability));

        // Notify parent component
        if (onTraceabilityCreated) {
          onTraceabilityCreated(traceData);
        }

        alert('Traceability record created successfully!');
      } else {
        alert('Failed to create traceability record. Please try again.');
      }
    } catch (error) {
      console.error('Error generating traceability:', error);
      alert('Error generating traceability record.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Update traceability record with new information
  const updateTraceability = async (updateData) => {
    if (!traceabilityData?.batchId || !smartContractIntegration?.isConnected) {
      alert('No traceability record found or wallet not connected.');
      return;
    }

    try {
      const result = await smartContractIntegration.contractUtils.updateTraceabilityRecord(
        smartContractIntegration.walletData,
        smartContractIntegration.accountId,
        traceabilityData.batchId,
        updateData
      );

      if (result && result.success) {
        // Update local data
        const updatedHistory = [...traceabilityHistory, {
          timestamp: updateData.timestamp || Date.now(),
          stage: updateData.stage,
          location: updateData.location,
          handler: updateData.handler,
          transactionId: result.transactionId
        }];

        setTraceabilityHistory(updatedHistory);

        // Update localStorage
        const existingTraceability = JSON.parse(localStorage.getItem('productTraceability') || '{}');
        if (existingTraceability[product.id]) {
          existingTraceability[product.id].history = updatedHistory;
          localStorage.setItem('productTraceability', JSON.stringify(existingTraceability));
        }

        alert('Traceability record updated successfully!');
      } else {
        alert('Failed to update traceability record.');
      }
    } catch (error) {
      console.error('Error updating traceability:', error);
      alert('Error updating traceability record.');
    }
  };

  // Load existing traceability data
  useEffect(() => {
    if (product?.id) {
      const existingTraceability = JSON.parse(localStorage.getItem('productTraceability') || '{}');
      if (existingTraceability[product.id]) {
        setTraceabilityData(existingTraceability[product.id]);
        setTraceabilityHistory(existingTraceability[product.id].history || []);
      }
    }
  }, [product]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStageIcon = (stage) => {
    switch (stage) {
      case 'harvesting':
        return '🌾';
      case 'processing':
        return '⚙️';
      case 'packaging':
        return '📦';
      case 'distribution':
        return '🚛';
      case 'retail':
        return '🏪';
      default:
        return '📋';
    }
  };

  if (!product) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">No product selected for traceability</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Product Traceability
            </h3>
            <p className="text-gray-600">
              {product.name} - Blockchain-powered tracking
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${traceabilityData ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className={`text-sm font-medium ${traceabilityData ? 'text-green-600' : 'text-gray-500'}`}>
              {traceabilityData ? 'Tracked' : 'Not Tracked'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!traceabilityData ? (
          /* Create Traceability Section */
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Create Traceability Record
            </h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Generate a blockchain-based traceability record for this product to enable
              transparent tracking from farm to consumer.
            </p>

            <button
              onClick={generateTraceability}
              disabled={isGenerating || !smartContractIntegration?.isConnected}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Traceability Record
                </>
              )}
            </button>

            {!smartContractIntegration?.isConnected && (
              <p className="text-sm text-red-600 mt-4">
                Please connect your wallet first to create traceability records.
              </p>
            )}
          </div>
        ) : (
          /* Existing Traceability Section */
          <div className="space-y-6">
            {/* Traceability Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-green-800">
                  Traceability Record Active
                </h4>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="text-green-700 hover:text-green-800 text-sm font-medium"
                >
                  {showQR ? 'Hide QR' : 'Show QR Code'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-green-700 font-medium">Batch ID:</p>
                  <p className="text-green-600 font-mono">{traceabilityData.batchId}</p>
                </div>
                <div>
                  <p className="text-green-700 font-medium">Created:</p>
                  <p className="text-green-600">{formatDate(traceabilityData.createdAt)}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-green-700 font-medium">Blockchain Hash:</p>
                  <p className="text-green-600 font-mono text-xs break-all">{traceabilityData.transactionId}</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            {showQR && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                <h4 className="font-semibold text-gray-900 mb-4">Traceability QR Code</h4>
                <div className="inline-block p-4 bg-white border border-gray-300 rounded-lg">
                  <QRCodeCanvas
                    value={traceabilityData.traceabilityUrl}
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-4 max-w-md mx-auto">
                  Scan this QR code to view the complete traceability history of this product.
                </p>
                <div className="mt-4">
                  <a
                    href={traceabilityData.traceabilityUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View Traceability Page
                  </a>
                </div>
              </div>
            )}

            {/* Product Details */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Product Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-700 font-medium">Product Type:</p>
                  <p className="text-gray-600">{traceabilityData.product.productType}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Origin:</p>
                  <p className="text-gray-600">{traceabilityData.product.origin}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Harvest Date:</p>
                  <p className="text-gray-600">{formatDate(traceabilityData.product.harvestDate)}</p>
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Quality Grade:</p>
                  <p className="text-gray-600">{traceabilityData.product.qualityMetrics.grade}</p>
                </div>
              </div>
            </div>

            {/* Traceability History */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Supply Chain History</h4>
                <button
                  onClick={() => {
                    const stage = prompt('Enter stage (harvesting/processing/packaging/distribution/retail):');
                    const location = prompt('Enter location:');
                    const handler = prompt('Enter handler name:');

                    if (stage && location && handler) {
                      updateTraceability({
                        stage,
                        location,
                        handler,
                        timestamp: Date.now(),
                        actions: [`${stage} completed at ${location}`],
                        qualityChecks: {}
                      });
                    }
                  }}
                  disabled={!smartContractIntegration?.isConnected}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Update
                </button>
              </div>

              {traceabilityHistory.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">
                  No supply chain updates recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {traceabilityHistory.map((entry, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-lg">
                        {getStageIcon(entry.stage)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 capitalize">
                          {entry.stage} by {entry.handler}
                        </p>
                        <p className="text-xs text-gray-600">
                          {entry.location} • {formatDate(entry.timestamp)}
                        </p>
                        {entry.transactionId && (
                          <p className="text-xs text-gray-500 font-mono mt-1">
                            TX: {entry.transactionId}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraceabilityComponent;
