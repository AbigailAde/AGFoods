import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertCircle, Clock, Upload, Eye, X, Award, Star, Zap } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useDropzone } from 'react-dropzone';
import {
  getUserVerification,
  submitDocument,
  VERIFICATION_STATUS,
  REQUIRED_DOCUMENTS,
  VERIFICATION_LEVELS,
  getVerificationProgress,
  getVerificationBenefits,
  autoApproveVerification
} from '../utils/kycUtils';

const KYCVerification = () => {
  const { user } = useAuth();
  const [verification, setVerification] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);

  // Load user verification data
  useEffect(() => {
    if (user) {
      const verificationData = getUserVerification(user.id);
      setVerification(verificationData);
    }
  }, [user]);

  const handleDocumentUpload = async (files, documentType) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingDoc(documentType);

    // Convert file to base64 (in real app, upload to cloud storage)
    const reader = new FileReader();
    reader.onload = async (e) => {
      const documentData = {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileData: e.target.result,
        uploadedBy: user.id
      };

      const success = submitDocument(user.id, documentType, documentData, user.role);
      if (success) {
        // Refresh verification data
        const updatedVerification = getUserVerification(user.id);
        setVerification(updatedVerification);

        // Auto-approve for demo (remove in production)
        if (updatedVerification.status === VERIFICATION_STATUS.PENDING) {
          autoApproveVerification(user.id, user.role);
          setTimeout(() => {
            const finalVerification = getUserVerification(user.id);
            setVerification(finalVerification);
          }, 2500);
        }
      }
      setUploadingDoc(null);
    };
    reader.readAsDataURL(file);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case VERIFICATION_STATUS.VERIFIED: return 'text-green-600 bg-green-100';
      case VERIFICATION_STATUS.PENDING: return 'text-yellow-600 bg-yellow-100';
      case VERIFICATION_STATUS.REJECTED: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case VERIFICATION_STATUS.VERIFIED: return <CheckCircle className="w-4 h-4" />;
      case VERIFICATION_STATUS.PENDING: return <Clock className="w-4 h-4" />;
      case VERIFICATION_STATUS.REJECTED: return <AlertCircle className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const DocumentUploadZone = ({ documentType, docInfo }) => {
    const isUploaded = verification?.documents[documentType];
    const isUploading = uploadingDoc === documentType;

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => handleDocumentUpload(files, documentType),
      accept: {
        'image/*': ['.png', '.jpg', '.jpeg'],
        'application/pdf': ['.pdf']
      },
      multiple: false,
      disabled: isUploading
    });

    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="font-medium text-gray-900 flex items-center">
              {docInfo.name}
              {docInfo.required && <span className="text-red-500 ml-1">*</span>}
            </h4>
            <p className="text-sm text-gray-600 mt-1">{docInfo.description}</p>
          </div>
          {isUploaded && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(isUploaded.status)}`}>
              {getStatusIcon(isUploaded.status)}
              <span className="ml-1 capitalize">{isUploaded.status}</span>
            </span>
          )}
        </div>

        {!isUploaded ? (
          <div {...getRootProps()} className={`cursor-pointer text-center ${isDragActive ? 'bg-blue-50' : ''}`}>
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {isUploading ? 'Uploading...' : isDragActive ? 'Drop file here' : 'Click to upload or drag & drop'}
            </p>
            <p className="text-xs text-gray-500 mt-1">PDF, PNG, JPG up to 5MB</p>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{isUploaded.fileName}</p>
                <p className="text-xs text-gray-500">
                  Uploaded {new Date(isUploaded.uploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedDocument({ type: documentType, ...isUploaded });
                setShowDocumentModal(true);
              }}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View
            </button>
          </div>
        )}
      </div>
    );
  };

  const VerificationLevel = ({ level, isActive }) => {
    const levelInfo = VERIFICATION_LEVELS[level.toUpperCase()];
    if (!levelInfo) return null;

    return (
      <div className={`border rounded-lg p-4 ${isActive ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 flex items-center">
            {level === 'basic' && <Shield className="w-5 h-5 text-blue-600 mr-2" />}
            {level === 'standard' && <Star className="w-5 h-5 text-yellow-600 mr-2" />}
            {level === 'premium' && <Award className="w-5 h-5 text-purple-600 mr-2" />}
            {levelInfo.name}
          </h4>
          {isActive && (
            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Current Level
            </span>
          )}
        </div>
        <ul className="space-y-1">
          {levelInfo.benefits.map((benefit, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start">
              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              {benefit}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (!verification) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const requiredDocs = REQUIRED_DOCUMENTS[user.role] || {};
  const progress = getVerificationProgress(verification.documents, user.role);
  const benefits = getVerificationBenefits(verification.level);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Shield className="w-6 h-6 text-blue-600 mr-3" />
              KYC Verification
            </h1>
            <p className="text-gray-600 mt-1">
              Complete your verification to build trust and unlock premium features
            </p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verification.status)}`}>
              {getStatusIcon(verification.status)}
              <span className="ml-2 capitalize">{verification.status}</span>
            </div>
            {verification.level && (
              <p className="text-sm text-gray-600 mt-1">
                Verification Level: <span className="font-medium capitalize">{verification.level}</span>
              </p>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Verification Progress</span>
            <span className="text-sm text-gray-600">{progress}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 rounded-t-xl">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: <Shield className="w-4 h-4" /> },
              { id: 'documents', label: 'Documents', icon: <Upload className="w-4 h-4" /> },
              { id: 'benefits', label: 'Benefits', icon: <Zap className="w-4 h-4" /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-xl shadow-sm border border-t-0">
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <VerificationLevel level="basic" isActive={verification.level === 'basic'} />
              <VerificationLevel level="standard" isActive={verification.level === 'standard'} />
              <VerificationLevel level="premium" isActive={verification.level === 'premium'} />
            </div>

            {verification.status === VERIFICATION_STATUS.REJECTED && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-red-800">Verification Rejected</h4>
                    <p className="text-red-700 text-sm mt-1">{verification.rejectionReason}</p>
                    <p className="text-red-600 text-sm mt-2">Please update your documents and resubmit.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
                <p className="text-gray-600 mt-1">
                  Upload the required documents for {user.role} verification
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(requiredDocs).map(([documentType, docInfo]) => (
                  <DocumentUploadZone
                    key={documentType}
                    documentType={documentType}
                    docInfo={docInfo}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'benefits' && (
          <div className="p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Verification Benefits</h3>
              <p className="text-gray-600 mt-1">
                See what you unlock with verification
              </p>
            </div>

            {verification.level ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Your Current Benefits</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2">Complete Verification to Unlock Benefits</h4>
                <p className="text-gray-600">Upload your documents to start enjoying verification benefits</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Document Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Document Preview</h3>
              <button
                onClick={() => {
                  setShowDocumentModal(false);
                  setSelectedDocument(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <p className="font-medium">{selectedDocument.fileName}</p>
                <p className="text-sm text-gray-600">
                  Uploaded {new Date(selectedDocument.uploadedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="max-h-96 overflow-auto">
                <img
                  src={selectedDocument.fileData}
                  alt="Document"
                  className="max-w-full h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerification;
