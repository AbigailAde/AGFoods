import { useState } from "react";
import { Link } from 'react-router-dom';
import { ChevronRight, Leaf, Factory, Truck, ShoppingCart, QrCode, Shield, Users, TrendingUp, HelpCircle, Wallet } from 'lucide-react';
import { useAuth } from './AuthContext';

function Home() {
  const [selectedUserType, setSelectedUserType] = useState(null);
  const { isAuthenticated, user } = useAuth();

  const userTypes = [
    {
      id: 'farmer',
      title: 'Farmer',
      description: 'Register your farm, create product batches, and track your plantain from harvest',
      icon: <Leaf className="w-8 h-8 text-green-600" />,
      color: 'from-green-500 to-emerald-600',
      features: ['Register harvest batches', 'Upload farm certifications', 'Track product journey']
    },
    {
      id: 'processor',
      title: 'Processor',
      description: 'Convert plantain to flour, add quality checks, and maintain processing records',
      icon: <Factory className="w-8 h-8 text-blue-600" />,
      color: 'from-blue-500 to-indigo-600',
      features: ['Quality control tracking', 'Processing documentation', 'Batch management']
    },
    {
      id: 'distributor',
      title: 'Distributor',
      description: 'Manage logistics, update delivery status, and handle wholesale/retail operations',
      icon: <Truck className="w-8 h-8 text-purple-600" />,
      color: 'from-purple-500 to-violet-600',
      features: ['Logistics tracking', 'Inventory management', 'Supply chain updates']
    },
    {
      id: 'consumer',
      title: 'Consumer',
      description: 'Scan QR codes to verify product authenticity and trace your plantain flour back to the farm',
      icon: <QrCode className="w-8 h-8 text-orange-600" />,
      color: 'from-orange-500 to-red-600',
      features: ['QR code scanning', 'Product verification', 'Farm-to-table journey']
    }
  ];

  const handleUserTypeSelect = (userType) => {
    setSelectedUserType(userType);
    // In a real app, this would navigate to the specific dashboard
    console.log(`Navigating to ${userType} dashboard...`);
  };

  const features = [
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: 'Blockchain Security',
      description: 'Immutable records ensure product authenticity and prevent fraud'
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: 'Complete Traceability',
      description: 'Track every step from farm to consumer with transparent supply chain'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      title: 'Quality Assurance',
      description: 'Real-time quality checks and certifications at every stage'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Trace Your Plantain Flour
            <span className="bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent block">
              From Farm to Table
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            Ensuring quality, authenticity, and transparency in the plantain flour supply chain through blockchain technology.
          </p>

          {/* Simplified User Type Selection */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">Select Your Role</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userTypes.map((type) => (
                <Link
                  key={type.id}
                  to={isAuthenticated ? `/${user.role}/dashboard` : `/signup/${type.id}`}
                  className="group block bg-white rounded-xl p-6 text-center border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="mb-3 flex items-center justify-center w-16 h-16 rounded-full mx-auto">
                    {type.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {type.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose AGFoods?</h3>
            <p className="text-lg text-gray-600">
              Blockchain-powered transparency for your plantain flour supply chain
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Help Section */}
      <section className="py-12 bg-green-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-green-100">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Help Connecting?</h3>
            <p className="text-gray-600 mb-6">
              To use AGFoods, you need a Web3 wallet like MetaMask or Coinbase Wallet.
              This allows you to securely interact with the blockchain.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <Wallet className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">1. Get a Wallet</h4>
                  <p className="text-sm text-gray-600">Install MetaMask or Coinbase Wallet extension for your browser.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                <Shield className="w-5 h-5 text-green-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-gray-900">2. Connect</h4>
                  <p className="text-sm text-gray-600">Click the "Connect Wallet" button in the top right corner.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Removed to reduce busy-ness */}
    </div>
  );
}
export default Home;

