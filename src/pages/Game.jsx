import React, { useEffect, useState } from 'react';
import SpotifyService from '../services/spotify/SpotifyService';
import { getBestImage } from '../utils/spotifyNormalize';

const redirectUri = 'https://127.0.0.1:5173/callback';

const Game = () => {
  const [hand, setHand] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const service = new SpotifyService(localStorage.getItem('spotify_access_token'));
    service.getRecentlyPlayed(20, redirectUri)
      .then(data => {
        // Pick 12 unique tracks for the hand
        const uniqueTracks = [];
        const seen = new Set();
        for (const item of data.items) {
          if (!seen.has(item.track.id) && uniqueTracks.length < 12) {
            uniqueTracks.push(item.track);
            seen.add(item.track.id);
          }
        }
        setHand(uniqueTracks);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch hand.');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2>Game Screen</h2>
      <p>Your hand for this round:</p>
      {loading && <div>Loading hand...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 16,
          padding: '1rem 0',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {hand.map(track => (
          <div
            key={track.id}
            style={{
              minWidth: 140,
              maxWidth: 160,
              background: '#181818',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#fff',
              flex: '0 0 auto',
            }}
          >
            {getBestImage(track.album.images) && (
              <img
                src={getBestImage(track.album.images).url}
                alt={track.name}
                style={{
                  width: 100,
                  height: 100,
                  objectFit: 'cover',
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              />
            )}
            <div style={{ fontWeight: 600, fontSize: 15, textAlign: 'center', marginBottom: 4 }}>
              {track.name}
            </div>
            <div style={{ fontSize: 13, color: '#b3b3b3', textAlign: 'center' }}>
              {track.artists.map(a => a.name).join(', ')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Game;
