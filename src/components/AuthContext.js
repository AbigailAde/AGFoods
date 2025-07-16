import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Helper: get users from localStorage
const getStoredUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('users')) || [];
  } catch {
    return [];
  }
};

// Helper: save users to localStorage
const setStoredUsers = (users) => {
  localStorage.setItem('users', JSON.stringify(users));
};

// Helper: get current user from localStorage
const getStoredCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('currentUser')) || null;
  } catch {
    return null;
  }
};

// Helper: save current user to localStorage
const setStoredCurrentUser = (user) => {
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
  } else {
    localStorage.removeItem('currentUser');
  }
};

// Helper: hash password using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredCurrentUser());

  // Sync user state with localStorage
  useEffect(() => {
    setStoredCurrentUser(user);
  }, [user]);

  // Sign up a new user (with password hashing)
  const signUp = async (userData) => {
    const users = getStoredUsers();
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase() && u.role === userData.role)) {
      throw new Error('User with this email and role already exists');
    }
    const hashedPassword = await hashPassword(userData.password);
    const newUser = {
      ...userData,
      password: hashedPassword,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    setStoredUsers(users);
    setUser(newUser); // auto-login after sign up
    return newUser;
  };

  // Login (with password hashing)
  const login = async (email, password, role) => {
    const users = getStoredUsers();
    const hashedPassword = await hashPassword(password);
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === hashedPassword && u.role === role);
    if (!found) throw new Error('Invalid credentials or role');
    setUser(found);
    return found;
  };

  // Logout
  const logout = () => {
    setUser(null);
    setStoredCurrentUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, signUp, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 