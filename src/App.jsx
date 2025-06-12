import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import MainLayout from './components/common/MainLayout';
import Home from './pages/Home';
import Game from './pages/Game';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import Callback from './pages/Callback';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/game" element={<Game />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/callback" element={<Callback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
        <Footer />
      </Router>
    </AuthProvider>
  );
}

export default App;
