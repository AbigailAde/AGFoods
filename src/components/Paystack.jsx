// PaystackButton.js
import React from 'react';
import { usePaystackPayment } from 'react-paystack';

const PaystackButton = ({ email, amount, onSuccessCallback }) => {
  const config = {
    reference: new Date().getTime().toString(),
    email: email,
    amount: amount * 100, // Paystack uses kobo (₦5000 = 500000)
    publicKey: "pk_test_690020ef169dfe98f61e6a78d6aac8c3766a612f", // Replace with your test public key
  };

  const onSuccess = (reference) => {
    console.log('Payment successful. Reference:', reference);
    onSuccessCallback(reference);
  };

  const onClose = () => {
    console.log('Payment window closed.');
  };

  const initializePayment = usePaystackPayment(config);

  return (
    <button
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      onClick={() => initializePayment({ onSuccess, onClose })}
    >
      Pay with Paystack
    </button>
  );
};

export default PaystackButton;
