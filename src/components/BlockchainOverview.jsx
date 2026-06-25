/**
 * BlockchainOverview Component
 * Shows a summary of blockchain integration status and statistics
 */

import React from 'react';
import { useAccount } from 'wagmi';
import { Link, Shield, CheckCircle, Clock, ExternalLink, Database, Activity } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { TRACEABILITY_CONTRACT, getExplorerAddressUrl } from '../config/contracts';
import { getAllBlockchainBatches, getContractInfo } from '../services/blockchainTraceability';

const BlockchainOverview = () => {
  const { address, isConnected } = useAccount();
  const contractInfo = getContractInfo();
  const blockchainBatches = getAllBlockchainBatches();
  const batchCount = Object.keys(blockchainBatches).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Link className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Blockchain Integration</h3>
            <p className="text-sm text-gray-500">Sepolia Testnet</p>
          </div>
        </div>
        {isConnected ? (
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            Connected
          </span>
        ) : (
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <button
                onClick={openConnectModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">On-Chain Batches</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{batchCount}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Network</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">Sepolia</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Contract</span>
          </div>
          <p className="text-sm font-mono text-gray-900 truncate">
            {contractInfo.address?.slice(0, 10)}...
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Status</span>
          </div>
          <p className="text-lg font-semibold text-green-600">Active</p>
        </div>
      </div>

      {/* Contract Info */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Smart Contract Details</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Contract Address:</span>
            <a
              href={getExplorerAddressUrl(contractInfo.address)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-blue-600 hover:text-blue-800 font-mono"
            >
              {contractInfo.address?.slice(0, 8)}...{contractInfo.address?.slice(-6)}
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Chain ID:</span>
            <span className="text-gray-900">{contractInfo.chainId}</span>
          </div>
          {isConnected && address && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Your Address:</span>
              <span className="text-gray-900 font-mono">
                {address.slice(0, 8)}...{address.slice(-6)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Recent Blockchain Activity */}
      {batchCount > 0 && (
        <div className="border-t mt-4 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Recent On-Chain Records</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.entries(blockchainBatches).slice(0, 5).map(([localId, data]) => (
              <div key={localId} className="flex items-center justify-between text-sm bg-gray-50 rounded p-2">
                <span className="text-gray-600 font-mono">{localId}</span>
                <a
                  href={data.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  View TX
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>How it works:</strong> When you create batches, process products, or manage orders, 
          the data is automatically recorded on the Ethereum blockchain (Sepolia testnet) for 
          permanent, tamper-proof traceability.
        </p>
      </div>
    </div>
  );
};

export default BlockchainOverview;
