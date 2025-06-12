import React from 'react';

const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const redirectUri = 'https://127.0.0.1:5173/callback';
const scopes = ['user-read-recently-played'];

const loginUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes.join(' '))}&response_type=code&show_dialog=true`;

const LoginButton = () => (
  <a href={loginUrl} style={{
    display: 'inline-block',
    padding: '0.75rem 1.5rem',
    background: '#1DB954',
    color: '#fff',
    borderRadius: 24,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    margin: '1rem 0',
  }}>
    Login with Spotify
  </a>
);

export default LoginButton; 