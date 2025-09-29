import {
  Client,
  PrivateKey,
  AccountId,
  TransferTransaction,
  Hbar,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction
} from '@hashgraph/sdk';

class SmartContractUtils {
  constructor() {
    this.client = null;
    this.operatorId = null;
    this.operatorKey = null;
    
    // Initialize with testnet configuration
    this.initializeClient();
  }

  initializeClient() {
    try {
      // For demo purposes - in production, these would come from secure environment
      this.client = Client.forTestnet();
      
      // Demo operator account (replace with actual values in production)
      const operatorIdString = process.env.REACT_APP_HEDERA_ACCOUNT_ID || "0.0.4649238";
      const operatorKeyString = process.env.REACT_APP_HEDERA_PRIVATE_KEY || "302e020100300506032b657004220420a6e394524c88e6e0f5c5e88a76cf6a6a7d5f5d9a8c3b2c1a9f8e7d6c5b4a3f2e";
      
      this.operatorId = AccountId.fromString(operatorIdString);
      this.operatorKey = PrivateKey.fromString(operatorKeyString);
      
      this.client.setOperator(this.operatorId, this.operatorKey);
    } catch (error) {
      console.error('Error initializing Hedera client:', error);
    }
  }

  async recordTransaction(walletData, accountId, transactionData) {
    try {
      if (!this.client) {
        throw new Error('Hedera client not initialized');
      }

      // Create a topic for transaction records if not exists
      const topicId = await this.getOrCreateTransactionTopic();
      
      // Prepare transaction record
      const record = {
        timestamp: new Date().toISOString(),
        accountId: accountId,
        type: transactionData.type || 'purchase',
        amount: transactionData.amount,
        productId: transactionData.productId,
        orderId: transactionData.orderId,
        status: 'recorded',
        transactionHash: this.generateTransactionHash(transactionData)
      };

      // Submit to Hedera topic
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(record));

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      // Store locally for quick access
      this.storeTransactionLocally(record);
      
      return {
        success: true,
        transactionId: txResponse.transactionId.toString(),
        status: receipt.status.toString(),
        record: record
      };
    } catch (error) {
      console.error('Error recording transaction:', error);
      return { success: false, error: error.message };
    }
  }

  async createTraceabilityRecord(walletData, accountId, productData) {
    try {
      const traceabilityId = this.generateTraceabilityId(productData);
      const batchRecord = {
        traceabilityId: traceabilityId,
        productName: productData.name,
        farmerId: accountId,
        timestamp: new Date().toISOString(),
        location: productData.location || 'Unknown',
        batchSize: productData.quantity || 1,
        qualityMetrics: productData.qualityMetrics || {},
        certifications: productData.certifications || [],
        status: 'created'
      };

      // Record on blockchain
      const topicId = await this.getOrCreateTraceabilityTopic();
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(batchRecord));

      const txResponse = await transaction.execute(this.client);
      await txResponse.getReceipt(this.client);

      // Store locally
      this.storeTraceabilityLocally(batchRecord);

      return {
        success: true,
        traceabilityId: traceabilityId,
        transactionId: txResponse.transactionId.toString(),
        batchRecord: batchRecord
      };
    } catch (error) {
      console.error('Error creating traceability record:', error);
      return { success: false, error: error.message };
    }
  }

  async processHBARPayment(walletData, buyerAccountId, sellerAccountId, amount, orderId) {
    try {
      if (!this.client) {
        throw new Error('Hedera client not initialized');
      }

      // Convert amount to HBAR (assuming amount is in Naira, converting at demo rate)
      const hbarAmount = amount * 0.0027; // Demo conversion rate
      
      const transaction = new TransferTransaction()
        .addHbarTransfer(buyerAccountId, Hbar.fromTinybars(-Math.round(hbarAmount * 100000000)))
        .addHbarTransfer(sellerAccountId, Hbar.fromTinybars(Math.round(hbarAmount * 100000000)))
        .freezeWith(this.client);

      // In a real implementation, this would be signed by the wallet
      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      // Record the payment transaction
      await this.recordTransaction(walletData, buyerAccountId, {
        type: 'hbar_payment',
        amount: amount,
        hbarAmount: hbarAmount,
        orderId: orderId,
        sellerAccountId: sellerAccountId,
        paymentMethod: 'hbar'
      });

      return {
        success: true,
        transactionId: txResponse.transactionId.toString(),
        status: receipt.status.toString(),
        hbarAmount: hbarAmount
      };
    } catch (error) {
      console.error('Error processing HBAR payment:', error);
      return { success: false, error: error.message };
    }
  }

  async createEscrow(walletData, buyerAccountId, escrowData) {
    try {
      const escrowId = this.generateEscrowId(escrowData);
      const hbarAmount = escrowData.amount * 0.0027; // Demo conversion rate
      
      // Create escrow record
      const escrowRecord = {
        escrowId: escrowId,
        buyerAccountId: buyerAccountId,
        sellerAccountId: escrowData.sellerId,
        amount: escrowData.amount,
        hbarAmount: hbarAmount,
        status: 'held',
        createdAt: new Date().toISOString(),
        orderId: escrowData.orderId,
        productDetails: escrowData.productDetails,
        deliveryTerms: escrowData.deliveryTerms,
        conditions: escrowData.conditions,
        releaseConditions: {
          deliveryConfirmed: false,
          disputeResolved: false,
          timeoutReached: false
        },
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      // In a real implementation, funds would be transferred to escrow account
      // For demo, we'll simulate this
      
      // Record escrow creation
      const topicId = await this.getOrCreateEscrowTopic();
      const transaction = new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(JSON.stringify(escrowRecord));

      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);

      // Store locally
      this.storeEscrowLocally(escrowRecord);

      return {
        success: true,
        escrowId: escrowId,
        transactionId: txResponse.transactionId.toString(),
        status: receipt.status.toString(),
        escrowRecord: escrowRecord
      };
    } catch (error) {
      console.error('Error creating escrow:', error);
      return { success: false, error: error.message };
    }
  }

  async getOrCreateTransactionTopic() {
    const stored = localStorage.getItem('agfoods_transaction_topic');
    if (stored) return stored;

    try {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo('AGFoods Transaction Records');
      
      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const topicId = receipt.topicId.toString();
      
      localStorage.setItem('agfoods_transaction_topic', topicId);
      return topicId;
    } catch (error) {
      console.error('Error creating transaction topic:', error);
      // Return a demo topic ID for development
      return '0.0.4649240';
    }
  }

  async getOrCreateTraceabilityTopic() {
    const stored = localStorage.getItem('agfoods_traceability_topic');
    if (stored) return stored;

    try {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo('AGFoods Traceability Records');
      
      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const topicId = receipt.topicId.toString();
      
      localStorage.setItem('agfoods_traceability_topic', topicId);
      return topicId;
    } catch (error) {
      console.error('Error creating traceability topic:', error);
      return '0.0.4649241';
    }
  }

  async getOrCreateEscrowTopic() {
    const stored = localStorage.getItem('agfoods_escrow_topic');
    if (stored) return stored;

    try {
      const transaction = new TopicCreateTransaction()
        .setTopicMemo('AGFoods Escrow Records');
      
      const txResponse = await transaction.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      const topicId = receipt.topicId.toString();
      
      localStorage.setItem('agfoods_escrow_topic', topicId);
      return topicId;
    } catch (error) {
      console.error('Error creating escrow topic:', error);
      return '0.0.4649242';
    }
  }

  generateTransactionHash(data) {
    return btoa(JSON.stringify(data) + Date.now()).replace(/=/g, '').substring(0, 16);
  }

  generateTraceabilityId(productData) {
    return 'TR' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  generateEscrowId(escrowData) {
    return 'ESC' + Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
  }

  storeTransactionLocally(record) {
    const transactions = JSON.parse(localStorage.getItem('agfoods_transactions') || '[]');
    transactions.push(record);
    localStorage.setItem('agfoods_transactions', JSON.stringify(transactions));
  }

  storeTraceabilityLocally(record) {
    const records = JSON.parse(localStorage.getItem('agfoods_traceability') || '[]');
    records.push(record);
    localStorage.setItem('agfoods_traceability', JSON.stringify(records));
  }

  storeEscrowLocally(record) {
    const escrows = JSON.parse(localStorage.getItem('agfoods_escrows') || '[]');
    escrows.push(record);
    localStorage.setItem('agfoods_escrows', JSON.stringify(escrows));
  }

  getLocalTransactions() {
    return JSON.parse(localStorage.getItem('agfoods_transactions') || '[]');
  }

  getLocalTraceability() {
    return JSON.parse(localStorage.getItem('agfoods_traceability') || '[]');
  }

  getLocalEscrows() {
    return JSON.parse(localStorage.getItem('agfoods_escrows') || '[]');
  }
}

export default SmartContractUtils;