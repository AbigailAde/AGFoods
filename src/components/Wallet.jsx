import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useDisconnect } from 'wagmi';

const Wallet = () => {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Wallet Connection</h1>
          
          {/* RainbowKit Connect Button */}
          <div className="flex justify-center mb-8">
            <ConnectButton />
          </div>

          {/* Wallet Details */}
          {isConnected && (
            <div className="space-y-6">
              {/* Connection Status */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-700 font-medium">Connected</span>
                </div>
              </div>

              {/* Account Info */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Account Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <p className="font-mono text-sm text-gray-900 break-all">{address}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-gray-500 mb-1">Network</p>
                    <p className="font-medium text-gray-900">{chain?.name || 'Unknown'}</p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-gray-500 mb-1">Balance</p>
                    <p className="font-medium text-gray-900">
                      {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : 'Loading...'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm text-gray-500 mb-1">Chain ID</p>
                    <p className="font-medium text-gray-900">{chain?.id || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end">
                <button
                  onClick={() => disconnect()}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Disconnect Wallet
                </button>
              </div>
            </div>
          )}

          {/* Not Connected State */}
          {!isConnected && (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Wallet Connected</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Connect your wallet to access blockchain features like HBAR payments, escrow, and product traceability.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;
