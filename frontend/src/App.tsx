import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DisplayPage from './pages/DisplayPage';
import ControllerPage from './pages/ControllerPage';
import TeamManager from './components/TeamManager';
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
const [activeTab, setActiveTab] = React.useState<'nav' | 'teams'>('nav');

  return (
    <div className="home-page">
      <ConnectionStatus />
      <h1>🏁 StageZero</h1>
      <div className='tab-buttons'>
        <button className={`tab-btn ${activeTab === 'nav' ? 'active' : ''}`} onClick={() => setActiveTab('nav')}>
          Navegação
        </button>
        <button className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`} onClick={() => setActiveTab('teams')}>
          Gerir Equipas
        </button>
      </div>

      {activeTab === 'nav' && (
        <div className='nav-links'>
          <Link to="display" className='nav-btn'>
            Modo Display
          </Link>
          <Link to="/controller" className='nav-btn'>
            Modo Controlador
          </Link>
        </div>
      )}

      {activeTab === 'teams' && (
        <TeamManager />
      )}
    </div>
  );
};

export default App;