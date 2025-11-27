import PlantainTraceabilityABI from '../contracts/PlantainTraceabilityABI.json';

export const TRACEABILITY_CONTRACT = {
  address: import.meta.env.VITE_TRACEABILITY_CONTRACT_ADDRESS || PlantainTraceabilityABI.address,
  abi: PlantainTraceabilityABI.abi,
  chainId: parseInt(import.meta.env.VITE_TRACEABILITY_CHAIN_ID || '11155111'),
  explorerUrl: PlantainTraceabilityABI.explorerUrl,
};

// Enum mappings for the contract
export const BatchStatus = {
  0: 'Created',
  1: 'Processed',
  2: 'Distributed',
  3: 'InTransit',
  4: 'Delivered',
  5: 'Sold',
};

export const OrderStatus = {
  0: 'Placed',
  1: 'Confirmed',
  2: 'Processing',
  3: 'Shipped',
  4: 'Delivered',
  5: 'Completed',
  6: 'Cancelled',
  7: 'Refunded',
};

export const DeliveryMode = {
  0: 'Pickup',
  1: 'Standard Delivery',
  2: 'Express Delivery',
  3: 'Same Day Delivery',
};

export const DeliveryStatus = {
  0: 'Pending',
  1: 'Confirmed',
  2: 'Processing',
  3: 'Shipped',
  4: 'In Transit',
  5: 'Out for Delivery',
  6: 'Delivered',
  7: 'Failed',
};

export const UserRole = {
  0: 'None',
  1: 'Farmer',
  2: 'Processor',
  3: 'Distributor',
  4: 'Consumer',
};

export const UserRoleValue = {
  None: 0,
  Farmer: 1,
  Processor: 2,
  Distributor: 3,
  Consumer: 4,
};

export const getExplorerTxUrl = (txHash) => {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
};

export const getExplorerAddressUrl = (address) => {
  return `https://sepolia.etherscan.io/address/${address}`;
};
