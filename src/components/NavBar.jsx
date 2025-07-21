import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Leaf, Package, Truck, Factory, ShoppingCart, User, Settings, LogOut, Camera, X, Save } from 'lucide-react';

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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || ''
  });
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = () => {
    // Here you would typically save to your backend
    // For now, we'll just update the local state
    console.log('Saving profile:', { ...profileData, profileImage });
    setShowEditProfile(false);
    // You could also update the user context here
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
          <Link to="/" className="flex items-center space-x-4 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-yellow-500 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">AGFoods</h1>
              (<span className="capitalize">{pageTitle}</span>)
            </div>
          </Link>
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
              <div className="relative" ref={dropdownRef}>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">{user?.firstName} {user?.lastName}</span>
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="relative w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                  >
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-sm font-semibold">
                        {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </button>
                </div>

                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          {profileImage ? (
                            <img 
                              src={profileImage} 
                              alt="Profile" 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white text-lg font-semibold">
                              {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || 'U'}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-gray-500">{user?.email}</p>
                          <p className="text-xs text-green-600 capitalize">{user?.role}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowEditProfile(true);
                          setShowProfileDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="w-4 h-4 mr-3" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileDropdown(false);
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </button>
                    </div>
                    
                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Image Upload */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    {profileImage ? (
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-2xl font-semibold">
                        {user?.firstName?.charAt(0) || user?.lastName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-green-600 transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500">Click the camera icon to upload a photo</p>
              </div>

              {/* Profile Form */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea
                    rows={3}
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    placeholder="Tell us about yourself..."
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 