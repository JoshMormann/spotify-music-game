import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoginButton from '../components/common/LoginButton';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

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
    </div>
  );
};

export default Home;
