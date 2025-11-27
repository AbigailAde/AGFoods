/**
 * BlockchainRecordButton Component
 * A reusable button that records data to the blockchain
 * Shows transaction status and links to explorer
 */

import React, { useState } from 'react';
import { Link, CheckCircle, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const BlockchainRecordButton = ({
  onRecord,
  recordedTxHash,
  explorerUrl,
  label = 'Record on Blockchain',
  recordedLabel = 'Recorded on Chain',
  size = 'sm',
  variant = 'primary',
  disabled = false,
  showConnectPrompt = true,
}) => {
  const { isConnected } = useAccount();
  const [isRecording, setIsRecording] = useState(false);
  const [txResult, setTxResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRecord = async () => {
    if (!onRecord) return;
    
    setIsRecording(true);
    setError(null);
    
    try {
      const result = await onRecord();
      setTxResult(result);
      
      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRecording(false);
    }
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
  };

  // Already recorded
  if (recordedTxHash || txResult?.success) {
    const url = explorerUrl || txResult?.explorerUrl;
    return (
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center text-green-600 text-sm">
          <CheckCircle className="w-4 h-4 mr-1" />
          {recordedLabel}
        </span>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View
          </a>
        )}
      </div>
    );
  }

  // Not connected - show connect prompt
  if (!isConnected && showConnectPrompt) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-gray-500 text-sm">Connect wallet to record</span>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className={`inline-flex items-center rounded-md font-medium transition-colors ${sizeClasses[size]} ${variantClasses.outline}`}
            >
              <Link className="w-4 h-4 mr-1" />
              Connect
            </button>
          )}
        </ConnectButton.Custom>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span className="truncate max-w-[200px]">{error}</span>
        </div>
        <button
          onClick={handleRecord}
          disabled={disabled || isRecording}
          className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${sizeClasses[size]} ${variantClasses[variant]} disabled:opacity-50`}
        >
          Retry
        </button>
      </div>
    );
  }

  // Default state - ready to record
  return (
    <button
      onClick={handleRecord}
      disabled={disabled || isRecording || !isConnected}
      className={`inline-flex items-center justify-center rounded-md font-medium transition-colors ${sizeClasses[size]} ${variantClasses[variant]} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isRecording ? (
        <>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          Recording...
        </>
      ) : (
        <>
          <Link className="w-4 h-4 mr-1" />
          {label}
        </>
      )}
    </button>
  );
};

export default BlockchainRecordButton;
