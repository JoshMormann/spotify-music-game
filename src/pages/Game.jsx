import React, { useEffect, useState } from 'react';
import SpotifyService from '../services/spotify/SpotifyService';
import { getBestImage } from '../utils/spotifyNormalize';

const redirectUri = 'https://127.0.0.1:5173/callback';

// Static prompt list (expand as needed)
const PROMPTS = [
  {
    id: 'oldest',
    text: 'Play the oldest track!',
    compare: (a, b) => new Date(a.album.releaseDate) - new Date(b.album.releaseDate),
    getValue: t => t.album.releaseDate,
    valueLabel: 'Release Date',
  },
  {
    id: 'longest',
    text: 'Play the longest track!',
    compare: (a, b) => b.durationMs - a.durationMs,
    getValue: t => t.durationMs,
    valueLabel: 'Duration (ms)',
  },
  {
    id: 'most-popular',
    text: 'Play the most popular track!',
    compare: (a, b) => b.popularity - a.popularity,
    getValue: t => t.popularity,
    valueLabel: 'Popularity',
  },
  // Add more prompts as desired
];

function getRandomPrompt(prevId) {
  if (PROMPTS.length === 1) return PROMPTS[0];
  let prompt;
  do {
    prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
  } while (prompt.id === prevId);
  return prompt;
}

const HAND_SIZE = 12;
const ROUNDS = 5;

const Game = () => {
  const [playerHand, setPlayerHand] = useState([]);
  const [computerHand, setComputerHand] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [round, setRound] = useState(1);
  const [prompt, setPrompt] = useState(null);
  const [playerSelection, setPlayerSelection] = useState(null);
  const [computerSelection, setComputerSelection] = useState(null);
  const [winner, setWinner] = useState(null);
  const [scores, setScores] = useState({ player: 0, computer: 0 });
  const [showResult, setShowResult] = useState(false);

  // Fetch hand on mount
  useEffect(() => {
    setLoading(true);
    const service = new SpotifyService(localStorage.getItem('spotify_access_token'));
    service.getRecentlyPlayed(20, redirectUri)
      .then(data => {
        // Pick 12 unique tracks for the hand
        const uniqueTracks = [];
        const seen = new Set();
        for (const item of data.items) {
          if (!seen.has(item.track.id) && uniqueTracks.length < HAND_SIZE) {
            uniqueTracks.push(item.track);
            seen.add(item.track.id);
          }
        }
        setPlayerHand(uniqueTracks);
        // For now, computer gets a shuffled copy
        setComputerHand(shuffle([...uniqueTracks]));
        setPrompt(getRandomPrompt());
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch hand.');
        setLoading(false);
      });
  }, []);

  // Shuffle helper
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Handle player selection
  const handleSelect = idx => {
    if (playerSelection !== null || showResult) return; // Prevent double select
    setPlayerSelection(idx);
    // Computer selects after short delay
    setTimeout(() => {
      const compIdx = getComputerSelectionIdx(computerHand, prompt);
      setComputerSelection(compIdx);
      // Determine winner
      const playerTrack = playerHand[idx];
      const computerTrack = computerHand[compIdx];
      const cmp = prompt.compare(playerTrack, computerTrack);
      let roundWinner = null;
      if (cmp < 0) roundWinner = 'player';
      else if (cmp > 0) roundWinner = 'computer';
      else roundWinner = 'tie';
      setWinner(roundWinner);
      setShowResult(true);
      setScores(s => ({
        player: s.player + (roundWinner === 'player' ? 1 : 0),
        computer: s.computer + (roundWinner === 'computer' ? 1 : 0),
      }));
    }, 700);
  };

  // Computer selection logic: pick best track for prompt
  function getComputerSelectionIdx(hand, prompt) {
    let bestIdx = 0;
    let bestValue = prompt.getValue(hand[0]);
    for (let i = 1; i < hand.length; i++) {
      const val = prompt.getValue(hand[i]);
      if (prompt.compare(hand[i], hand[bestIdx]) < 0) {
        bestIdx = i;
        bestValue = val;
      }
    }
    return bestIdx;
  }

  // Next round
  const nextRound = () => {
    if (round >= ROUNDS) {
      // Game over, reset for now
      setRound(1);
      setScores({ player: 0, computer: 0 });
      setPrompt(getRandomPrompt(prompt?.id));
      setPlayerSelection(null);
      setComputerSelection(null);
      setWinner(null);
      setShowResult(false);
      return;
    }
    setRound(r => r + 1);
    setPrompt(getRandomPrompt(prompt?.id));
    setPlayerSelection(null);
    setComputerSelection(null);
    setWinner(null);
    setShowResult(false);
  };

  return (
    <div>
      <h2>Game Screen</h2>
      <div style={{ marginBottom: 16 }}>
        <strong>Round:</strong> {round} / {ROUNDS} &nbsp; | &nbsp;
        <strong>Score:</strong> You {scores.player} - {scores.computer} Computer
      </div>
      {loading && <div>Loading hand...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {prompt && (
        <div style={{ fontSize: 20, fontWeight: 600, margin: '1rem 0' }}>{prompt.text}</div>
      )}
      {/* Player hand */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          gap: 16,
          padding: '1rem 0',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {playerHand.map((track, idx) => (
          <div
            key={track.id}
            onClick={() => handleSelect(idx)}
            style={{
              minWidth: 140,
              maxWidth: 160,
              background: idx === playerSelection ? '#1DB954' : '#181818',
              borderRadius: 12,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: '#fff',
              flex: '0 0 auto',
              cursor: playerSelection === null && !showResult ? 'pointer' : 'default',
              opacity: playerSelection !== null && idx !== playerSelection ? 0.5 : 1,
              border: idx === playerSelection ? '2px solid #fff' : '2px solid transparent',
              transition: 'background 0.2s, border 0.2s, opacity 0.2s',
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
      {/* Show result and computer hand selection */}
      {showResult && (
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            {winner === 'tie' && (<>It&apos;s a tie!</>)}
            {winner === 'player' && (<>You win this round!</>)}
            {winner === 'computer' && (<>Computer wins this round!</>)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 16 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Your Pick</div>
              {playerSelection !== null && (
                <TrackCard track={playerHand[playerSelection]} highlight />
              )}
              <div style={{ marginTop: 4, fontSize: 13 }}>
                {prompt.valueLabel}: {prompt.getValue(playerHand[playerSelection])}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Computer Pick</div>
              {computerSelection !== null && (
                <TrackCard track={computerHand[computerSelection]} highlight />
              )}
              <div style={{ marginTop: 4, fontSize: 13 }}>
                {prompt.valueLabel}: {prompt.getValue(computerHand[computerSelection])}
              </div>
            </div>
          </div>
          <button
            onClick={nextRound}
            style={{
              marginTop: 24,
              background: '#1DB954',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '0.8rem 2rem',
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              letterSpacing: 1,
              transition: 'background 0.2s',
            }}
          >
            {round >= ROUNDS ? 'Restart Game' : 'Next Round'}
          </button>
        </div>
      )}
    </div>
  );
};

// TrackCard for result display
function TrackCard({ track, highlight }) {
  if (!track) return null;
  return (
    <div
      style={{
        minWidth: 120,
        maxWidth: 140,
        background: highlight ? '#1DB954' : '#181818',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#fff',
      }}
    >
      {getBestImage(track.album.images) && (
        <img
          src={getBestImage(track.album.images).url}
          alt={track.name}
          style={{
            width: 80,
            height: 80,
            objectFit: 'cover',
            borderRadius: 6,
            marginBottom: 6,
          }}
        />
      )}
      <div style={{ fontWeight: 600, fontSize: 14, textAlign: 'center', marginBottom: 2 }}>
        {track.name}
      </div>
      <div style={{ fontSize: 12, color: '#b3b3b3', textAlign: 'center' }}>
        {track.artists.map(a => a.name).join(', ')}
      </div>
    </div>
  );
}

export default Game;
