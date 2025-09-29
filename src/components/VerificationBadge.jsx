import React from 'react';
import { Shield, Star, Award, CheckCircle } from 'lucide-react';
import { VERIFICATION_STATUS, VERIFICATION_LEVELS } from '../utils/kycUtils';

const VerificationBadge = ({
  status = VERIFICATION_STATUS.UNVERIFIED,
  level = null,
  size = 'sm',
  showText = true,
  className = ''
}) => {
  const getBadgeConfig = () => {
    if (status !== VERIFICATION_STATUS.VERIFIED) {
      return {
        icon: Shield,
        color: 'text-gray-500 bg-gray-100',
        text: 'Unverified',
        title: 'Not verified'
      };
    }

    switch (level) {
      case 'basic':
        return {
          icon: Shield,
          color: 'text-blue-600 bg-blue-100',
          text: 'Basic Verified',
          title: 'Basic verification completed'
        };
      case 'standard':
        return {
          icon: Star,
          color: 'text-yellow-600 bg-yellow-100',
          text: 'Standard Verified',
          title: 'Standard verification completed'
        };
      case 'premium':
        return {
          icon: Award,
          color: 'text-purple-600 bg-purple-100',
          text: 'Premium Verified',
          title: 'Premium verification completed'
        };
      default:
        return {
          icon: CheckCircle,
          color: 'text-green-600 bg-green-100',
          text: 'Verified',
          title: 'Verification completed'
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return showText ? 'px-2 py-1 text-xs' : 'p-1';
      case 'sm':
        return showText ? 'px-2 py-1 text-xs' : 'p-1.5';
      case 'md':
        return showText ? 'px-3 py-1.5 text-sm' : 'p-2';
      case 'lg':
        return showText ? 'px-4 py-2 text-base' : 'p-2.5';
      default:
        return showText ? 'px-2 py-1 text-xs' : 'p-1.5';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'xs': return 'w-3 h-3';
      case 'sm': return 'w-3 h-3';
      case 'md': return 'w-4 h-4';
      case 'lg': return 'w-5 h-5';
      default: return 'w-3 h-3';
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;
  const sizeClasses = getSizeClasses();
  const iconSize = getIconSize();

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses} ${className}`}
      title={config.title}
    >
      <Icon className={`${iconSize} ${showText ? 'mr-1' : ''}`} />
      {showText && <span>{config.text}</span>}
    </span>
  );
};

// Verification status indicator for user profiles
export const VerificationStatus = ({ user, size = 'sm', className = '' }) => {
  // This would normally fetch from the verification system
  // For now, we'll simulate based on user data
  const hasVerification = user?.verification;
  const status = hasVerification?.status || VERIFICATION_STATUS.UNVERIFIED;
  const level = hasVerification?.level || null;

  return (
    <VerificationBadge
      status={status}
      level={level}
      size={size}
      className={className}
    />
  );
};

// Trust indicator showing verification benefits
export const TrustIndicator = ({ user, compact = false }) => {
  const hasVerification = user?.verification?.status === VERIFICATION_STATUS.VERIFIED;
  const level = user?.verification?.level;

  if (!hasVerification) {
    return null;
  }

  const benefits = [];
  if (level === 'premium') {
    benefits.push('Premium Seller', 'Lowest Fees', 'Priority Support');
  } else if (level === 'standard') {
    benefits.push('Trusted Seller', 'Reduced Fees', 'Higher Priority');
  } else if (level === 'basic') {
    benefits.push('Verified Identity', 'Basic Trust');
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <VerificationBadge status={VERIFICATION_STATUS.VERIFIED} level={level} showText={false} />
        <span className="text-xs text-gray-600">Verified</span>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
      <div className="flex items-center space-x-2 mb-2">
        <VerificationBadge status={VERIFICATION_STATUS.VERIFIED} level={level} />
        <span className="font-medium text-green-800">Trusted {user.role}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {benefits.map((benefit, index) => (
          <span key={index} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            {benefit}
          </span>
        ))}
      </div>
    </div>
  );
};

export default VerificationBadge;
