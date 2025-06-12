import React from 'react';

const Footer = () => (
  <footer style={{ padding: '1rem', background: '#222', color: '#fff', textAlign: 'center', marginTop: '2rem' }}>
    <small>&copy; {new Date().getFullYear()} UMG Track Battle</small>
  </footer>
);

export default Footer;
