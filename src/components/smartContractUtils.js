import {
  ContractExecuteTransaction,
  ContractFunctionParameters,
  TransferTransaction,
  Hbar,
  AccountId
} from "@hashgraph/sdk";

// Smart contract integration utilities for AGFoods platform
class SmartContractUtils {
  constructor() {
    // Contract addresses and IDs (to be set after deployment)
    this.contractId = process.env.REACT_APP_CONTRACT_ID || null;
    this.tokenId = process.env.REACT_APP_TOKEN_ID || null;
    this.escrowContractId = process.env.REACT_APP_ESCROW_CONTRACT_ID || null;
  }

  // ========== TRANSACTION RECORDING ==========

  /**
   * Record a transaction on the blockchain for transparency
   * @param {Object} walletData - Wallet connection data
   * @param {String} accountId - User's account ID
   * @param {Object} transactionData - Transaction details to record
   */
  async recordTransaction(walletData, accountId, transactionData) {
    try {
      console.log(`\n=======================================`);
      console.log(`- Recording transaction on blockchain...`);

      const hashconnect = walletData[0];
      const saveData = walletData[1];
      const provider = hashconnect.getProvider("testnet", saveData.topic, accountId);
      const signer = hashconnect.getSigner(provider);

      // Prepare transaction parameters
      const contractExecuteParams = new ContractFunctionParameters()
        .addString(transactionData.orderId)
        .addString(transactionData.batchId || "")
        .addString(transactionData.productType)
        .addInt64(Math.floor(transactionData.amount * 100)) // Convert to smallest unit
        .addAddress(AccountId.fromString(transactionData.sellerId).toSolidityAddress())
        .addAddress(AccountId.fromString(transactionData.buyerId).toSolidityAddress())
        .addString(JSON.stringify({
          timestamp: transactionData.timestamp,
          quantity: transactionData.quantity,
          status: transactionData.status,
          metadata: transactionData.metadata || {}
        }));

      // Execute contract function to record transaction
      const contractExecuteTx = await new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(300000)
        .setFunction("recordTransaction", contractExecuteParams)
        .freezeWithSigner(signer);

      const contractExecuteSubmit = await contractExecuteTx.executeWithSigner(signer);
      const contractExecuteRx = await provider.getTransactionReceipt(contractExecuteSubmit.transactionId);

      console.log(`- Transaction recorded on blockchain: ${contractExecuteRx.status.toString()}`);
      console.log(`- Transaction ID: ${contractExecuteSubmit.transactionId}`);

      return {
        success: true,
        transactionId: contractExecuteSubmit.transactionId.toString(),
        contractReceiptStatus: contractExecuteRx.status.toString(),
        blockchainHash: contractExecuteSubmit.transactionId.toString()
      };

    } catch (error) {
      console.error("Error recording transaction on blockchain:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========== TRACEABILITY FUNCTIONS ==========

  /**
   * Create a traceability record for a batch
   * @param {Object} walletData - Wallet connection data
   * @param {String} accountId - User's account ID
   * @param {Object} batchData - Batch information
   */
  async createTraceabilityRecord(walletData, accountId, batchData) {
    try {
      console.log(`\n=======================================`);
      console.log(`- Creating traceability record for batch: ${batchData.batchId}`);

      const hashconnect = walletData[0];
      const saveData = walletData[1];
      const provider = hashconnect.getProvider("testnet", saveData.topic, accountId);
      const signer = hashconnect.getSigner(provider);

      const contractExecuteParams = new ContractFunctionParameters()
        .addString(batchData.batchId)
        .addString(batchData.productType)
        .addString(batchData.origin)
        .addString(batchData.processingLocation || "")
        .addInt64(batchData.harvestDate || Date.now())
        .addString(JSON.stringify({
          certifications: batchData.certifications || [],
          qualityMetrics: batchData.qualityMetrics || {},
          environmentalData: batchData.environmentalData || {},
          processingSteps: batchData.processingSteps || []
        }));

      const contractExecuteTx = await new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(300000)
        .setFunction("createBatch", contractExecuteParams)
        .freezeWithSigner(signer);

      const contractExecuteSubmit = await contractExecuteTx.executeWithSigner(signer);
      const contractExecuteRx = await provider.getTransactionReceipt(contractExecuteSubmit.transactionId);

      console.log(`- Traceability record created: ${contractExecuteRx.status.toString()}`);

      return {
        success: true,
        transactionId: contractExecuteSubmit.transactionId.toString(),
        batchId: batchData.batchId,
        blockchainHash: contractExecuteSubmit.transactionId.toString()
      };

    } catch (error) {
      console.error("Error creating traceability record:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update traceability record as product moves through supply chain
   * @param {Object} walletData - Wallet connection data
   * @param {String} accountId - User's account ID
   * @param {String} batchId - Batch identifier
   * @param {Object} updateData - Update information
   */
  async updateTraceabilityRecord(walletData, accountId, batchId, updateData) {
    try {
      console.log(`\n=======================================`);
      console.log(`- Updating traceability record for batch: ${batchId}`);

      const hashconnect = walletData[0];
      const saveData = walletData[1];
      const provider = hashconnect.getProvider("testnet", saveData.topic, accountId);
      const signer = hashconnect.getSigner(provider);

      const contractExecuteParams = new ContractFunctionParameters()
        .addString(batchId)
        .addString(updateData.stage) // "processing", "packaging", "distribution", "retail"
        .addString(updateData.location)
        .addInt64(updateData.timestamp || Date.now())
        .addString(JSON.stringify({
          handler: updateData.handler,
          actions: updateData.actions || [],
          qualityChecks: updateData.qualityChecks || {},
          transportDetails: updateData.transportDetails || {}
        }));

      const contractExecuteTx = await new ContractExecuteTransaction()
        .setContractId(this.contractId)
        .setGas(300000)
        .setFunction("updateBatch", contractExecuteParams)
        .freezeWithSigner(signer);

      const contractExecuteSubmit = await contractExecuteTx.executeWithSigner(signer);
      const contractExecuteRx = await provider.getTransactionReceipt(contractExecuteSubmit.transactionId);

      console.log(`- Traceability record updated: ${contractExecuteRx.status.toString()}`);

      return {
        success: true,
        transactionId: contractExecuteSubmit.transactionId.toString(),
        batchId: batchId
      };

    } catch (error) {
      console.error("Error updating traceability record:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========== PAYMENT FUNCTIONS ==========

  /**
   * Process HBAR payment for an order
   * @param {Object} walletData - Wallet connection data
   * @param {String} accountId - Buyer's account ID
   * @param {String} sellerId - Seller's account ID
   * @param {Number} amount - Amount in HBAR
   * @param {String} orderId - Order identifier
   */
  async processHBARPayment(walletData, accountId, sellerId, amount, orderId) {
    try {
      console.log(`\n=======================================`);
      console.log(`- Processing HBAR payment for order: ${orderId}`);

      const hashconnect = walletData[0];
      const saveData = walletData[1];
      const provider = hashconnect.getProvider("testnet", saveData.topic, accountId);
      const signer = hashconnect.getSigner(provider);

      // Create transfer transaction
      const transferTx = await new TransferTransaction()
        .addHbarTransfer(accountId, new Hbar(-amount))
        .addHbarTransfer(sellerId, new Hbar(amount))
        .setTransactionMemo(`AGFoods Order: ${orderId}`)
        .freezeWithSigner(signer);

      const transferTxSubmit = await transferTx.executeWithSigner(signer);
      const transferTxRx = await provider.getTransactionReceipt(transferTxSubmit.transactionId);

      console.log(`- HBAR payment processed: ${transferTxRx.status.toString()}`);

      // Record the payment transaction on the contract
      await this.recordTransaction(walletData, accountId, {
        orderId: orderId,
        productType: "payment",
        amount: amount,
        sellerId: sellerId,
        buyerId: accountId,
        timestamp: Date.now(),
        status: "completed",
        metadata: {
          paymentMethod: "HBAR",
          transactionId: transferTxSubmit.transactionId.toString()
        }
      });

      return {
        success: true,
        transactionId: transferTxSubmit.transactionId.toString(),
        status: transferTxRx.status.toString()
      };

    } catch (error) {
      console.error("Error processing HBAR payment:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process token payment for an order
   * @param {Object} walletData - Wallet connection data
   * @param {String} accountId - Buyer's account ID
   * @param {String} sellerId - Seller's account ID
   * @param {Number} amount - Amount in tokens
   * @param {String} orderId - Order identifier
   */
  async processTokenPayment(walletData, accountId, sellerId, amount, orderId) {
    try {
      console.log(`\n=======================================`);
      console.log(`- Processing token payment for order: ${orderId}`);

      const hashconnect = walletData[0];
      const saveData = walletData[1];
      const provider = hashconnect.getProvider("testnet", saveData.topic, accountId);
      const signer = hashconnect.getSigner(provider);

      // Create HBAR transfer transaction (simplified for demo)
      const transferTx = await new TransferTransaction()
        .addHbarTransfer(accountId, Hbar.fromTinybars(-amount * 1000000)) // Convert to tinybars
        .addHbarTransfer(sellerId, Hbar.fromTinybars(amount * 1000000))
        .setTransactionMemo(`AGFoods Order: ${orderId}`)
        .freezeWithSigner(signer);

      const transferTxSubmit = await transferTx.executeWithSigner(signer);
      const transferTxRx = await provider.getTransactionReceipt(transferTxSubmit.transactionId);

      console.log(`- HBAR payment processed: ${transferTxRx.status.toString()}`);

      // Record the payment transaction on the contract
      await this.recordTransaction(walletData, accountId, {
        orderId: orderId,
        productType: "payment",
        amount: amount,
        sellerId: sellerId,
        buyerId: accountId,
        timestamp: Date.now(),
        status: "completed",
        metadata: {
          paymentMethod: "TOKEN",
          tokenId: this.tokenId,
          transactionId: transferTxSubmit.transactionId.toString()
        }
      });

      return {
        success: true,
        transactionId: transferTxSubmit.transactionId.toString(),
        status: transferTxRx.status.toString()
      };

    } catch (error) {
      console.error("Error processing token payment:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========== ESCROW FUNCTIONS ==========

  /**
   * Create an escrow for a transaction
   * @param {Object} walletData - Wallet connection data
   * @param {String} accountId - Buyer's account ID
   * @param {Object} escrowData - Escrow details
   */
  async createEscrow(walletData, accountId, escrowData) {
    try {
      console.log(`\n=======================================`);
      console.log(`- Creating escrow for order: ${escrowData.orderId}`);

      const hashconnect = walletData[0];
      const saveData = walletData[1];
      const provider = hashconnect.getProvider("testnet", saveData.topic, accountId);
      const signer = hashconnect.getSigner(provider);

      const contractExecuteParams = new ContractFunctionParameters()
        .addString(escrowData.orderId)
        .addAddress(AccountId.fromString(escrowData.sellerId).toSolidityAddress())
        .addAddress(AccountId.fromString(accountId).toSolidityAddress())
        .addInt64(Math.floor(escrowData.amount * 100))
        .addInt64(escrowData.releaseTime || (Date.now() + 7 * 24 * 60 * 60 * 1000)) // 7 days default
        .addString(JSON.stringify({
          productDetails: escrowData.productDetails,
          deliveryTerms: escrowData.deliveryTerms || {},
          conditions: escrowData.conditions || []
        }));

      const contractExecuteTx = await new ContractExecuteTransaction()
        .setContractId(this.escrowContractId)
        .setGas(300000)
        .setFunction("createEscrow", contractExecuteParams)
        .setPayableAmount(new Hbar(escrowData.amount))
        .freezeWithSigner(signer);

      const contractExecuteSubmit = await contractExecuteTx.executeWithSigner(signer);
      const contractExecuteRx = await provider.getTransactionReceipt(contractExecuteSubmit.transactionId);

      console.log(`- Escrow created: ${contractExecuteRx.status.toString()}`);

      return {
        success: true,
        transactionId: contractExecuteSubmit.transactionId.toString(),
        escrowId: escrowData.orderId,
        status: contractExecuteRx.status.toString()
      };

    } catch (error) {
      console.error("Error creating escrow:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Release escrow funds to seller
   * @param {Object} walletData - Wallet connection data
   * @param {String} accountId - Account releasing the funds (buyer or arbiter)
   * @param {String} orderId - Order identifier
   */
  async releaseEscrow(walletData, accountId, orderId) {
    try {
      console.log(`\n=======================================`);
      console.log(`- Releasing escrow for order: ${orderId}`);

      const hashconnect = walletData[0];
      const saveData = walletData[1];
      const provider = hashconnect.getProvider("testnet", saveData.topic, accountId);
      const signer = hashconnect.getSigner(provider);

      const contractExecuteParams = new ContractFunctionParameters()
        .addString(orderId);

      const contractExecuteTx = await new ContractExecuteTransaction()
        .setContractId(this.escrowContractId)
        .setGas(300000)
        .setFunction("releaseEscrow", contractExecuteParams)
        .freezeWithSigner(signer);

      const contractExecuteSubmit = await contractExecuteTx.executeWithSigner(signer);
      const contractExecuteRx = await provider.getTransactionReceipt(contractExecuteSubmit.transactionId);

      console.log(`- Escrow released: ${contractExecuteRx.status.toString()}`);

      return {
        success: true,
        transactionId: contractExecuteSubmit.transactionId.toString(),
        status: contractExecuteRx.status.toString()
      };

    } catch (error) {
      console.error("Error releasing escrow:", error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Get transaction history from blockchain
   * @param {String} accountId - Account to query
   */
  async getTransactionHistory(accountId) {
    try {
      // This would typically query the Hedera Mirror Node API
      const mirrorNodeUrl = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${accountId}/transactions`;

      const response = await fetch(mirrorNodeUrl);
      const data = await response.json();

      return {
        success: true,
        transactions: data.transactions || []
      };

    } catch (error) {
      console.error("Error fetching transaction history:", error);
      return {
        success: false,
        error: error.message,
        transactions: []
      };
    }
  }

  /**
   * Generate QR code for traceability
   * @param {String} batchId - Batch identifier
   * @param {String} transactionId - Blockchain transaction ID
   */
  generateTraceabilityQR(batchId, transactionId) {
    const traceabilityUrl = `${window.location.origin}/trace/${batchId}/${transactionId}`;
    return traceabilityUrl;
  }

  /**
   * Verify if user has sufficient balance for transaction
   * @param {Object} walletData - Wallet connection data
   * @param {String} accountId - User's account ID
   * @param {Number} amount - Amount to check
   * @param {String} type - "HBAR" or "TOKEN"
   */
  async checkBalance(walletData, accountId, amount, type = "HBAR") {
    try {
      const hashconnect = walletData[0];
      const saveData = walletData[1];
      const provider = hashconnect.getProvider("testnet", saveData.topic, accountId);
      const signer = hashconnect.getSigner(provider);

      const balance = await signer.getAccountBalance();

      if (type === "HBAR") {
        const hbarBalance = balance.hbars.toTinybars();
        const requiredAmount = new Hbar(amount).toTinybars();
        return hbarBalance.gte(requiredAmount);
      } else if (type === "TOKEN") {
        const tokenBalance = balance.tokens._map.get(this.tokenId.toString()) || 0;
        return tokenBalance >= amount;
      }

      return false;

    } catch (error) {
      console.error("Error checking balance:", error);
      return false;
    }
  }
}

export default SmartContractUtils;
