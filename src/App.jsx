import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ChevronRight, Leaf, Factory, Truck, ShoppingCart, QrCode, Shield, Users, TrendingUp } from 'lucide-react';
import Home from './components/Home';
import Wallet from './components/Wallet';
import CustomerOrderDashboard from "./components/Consumer";
import FarmerDashboard from "./components/Farmer";
import ProcessorDashboard from "./components/Processor";
import DistributorDashboard from "./components/Distributor";
import OnboardFarmer from "./components/SignUp/Farmer";
import OnboardDistributor from "./components/SignUp/Distributor";
import OnboardConsumer from "./components/SignUp/Consumer";
import OnboardProcessor from "./components/SignUp/Processor";
import Login from './components/Login';
import { useAuth } from './components/AuthContext';
import NavBar from './components/NavBar';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
    const [selectedUserType, setSelectedUserType] = useState(null);

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

  const Layout = () => (
    <header className="bg-white shadow-sm border-b w-full">
      <div className="mzx-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AGFoods</h1>
              <p className="text-sm text-gray-600">Farm to Table Verification</p>
            </div>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            About
          </button>
        </div>
      </div>
    </header>
  );

	return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/processor/dashboard" element={<PrivateRoute><ProcessorDashboard userType={selectedUserType} onSelect={handleUserTypeSelect} /></PrivateRoute>} />
        <Route path="/wallet" element={<PrivateRoute><Wallet /></PrivateRoute>} />
        <Route path="/distributor/dashboard" element={<PrivateRoute><DistributorDashboard userType={selectedUserType} onSelect={handleUserTypeSelect} /></PrivateRoute>} />
        <Route path="/farmer/dashboard" element={<PrivateRoute><FarmerDashboard userTypes={userTypes} onSelect={handleUserTypeSelect} /></PrivateRoute>} />
        <Route path="/consumer/dashboard" element={<PrivateRoute><CustomerOrderDashboard userTypes={userTypes} onSelect={handleUserTypeSelect} /></PrivateRoute>} />
        <Route path="/products/:id" element={<PrivateRoute><FarmerDashboard userType="farmer" /></PrivateRoute>} />
        <Route path="/signup/farmer" element={<OnboardFarmer />} />
        <Route path="/signup/processor" element={<OnboardProcessor />} />
        <Route path="/signup/distributor" element={<OnboardDistributor />} />
        <Route path="/signup/consumer" element={<OnboardConsumer />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<div className="text-center mt-10 text-red-500">404 - Page Not Found</div>} />
      </Routes>
      <footer className="bg-gray-900 text-white py-12 w-full">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold">AGFoods</span>
            </div>
            <p className="text-gray-400 text-sm">© 2025 AGFoods. Powered by blockchain technology.</p>
          </div>
        </div>
      </footer>
    </BrowserRouter>
	);
}
export default App;

