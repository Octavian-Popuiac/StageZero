import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DisplayPage from './pages/DisplayPage';
import ControllerPage from './pages/ControllerPage';
import ConnectionStatus from './components/ConnectionStatus';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/display" element={<DisplayPage />} />
          <Route path="/controller" element={<ControllerPage />} />
        </Routes>
      </div>
    </Router>
  );
}

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <ConnectionStatus />
      <h1>🏁 StageZero</h1>
      <div className="nav-links">
        <Link to="/display" className="nav-btn">
          📺 Display (Projetor)
        </Link>
        <Link to="/controller" className="nav-btn">
          🎮 Controlo (Telemóvel)
        </Link>
      </div>
    </div>
  );
};

export default App;