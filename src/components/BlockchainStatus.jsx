/**
 * BlockchainStatus Component
 * Shows blockchain recording status for batches and orders
 */

import React from 'react';
import { Link, CheckCircle, Clock, ExternalLink, Shield } from 'lucide-react';
import { getBlockchainBatchMapping, getBlockchainOrderMapping } from '../services/blockchainTraceability';

const BlockchainStatus = ({ 
  itemId, 
  type = 'batch', // 'batch' or 'order'
  compact = false,
  showExplorerLink = true 
}) => {
  const mapping = type === 'batch' 
    ? getBlockchainBatchMapping(itemId)
    : getBlockchainOrderMapping(itemId);

  if (!mapping) {
    if (compact) {
      return (
        <span className="inline-flex items-center text-gray-400 text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Local only
        </span>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 text-gray-500 text-sm">
        <Clock className="w-4 h-4" />
        <span>Not recorded on blockchain</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <span className="inline-flex items-center text-green-600 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          On-chain
        </span>
        {showExplorerLink && mapping.explorerUrl && (
          <a
            href={mapping.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">Blockchain Verified</p>
            <p className="text-xs text-green-600">
              Recorded: {new Date(mapping.recordedAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {showExplorerLink && mapping.explorerUrl && (
          <a
            href={mapping.explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View on Etherscan
          </a>
        )}
      </div>
      {mapping.txHash && (
        <p className="mt-2 text-xs text-green-600 font-mono truncate">
          TX: {mapping.txHash.slice(0, 10)}...{mapping.txHash.slice(-8)}
        </p>
      )}
    </div>
  );
};

export default BlockchainStatus;
