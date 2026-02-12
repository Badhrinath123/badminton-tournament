import React, { useMemo, useRef } from 'react';
import html2canvas from 'html2canvas';
import { DateTime } from 'luxon';

const KnockoutBracket = React.memo(({
    knockoutMatches,
    tournament,
    poolMatches,
    currentUser,
    allPoolMatchesCompleted,
    setSelectedMatch,
    setScores
}) => {
    const bracketRef = useRef(null);

    // Group matches by round
    const matchesByRound = useMemo(() => {
        if (!knockoutMatches) return {};
        const byRound = {};
        knockoutMatches.forEach(match => {
            const r = match.round || 1;
            if (!byRound[r]) byRound[r] = [];
            byRound[r].push(match);
        });
        return byRound;
    }, [knockoutMatches]);

    const rounds = Object.keys(matchesByRound).sort((a, b) => a - b);

    const getRoundName = (roundNum, totalRounds) => {
        const roundInt = parseInt(roundNum);

        // For pool-based tournaments with knockout finals
        if (tournament.usePools && knockoutMatches.length > 0) {
            if (roundInt === 2) return 'Finals';
            if (roundInt === 1) return 'Semi-Finals';
        }

        // For regular knockout tournaments
        if (roundInt === totalRounds) return 'Final';
        if (roundInt === totalRounds - 1) return 'Semi-Final';
        if (roundInt === totalRounds - 2) return 'Quarter-Final';
        return `Round ${roundInt}`;
    };

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

    const exportBracket = async () => {
        if (!bracketRef.current) return;

        try {
            // Add temporary padding and background for better capture
            const element = bracketRef.current;
            const canvas = await html2canvas(element, {
                backgroundColor: '#f8fafc',
                scale: 2, // High quality
                logging: false,
                useCORS: true
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            const fileName = `${tournament.name.toLowerCase().replace(/\s+/g, '_')}_bracket.png`;

            link.href = image;
            link.download = fileName;
            link.click();
        } catch (error) {
            console.error('Failed to export bracket:', error);
        }
    };

    if (knockoutMatches.length === 0 && !tournament.usePools) return null;

    return (
        <div style={{ marginTop: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                        <span style={{ fontSize: '1.5rem' }}>🔥</span>
                    </div>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Knockout Finals</h3>
                </div>
                {knockoutMatches.length > 0 && (
                    <button
                        className="btn-secondary"
                        onClick={exportBracket}
                        style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem', fontWeight: '800' }}
                    >
                        📸 EXPORT BRACKET AS PNG
                    </button>
                )}
            </div>

            {(poolMatches.length === 0 && knockoutMatches.length === 0) ? (
                <div style={{
                    textAlign: 'center',
                    padding: '8rem 2rem',
                    background: 'white',
                    borderRadius: '24px',
                    border: '2px dashed #cbd5e1'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>⏳</div>
                    <h4 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Waiting for Participants</h4>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Fixtures will be generated once players are registered.
                    </p>
                </div>
            ) : (
                <div ref={bracketRef} className="tournament-bracket" style={{ padding: '2rem', borderRadius: '24px' }}>
                    <div style={{ marginBottom: '2rem', display: 'none' }}>
                        <h2 style={{ fontSize: '2rem' }}>{tournament.name} - Official Bracket</h2>
                    </div>
                    {rounds.map((round, rIdx) => (
                        <div key={round} className="bracket-round">
                            <div className="round-header">
                                {getRoundName(round, rounds.length)}
                            </div>
                            <div className="bracket-matches">
                                {matchesByRound[round].map(match => {
                                    const schedule = getMatchSchedule(match.scheduled_time);
                                    return (
                                        <div
                                            key={match.id}
                                            className="match-box"
                                            style={{
                                                cursor: 'pointer',
                                                borderColor: match.winner_id ? 'var(--primary)' : '#e2e8f0',
                                                minWidth: '240px',
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
                                                    fontWeight: '800',
                                                    zIndex: 1
                                                }}>
                                                    {schedule}
                                                </div>
                                            )}
                                            <div className={`match-box-player ${match.winner_id === match.player_a_id ? 'winner' : ''}`}>
                                                <span>{allPoolMatchesCompleted ? (match.player_a_id || 'TBD') : 'TBD'}</span>
                                                <span style={{ fontWeight: '800' }}>{match.score_a || 0}</span>
                                            </div>
                                            <div className="match-vs">VS</div>
                                            <div className={`match-box-player ${match.winner_id === match.player_b_id ? 'winner' : ''}`}>
                                                <span>{allPoolMatchesCompleted ? (match.player_b_id || 'TBD') : 'TBD'}</span>
                                                <span style={{ fontWeight: '800' }}>{match.score_b || 0}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

export default KnockoutBracket;
