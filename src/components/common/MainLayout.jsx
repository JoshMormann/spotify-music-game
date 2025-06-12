import React from 'react';

const MainLayout = ({ children }) => (
  <main style={{ minHeight: '80vh', padding: '2rem 1rem', maxWidth: 1200, margin: '0 auto' }}>
    {children}
  </main>
);

export default MainLayout;
