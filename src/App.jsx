import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { DynamiteProvider, useDynamite } from './context/DynamiteContext';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Workspace from './components/Workspace';
import StudyRoom from './components/StudyRoom';
import Friends from './pages/Friends';

function RequireUser({ children }) {
  const { user, loading } = useDynamite();
  if (loading) return <div className="app-loading"><span className="loading-spark">✦</span><strong>Opening your little world…</strong></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useDynamite();
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/dashboard" element={<RequireUser><Dashboard /></RequireUser>} />
        <Route path="/room" element={<RequireUser><Workspace /></RequireUser>} />
        <Route path="/friends" element={<RequireUser><Friends /></RequireUser>} />
        <Route path="/study-room" element={<RequireUser><StudyRoom /></RequireUser>} />
        <Route path="/study-room/:roomId" element={<RequireUser><StudyRoom /></RequireUser>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return <DynamiteProvider><BrowserRouter><AppRoutes /></BrowserRouter></DynamiteProvider>;
}
