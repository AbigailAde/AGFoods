import { use, useState } from "react";
import { ChevronRight, Leaf, Factory, Truck, QrCode, Shield, Users, TrendingUp, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function OnboardProcessor() {
  const { signUp } = useAuth();
  const [currentStep, setCurrentStep] = useState('userType'); // 'userType', 'form', 'success'
  const [selectedUserType, setSelectedUserType] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    location: '',
    certifications: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const userTypes = [
    {
      id: 'processor',
      title: 'Processor',
      description: 'Convert plantain to flour, add quality checks, and maintain processing records',
      icon: <Factory className="w-8 h-8 text-blue-600" />,
      color: 'from-blue-500 to-indigo-600',
      fields: ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword', 'companyName', 'location', 'certifications']
    },
  ];

  const validateForm = () => {
    const newErrors = {};
    const selectedType = userTypes.find(type => type.id === selectedUserType);
    const requiredFields = selectedType?.fields || [];

    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (formData.phone && !/^[\+]?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Password validation
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const userData = {
        ...formData,
        role: selectedUserType
      };
      await signUp(userData);
      setCurrentStep('success');
    } catch (error) {
      setErrors({ general: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('userType');
    setSelectedUserType(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      companyName: '',
      location: '',
      certifications: ''
    });
    setErrors({});
  };

  const selectedType = userTypes.find(type => type.id === selectedUserType);

  return (
    <div className="min-h-screen bg-gray-50">


      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep !== 'userType' && (
          <button
            onClick={() => currentStep === 'form' ? setCurrentStep('userType') : resetForm()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        )}
        {currentStep === 'userType' && (
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        )}
        {/* User Type Selection */}
        {currentStep === 'userType' && (
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Join AGFoods as a Processor</h1>
            {/* <p className="text-lg text-gray-600 mb-12">
              Select your role to get started with blockchain-powered supply chain tracking
            </p> */}
            <p className="text-gray-600 text-sm">
              {userTypes[0].description}
            </p>
            <button
              type="button"
              className="mt-3 flex items-center text-green-600 group-hover:text-green-700"
              onClick={() => {
                setSelectedUserType(userTypes[0].id);
                setCurrentStep('form');
              }}
            >
              <span className="text-sm font-medium">Get Started</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        )}

        {/* Registration Form */}
        {currentStep === 'form' && selectedType && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {selectedType.icon}
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Sign Up as {selectedType.title}</h1>
                <p className="text-gray-600 mt-2">{selectedType.description}</p>
              </div>

              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-800">{errors.general}</span>
                </div>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                {selectedType.fields.includes('companyName') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {selectedUserType === 'farmer' ? 'Farm Name' : 'Company Name'} *
                    </label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.companyName ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.companyName && <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City, State/Region"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.location ? 'border-red-500' : 'border-gray-300'
                      }`}
                  />
                  {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
                </div>

                {selectedType.fields.includes('certifications') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certifications *
                    </label>
                    <textarea
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="List any relevant certifications (e.g., Organic, Fair Trade, ISO)"
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.certifications ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.certifications && <p className="text-red-500 text-sm mt-1">{errors.certifications}</p>}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Page */}
        {currentStep === 'success' && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Account Created Successfully!</h1>
              <p className="text-gray-600 mb-6">
                Welcome to AGFoods! Your {selectedType?.title.toLowerCase()} account has been created.
                You can now start using our blockchain-powered supply chain tracking platform.
              </p>
              <div className="space-y-3">
                <button
                  onClick={resetForm}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={resetForm}
                  className="w-full text-gray-600 hover:text-gray-800 py-2"
                >
                  Create Another Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OnboardProcessor;
