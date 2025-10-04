import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VotingPage from './pages/VotingPage';
import DisplayPage from './pages/DisplayPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vote" element={<VotingPage />} />
          <Route path="/display" element={<DisplayPage />} />
        </Routes>
      </div>
    </Router>
  );
}

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <h1>🏁 StageZero</h1>
      <div className="nav-links">
        <Link to="/vote" className="nav-btn">
          📱 Votar (Pilotos)
        </Link>
        <Link to="/display" className="nav-btn">
          📺 Display (Projetor)
        </Link>
      </div>
    </div>
  );
};

export default App;