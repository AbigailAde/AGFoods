// PaystackButton.js
import React from 'react';
import { usePaystackPayment } from 'react-paystack';

const PaystackButton = ({
  email,
  amount,
  onSuccessCallback,
  orderInfo = {},
  customerInfo = {},
  label = "Pay with Paystack",
  className = "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
}) => {
  // Generate unique reference for this order
  const generateReference = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `AGF-${timestamp}-${random}`.toUpperCase();
  };

  const config = {
    reference: generateReference(),
    email: email,
    amount: amount * 100, // Paystack uses kobo (₦5000 = 500000)
    publicKey: "pk_test_690020ef169dfe98f61e6a78d6aac8c3766a612f", // Replace with your test public key
    metadata: {
      custom_fields: [
        {
          display_name: "Order Type",
          variable_name: "order_type",
          value: orderInfo.type || "marketplace_purchase"
        },
        {
          display_name: "Customer Role",
          variable_name: "customer_role",
          value: customerInfo.role || "consumer"
        },
        {
          display_name: "Order Items",
          variable_name: "items_count",
          value: orderInfo.itemsCount || "1"
        },
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: customerInfo.name || "N/A"
        }
      ]
    },
    currency: 'NGN',
    channels: ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
  };

  const onSuccess = (reference) => {
    console.log('Payment successful. Reference:', reference);
    console.log('Payment data:', {
      reference: reference.reference,
      status: reference.status,
      transaction: reference.transaction,
      message: reference.message
    });

    // Add payment timestamp and status to reference data
    const enhancedReference = {
      ...reference,
      paidAt: new Date().toISOString(),
      orderInfo,
      customerInfo,
      amount: amount,
      currency: 'NGN'
    };

    onSuccessCallback(enhancedReference);
  };

  const onClose = () => {
    console.log('Payment window closed.');
    // Optionally handle payment cancellation
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button
      className={className}
      onClick={() => {
        // Validate required fields before opening payment
        if (!email) {
          alert('Email is required for payment');
          return;
        }
        if (!amount || amount <= 0) {
          alert('Invalid payment amount');
          return;
        }

        initializePayment({ onSuccess, onClose });
      }}
    >
      {label}
    </button>
  );
};

export default PaystackButton;
