import { parseEther, formatEther } from 'viem';

class SmartContractUtils {
  constructor(walletClient, publicClient, address) {
    this.walletClient = walletClient;
    this.publicClient = publicClient;
    this.address = address;
    this.transactions = [];
    this.escrows = new Map();
    this.traceabilityRecords = new Map();
  }

  // Process HBAR/ETH Payment
  async processHBARPayment(walletClient, senderAddress, sellerId, amount, orderId) {
    try {
      // Convert amount to wei (assuming amount is in the native currency)
      const value = parseEther(amount.toString());

      // Send transaction
      const hash = await walletClient.sendTransaction({
        to: sellerId,
        value: value,
      });

      // Wait for confirmation
      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      // Record transaction
      const txRecord = {
        transactionId: hash,
        orderId,
        from: senderAddress,
        to: sellerId,
        amount,
        status: receipt.status === 'success' ? 'SUCCESS' : 'FAILED',
        timestamp: Date.now(),
        type: 'PAYMENT',
      };

      this.transactions.push(txRecord);
      this.saveTransactionsToStorage();

      return {
        success: receipt.status === 'success',
        transactionId: hash,
        status: receipt.status,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      console.error('Payment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create Escrow
  async createEscrow(walletClient, buyerAddress, escrowData) {
    try {
      const escrowId = `ESCROW-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const value = parseEther(escrowData.amount.toString());

      // In a real implementation, this would interact with an escrow smart contract
      // For demo purposes, we simulate the escrow creation
      const hash = await walletClient.sendTransaction({
        to: escrowData.sellerId,
        value: value,
        data: '0x', // Would include escrow contract call data
      });

      const receipt = await this.publicClient.waitForTransactionReceipt({ hash });

      const escrowRecord = {
        escrowId,
        transactionId: hash,
        orderId: escrowData.orderId,
        buyer: buyerAddress,
        seller: escrowData.sellerId,
        amount: escrowData.amount,
        productDetails: escrowData.productDetails,
        deliveryTerms: escrowData.deliveryTerms,
        conditions: escrowData.conditions,
        status: 'ACTIVE',
        createdAt: Date.now(),
        releasedAt: null,
      };

      this.escrows.set(escrowId, escrowRecord);
      this.saveEscrowsToStorage();

      return {
        success: receipt.status === 'success',
        escrowId,
        transactionId: hash,
        status: 'ACTIVE',
      };
    } catch (error) {
      console.error('Escrow creation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Release Escrow
  async releaseEscrow(walletClient, escrowId, releaserAddress) {
    try {
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        return { success: false, error: 'Escrow not found' };
      }

      if (escrow.status !== 'ACTIVE') {
        return { success: false, error: 'Escrow is not active' };
      }

      // Update escrow status
      escrow.status = 'RELEASED';
      escrow.releasedAt = Date.now();
      escrow.releasedBy = releaserAddress;

      this.escrows.set(escrowId, escrow);
      this.saveEscrowsToStorage();

      return {
        success: true,
        escrowId,
        status: 'RELEASED',
      };
    } catch (error) {
      console.error('Escrow release error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create Traceability Record
  async createTraceabilityRecord(walletClient, creatorAddress, batchData) {
    try {
      const batchId = batchData.batchId || `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a hash of the batch data for blockchain storage
      const dataHash = this.hashData(batchData);

      // In production, this would store the hash on-chain
      // For demo, we simulate the transaction
      const record = {
        batchId,
        transactionId: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
        blockchainHash: dataHash,
        creator: creatorAddress,
        productType: batchData.productType,
        origin: batchData.origin,
        processingLocation: batchData.processingLocation,
        harvestDate: batchData.harvestDate,
        certifications: batchData.certifications,
        qualityMetrics: batchData.qualityMetrics,
        environmentalData: batchData.environmentalData,
        processingSteps: batchData.processingSteps || [],
        history: [],
        createdAt: Date.now(),
      };

      this.traceabilityRecords.set(batchId, record);
      this.saveTraceabilityToStorage();

      return {
        success: true,
        batchId,
        transactionId: record.transactionId,
        blockchainHash: dataHash,
      };
    } catch (error) {
      console.error('Traceability record creation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update Traceability Record
  async updateTraceabilityRecord(walletClient, updaterAddress, batchId, updateData) {
    try {
      const record = this.traceabilityRecords.get(batchId);
      if (!record) {
        return { success: false, error: 'Traceability record not found' };
      }

      const historyEntry = {
        timestamp: updateData.timestamp || Date.now(),
        stage: updateData.stage,
        location: updateData.location,
        handler: updateData.handler,
        updatedBy: updaterAddress,
        transactionId: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
        actions: updateData.actions || [],
        qualityChecks: updateData.qualityChecks || {},
      };

      record.history.push(historyEntry);
      record.lastUpdated = Date.now();

      this.traceabilityRecords.set(batchId, record);
      this.saveTraceabilityToStorage();

      return {
        success: true,
        batchId,
        transactionId: historyEntry.transactionId,
      };
    } catch (error) {
      console.error('Traceability update error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Record Transaction
  async recordTransaction(walletClient, address, txData) {
    try {
      const txRecord = {
        transactionId: `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`,
        ...txData,
        recordedBy: address,
        recordedAt: Date.now(),
      };

      this.transactions.push(txRecord);
      this.saveTransactionsToStorage();

      return {
        success: true,
        transactionId: txRecord.transactionId,
      };
    } catch (error) {
      console.error('Transaction recording error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get Transaction History
  async getTransactionHistory(address) {
    try {
      this.loadTransactionsFromStorage();
      const userTransactions = this.transactions.filter(
        tx => tx.from === address || tx.to === address || tx.recordedBy === address
      );

      return {
        success: true,
        transactions: userTransactions.map(tx => ({
          transactionId: tx.transactionId,
          type: tx.type || 'TRANSACTION',
          consensusTimestamp: tx.timestamp || tx.recordedAt,
          result: tx.status || 'SUCCESS',
          ...tx,
        })),
      };
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return {
        success: false,
        transactions: [],
        error: error.message,
      };
    }
  }

  // Generate Traceability QR Data
  generateTraceabilityQR(batchId, transactionId) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/verify/${batchId}?tx=${transactionId}`;
  }

  // Helper: Hash data
  hashData(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
  }

  // Storage helpers
  saveTransactionsToStorage() {
    localStorage.setItem('blockchain_transactions', JSON.stringify(this.transactions));
  }

  loadTransactionsFromStorage() {
    const stored = localStorage.getItem('blockchain_transactions');
    if (stored) {
      this.transactions = JSON.parse(stored);
    }
  }

  saveEscrowsToStorage() {
    localStorage.setItem('blockchain_escrows', JSON.stringify(Array.from(this.escrows.entries())));
  }

  loadEscrowsFromStorage() {
    const stored = localStorage.getItem('blockchain_escrows');
    if (stored) {
      this.escrows = new Map(JSON.parse(stored));
    }
  }

  saveTraceabilityToStorage() {
    localStorage.setItem('blockchain_traceability', JSON.stringify(Array.from(this.traceabilityRecords.entries())));
  }

  loadTraceabilityFromStorage() {
    const stored = localStorage.getItem('blockchain_traceability');
    if (stored) {
      this.traceabilityRecords = new Map(JSON.parse(stored));
    }
  }
}

export default SmartContractUtils;
