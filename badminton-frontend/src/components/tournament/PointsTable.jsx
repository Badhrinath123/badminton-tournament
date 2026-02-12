import React from 'react';

const PointsTable = React.memo(({ poolPointsTables }) => {
    if (!poolPointsTables || Object.keys(poolPointsTables).length === 0) return null;

    return (
        <div style={{ marginBottom: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '0.5rem', background: '#dbeafe', borderRadius: '12px', border: '1px solid #93c5fd' }}>
                    <span style={{ fontSize: '1.5rem' }}>📊</span>
                </div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Points Table</h3>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: Object.keys(poolPointsTables).length > 1 ? 'repeat(auto-fit, minmax(400px, 1fr))' : '1fr',
                gap: '2rem'
            }}>
                {Object.keys(poolPointsTables).sort((a, b) => a - b).map(poolIdx => (
                    <div key={poolIdx}>
                        <div style={{
                            background: 'var(--primary)',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '16px 16px 0 0',
                            textAlign: 'center',
                            fontWeight: '800',
                            fontSize: '1.1rem',
                            letterSpacing: '0.05em'
                        }}>
                            POOL {String.fromCharCode(65 + parseInt(poolIdx))}
                        </div>
                        <div className="points-table-container" style={{ borderRadius: '0 0 16px 16px', background: 'var(--card-bg)' }}>
                            <table className="points-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '60px', textAlign: 'center' }}>RANK</th>
                                        <th>TEAM / PLAYER</th>
                                        <th style={{ textAlign: 'center' }}>P</th>
                                        <th style={{ textAlign: 'center' }}>W</th>
                                        <th style={{ textAlign: 'center' }}>L</th>
                                        <th style={{ textAlign: 'center' }}>WR%</th>
                                        <th style={{ textAlign: 'center', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', width: '100px' }}>PTS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {poolPointsTables[poolIdx].map((row, i) => {
                                        const winRate = row.p > 0 ? ((row.w / row.p) * 100).toFixed(0) : 0;
                                        return (
                                            <tr key={i} style={{
                                                background: i < 2 ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                                transition: 'background 0.2s ease'
                                            }}>
                                                <td style={{ textAlign: 'center', fontWeight: '900', color: i < 2 ? 'var(--primary)' : 'var(--text-muted)' }}>
                                                    {i + 1}
                                                </td>
                                                <td style={{ fontSize: '1.05rem', fontWeight: i < 2 ? '700' : '600', color: 'var(--text-dark)' }}>{row.name}</td>
                                                <td style={{ textAlign: 'center', color: 'var(--text-dark)' }}>{row.p}</td>
                                                <td style={{ textAlign: 'center', color: 'var(--success)', fontWeight: '700' }}>{row.w}</td>
                                                <td style={{ textAlign: 'center', color: 'var(--danger)', fontWeight: '700' }}>{row.l}</td>
                                                <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{winRate}%</td>
                                                <td style={{
                                                    textAlign: 'center',
                                                    fontWeight: '900',
                                                    color: 'var(--primary)',
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    fontSize: '1.2rem'
                                                }}>{row.pts}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
});

export default PointsTable;
