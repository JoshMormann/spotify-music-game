import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotifyService from '../services/spotify/SpotifyService';
import { useAuth } from '../contexts/AuthContext';

const redirectUri = 'https://127.0.0.1:5173/callback';

const Callback = () => {
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const errorParam = params.get('error');

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (code) {
      // Exchange code for tokens
      SpotifyService.exchangeCodeForToken(code, redirectUri)
        .then(data => {
          // Store tokens in localStorage
          localStorage.setItem('spotify_access_token', data.access_token);
          localStorage.setItem('spotify_refresh_token', data.refresh_token);
          localStorage.setItem('spotify_token_expires_in', data.expires_in);
          // Update auth context
          login({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            user: null, // Optionally fetch user profile here
          });
          navigate('/', { replace: true });
        })
        .catch(err => {
          setError('Failed to authenticate with Spotify.');
        });
    } else {
      setError('No authorization code found.');
    }
  }, [navigate, login]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>Authenticating with Spotify...</div>;
};

export default Callback; 