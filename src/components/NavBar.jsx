import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b shadow-sm py-3 px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link to="/" className="font-bold text-green-700 text-xl">AGFoods</Link>
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
      </div>
      <div className="flex items-center space-x-4">
        {isAuthenticated && user && (
          <span className="text-gray-700 text-sm">Logged in as <span className="font-semibold capitalize">{user.firstName} {user.lastName}</span> (<span className="capitalize">{user.role}</span>)</span>
        )}
        {isAuthenticated && (
          <button onClick={handleLogout} className="ml-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Logout</button>
        )}
      </div>
    </nav>
  );
} 