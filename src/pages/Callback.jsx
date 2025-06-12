import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotifyService from '../services/spotify/SpotifyService';
import { useAuth } from '../contexts/AuthContext';

const redirectUri = 'https://127.0.0.1:5173/callback';

const Callback = () => {
  const [error, setError] = useState(null);
  const [isExchanging, setIsExchanging] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    if (isExchanging) return;
    setIsExchanging(true);

    // If already authenticated, redirect home
    if (localStorage.getItem('spotify_access_token')) {
      navigate('/', { replace: true });
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(errorParam);
      setTimeout(() => navigate('/', { replace: true }), 2000);
      return;
    }

    if (code && sessionStorage.getItem(`spotify_code_used_${code}`)) {
      setError('This authorization code has already been used. Please try logging in again.');
      setTimeout(() => navigate('/', { replace: true }), 2000);
      return;
    }

    if (code) {
      SpotifyService.exchangeCodeForToken(code, redirectUri)
        .then(data => {
          sessionStorage.setItem(`spotify_code_used_${code}`, 'true');
          localStorage.setItem('spotify_access_token', data.access_token);
          localStorage.setItem('spotify_refresh_token', data.refresh_token);
          localStorage.setItem('spotify_token_expires_in', data.expires_in);
          login({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: null, // Optionally fetch user profile here
          });
          navigate('/', { replace: true });
        })
        .catch(err => {
          setError('Failed to authenticate with Spotify.');
          setTimeout(() => navigate('/', { replace: true }), 2000);
        });
    } else {
      setError('No authorization code found.');
      setTimeout(() => navigate('/', { replace: true }), 2000);
    }
  }, [navigate, login, isExchanging]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>Authenticating with Spotify...</div>;
};

export default Callback; 