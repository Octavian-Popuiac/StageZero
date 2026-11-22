import DisplayPage from './pages/DisplayPage';
import ControllerPage from './pages/ControllerPage';
import HomePage from './pages/HomePage';
import { PositionProvider } from './contexts/PositionContext';
import './App.css';

export default function App() {
  const path = window.location.pathname.replace(/\/$/, '');
  const page = path === '/display' ? <DisplayPage />
    : path === '/controller' ? <ControllerPage /> : <HomePage />;
  return <PositionProvider>{page}</PositionProvider>;
}
