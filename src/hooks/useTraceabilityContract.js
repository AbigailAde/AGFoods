import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { TRACEABILITY_CONTRACT, UserRoleValue, getExplorerTxUrl } from '../config/contracts';

export const useTraceabilityContract = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Register user with role
  const registerUser = async (role) => {
    const roleValue = typeof role === 'string' ? UserRoleValue[role] : role;
    return writeContract({
      address: TRACEABILITY_CONTRACT.address,
      abi: TRACEABILITY_CONTRACT.abi,
      functionName: 'registerUser',
      args: [roleValue],
    });
  };

  // Create a new batch (Farmer only)
  const createBatch = async () => {
    return writeContract({
      address: TRACEABILITY_CONTRACT.address,
      abi: TRACEABILITY_CONTRACT.abi,
      functionName: 'createBatch',
    });
  };

  // Add farmer data to batch
  const addFarmerData = async (batchId, data) => {
    return writeContract({
      address: TRACEABILITY_CONTRACT.address,
      abi: TRACEABILITY_CONTRACT.abi,
      functionName: 'addFarmerData',
      args: [
        batchId,
        data.variety,
        BigInt(data.quantity),
        BigInt(Math.floor(new Date(data.harvestDate).getTime() / 1000)),
        data.farmLocation,
        data.qualityNotes || '',
        data.certifications || [],
        data.imageHash || '',
      ],
    });
  };

  // Add processor data to batch
  const addProcessorData = async (batchId, data) => {
    return writeContract({
      address: TRACEABILITY_CONTRACT.address,
      abi: TRACEABILITY_CONTRACT.abi,
      functionName: 'addProcessorData',
      args: [
        batchId,
        data.facilityLocation,
        BigInt(data.inputQuantity),
        BigInt(data.outputQuantity),
        data.qualityGrade,
        data.processingNotes || '',
        BigInt(data.moistureContent || 0),
        BigInt(data.purityLevel || 0),
      ],
    });
  };

  // Add distributor data to batch
  const addDistributorData = async (batchId, data) => {
    return writeContract({
      address: TRACEABILITY_CONTRACT.address,
      abi: TRACEABILITY_CONTRACT.abi,
      functionName: 'addDistributorData',
      args: [
        batchId,
        data.warehouseLocation,
        data.storageConditions,
        BigInt(data.quantity),
      ],
    });
  };

  // Create order
  const createOrder = async (batchId, seller, quantity, price) => {
    return writeContract({
      address: TRACEABILITY_CONTRACT.address,
      abi: TRACEABILITY_CONTRACT.abi,
      functionName: 'createOrder',
      args: [batchId, seller, BigInt(quantity), BigInt(price)],
    });
  };

  // Set delivery mode
  const setDeliveryMode = async (orderId, mode, address, recipientName) => {
    return writeContract({
      address: TRACEABILITY_CONTRACT.address,
      abi: TRACEABILITY_CONTRACT.abi,
      functionName: 'setDeliveryMode',
      args: [orderId, mode, address, recipientName],
    });
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    return writeContract({
      address: TRACEABILITY_CONTRACT.address,
      abi: TRACEABILITY_CONTRACT.abi,
      functionName: 'updateOrderStatus',
      args: [orderId, newStatus],
    });
  };

  // Update delivery status
  const updateDeliveryStatus = async (orderId, data) => {
    return writeContract({
      address: TRACEABILITY_CONTRACT.address,
      abi: TRACEABILITY_CONTRACT.abi,
      functionName: 'updateDeliveryStatus',
      args: [
        orderId,
        data.status,
        data.carrier || '',
        data.trackingNumber || '',
        BigInt(data.estimatedDelivery || 0),
        data.notes || '',
      ],
    });
  };

  // Confirm delivery
  const confirmDelivery = async (orderId) => {
    return writeContract({
      address: TRACEABILITY_CONTRACT.address,
      abi: TRACEABILITY_CONTRACT.abi,
      functionName: 'confirmDelivery',
      args: [orderId],
    });
  };

  return {
    // Write functions
    registerUser,
    createBatch,
    addFarmerData,
    addProcessorData,
    addDistributorData,
    createOrder,
    setDeliveryMode,
    updateOrderStatus,
    updateDeliveryStatus,
    confirmDelivery,
    // Transaction state
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
    txUrl: hash ? getExplorerTxUrl(hash) : null,
  };
};

// Read hooks
export const useUserRole = (address) => {
  return useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'getUserRole',
    args: [address],
    enabled: !!address,
  });
};

export const useBatchDetails = (batchId) => {
  return useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'getBatchDetails',
    args: [batchId],
    enabled: !!batchId,
  });
};

export const useBatchHistory = (batchId) => {
  return useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'getBatchHistory',
    args: [batchId],
    enabled: !!batchId,
  });
};

export const useOrderDetails = (orderId) => {
  return useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'getOrderDetails',
    args: [orderId],
    enabled: !!orderId,
  });
};

export const useUserBatches = (address) => {
  return useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'getUserBatches',
    args: [address],
    enabled: !!address,
  });
};

export const useUserOrders = (address) => {
  return useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'getUserOrders',
    args: [address],
    enabled: !!address,
  });
};

export const useTrackDelivery = (orderId) => {
  return useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'trackDelivery',
    args: [orderId],
    enabled: !!orderId,
  });
};

export const useAllBatches = () => {
  return useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'getAllBatches',
  });
};

export const useTotalBatches = () => {
  return useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'totalBatches',
  });
};

export const useTotalOrders = () => {
  return useReadContract({
    address: TRACEABILITY_CONTRACT.address,
    abi: TRACEABILITY_CONTRACT.abi,
    functionName: 'totalOrders',
  });
};

export default useTraceabilityContract;
