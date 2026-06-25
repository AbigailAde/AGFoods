// KYC/Verification system for AGFoods platform
const KYC_KEY = 'kyc_verifications';
const VERIFICATION_REQUESTS_KEY = 'verification_requests';

// Verification statuses
export const VERIFICATION_STATUS = {
  UNVERIFIED: 'unverified',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
};

// Document types required for each role
export const REQUIRED_DOCUMENTS = {
  farmer: {
    identity: {
      name: 'Government ID',
      description: 'National ID, Driver\'s License, or Passport',
      required: true
    },
    business: {
      name: 'Farm Registration',
      description: 'Farm registration certificate or land ownership documents',
      required: true
    },
    certifications: {
      name: 'Agricultural Certifications',
      description: 'Organic, Fair Trade, or other agricultural certifications',
      required: false
    },
    bankStatement: {
      name: 'Bank Statement',
      description: 'Recent bank statement (last 3 months)',
      required: true
    }
  },
  processor: {
    identity: {
      name: 'Government ID',
      description: 'National ID, Driver\'s License, or Passport',
      required: true
    },
    business: {
      name: 'Business Registration',
      description: 'CAC certificate or business registration documents',
      required: true
    },
    facility: {
      name: 'Facility License',
      description: 'Food processing facility license or permit',
      required: true
    },
    certifications: {
      name: 'Processing Certifications',
      description: 'NAFDAC, ISO, HACCP, or other relevant certifications',
      required: false
    },
    insurance: {
      name: 'Business Insurance',
      description: 'Valid business liability insurance certificate',
      required: true
    }
  },
  distributor: {
    identity: {
      name: 'Government ID',
      description: 'National ID, Driver\'s License, or Passport',
      required: true
    },
    business: {
      name: 'Business Registration',
      description: 'CAC certificate or business registration documents',
      required: true
    },
    license: {
      name: 'Distribution License',
      description: 'Food distribution or wholesale license',
      required: true
    },
    warehouse: {
      name: 'Warehouse Certificate',
      description: 'Warehouse or storage facility certification',
      required: false
    },
    insurance: {
      name: 'Business Insurance',
      description: 'Valid business liability insurance certificate',
      required: true
    }
  },
  consumer: {
    identity: {
      name: 'Government ID',
      description: 'National ID, Driver\'s License, or Passport',
      required: false
    },
    address: {
      name: 'Address Verification',
      description: 'Utility bill or bank statement showing current address',
      required: false
    }
  }
};

// Verification levels and benefits
export const VERIFICATION_LEVELS = {
  BASIC: {
    level: 'basic',
    name: 'Basic Verification',
    requirements: ['identity'],
    benefits: [
      'Trusted seller badge',
      'Access to basic marketplace features',
      'Customer trust indicator'
    ]
  },
  STANDARD: {
    level: 'standard',
    name: 'Standard Verification',
    requirements: ['identity', 'business'],
    benefits: [
      'All basic benefits',
      'Higher listing priority',
      'Access to bulk order tools',
      'Reduced transaction fees (2% vs 3%)'
    ]
  },
  PREMIUM: {
    level: 'premium',
    name: 'Premium Verification',
    requirements: ['identity', 'business', 'facility', 'insurance'],
    benefits: [
      'All standard benefits',
      'Premium seller badge',
      'Priority customer support',
      'Advanced analytics access',
      'Lowest transaction fees (1%)'
    ]
  }
};

// Get user verification data
export const getUserVerification = (userId) => {
  try {
    const allKyc = JSON.parse(localStorage.getItem(KYC_KEY) || '{}');
    return allKyc[userId] || {
      status: VERIFICATION_STATUS.UNVERIFIED,
      level: null,
      documents: {},
      submittedAt: null,
      verifiedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      expiresAt: null
    };
  } catch (error) {
    console.error('Error getting user verification:', error);
    return {
      status: VERIFICATION_STATUS.UNVERIFIED,
      level: null,
      documents: {},
      submittedAt: null,
      verifiedAt: null,
      rejectedAt: null,
      rejectionReason: null,
      expiresAt: null
    };
  }
};

// Save user verification data
export const saveUserVerification = (userId, verificationData) => {
  try {
    const allKyc = JSON.parse(localStorage.getItem(KYC_KEY) || '{}');
    allKyc[userId] = {
      ...allKyc[userId],
      ...verificationData,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(KYC_KEY, JSON.stringify(allKyc));
    return true;
  } catch (error) {
    console.error('Error saving user verification:', error);
    return false;
  }
};

// Submit document for verification
export const submitDocument = (userId, documentType, documentData, userRole) => {
  try {
    const verification = getUserVerification(userId);
    const requiredDocs = REQUIRED_DOCUMENTS[userRole] || {};

    if (!requiredDocs[documentType]) {
      throw new Error('Invalid document type for role');
    }

    // Update documents
    verification.documents[documentType] = {
      ...documentData,
      uploadedAt: new Date().toISOString(),
      status: VERIFICATION_STATUS.PENDING
    };

    // Check if all required documents are submitted
    const requiredDocTypes = Object.keys(requiredDocs).filter(
      key => requiredDocs[key].required
    );
    const submittedDocs = Object.keys(verification.documents);
    const allRequiredSubmitted = requiredDocTypes.every(
      docType => submittedDocs.includes(docType)
    );

    // Update overall status
    if (allRequiredSubmitted && verification.status === VERIFICATION_STATUS.UNVERIFIED) {
      verification.status = VERIFICATION_STATUS.PENDING;
      verification.submittedAt = new Date().toISOString();

      // Create verification request
      createVerificationRequest(userId, userRole, verification);
    }

    return saveUserVerification(userId, verification);
  } catch (error) {
    console.error('Error submitting document:', error);
    return false;
  }
};

// Create verification request for admin review
export const createVerificationRequest = (userId, userRole, verificationData) => {
  try {
    const requests = JSON.parse(localStorage.getItem(VERIFICATION_REQUESTS_KEY) || '[]');
    const request = {
      id: `VER-${Date.now()}`,
      userId,
      userRole,
      submittedAt: new Date().toISOString(),
      status: VERIFICATION_STATUS.PENDING,
      documents: verificationData.documents,
      reviewedBy: null,
      reviewedAt: null,
      notes: ''
    };

    requests.push(request);
    localStorage.setItem(VERIFICATION_REQUESTS_KEY, JSON.stringify(requests));
    return request.id;
  } catch (error) {
    console.error('Error creating verification request:', error);
    return null;
  }
};

// Get verification level based on submitted documents
export const getVerificationLevel = (documents, userRole) => {
  const requiredDocs = REQUIRED_DOCUMENTS[userRole] || {};
  const submittedDocTypes = Object.keys(documents).filter(
    key => documents[key].status === VERIFICATION_STATUS.VERIFIED
  );

  // Check premium level first
  const premiumRequirements = VERIFICATION_LEVELS.PREMIUM.requirements;
  if (premiumRequirements.every(req =>
    submittedDocTypes.includes(req) && requiredDocs[req]
  )) {
    return VERIFICATION_LEVELS.PREMIUM;
  }

  // Check standard level
  const standardRequirements = VERIFICATION_LEVELS.STANDARD.requirements;
  if (standardRequirements.every(req =>
    submittedDocTypes.includes(req) && requiredDocs[req]
  )) {
    return VERIFICATION_LEVELS.STANDARD;
  }

  // Check basic level
  const basicRequirements = VERIFICATION_LEVELS.BASIC.requirements;
  if (basicRequirements.every(req =>
    submittedDocTypes.includes(req) && requiredDocs[req]
  )) {
    return VERIFICATION_LEVELS.BASIC;
  }

  return null;
};

// Mock verification approval (in real app, this would be done by admin)
export const approveVerification = (userId, userRole, level = 'standard') => {
  try {
    const verification = getUserVerification(userId);
    const verificationLevel = VERIFICATION_LEVELS[level.toUpperCase()];

    if (!verificationLevel) {
      throw new Error('Invalid verification level');
    }

    // Update verification status
    verification.status = VERIFICATION_STATUS.VERIFIED;
    verification.level = verificationLevel.level;
    verification.verifiedAt = new Date().toISOString();
    verification.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

    // Mark all documents as verified
    Object.keys(verification.documents).forEach(docType => {
      verification.documents[docType].status = VERIFICATION_STATUS.VERIFIED;
    });

    return saveUserVerification(userId, verification);
  } catch (error) {
    console.error('Error approving verification:', error);
    return false;
  }
};

// Reject verification
export const rejectVerification = (userId, reason) => {
  try {
    const verification = getUserVerification(userId);
    verification.status = VERIFICATION_STATUS.REJECTED;
    verification.rejectedAt = new Date().toISOString();
    verification.rejectionReason = reason;

    // Mark documents as rejected
    Object.keys(verification.documents).forEach(docType => {
      verification.documents[docType].status = VERIFICATION_STATUS.REJECTED;
    });

    return saveUserVerification(userId, verification);
  } catch (error) {
    console.error('Error rejecting verification:', error);
    return false;
  }
};

// Check if verification is expired
export const isVerificationExpired = (verification) => {
  if (!verification.expiresAt) return false;
  return new Date() > new Date(verification.expiresAt);
};

// Get verification progress percentage
export const getVerificationProgress = (documents, userRole) => {
  const requiredDocs = REQUIRED_DOCUMENTS[userRole] || {};
  const requiredDocTypes = Object.keys(requiredDocs).filter(
    key => requiredDocs[key].required
  );

  if (requiredDocTypes.length === 0) return 100;

  const submittedDocs = Object.keys(documents);
  const completedDocs = requiredDocTypes.filter(
    docType => submittedDocs.includes(docType)
  );

  return Math.round((completedDocs.length / requiredDocTypes.length) * 100);
};

// Get verification benefits for user
export const getVerificationBenefits = (verificationLevel) => {
  if (!verificationLevel) return [];

  const level = VERIFICATION_LEVELS[verificationLevel.toUpperCase()];
  return level ? level.benefits : [];
};

// Auto-approve verification for testing (simulate instant approval)
export const autoApproveVerification = (userId, userRole) => {
  setTimeout(() => {
    approveVerification(userId, userRole, 'standard');
  }, 2000); // Simulate 2 second processing time
};
