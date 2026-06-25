import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useWalletClient, usePublicClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import SmartContractUtils from './smartContractUtils';

const SmartContractIntegration = ({ onIntegrationComplete }) => {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  
  const [contractUtils, setContractUtils] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize contract utils when wallet connects
  useEffect(() => {
    if (isConnected && walletClient && address) {
      initializeContractUtils();
    }
  }, [isConnected, walletClient, address]);

  const initializeContractUtils = async () => {
    setIsInitializing(true);
    try {
      const utils = new SmartContractUtils(walletClient, publicClient, address);
      setContractUtils(utils);

      // Create integration object
      const integration = {
        isConnected: true,
        accountId: address,
        walletData: walletClient,
        contractUtils: utils,
        balance: balance?.formatted || '0',
        chain: chain,
        // Methods
        processHBARPayment: async (sellerId, amount, orderId) => {
          return utils.processHBARPayment(walletClient, address, sellerId, amount, orderId);
        },
        createEscrow: async (escrowData) => {
          return utils.createEscrow(walletClient, address, escrowData);
        },
        createTraceabilityRecord: async (batchData) => {
          return utils.createTraceabilityRecord(walletClient, address, batchData);
        },
        recordTransaction: async (txData) => {
          return utils.recordTransaction(walletClient, address, txData);
        },
      };

      if (onIntegrationComplete) {
        onIntegrationComplete(integration);
      }
    } catch (error) {
      console.error('Error initializing contract utils:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  // Notify parent when disconnected
  useEffect(() => {
    if (!isConnected && onIntegrationComplete) {
      onIntegrationComplete(null);
    }
  }, [isConnected]);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blockchain Connection</h2>
          <p className="text-gray-600 text-sm">Connect your wallet to use smart contract features</p>
        </div>
        <ConnectButton />
      </div>

      {isConnected ? (
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-700 font-medium">Wallet Connected</span>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Address</p>
              <p className="font-mono text-sm text-gray-900 truncate" title={address}>
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Network</p>
              <p className="font-medium text-gray-900">{chain?.name || 'Unknown'}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Balance</p>
              <p className="font-medium text-gray-900">
                {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}
              </p>
            </div>
          </div>

          {/* Initialization Status */}
          {isInitializing && (
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
              <svg className="animate-spin h-5 w-5 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-blue-700">Initializing smart contract connection...</span>
            </div>
          )}

          {contractUtils && !isInitializing && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">
                ✓ Smart contract utilities ready. You can now use blockchain features.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
          <p className="text-gray-600 text-sm max-w-md mx-auto mb-4">
            Connect your wallet to access HBAR payments, escrow services, and blockchain-based product traceability.
          </p>
        </div>
      )}
    </div>
  );
};

export default SmartContractIntegration;
