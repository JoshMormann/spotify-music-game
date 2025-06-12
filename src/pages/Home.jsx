import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from '../components/common/LoginButton';
import SpotifyService from '../services/spotify/SpotifyService';

const redirectUri = 'https://127.0.0.1:5173/callback';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      const service = new SpotifyService();
      service.getRecentlyPlayed(10, redirectUri)
        .then(data => {
          setRecentTracks(data.items || []);
          setLoading(false);
        })
        .catch(err => {
          setError('Failed to fetch recent tracks.');
          setLoading(false);
        });
    }
  }, [isAuthenticated]);

  return (
    <div>
      <h2>Welcome to UMG Track Battle</h2>
      <p>This is the home page. Start your music game adventure!</p>
      {!isAuthenticated && <LoginButton />}
      {isAuthenticated && (
        <div style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ccc', borderRadius: 8 }}>
          <strong>Logged in as:</strong> {user?.name || 'Spotify User'}
        </div>
      )}
      {isAuthenticated && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Recently Played Tracks</h3>
          {loading && <div>Loading...</div>}
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <ul>
            {recentTracks.map((item, idx) => (
              <li key={item.track.id || idx}>
                {item.track.name} — {item.track.artists.map(a => a.name).join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Home;
