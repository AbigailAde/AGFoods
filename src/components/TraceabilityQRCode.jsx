import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const TraceabilityQRCode = ({
  batchId,
  productName,
  size = 80,
  showDetails = true,
  level = 'L'
}) => {
  const traceabilityData = {
    batchId: batchId,
    productName: productName,
    timestamp: new Date().toISOString(),
    verificationUrl: `https://agfoods-verify.com/trace/${batchId}`,
    type: 'traceability'
  };

  const qrValue = JSON.stringify(traceabilityData);

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="bg-white p-2 rounded-lg shadow-sm border">
        <QRCodeCanvas
          value={qrValue}
          size={size}
          level={level}
          includeMargin={true}
          bgColor="white"
          fgColor="black"
        />
      </div>

      {showDetails && (
        <div className="text-center">
          <p className="text-xs font-medium text-gray-800">
            Batch: {batchId}
          </p>
          <p className="text-xs text-gray-500">
            Scan to verify origin
          </p>
        </div>
      )}
    </div>
  );
};

export default TraceabilityQRCode;
