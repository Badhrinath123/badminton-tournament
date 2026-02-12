import React, { useState } from 'react';
import { useTournaments } from '../context/TournamentContext';
import { useToast } from './Toast';
import { SkeletonCard } from './LoadingSpinner';
import { useDebounce } from '../hooks/useDebounce';
import { generateKnockoutFixtures, generatePoolFixtures } from '../utils/fixtureLogic';
import TournamentDetail from './TournamentDetail';
import Notification from './Notification';

const ManagerDashboard = () => {
    const { tournaments, addTournament, deleteTournament, loading } = useTournaments();
    const toast = useToast();
    const [selectedTournamentId, setSelectedTournamentId] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [notification, setNotification] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [filterType, setFilterType] = useState('all');
    const [formData, setFormData] = useState({
        name: '',
        type: 'singles',
        teamCount: '8',
        usePools: false,
        poolCount: 2,
        managerName: '',
        managerPhone: '',
        managerEmail: '',
        rules: '',
        entryFee: '',
        prizePool: ''
    });

    const handleCreate = async (e) => {
        e.preventDefault();
        const count = parseInt(formData.teamCount, 10);

        if (!formData.usePools) {
            const isPowerOfTwo = (n) => n > 1 && (n & (n - 1)) === 0;
            if (!isPowerOfTwo(count)) {
                toast.error('Knockout tournament team count must be a power of 2 (e.g., 2, 4, 8, 16, 32)');
                return;
            }
        }

        setIsLoading(true);
        try {
            const res = formData.usePools
                ? generatePoolFixtures([], parseInt(formData.poolCount, 10))
                : { matches: generateKnockoutFixtures(Array.from({ length: count })) };

            const tournamentData = {
                ...formData,
                teamCount: count,
                maxCapacity: count,
                players: [],
                pools: res.pools || [],
                matches: (res.matches || []).map(m => ({
                    ...m,
                    type: formData.usePools ? 'pool' : 'knockout'
                })),
                status: 'active'
            };

            await addTournament(tournamentData);
            toast.success(`Tournament "${formData.name}" created successfully!`);
            setShowCreateModal(false);
            setFormData({
                name: '',
                type: 'singles',
                teamCount: '8',
                usePools: false,
                poolCount: 2,
                managerName: '',
                managerPhone: '',
                managerEmail: '',
                rules: '',
                entryFee: '',
                prizePool: ''
            });
        } catch (error) {
            toast.error('Failed to create tournament. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteTournament = (id, name) => {
        setNotification({
            type: 'confirm',
            message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            onConfirm: async () => {
                try {
                    await deleteTournament(id);
                    toast.success(`Tournament "${name}" deleted successfully`);
                    setNotification(null);
                } catch (error) {
                    toast.error('Failed to delete tournament. Please try again.');
                    setNotification(null);
                }
            }
        });
    };

    const selectedTournament = tournaments.find(t => t.id === selectedTournamentId);

    const filteredTournaments = tournaments.filter(t => {
        const matchesSearch = t.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="container" style={{ paddingTop: 'var(--space-xl)', paddingBottom: '5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-xl)' }}>
                <div>
                    <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--text-dark)' }}>
                        Manager Dashboard
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>Manage and monitor your active tournaments</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search tournaments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '0.8rem 1.2rem',
                                borderRadius: '12px',
                                border: '1.5px solid var(--border)',
                                width: '250px',
                                background: 'white'
                            }}
                        />
                    </div>
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)} style={{ padding: '0.8rem 2rem' }}>
                        <span style={{ fontSize: '1.2rem', lineHeight: '0' }}>+</span> CREATE TOURNAMENT
                    </button>
                </div>
            </div>

            {showCreateModal && (
                <div className="glass-card animate-fade-in" style={{ marginBottom: 'var(--space-xl)', padding: '2.5rem', border: '1px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.8rem' }}>New Tournament Setup</h3>
                        <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
                    </div>

                    <form onSubmit={handleCreate}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-dark)' }}>TOURNAMENT NAME</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Winter Open Championship"
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '1rem' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-dark)' }}>GAME TYPE</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '1rem', background: 'white' }}
                                >
                                    <option value="singles">Singles</option>
                                    <option value="doubles">Doubles</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-dark)' }}>PLAYER COUNT (TOTAL)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.teamCount}
                                    onChange={e => setFormData({ ...formData, teamCount: e.target.value })}
                                    placeholder="8"
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '1rem' }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>For Knockout, use 2, 4, 8, 16, 32...</p>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', marginBottom: '2.5rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: '800', cursor: 'pointer', color: 'var(--text-dark)' }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.usePools}
                                        onChange={e => setFormData({ ...formData, usePools: e.target.checked })}
                                        style={{ width: '22px', height: '22px', accentColor: 'var(--primary)' }}
                                    />
                                    Enable Pool Stage (Round Robin)
                                </label>
                                {formData.usePools && (
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <label style={{ fontWeight: '800', fontSize: '0.8rem' }}>NUMBER OF POOLS</label>
                                        <input
                                            type="number"
                                            value={formData.poolCount}
                                            onChange={e => setFormData({ ...formData, poolCount: e.target.value })}
                                            style={{ width: '70px', padding: '0.6rem', borderRadius: '8px', border: '1.5px solid var(--border)', textAlign: 'center' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <h4 style={{ marginBottom: '1.25rem', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>MANAGER CONTACT DETAILS</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                                <input
                                    required
                                    value={formData.managerName}
                                    onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                                    placeholder="Full Name"
                                    style={{ padding: '0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)' }}
                                />
                                <input
                                    value={formData.managerPhone}
                                    onChange={e => setFormData({ ...formData, managerPhone: e.target.value })}
                                    placeholder="Phone Number"
                                    style={{ padding: '0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)' }}
                                />
                                <input
                                    type="email"
                                    value={formData.managerEmail}
                                    onChange={e => setFormData({ ...formData, managerEmail: e.target.value })}
                                    placeholder="Email Address"
                                    style={{ padding: '0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)' }}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h4 style={{ marginBottom: '1.25rem', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>PREMIUM TOURNAMENT DETAILS</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '800', fontSize: '0.8rem' }}>ENTRY FEE (Per Player/Team)</label>
                                    <input
                                        type="number"
                                        value={formData.entryFee}
                                        onChange={e => setFormData({ ...formData, entryFee: e.target.value })}
                                        placeholder="e.g. 500"
                                        style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '800', fontSize: '0.8rem' }}>TOTAL PRIZE POOL</label>
                                    <input
                                        type="number"
                                        value={formData.prizePool}
                                        onChange={e => setFormData({ ...formData, prizePool: e.target.value })}
                                        placeholder="e.g. 5000"
                                        style={{ width: '100%', padding: '0.9rem', borderRadius: '10px', border: '1.5px solid var(--border)' }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.6rem', fontWeight: '800', fontSize: '0.8rem' }}>TOURNAMENT RULES & GUIDELINES</label>
                                <textarea
                                    value={formData.rules}
                                    onChange={e => setFormData({ ...formData, rules: e.target.value })}
                                    placeholder="Enter tournament-specific rules, format details, and prize distribution..."
                                    rows="4"
                                    style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '0.9rem', fontFamily: 'inherit' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-start' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '1.1rem 3rem', fontSize: '1rem' }}>INITIALIZE TOURNAMENT</button>
                            <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)} style={{ padding: '1.1rem 2rem', background: 'none' }}>CANCEL</button>
                        </div>
                    </form>
                </div>
            )}

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
                            {searchTerm ? 'No Tournaments Found' : 'Empty Dashboard'}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}>
                            {searchTerm
                                ? `We couldn't find any tournaments matching "${searchTerm}". Try a different search term or clear the filter.`
                                : 'Ready to host a tournament? Click the "Create Tournament" button to get started.'}
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
                        <div
                            key={t.id}
                            className="glass-card animate-slide-up"
                            style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                            onClick={() => setSelectedTournamentId(t.id)}
                        >
                            <div className="card-red-cap"></div>
                            <div style={{ padding: '2.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                                    <h3 style={{ color: 'var(--text-dark)', fontSize: '1.5rem', fontWeight: '900', lineHeight: '1.1' }}>{t.name || 'Untitled'}</h3>
                                    <button
                                        className="btn-secondary"
                                        style={{
                                            padding: '0.4rem 0.8rem',
                                            background: '#fff1f2',
                                            color: '#e11d48',
                                            border: '1px solid #fecdd3',
                                            fontSize: '0.7rem',
                                            fontWeight: '900'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteTournament(t.id, t.name);
                                        }}
                                    >
                                        DELETE
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '2.5rem' }}>
                                    <span className="badge badge-primary">{t.type}</span>
                                    <span className="badge">{t.usePools ? 'Pool-based' : 'Knockout'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ width: '8px', height: '8px', background: t.players?.length >= t.teamCount ? '#94a3b8' : 'var(--success)', borderRadius: '50%' }}></span>
                                        <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '700' }}>
                                            {t.players?.length || 0} / {t.teamCount || '?'} Full
                                        </span>
                                    </div>
                                    <span style={{ color: 'var(--primary)', fontSize: '0.9rem', fontWeight: '900', letterSpacing: '0.02em' }}>
                                        MANAGE →
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {selectedTournament && (
                <TournamentDetail
                    tournament={selectedTournament}
                    onClose={() => setSelectedTournamentId(null)}
                />
            )}

            {notification && (
                <Notification
                    {...notification}
                    onCancel={() => setNotification(null)}
                />
            )}
        </div>
    );
};

export default ManagerDashboard;
