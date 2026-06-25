import React, { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import SmartContractIntegration from './SmartContractIntegration';
import TraceabilityComponent from './TraceabilityComponent';
import BlockchainOverview from './BlockchainOverview';
import { useBlockchainIntegration } from '../hooks/useBlockchainIntegration';
import { useTotalBatches, useTotalOrders, useUserBatches } from '../hooks/useTraceabilityContract';

const SmartContractDashboard = ({ user, products = [], onTransactionComplete }) => {
  const { address, isConnected } = useAccount();
  const { recordBatchOnChain } = useBlockchainIntegration();
  
  // On-chain data
  const { data: totalBatches } = useTotalBatches();
  const { data: totalOrders } = useTotalOrders();
  const { data: userBatches } = useUserBatches(address);

  const [smartContractIntegration, setSmartContractIntegration] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle smart contract integration completion
  const handleIntegrationComplete = (integration) => {
    setSmartContractIntegration(integration);
  };

  // Load transaction history when connected
  const loadTransactionHistory = useCallback(async () => {
    if (!smartContractIntegration?.contractUtils) return;

    setIsLoading(true);
    try {
      const history = await smartContractIntegration.contractUtils.getTransactionHistory(
        smartContractIntegration.accountId
      );
      
      if (history.success) {
        setTransactionHistory(history.transactions.slice(0, 20)); // Show last 20 transactions
      }
    } catch (error) {
      console.error('Error loading transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [smartContractIntegration]);

  useEffect(() => {
    if (smartContractIntegration?.isConnected && smartContractIntegration.accountId) {
      loadTransactionHistory();
    }
  }, [smartContractIntegration, loadTransactionHistory]);

  // Handle product selection for traceability
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setActiveTab('traceability');
  };

  // Handle traceability creation
  const handleTraceabilityCreated = (traceabilityData) => {
    // Notify parent component
    if (onTransactionComplete) {
      onTransactionComplete({
        type: 'traceability_created',
        product: selectedProduct,
        traceabilityData
      });
    }
  };

  // Handle payment processing
  const processPayment = async (paymentData) => {
    if (!smartContractIntegration?.isConnected) {
      alert('Please connect your wallet first.');
      return null;
    }

    try {
      let result;
      
      if (paymentData.method === 'HBAR') {
        result = await smartContractIntegration.processHBARPayment(
          paymentData.sellerId,
          paymentData.amount,
          paymentData.orderId
        );
      } else if (paymentData.method === 'TOKEN') {
        // Implement token payment if needed
        alert('Token payments coming soon!');
        return null;
      } else if (paymentData.method === 'ESCROW') {
        result = await smartContractIntegration.createEscrow({
          orderId: paymentData.orderId,
          sellerId: paymentData.sellerId,
          amount: paymentData.amount,
          productDetails: paymentData.productDetails,
          deliveryTerms: paymentData.deliveryTerms
        });
      }

      if (result && result.success) {
        // Record the transaction
        await smartContractIntegration.recordTransaction({
          orderId: paymentData.orderId,
          productType: paymentData.productType || 'purchase',
          amount: paymentData.amount,
          sellerId: paymentData.sellerId,
          buyerId: smartContractIntegration.accountId,
          timestamp: Date.now(),
          status: 'completed',
          metadata: {
            paymentMethod: paymentData.method,
            transactionId: result.transactionId
          }
        });

        // Notify parent component
        if (onTransactionComplete) {
          onTransactionComplete({
            type: 'payment_processed',
            paymentData,
            result
          });
        }

        // Reload transaction history
        setTimeout(() => loadTransactionHistory(), 2000);

        return result;
      }

      return null;
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Error processing payment. Please try again.');
      return null;
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Smart Contract Dashboard
            </h1>
            <p className="text-gray-600">
              Manage blockchain transactions, traceability, and payments
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Welcome back,</p>
            <p className="text-lg font-semibold text-gray-900">
              {user?.name || user?.email || 'User'}
            </p>
          </div>
        </div>
      </div>

      {/* Smart Contract Integration Component */}
      <SmartContractIntegration onIntegrationComplete={handleIntegrationComplete} />

      {/* Main Dashboard Content */}
      {smartContractIntegration?.isConnected && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Products & Traceability
              </button>
              <button
                onClick={() => setActiveTab('transactions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'transactions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Transaction History
              </button>
              {selectedProduct && (
                <button
                  onClick={() => setActiveTab('traceability')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'traceability'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {selectedProduct.name} Traceability
                </button>
              )}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600">Total Transactions</p>
                        <p className="text-2xl font-bold text-blue-900">{transactionHistory.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-600">Tracked Products</p>
                        <p className="text-2xl font-bold text-green-900">
                          {products.filter(p => p.traceabilityData).length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2z" />
                      </svg>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600">Account ID</p>
                        <p className="text-sm font-bold text-purple-900 font-mono">
                          {smartContractIntegration.accountId.slice(0, 12)}...
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-600">Network</p>
                        <p className="text-lg font-bold text-orange-900">Hedera Testnet</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Recent Blockchain Activity
                  </h3>
                  {transactionHistory.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      No blockchain transactions yet. Start by creating a product traceability record.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {transactionHistory.slice(0, 5).map((tx, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Transaction #{tx.transactionId?.slice(-8)}
                              </p>
                              <p className="text-xs text-gray-600">
                                {formatDate(tx.consensusTimestamp)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-gray-900">
                                {tx.type === 'CRYPTOTRANSFER' ? 'Payment' : 'Contract Call'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {tx.result === 'SUCCESS' ? '✅ Success' : '❌ Failed'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Products & Traceability Tab */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Your Products
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select a product to manage its blockchain traceability
                  </p>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Add products to your inventory to start using blockchain traceability features.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product, index) => (
                      <div key={product.id || index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {product.name || product.type || 'Untitled Product'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {product.description || product.location || 'No description'}
                            </p>
                          </div>
                          <div className={`ml-2 w-3 h-3 rounded-full ${
                            product.traceabilityData ? 'bg-green-500' : 'bg-gray-300'
                          }`}></div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            {product.traceabilityData ? (
                              <span className="text-green-600 font-medium">✓ Tracked</span>
                            ) : (
                              <span className="text-gray-500">Not Tracked</span>
                            )}
                          </div>
                          <button
                            onClick={() => handleProductSelect(product)}
                            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                          >
                            {product.traceabilityData ? 'Manage' : 'Track'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Transaction History Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Transaction History
                  </h3>
                  <button
                    onClick={loadTransactionHistory}
                    disabled={isLoading}
                    className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {transactionHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Your blockchain transaction history will appear here once you start using the platform.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date & Time
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {transactionHistory.map((tx, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <p className="text-sm font-mono text-gray-900">
                                  {tx.transactionId?.slice(0, 20)}...
                                </p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-600">
                                  {tx.type === 'CRYPTOTRANSFER' ? 'Payment' : 'Contract Call'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {formatDate(tx.consensusTimestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  tx.result === 'SUCCESS' 
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {tx.result === 'SUCCESS' ? 'Success' : 'Failed'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Traceability Tab */}
            {activeTab === 'traceability' && selectedProduct && (
              <TraceabilityComponent
                product={selectedProduct}
                onTraceabilityCreated={handleTraceabilityCreated}
                smartContractIntegration={smartContractIntegration}
              />
            )}
          </div>
        </div>
      )}

      {/* Payment Processing Component */}
      {smartContractIntegration?.isConnected && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Payment Processing Demo
          </h3>
          <p className="text-gray-600 mb-6">
            Test blockchain payment functionality (Demo purposes only)
          </p>
          
          <button
            onClick={() => {
              const orderId = `ORDER-${Date.now()}`;
              const sellerId = prompt('Enter seller Hedera Account ID (e.g., 0.0.12345):');
              const amount = parseFloat(prompt('Enter amount in HBAR:'));
              
              if (sellerId && amount && amount > 0) {
                processPayment({
                  method: 'HBAR',
                  sellerId: sellerId,
                  amount: amount,
                  orderId: orderId,
                  productType: 'test_payment'
                });
              }
            }}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2z" />
            </svg>
            Test HBAR Payment
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartContractDashboard;