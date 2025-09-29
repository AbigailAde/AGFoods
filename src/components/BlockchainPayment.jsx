import React, { useState } from 'react';
import SmartContractUtils from './smartContractUtils';

const BlockchainPayment = ({
  amount,
  orderId,
  paymentMethod,
  onSuccess,
  onError,
  walletData,
  accountId
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [contractUtils] = useState(new SmartContractUtils());

  const processBlockchainPayment = async () => {
    if (!walletData || !accountId) {
      onError('Please connect your wallet first');
      return;
    }

    setIsProcessing(true);
    try {
      let result;

      if (paymentMethod === 'hbar') {
        // Direct HBAR payment - for demo, we'll use a placeholder seller ID
        const sellerId = '0.0.4649239'; // Demo seller account ID

        result = await contractUtils.processHBARPayment(
          walletData,
          accountId,
          sellerId,
          amount,
          orderId
        );
      } else if (paymentMethod === 'escrow') {
        // Escrow payment
        const escrowData = {
          orderId: orderId,
          sellerId: '0.0.4649239', // Demo seller account ID
          amount: amount,
          productDetails: {
            description: 'AGFoods marketplace order',
            orderId: orderId
          },
          deliveryTerms: {
            estimatedDelivery: '5-7 business days',
            location: 'Customer provided address'
          },
          conditions: [
            'Product must be delivered in good condition',
            'Customer has 24 hours to confirm receipt'
          ]
        };

        result = await contractUtils.createEscrow(walletData, accountId, escrowData);
      }

      if (result && result.success) {
        onSuccess({
          transactionId: result.transactionId,
          status: result.status,
          paymentMethod: paymentMethod,
          amount: amount
        });
      } else {
        onError(result?.error || 'Payment processing failed');
      }
    } catch (error) {
      console.error('Blockchain payment error:', error);
      onError(error.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-semibold text-gray-900 flex items-center">
            {paymentMethod === 'hbar' ? '⚡ HBAR Payment' : '🔒 HBAR Escrow Payment'}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {paymentMethod === 'hbar'
              ? 'Direct cryptocurrency payment using HBAR'
              : 'Secure escrow payment - funds released upon delivery confirmation'
            }
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-purple-600">
            ₦{amount.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            ~{(amount * 0.0027).toFixed(2)} HBAR
          </p>
        </div>
      </div>

      {paymentMethod === 'escrow' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <h5 className="font-medium text-blue-800 mb-2">Escrow Protection Benefits:</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Your payment is held securely until delivery</li>
            <li>• Automatic release after confirmed delivery</li>
            <li>• Dispute resolution available</li>
            <li>• Full refund if delivery conditions aren't met</li>
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          <p>• Blockchain transaction fee: ~$0.01</p>
          <p>• Transaction recorded on Hedera network</p>
          <p>• Immutable payment proof provided</p>
        </div>

        <button
          onClick={processBlockchainPayment}
          disabled={isProcessing || !walletData}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processing...</span>
            </div>
          ) : (
            `Pay with ${paymentMethod === 'hbar' ? 'HBAR' : 'HBAR Escrow'}`
          )}
        </button>
      </div>

      {!walletData && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Please connect your Hedera wallet first to use blockchain payments.
          </p>
        </div>
      )}
    </div>
  );
};

export default BlockchainPayment;
