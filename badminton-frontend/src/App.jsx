import React, { useState } from 'react';
import { TournamentProvider, useTournaments } from './context/TournamentContext';
import TournamentDetail from './components/TournamentDetail';
import ThemeToggle from './components/ThemeToggle';
import { ToastProvider } from './components/Toast';
import ManagerDashboard from './components/ManagerDashboard';
import PlayerPortal from './components/PlayerPortal';
import './index.css';

const AppContent = () => {
  const { currentUser, setCurrentUser } = useTournaments();

  return (
    <div className="animate-fade-in">
      {/* Global Navigation Header */}
      <header style={{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--border)',
        padding: '1.5rem 0',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div className="container" style={{ padding: '0 var(--space-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0', cursor: 'pointer', color: 'var(--text-dark)' }} onClick={() => window.location.reload()}>
              SHUTTLESTACK
            </h1>
          </div>
          <div style={{ display: 'flex', background: 'var(--background)', padding: '0.4rem', borderRadius: '12px', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn-primary"
              onClick={() => setCurrentUser({ role: 'manager' })}
              style={{
                background: currentUser.role === 'manager' ? 'var(--primary)' : 'transparent',
                color: currentUser.role === 'manager' ? 'white' : 'var(--text-muted)',
                boxShadow: currentUser.role === 'manager' ? '0 4px 6px rgba(225, 29, 72, 0.2)' : 'none',
                padding: '0.6rem 1.2rem',
                fontSize: '0.85rem',
                border: 'none'
              }}
            >
              Manager Control
            </button>
            <button
              className="btn-primary"
              onClick={() => setCurrentUser({ role: 'player' })}
              style={{
                background: currentUser.role === 'player' ? 'var(--primary)' : 'transparent',
                color: currentUser.role === 'player' ? 'white' : 'var(--text-muted)',
                boxShadow: currentUser.role === 'player' ? '0 4px 6px rgba(225, 29, 72, 0.2)' : 'none',
                padding: '0.6rem 1.2rem',
                fontSize: '0.85rem',
                border: 'none'
              }}
            >
              Player Portal
            </button>
          </div>
        </div>
      </header>

      <main style={{ minHeight: 'calc(100vh - 80px)', background: 'var(--background)' }}>
        {currentUser.role === 'manager' ? <ManagerDashboard /> : <PlayerPortal />}
      </main>

      {/* Global Theme Toggle */}
      <ThemeToggle />
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <TournamentProvider>
        <AppContent />
      </TournamentProvider>
    </ToastProvider>
  );
}

export default App;
