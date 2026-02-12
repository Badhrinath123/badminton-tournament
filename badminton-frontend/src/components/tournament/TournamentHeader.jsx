import React from 'react';

const TournamentHeader = React.memo(({
    tournament,
    lastUpdated,
    currentUser,
    isGenerating,
    handleGenerate,
    handleExportPDF,
    showSettings,
    setShowSettings,
    onClose
}) => {
    return (
        <div style={{ padding: 'var(--space-xl) 0', borderBottom: '1px solid var(--border)', marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '3.5rem', marginBottom: '0.75rem', letterSpacing: '-0.03em', color: 'var(--text-dark)' }}>{tournament.name}</h2>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className="badge badge-primary">{tournament.type}</span>
                        <span className="badge">{tournament.usePools ? 'Pool-based' : 'Knockout'}</span>
                        <span className="badge" style={{ color: 'var(--text-muted)' }}>{tournament.players?.length || 0} / {tournament.teamCount} Players</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: '800', color: 'var(--success)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <span className="animate-pulse" style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }}></span>
                            LIVE • {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className="btn-secondary"
                        onClick={handleExportPDF}
                        style={{ padding: '1.25rem 1.5rem', fontWeight: '800' }}
                    >
                        📊 EXPORT PDF
                    </button>

                    {currentUser.role === 'manager' && tournament.usePools && (!tournament.matches || tournament.matches.length === 0) && (
                        <button
                            className="btn-primary"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            style={{ padding: '1rem 2rem', fontWeight: '800' }}
                        >
                            {isGenerating ? 'GENERATING...' : 'GENERATE POOL FIXTURES'}
                        </button>
                    )}
                    {currentUser.role === 'manager' && (
                        <button className="btn-secondary" onClick={() => setShowSettings(!showSettings)} style={{ padding: '1rem 1.5rem', fontWeight: '800' }}>
                            ⚙️ SETTINGS
                        </button>
                    )}
                    <button className="btn-secondary" onClick={onClose} style={{ padding: '1rem 1.5rem', fontWeight: '800' }}>
                        ✕ CLOSE VIEW
                    </button>
                </div>
            </div>
        </div>
    );
});

export default TournamentHeader;
