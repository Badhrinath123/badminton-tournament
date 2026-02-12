import React, { useState } from 'react';
import { useTournaments } from '../context/TournamentContext';
import { useToast } from './Toast';
import { SkeletonCard } from './LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';

const PlayerPortal = () => {
    const { tournaments, registerPlayer, loading } = useTournaments();
    const toast = useToast();
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [isRegistering, setIsRegistering] = useState(false);
    const [regData, setRegData] = useState({ name: '', phone: '', email: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filterType, setFilterType] = useState('all');

    const filteredTournaments = tournaments.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
    });

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsRegistering(true);
        try {
            await registerPlayer(selectedTournament.id, regData);
            toast.success(`Successfully registered for ${selectedTournament.name}!`);
            setSelectedTournament(null);
            setRegData({ name: '', phone: '', email: '' });
        } catch (error) {
            toast.error('Registration failed. Please try again.');
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '5rem' }}>
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-dark)' }}>
                    Player Portal
                </h2>
                <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Discover and register for upcoming badminton championships</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: 'var(--space-xl)', background: 'white', padding: '2rem', borderRadius: '20px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800' }}>Find Your Next Tournament</h3>
                <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px', relative: 'true' }}>
                        <input
                            type="text"
                            placeholder="Search by tournament name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ width: '100%', padding: '1rem 1.5rem', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '1rem', background: '#f8fafc' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            className={filterType === 'all' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setFilterType('all')}
                            style={{ padding: '0.8rem 1.5rem', fontSize: '0.85rem' }}
                        >
                            All Categories
                        </button>
                        <button
                            className={filterType === 'singles' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setFilterType('singles')}
                            style={{ padding: '0.8rem 1.5rem', fontSize: '0.85rem' }}
                        >
                            Singles
                        </button>
                        <button
                            className={filterType === 'doubles' ? 'btn-primary' : 'btn-secondary'}
                            onClick={() => setFilterType('doubles')}
                            style={{ padding: '0.8rem 1.5rem', fontSize: '0.85rem' }}
                        >
                            Doubles
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '2.5rem' }}>
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))
                ) : filteredTournaments.length === 0 ? (
                    <div style={{
                        gridColumn: '1 / -1',
                        padding: '6rem 2rem',
                        textAlign: 'center',
                        background: 'white',
                        borderRadius: '24px',
                        border: '2.5px dashed var(--border)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>
                            {searchTerm ? '🔍' : '🏟️'}
                        </div>
                        <h3 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>
                            {searchTerm ? 'No Tournaments Found' : 'Empty Portal'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            {searchTerm
                                ? `We couldn't find any tournaments matching "${searchTerm}".`
                                : 'Check back later for new tournaments!'}
                        </p>
                        {searchTerm && (
                            <button
                                className="btn-secondary"
                                onClick={() => setSearchTerm('')}
                                style={{ marginTop: '1.5rem', background: 'white' }}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    filteredTournaments.map(t => (
                        <div key={t.id} className="glass-card animate-slide-up" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="card-red-cap"></div>
                            <div style={{ padding: '2.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ color: 'var(--text-dark)', fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.75rem' }}>{t.name}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                    <span className="badge badge-primary">{t.type}</span>
                                    <span className="badge" style={{ color: 'var(--text-muted)' }}>{t.players.length} / {t.teamCount || '?'} Spots Taken</span>
                                </div>

                                {t.players.length >= (t.teamCount || 999) ? (
                                    <button className="btn-secondary" disabled style={{ width: '100%', opacity: 0.5, cursor: 'not-allowed', padding: '1rem' }}>
                                        REGISTRATION CLOSED
                                    </button>
                                ) : (
                                    <button className="btn-primary" onClick={() => setSelectedTournament(t)} style={{ width: '100%', padding: '1rem' }}>
                                        REGISTER NOW
                                    </button>
                                )}

                                <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                    <h4 style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PREVIEW FIXTURES</h4>
                                    {t.matches && t.matches.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {t.matches.filter(m => m.round === 1 || m.type === 'pool').slice(0, 3).map(m => (
                                                <div key={m.id} style={{ fontSize: '0.85rem', color: 'var(--text-dark)', background: '#f8fafc', padding: '0.75rem', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                                    <span>{m.player_a_id || 'TBD'}</span>
                                                    <span style={{ color: 'var(--primary)', opacity: 0.5 }}>VS</span>
                                                    <span>{m.player_b_id || 'TBD'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Will be generated soon...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedTournament && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(15, 23, 42, 0.1)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                }}>
                    <div className="glass-card" style={{ width: '450px', padding: '0', background: 'white', border: 'none', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ background: 'var(--primary)', color: 'white', padding: '2rem', textAlign: 'center' }}>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.5rem' }}>TOURNAMENT REGISTRATION</h3>
                            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>{selectedTournament.name}</p>
                        </div>

                        <div style={{ padding: '2.5rem' }}>
                            <form onSubmit={handleRegister}>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', fontSize: '0.85rem' }}>PARTICIPANT NAME</label>
                                    <input required className="form-input" style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1.5px solid var(--border)' }} value={regData.name} onChange={e => setRegData({ ...regData, name: e.target.value })} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', fontSize: '0.85rem' }}>PHONE</label>
                                        <input className="form-input" style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1.5px solid var(--border)' }} value={regData.phone} onChange={e => setRegData({ ...regData, phone: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', fontSize: '0.85rem' }}>EMAIL</label>
                                        <input type="email" className="form-input" style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1.5px solid var(--border)' }} value={regData.email} onChange={e => setRegData({ ...regData, email: e.target.value })} />
                                    </div>
                                </div>

                                {selectedTournament.type === 'doubles' && (
                                    <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '2px dashed var(--border)' }}>
                                        <h4 style={{ marginBottom: '1.5rem', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--primary)' }}>PARTNER INFORMATION</h4>
                                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '800', fontSize: '0.85rem' }}>PARTNER NAME</label>
                                            <input required className="form-input" style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', border: '1.5px solid var(--border)' }} value={regData.name2 || ''} onChange={e => setRegData({ ...regData, name2: e.target.value })} />
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem' }}>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                        disabled={isRegistering}
                                        style={{ flex: 1, padding: '1rem' }}
                                    >
                                        {isRegistering ? 'REGISTERING...' : 'REGISTER'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setSelectedTournament(null)}
                                        disabled={isRegistering}
                                        style={{ flex: 1, padding: '1rem', background: '#f1f5f9' }}
                                    >
                                        CANCEL
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlayerPortal;
