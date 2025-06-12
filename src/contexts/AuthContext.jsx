import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null,
  });

  // Placeholder login/logout logic
  const login = (tokens) => {
    setAuth({
      ...auth,
      isAuthenticated: true,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user || null,
    });
  };

  const logout = () => {
    setAuth({ isAuthenticated: false, accessToken: null, refreshToken: null, user: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 