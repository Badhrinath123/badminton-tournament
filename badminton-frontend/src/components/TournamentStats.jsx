import React from 'react';

const TournamentStats = ({ tournament }) => {
    if (!tournament || !tournament.matches) return null;

    const totalMatches = tournament.matches.length;
    const completedMatches = tournament.matches.filter(m => m.winner_id).length;
    const pendingMatches = totalMatches - completedMatches;
    const progress = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

    const statsCards = [
        { label: 'Total Fixtures', value: totalMatches, color: 'var(--primary)' },
        { label: 'Completed', value: completedMatches, color: 'var(--success)' },
        { label: 'Pending', value: pendingMatches, color: '#f59e0b' },
        { label: 'Progress', value: `${Math.round(progress)}%`, color: '#6366f1' }
    ];

    return (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '800', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📊</span> Tournament Statistics
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {statsCards.map((stat, i) => (
                    <div key={i} className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                            {stat.label}
                        </p>
                        <p style={{ fontSize: '2rem', fontWeight: '900', color: stat.color }}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', background: '#f1f5f9', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{
                    width: `${progress}%`,
                    background: 'var(--primary)',
                    height: '100%',
                    transition: 'width 0.5s ease-out',
                    boxShadow: '0 0 10px rgba(225, 29, 72, 0.3)'
                }}></div>
            </div>
        </div>
    );
};

export default TournamentStats;
