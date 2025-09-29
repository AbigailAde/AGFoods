import React, { useState, useEffect, useCallback } from 'react';
import SmartContractUtils from './smartContractUtils';
import walletConnectFcn from './hedera/walletConnect';

const SmartContractIntegration = ({ onIntegrationComplete }) => {
  const [walletData, setWalletData] = useState(null);
  const [accountId, setAccountId] = useState('');
  const [contractUtils, setContractUtils] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState('');

  useEffect(() => {
    setContractUtils(new SmartContractUtils());
  }, []);

  // Connect to Hedera wallet
  const connectWallet = async () => {
    try {
      setLoading(true);
      setTransactionStatus('Connecting to wallet...');
      
      const wData = await walletConnectFcn();
      setWalletData(wData);
      setAccountId(wData[1].accountIds[0]);
      setIsConnected(true);
      setTransactionStatus('Wallet connected successfully!');
      
      setTimeout(() => setTransactionStatus(''), 3000);
    } catch (error) {
      console.error('Wallet connection error:', error);
      setTransactionStatus('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Record a transaction on the blockchain
  const recordTransaction = useCallback(async (transactionData) => {
    if (!isConnected || !contractUtils) {
      setTransactionStatus('Please connect your wallet first.');
      return null;
    }

    try {
      setLoading(true);
      setTransactionStatus('Recording transaction on blockchain...');
      
      const result = await contractUtils.recordTransaction(walletData, accountId, transactionData);
      
      if (result.success) {
        setTransactionStatus('Transaction recorded successfully!');
        setTimeout(() => setTransactionStatus(''), 5000);
        return result;
      } else {
        setTransactionStatus(`Error: ${result.error}`);
        return null;
      }
    } catch (error) {
      console.error('Transaction recording error:', error);
      setTransactionStatus('Failed to record transaction.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConnected, contractUtils, walletData, accountId]);

  // Create traceability record
  const createTraceabilityRecord = useCallback(async (batchData) => {
    if (!isConnected || !contractUtils) {
      setTransactionStatus('Please connect your wallet first.');
      return null;
    }

    try {
      setLoading(true);
      setTransactionStatus('Creating traceability record...');
      
      const result = await contractUtils.createTraceabilityRecord(walletData, accountId, batchData);
      
      if (result.success) {
        setTransactionStatus('Traceability record created successfully!');
        setTimeout(() => setTransactionStatus(''), 5000);
        return result;
      } else {
        setTransactionStatus(`Error: ${result.error}`);
        return null;
      }
    } catch (error) {
      console.error('Traceability record error:', error);
      setTransactionStatus('Failed to create traceability record.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConnected, contractUtils, walletData, accountId]);

  // Process HBAR payment
  const processHBARPayment = useCallback(async (sellerId, amount, orderId) => {
    if (!isConnected || !contractUtils) {
      setTransactionStatus('Please connect your wallet first.');
      return null;
    }

    try {
      setLoading(true);
      setTransactionStatus('Processing HBAR payment...');
      
      // Check balance first
      const hasBalance = await contractUtils.checkBalance(walletData, accountId, amount, "HBAR");
      if (!hasBalance) {
        setTransactionStatus('Insufficient HBAR balance.');
        return null;
      }
      
      const result = await contractUtils.processHBARPayment(walletData, accountId, sellerId, amount, orderId);
      
      if (result.success) {
        setTransactionStatus('Payment processed successfully!');
        setTimeout(() => setTransactionStatus(''), 5000);
        return result;
      } else {
        setTransactionStatus(`Error: ${result.error}`);
        return null;
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setTransactionStatus('Failed to process payment.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConnected, contractUtils, walletData, accountId]);

  // Create escrow
  const createEscrow = useCallback(async (escrowData) => {
    if (!isConnected || !contractUtils) {
      setTransactionStatus('Please connect your wallet first.');
      return null;
    }

    try {
      setLoading(true);
      setTransactionStatus('Creating escrow...');
      
      const result = await contractUtils.createEscrow(walletData, accountId, escrowData);
      
      if (result.success) {
        setTransactionStatus('Escrow created successfully!');
        setTimeout(() => setTransactionStatus(''), 5000);
        return result;
      } else {
        setTransactionStatus(`Error: ${result.error}`);
        return null;
      }
    } catch (error) {
      console.error('Escrow creation error:', error);
      setTransactionStatus('Failed to create escrow.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isConnected, contractUtils, walletData, accountId]);

  // Expose functions to parent component
  useEffect(() => {
    if (onIntegrationComplete && isConnected && contractUtils) {
      onIntegrationComplete({
        recordTransaction,
        createTraceabilityRecord,
        processHBARPayment,
        createEscrow,
        contractUtils,
        accountId,
        isConnected
      });
    }
  }, [onIntegrationComplete, isConnected, contractUtils, recordTransaction, createTraceabilityRecord, processHBARPayment, createEscrow, accountId]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Smart Contract Integration
          </h3>
          <p className="text-gray-600">
            Connect your Hedera wallet to enable blockchain features
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {!isConnected ? (
        <div className="text-center py-8">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              Connect Your Wallet
            </h4>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your Hedera wallet to access blockchain features like transaction recording, 
              traceability, and secure payments.
            </p>
          </div>
          
          <button
            onClick={connectWallet}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
                </svg>
                Connect Wallet
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Connected Wallet Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Wallet Connected
                </p>
                <p className="text-sm text-green-600 font-mono">
                  Account: {accountId}
                </p>
              </div>
            </div>
          </div>

          {/* Blockchain Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 className="font-medium text-blue-800">
                  Transaction Recording
                </h4>
              </div>
              <p className="text-sm text-blue-600">
                All transactions are automatically recorded on the blockchain for transparency
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <h4 className="font-medium text-green-800">
                  Product Traceability
                </h4>
              </div>
              <p className="text-sm text-green-600">
                Track products from farm to consumer with immutable records
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2z" />
                </svg>
                <h4 className="font-medium text-purple-800">
                  Secure Payments
                </h4>
              </div>
              <p className="text-sm text-purple-600">
                Process payments in HBAR or tokens with blockchain verification
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <h4 className="font-medium text-orange-800">
                  Escrow Protection
                </h4>
              </div>
              <p className="text-sm text-orange-600">
                Secure transactions with smart contract escrow for buyer protection
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {transactionStatus && (
        <div className="mt-4">
          <div className={`p-3 rounded-lg border ${
            transactionStatus.includes('Error') || transactionStatus.includes('Failed') 
              ? 'bg-red-50 border-red-200 text-red-700' 
              : transactionStatus.includes('successfully') || transactionStatus.includes('Connected')
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
            <div className="flex items-center">
              {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <p className="text-sm font-medium">
                {transactionStatus}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartContractIntegration;