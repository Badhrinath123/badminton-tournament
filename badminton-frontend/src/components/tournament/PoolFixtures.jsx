import React from 'react';
import { DateTime } from 'luxon';

const PoolFixtures = React.memo(({
    poolMatches,
    knockoutMatches,
    poolIndices,
    matchesByPool,
    currentUser,
    allPoolMatchesCompleted,
    generatingFinals,
    onGenerateFinals,
    setSelectedMatch,
    setScores
}) => {
    if (!poolMatches || poolMatches.length === 0) return null;

    const getMatchSchedule = (scheduledTime) => {
        if (!scheduledTime) return null;
        const dt = DateTime.fromISO(scheduledTime);
        const now = DateTime.now();
        const diff = dt.diff(now, 'minutes').minutes;

        if (diff < 0 && Math.abs(diff) < 60) return `Started ${Math.floor(Math.abs(diff))}m ago`;
        if (diff < 0) return dt.toLocaleString(DateTime.TIME_SIMPLE);
        if (diff < 60) return `Starts in ${Math.floor(diff)}m`;
        return dt.toLocaleString(DateTime.DATETIME_SHORT);
    };

    return (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem', background: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '1.5rem' }}>🎾</span>
                    </div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Round Robin Fixtures</h3>
                </div>
                {knockoutMatches.length === 0 && (
                    <button
                        className="btn-primary"
                        onClick={onGenerateFinals}
                        disabled={generatingFinals || !allPoolMatchesCompleted}
                        style={{
                            padding: '1rem 2rem',
                            opacity: allPoolMatchesCompleted ? 1 : 0.5,
                            cursor: allPoolMatchesCompleted ? 'pointer' : 'not-allowed'
                        }}
                    >
                        {generatingFinals ? 'Creating Bracket...' : '🏆 Generate Knockout Finals'}
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2rem' }}>
                {poolIndices.map(pIdx => (
                    <div key={pIdx} className="glass-card" style={{ transition: 'none', border: '1px solid var(--border)' }}>
                        <div style={{
                            background: '#f8fafc',
                            padding: '1rem',
                            textAlign: 'center',
                            borderBottom: '1px solid var(--border)',
                            fontWeight: '800',
                            fontSize: '0.85rem',
                            color: 'var(--text-muted)',
                            letterSpacing: '0.2em'
                        }}>
                            GROUP {String.fromCharCode(65 + parseInt(pIdx))}
                        </div>
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {matchesByPool[pIdx].map(match => {
                                const schedule = getMatchSchedule(match.scheduled_time);
                                return (
                                    <div
                                        key={match.id}
                                        className="match-box"
                                        style={{
                                            cursor: 'pointer',
                                            borderColor: match.winner_id ? 'var(--primary)' : '#e2e8f0',
                                            boxShadow: match.winner_id ? '0 4px 12px rgba(225, 29, 72, 0.1)' : 'none',
                                            position: 'relative'
                                        }}
                                        onClick={() => {
                                            if (currentUser.role === 'manager') {
                                                setSelectedMatch(match);
                                                setScores({ a: match.score_a || '', b: match.score_b || '' });
                                            }
                                        }}
                                    >
                                        {schedule && !match.winner_id && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '-6px',
                                                right: '12px',
                                                background: 'var(--primary)',
                                                color: 'white',
                                                fontSize: '0.7rem',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                                fontWeight: '800'
                                            }}>
                                                {schedule}
                                            </div>
                                        )}
                                        <div className={`match-box-player ${match.winner_id === match.player_a_id ? 'winner' : ''}`}>
                                            <span>{match.player_a_id}</span>
                                            <span style={{ fontWeight: '800' }}>{match.score_a || 0}</span>
                                        </div>
                                        <div className="match-vs">VS</div>
                                        <div className={`match-box-player ${match.winner_id === match.player_b_id ? 'winner' : ''}`}>
                                            <span>{match.player_b_id}</span>
                                            <span style={{ fontWeight: '800' }}>{match.score_b || 0}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default PoolFixtures;
