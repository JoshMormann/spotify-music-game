import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from '../components/common/LoginButton';
import SpotifyService from '../services/spotify/SpotifyService';
import { getBestImage, formatDuration } from '../utils/spotifyNormalize';

const redirectUri = 'https://127.0.0.1:5173/callback';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [recentTracks, setRecentTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [albumDetails, setAlbumDetails] = useState(null);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [albumError, setAlbumError] = useState(null);
  const [testError, setTestError] = useState(null);

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

  const handleAlbumClick = (albumId) => {
    setAlbumLoading(true);
    setAlbumError(null);
    setAlbumDetails(null);
    const service = new SpotifyService();
    service.getAlbum(albumId, redirectUri)
      .then(data => {
        setAlbumDetails(data);
        setAlbumLoading(false);
      })
      .catch(err => {
        setAlbumError('Failed to fetch album details.');
        setAlbumLoading(false);
      });
  };

  const handleTestError = () => {
    setTestError(null);
    const service = new SpotifyService();
    service.getAlbum('invalid_album_id', redirectUri)
      .then(() => setTestError('Unexpected success!'))
      .catch(err => setTestError(err.message));
  };

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
              <li key={item.track.id || idx} style={{ marginBottom: 12 }}>
                <button onClick={() => handleAlbumClick(item.track.album.id)} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#1DB954', textDecoration: 'underline', padding: 0 }}>
                  {item.track.name} — {item.track.artists.map(a => a.name).join(', ')}
                </button>
                <span style={{ marginLeft: 8, color: '#888' }}>
                  ({formatDuration(item.track.durationMs)}, Popularity: {item.track.popularity})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {albumLoading && <div>Loading album details...</div>}
      {albumError && <div style={{ color: 'red' }}>{albumError}</div>}
      {albumDetails && (
        <div style={{ marginTop: '2rem', border: '1px solid #ccc', borderRadius: 8, padding: '1rem', maxWidth: 400 }}>
          <h4>{albumDetails.name}</h4>
          <div>Release Date: {albumDetails.releaseDate}</div>
          {getBestImage(albumDetails.images) && (
            <img src={getBestImage(albumDetails.images).url} alt={albumDetails.name} style={{ width: 200, marginTop: 8 }} />
          )}
          <div>Tracks: {albumDetails.tracks?.items?.length || 0}</div>
          <div>Popularity: {albumDetails.popularity}</div>
        </div>
      )}
      {isAuthenticated && (
        <div style={{ marginTop: '2rem' }}>
          <button onClick={handleTestError} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, padding: '0.5rem 1rem', cursor: 'pointer' }}>
            Test Error Handling (Invalid Album)
          </button>
          {testError && <div style={{ color: 'red', marginTop: 8 }}>{testError}</div>}
        </div>
      )}
    </div>
  );
};

export default Home;
