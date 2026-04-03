/**
 * useBlockchainIntegration Hook
 * Seamlessly integrates blockchain recording with existing localStorage operations
 * Records data on-chain without disrupting the app's core functionality
 */

import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { keccak256, toBytes, encodeAbiParameters, parseAbiParameters, decodeEventLog } from 'viem';
import { TRACEABILITY_CONTRACT, UserRoleValue, getExplorerTxUrl } from '../config/contracts';
import {
  setBlockchainBatchMapping,
  setBlockchainOrderMapping,
  getBlockchainBatchMapping,
  setUserRegisteredOnChain,
  isUserRegisteredOnChain,
} from '../services/blockchainTraceability';

// Generate a deterministic batch ID from local batch ID
const generateBatchId = (localBatchId) => {
  return keccak256(toBytes(localBatchId));
};

// Generate order ID
const generateOrderId = (localOrderId) => {
  return keccak256(toBytes(localOrderId));
};

export const useBlockchainIntegration = () => {
  const { address, isConnected } = useAccount();
  const [pendingTx, setPendingTx] = useState(null);
  const [error, setError] = useState(null);

  const { writeContractAsync } = useWriteContract();

  // Check user role on chain
  const { data: userRole } = useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'getUserRole',
    args: [address],
    enabled: !!address && isConnected,
  });

  const publicClient = usePublicClient();

  // Register user on blockchain
  const registerUser = useCallback(async (role) => {
    if (!isConnected || !address) {
      console.log('Wallet not connected, skipping blockchain registration');
      return { success: false, reason: 'wallet_not_connected' };
    }

    try {
      const roleValue = UserRoleValue[role] || UserRoleValue.Consumer;
      
      const hash = await writeContractAsync({
        address: TRACEABILITY_CONTRACT.address,
        abi: TRACEABILITY_CONTRACT.abi,
        functionName: 'registerUser',
        args: [roleValue],
      });

      setPendingTx(hash);
      setUserRegisteredOnChain(address, role, hash);
      
      return { 
        success: true, 
        txHash: hash, 
        explorerUrl: getExplorerTxUrl(hash) 
      };
    } catch (err) {
      console.error('Blockchain registration error:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, [isConnected, address, writeContractAsync]);

  // Record batch creation on blockchain (for Farmers)
  const recordBatchOnChain = useCallback(async (localBatch, userData) => {
    if (!isConnected || !address) {
      console.log('Wallet not connected, batch saved locally only');
      return { success: false, reason: 'wallet_not_connected', localOnly: true };
    }

    try {
      // First create the batch on chain
      const createHash = await writeContractAsync({
        address: TRACEABILITY_CONTRACT.address,
        abi: TRACEABILITY_CONTRACT.abi,
        functionName: 'createBatch',
      });

      setPendingTx(createHash);
      
      // Wait for the createBatch transaction to be mined so the state exists
      // before we try to add farmer data (otherwise gas estimation for addFarmerData fails)
      const receipt = await publicClient.waitForTransactionReceipt({ hash: createHash });

      // Generate batch ID for farmer data as a fallback (Wait, if the contract generates one randomly, we should extract it from logs)
      let batchId = generateBatchId(localBatch.id);
      
      // Try to get the actual emitted batchId from the BatchCreated event if possible
      try {
        console.log("Analyzing receipt logs for createBatch:", receipt.logs);
        let foundEvent = false;
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: TRACEABILITY_CONTRACT.abi,
              data: log.data,
              topics: log.topics,
            });
            console.log("Decoded log:", decoded);
            if (decoded.eventName === 'BatchCreated') {
              batchId = decoded.args.batchId;
              foundEvent = true;
              console.log("SUCCESSFULLY extracted batchId from event:", batchId);
              break;
            }
          } catch (e) {
            // parse errors just mean it's not the event we want
          }
        }
        if (!foundEvent) {
          console.warn("BatchCreated event NOT found in logs! Falling back to local batch ID. This may cause revert!");
        }
      } catch (e) {
        console.warn('Could not parse BatchCreated event:', e);
      }
      
      console.log("Calling addFarmerData with batchId:", batchId);
      // Add farmer data
      const farmerDataHash = await writeContractAsync({
        address: TRACEABILITY_CONTRACT.address,
        abi: TRACEABILITY_CONTRACT.abi,
        functionName: 'addFarmerData',
        gas: 10000000n, // explicit gas to prevent 21M fallback which blows the Sepolia cap
        args: [
          batchId,
          localBatch.variety || 'Unknown',
          BigInt(parseInt(localBatch.quantity) || 0),
          BigInt(Math.floor(new Date(localBatch.harvestDate).getTime() / 1000)),
          userData?.location || 'Farm Location',
          localBatch.qualityNotes || '',
          localBatch.certifications || [],
          localBatch.image ? `local://${localBatch.id}` : '',
        ],
      });

      // Store mapping so subsequent processors/distributors know the correct on-chain batchId!
      setBlockchainBatchMapping(localBatch.id, batchId, farmerDataHash);

      return {
        success: true,
        batchId,
        txHash: farmerDataHash,
        explorerUrl: getExplorerTxUrl(farmerDataHash),
      };
    } catch (err) {
      console.error('Blockchain batch recording error:', err);
      setError(err.message);
      return { success: false, error: err.message, localOnly: true };
    }
  }, [isConnected, address, writeContractAsync, publicClient]);

  // Record processing data on blockchain (for Processors)
  const recordProcessingOnChain = useCallback(async (localBatchId, processingData, userData) => {
    if (!isConnected || !address) {
      console.log('Wallet not connected, processing saved locally only');
      return { success: false, reason: 'wallet_not_connected', localOnly: true };
    }

    try {
      const mapping = getBlockchainBatchMapping(localBatchId);
      const batchId = mapping?.blockchainBatchId || generateBatchId(localBatchId);
      
      const hash = await writeContractAsync({
        address: TRACEABILITY_CONTRACT.address,
        abi: TRACEABILITY_CONTRACT.abi,
        functionName: 'addProcessorData',
        gas: 10000000n,
        args: [
          batchId,
          userData?.location || 'Processing Facility',
          BigInt(parseInt(processingData.inputQuantity) || 0),
          BigInt(parseInt(processingData.expectedYield || processingData.outputQuantity) || 0),
          processingData.qualityGrade || 'A',
          processingData.processingNotes || '',
          BigInt(parseInt(processingData.moistureContent) || 12),
          BigInt(parseInt(processingData.purityLevel) || 95),
        ],
      });

      setPendingTx(hash);

      return {
        success: true,
        batchId,
        txHash: hash,
        explorerUrl: getExplorerTxUrl(hash),
      };
    } catch (err) {
      console.error('Blockchain processing recording error:', err);
      setError(err.message);
      return { success: false, error: err.message, localOnly: true };
    }
  }, [isConnected, address, writeContractAsync]);

  // Record distribution data on blockchain (for Distributors)
  const recordDistributionOnChain = useCallback(async (localBatchId, distributionData, userData) => {
    if (!isConnected || !address) {
      console.log('Wallet not connected, distribution saved locally only');
      return { success: false, reason: 'wallet_not_connected', localOnly: true };
    }

    try {
      const mapping = getBlockchainBatchMapping(localBatchId);
      const batchId = mapping?.blockchainBatchId || generateBatchId(localBatchId);
      
      const hash = await writeContractAsync({
        address: TRACEABILITY_CONTRACT.address,
        abi: TRACEABILITY_CONTRACT.abi,
        functionName: 'addDistributorData',
        gas: 10000000n,
        args: [
          batchId,
          userData?.location || distributionData.destination || 'Warehouse',
          distributionData.storageConditions || 'Standard storage',
          BigInt(parseInt(distributionData.quantity) || 0),
        ],
      });

      setPendingTx(hash);

      return {
        success: true,
        batchId,
        txHash: hash,
        explorerUrl: getExplorerTxUrl(hash),
      };
    } catch (err) {
      console.error('Blockchain distribution recording error:', err);
      setError(err.message);
      return { success: false, error: err.message, localOnly: true };
    }
  }, [isConnected, address, writeContractAsync]);

  // Record order on blockchain (for Consumers/Buyers)
  const recordOrderOnChain = useCallback(async (localOrder, batchId, sellerAddress) => {
    if (!isConnected || !address) {
      console.log('Wallet not connected, order saved locally only');
      return { success: false, reason: 'wallet_not_connected', localOnly: true };
    }

    try {
      const mapping = getBlockchainBatchMapping(batchId);
      const blockchainBatchId = mapping?.blockchainBatchId || generateBatchId(batchId);
      const seller = sellerAddress || address; // Default to self if no seller
      
      const hash = await writeContractAsync({
        address: TRACEABILITY_CONTRACT.address,
        abi: TRACEABILITY_CONTRACT.abi,
        functionName: 'createOrder',
        gas: 10000000n,
        args: [
          blockchainBatchId,
          seller,
          BigInt(parseInt(localOrder.quantity) || 1),
          BigInt(parseInt(localOrder.totalPrice || localOrder.price) || 0),
        ],
      });

      const orderId = generateOrderId(localOrder.id);
      setBlockchainOrderMapping(localOrder.id, orderId, hash);
      setPendingTx(hash);

      return {
        success: true,
        orderId,
        txHash: hash,
        explorerUrl: getExplorerTxUrl(hash),
      };
    } catch (err) {
      console.error('Blockchain order recording error:', err);
      setError(err.message);
      return { success: false, error: err.message, localOnly: true };
    }
  }, [isConnected, address, writeContractAsync]);

  // Update delivery status on blockchain
  const updateDeliveryOnChain = useCallback(async (localOrderId, deliveryData) => {
    if (!isConnected || !address) {
      return { success: false, reason: 'wallet_not_connected', localOnly: true };
    }

    try {
      const orderId = generateOrderId(localOrderId);
      
      const hash = await writeContractAsync({
        address: TRACEABILITY_CONTRACT.address,
        abi: TRACEABILITY_CONTRACT.abi,
        functionName: 'updateDeliveryStatus',
        gas: 10000000n,
        args: [
          orderId,
          deliveryData.status || 0,
          deliveryData.carrier || '',
          deliveryData.trackingNumber || '',
          BigInt(deliveryData.estimatedDelivery || 0),
          deliveryData.notes || '',
        ],
      });

      setPendingTx(hash);

      return {
        success: true,
        txHash: hash,
        explorerUrl: getExplorerTxUrl(hash),
      };
    } catch (err) {
      console.error('Blockchain delivery update error:', err);
      setError(err.message);
      return { success: false, error: err.message, localOnly: true };
    }
  }, [isConnected, address, writeContractAsync]);

  // Confirm delivery on blockchain
  const confirmDeliveryOnChain = useCallback(async (localOrderId) => {
    if (!isConnected || !address) {
      return { success: false, reason: 'wallet_not_connected', localOnly: true };
    }

    try {
      const orderId = generateOrderId(localOrderId);
      
      const hash = await writeContractAsync({
        address: TRACEABILITY_CONTRACT.address,
        abi: TRACEABILITY_CONTRACT.abi,
        functionName: 'confirmDelivery',
        gas: 10000000n,
        args: [orderId],
      });

      setPendingTx(hash);

      return {
        success: true,
        txHash: hash,
        explorerUrl: getExplorerTxUrl(hash),
      };
    } catch (err) {
      console.error('Blockchain delivery confirmation error:', err);
      setError(err.message);
      return { success: false, error: err.message, localOnly: true };
    }
  }, [isConnected, address, writeContractAsync]);

  return {
    // Connection state
    isConnected,
    address,
    userRole,
    
    // Transaction state
    pendingTx,
    error,
    clearError: () => setError(null),
    
    // Actions
    registerUser,
    recordBatchOnChain,
    recordProcessingOnChain,
    recordDistributionOnChain,
    recordOrderOnChain,
    updateDeliveryOnChain,
    confirmDeliveryOnChain,
    
    // Utilities
    generateBatchId,
    generateOrderId,
    getBlockchainBatchMapping,
  };
};

export default useBlockchainIntegration;
