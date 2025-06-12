import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Hydrate from localStorage if available
  const getInitialAuth = () => {
    const accessToken = localStorage.getItem('spotify_access_token');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    // Optionally, you could also load user info if you store it
    if (accessToken && refreshToken) {
      return {
        isAuthenticated: true,
        accessToken,
        refreshToken,
        user: null, // Optionally, load user from storage
      };
    }
    return {
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    };
  };

  const [auth, setAuth] = useState(getInitialAuth);

  // Keep localStorage in sync on login/logout
  useEffect(() => {
    if (auth.isAuthenticated) {
      localStorage.setItem('spotify_access_token', auth.accessToken);
      localStorage.setItem('spotify_refresh_token', auth.refreshToken);
      // Optionally, store user info
    } else {
      localStorage.removeItem('spotify_access_token');
      localStorage.removeItem('spotify_refresh_token');
      // Optionally, remove user info
    }
  }, [auth.isAuthenticated, auth.accessToken, auth.refreshToken]);

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