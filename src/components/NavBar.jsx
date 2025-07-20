import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Leaf, Package, Truck, Factory, ShoppingCart } from 'lucide-react';

const roleIcons = {
  farmer: <Package className="w-5 h-5 text-green-600" />,
  distributor: <Truck className="w-5 h-5 text-orange-600" />,
  processor: <Factory className="w-5 h-5 text-purple-600" />,
  consumer: <ShoppingCart className="w-5 h-5 text-blue-600" />,
};

const roleTitles = {
  farmer: 'Farmer Dashboard',
  distributor: 'Distributor Dashboard',
  processor: 'Processor Dashboard',
  consumer: 'Consumer Dashboard',
};

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  let pageTitle = 'AGFoods';
  let pageIcon = <Leaf className="w-6 h-6 text-white" />;
  if (isAuthenticated && user && location.pathname.includes('dashboard')) {
    pageTitle = roleTitles[user.role] || 'Dashboard';
    pageIcon = roleIcons[user.role] || <Leaf className="w-6 h-6 text-white" />;
  }

  return (
    <header className="bg-white shadow-sm border-b w-full">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="w-10 h-10 bg-gradient-to-br from-green-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AGFoods</h1>
              (<span className="capitalize">{pageTitle}</span>)
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-700 hover:text-green-700">Home</Link>
            {isAuthenticated && (
              <>
                <Link to={`/${user.role}/dashboard`} className="text-gray-700 hover:text-green-700 capitalize">Dashboard</Link>
                <Link to="/wallet" className="text-gray-700 hover:text-green-700">Wallet</Link>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="text-gray-700 hover:text-green-700">Login</Link>
                <div className="relative group">
                  <button className="text-gray-700 hover:text-green-700">Sign Up</button>
                  <div className="absolute left-0 mt-2 w-32 bg-white border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Link to="/signup/farmer" className="block px-4 py-2 hover:bg-green-50">Farmer</Link>
                    <Link to="/signup/processor" className="block px-4 py-2 hover:bg-green-50">Processor</Link>
                    <Link to="/signup/distributor" className="block px-4 py-2 hover:bg-green-50">Distributor</Link>
                    <Link to="/signup/consumer" className="block px-4 py-2 hover:bg-green-50">Consumer</Link>
                  </div>
                </div>
              </>
            )}
            {isAuthenticated && user && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</span>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">S</span>
                </div>
              </div>
            )}
            
            {isAuthenticated && (
              <button onClick={handleLogout} className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Logout</button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 