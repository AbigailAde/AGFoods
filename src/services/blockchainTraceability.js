/**
 * Blockchain Traceability Service
 * Integrates with the PlantainTraceability smart contract
 * Works alongside existing localStorage-based traceability
 */

import { TRACEABILITY_CONTRACT, getExplorerTxUrl, UserRoleValue } from '../config/contracts';

// Store blockchain batch mappings (localStorage batchId -> blockchain batchId)
const BLOCKCHAIN_BATCHES_KEY = 'blockchain_batch_mappings';
const BLOCKCHAIN_ORDERS_KEY = 'blockchain_order_mappings';

// Get stored mappings
export const getBlockchainBatchMapping = (localBatchId) => {
  const mappings = JSON.parse(localStorage.getItem(BLOCKCHAIN_BATCHES_KEY) || '{}');
  return mappings[localBatchId] || null;
};

export const setBlockchainBatchMapping = (localBatchId, blockchainBatchId, txHash) => {
  const mappings = JSON.parse(localStorage.getItem(BLOCKCHAIN_BATCHES_KEY) || '{}');
  mappings[localBatchId] = {
    blockchainBatchId,
    txHash,
    explorerUrl: getExplorerTxUrl(txHash),
    recordedAt: new Date().toISOString()
  };
  localStorage.setItem(BLOCKCHAIN_BATCHES_KEY, JSON.stringify(mappings));
};

export const getBlockchainOrderMapping = (localOrderId) => {
  const mappings = JSON.parse(localStorage.getItem(BLOCKCHAIN_ORDERS_KEY) || '{}');
  return mappings[localOrderId] || null;
};

export const setBlockchainOrderMapping = (localOrderId, blockchainOrderId, txHash) => {
  const mappings = JSON.parse(localStorage.getItem(BLOCKCHAIN_ORDERS_KEY) || '{}');
  mappings[localOrderId] = {
    blockchainOrderId,
    txHash,
    explorerUrl: getExplorerTxUrl(txHash),
    recordedAt: new Date().toISOString()
  };
  localStorage.setItem(BLOCKCHAIN_ORDERS_KEY, JSON.stringify(mappings));
};

// Check if user is registered on blockchain
export const isUserRegisteredOnChain = (userRole) => {
  const registrations = JSON.parse(localStorage.getItem('blockchain_user_registrations') || '{}');
  return registrations[userRole] || null;
};

export const setUserRegisteredOnChain = (address, role, txHash) => {
  const registrations = JSON.parse(localStorage.getItem('blockchain_user_registrations') || '{}');
  registrations[address] = {
    role,
    txHash,
    explorerUrl: getExplorerTxUrl(txHash),
    registeredAt: new Date().toISOString()
  };
  localStorage.setItem('blockchain_user_registrations', JSON.stringify(registrations));
};

// Get role value for contract
export const getRoleValue = (role) => {
  const roleMap = {
    'farmer': UserRoleValue.Farmer,
    'processor': UserRoleValue.Processor,
    'distributor': UserRoleValue.Distributor,
    'consumer': UserRoleValue.Consumer
  };
  return roleMap[role?.toLowerCase()] || UserRoleValue.Consumer;
};

// Format batch data for contract
export const formatBatchDataForContract = (batch, user) => {
  return {
    variety: batch.variety || 'Unknown',
    quantity: parseInt(batch.quantity) || 0,
    harvestDate: batch.harvestDate,
    farmLocation: user?.location || batch.location || 'Farm Location',
    qualityNotes: batch.qualityNotes || '',
    certifications: batch.certifications || [],
    imageHash: batch.image ? `ipfs://${batch.id}` : '' // Placeholder for IPFS
  };
};

// Format processor data for contract
export const formatProcessorDataForContract = (processingData, batch) => {
  return {
    facilityLocation: processingData.facilityLocation || 'Processing Facility',
    inputQuantity: parseInt(processingData.inputQuantity || batch?.quantity) || 0,
    outputQuantity: parseInt(processingData.outputQuantity || processingData.expectedYield) || 0,
    qualityGrade: processingData.qualityGrade || 'A',
    processingNotes: processingData.processingNotes || '',
    moistureContent: parseInt(processingData.moistureContent) || 12,
    purityLevel: parseInt(processingData.purityLevel) || 95
  };
};

// Format distributor data for contract
export const formatDistributorDataForContract = (distributorData) => {
  return {
    warehouseLocation: distributorData.warehouseLocation || 'Warehouse',
    storageConditions: distributorData.storageConditions || 'Standard storage',
    quantity: parseInt(distributorData.quantity) || 0
  };
};

// Get all blockchain-recorded batches for display
export const getAllBlockchainBatches = () => {
  return JSON.parse(localStorage.getItem(BLOCKCHAIN_BATCHES_KEY) || '{}');
};

// Get contract address and explorer URL
export const getContractInfo = () => {
  return {
    address: TRACEABILITY_CONTRACT.address,
    explorerUrl: TRACEABILITY_CONTRACT.explorerUrl,
    chainId: TRACEABILITY_CONTRACT.chainId
  };
};

export default {
  getBlockchainBatchMapping,
  setBlockchainBatchMapping,
  getBlockchainOrderMapping,
  setBlockchainOrderMapping,
  isUserRegisteredOnChain,
  setUserRegisteredOnChain,
  getRoleValue,
  formatBatchDataForContract,
  formatProcessorDataForContract,
  formatDistributorDataForContract,
  getAllBlockchainBatches,
  getContractInfo
};
