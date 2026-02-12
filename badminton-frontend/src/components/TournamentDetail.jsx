import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTournaments } from '../context/TournamentContext';
import PointsTable from './tournament/PointsTable';
import TournamentHeader from './tournament/TournamentHeader';
import PoolFixtures from './tournament/PoolFixtures';
import KnockoutBracket from './tournament/KnockoutBracket';
import TournamentStats from './TournamentStats';
import Notification from './Notification';
import Confetti from './Confetti';
import { useToast } from './Toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DateTime } from 'luxon';

const TournamentDetail = ({ tournament, onClose }) => {
    const { updateMatchResult, fetchTournaments, generateFixtures, clearMatchResult, currentUser } = useTournaments();
    const toast = useToast();
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [scores, setScores] = useState({ a: '', b: '' });
    const [generatingFinals, setGeneratingFinals] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [vsPlayers, setVsPlayers] = useState({ p1: '', p2: '' });

    // Real-time polling
    useEffect(() => {
        const interval = setInterval(() => {
            fetchTournaments();
            setLastUpdated(new Date());
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchTournaments]);

    // Ensure matches is a valid array of objects
    const validMatches = useMemo(() => {
        if (!tournament || !Array.isArray(tournament.matches)) return [];
        return tournament.matches.filter(m => m && typeof m === 'object');
    }, [tournament]);

    // Group pool matches
    const poolMatches = useMemo(() => {
        return validMatches.filter(m => m && (m.type === 'pool' || (m.pool_index !== null && m.pool_index !== undefined)));
    }, [validMatches]);

    // Process pool matches into structure
    const matchesByPool = useMemo(() => {
        const byPool = {};
        poolMatches.forEach(match => {
            const pIdx = (match.pool_index !== null && match.pool_index !== undefined) ? match.pool_index : 0;
            if (!byPool[pIdx]) {
                byPool[pIdx] = [];
            }
            byPool[pIdx].push(match);
        });
        return byPool;
    }, [poolMatches]);

    // Check if pool stage is complete
    const allPoolMatchesCompleted = useMemo(() => {
        if (!tournament.usePools) return true;
        if (poolMatches.length === 0) return false;
        return poolMatches.every(m => m.winner_id);
    }, [poolMatches, tournament.usePools]);

    const handleGenerate = useCallback(async () => {
        if (!allPoolMatchesCompleted) {
            toast.warning('Please complete all pool matches before generating finals.');
            return;
        }
        setIsGenerating(true);
        try {
            await generateFixtures(tournament.id);
            toast.success('Initial fixtures generated successfully!');
        } catch (error) {
            toast.error('Failed to generate fixtures.');
        } finally {
            setIsGenerating(false);
        }
    }, [allPoolMatchesCompleted, tournament.id, generateFixtures, toast]);

    const poolPointsTables = useMemo(() => {
        if (!tournament || !tournament.players || !tournament.matches) return {};

        try {
            const poolTables = {};
            const poolMatchesFilter = validMatches.filter(m => m.type === 'pool');

            poolMatchesFilter.forEach(m => {
                const poolIdx = (m.pool_index !== null && m.pool_index !== undefined) ? m.pool_index : 0;
                if (!poolTables[poolIdx]) poolTables[poolIdx] = {};
            });

            poolMatchesFilter.forEach(m => {
                const poolIdx = (m.pool_index !== null && m.pool_index !== undefined) ? m.pool_index : 0;
                const pA = m.player_a_id;
                const pB = m.player_b_id;

                if (!pA || !pB) return;
                if (!poolTables[poolIdx]) poolTables[poolIdx] = {};

                if (!poolTables[poolIdx][pA]) poolTables[poolIdx][pA] = { name: pA, p: 0, w: 0, l: 0, pts: 0 };
                if (!poolTables[poolIdx][pB]) poolTables[poolIdx][pB] = { name: pB, p: 0, w: 0, l: 0, pts: 0 };

                if (m.winner_id) {
                    poolTables[poolIdx][pA].p += 1;
                    poolTables[poolIdx][pB].p += 1;

                    if (m.winner_id === pA) {
                        poolTables[poolIdx][pA].w += 1;
                        poolTables[poolIdx][pA].pts += 2;
                        poolTables[poolIdx][pB].l += 1;
                    } else if (m.winner_id === pB) {
                        poolTables[poolIdx][pB].w += 1;
                        poolTables[poolIdx][pB].pts += 2;
                        poolTables[poolIdx][pA].l += 1;
                    }
                }
            });

            Object.keys(poolTables).forEach(poolIdx => {
                poolTables[poolIdx] = Object.values(poolTables[poolIdx]).sort((a, b) => b.pts - a.pts || b.w - a.w);
            });

            return poolTables;
        } catch (err) {
            return {};
        }
    }, [tournament, validMatches]);

    const knockoutMatches = useMemo(() => {
        return validMatches.filter(m => m && m.type !== 'pool' && m.pool_index === null);
    }, [validMatches]);

    const tournamentWinner = useMemo(() => {
        const finalsMatch = knockoutMatches.find(m => m.round === 2 && m.winner_id);
        return finalsMatch?.winner_id || null;
    }, [knockoutMatches]);

    useEffect(() => {
        if (tournamentWinner) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [tournamentWinner]);

    const handleExportPDF = useCallback(async () => {
        try {
            if (!tournament || !validMatches.length) {
                toast.warning("No data to export.");
                return;
            }

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            doc.setFontSize(22);
            doc.text(tournament.name || "Tournament Results", pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(12);
            doc.text(`Type: ${tournament.type} | Format: ${tournament.usePools ? 'Pool-based' : 'Knockout'}`, pageWidth / 2, 30, { align: 'center' });
            doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 37, { align: 'center' });

            let currentY = 50;

            if (tournament.usePools && Object.keys(poolPointsTables).length > 0) {
                doc.setFontSize(16);
                doc.text("Points Table", 14, currentY);
                currentY += 10;

                Object.keys(poolPointsTables).forEach((poolIdx, index) => {
                    doc.setFontSize(14);
                    doc.text(`Pool ${String.fromCharCode(65 + parseInt(poolIdx))}`, 14, currentY);

                    const tableData = poolPointsTables[poolIdx].map((p, i) => [i + 1, p.name, p.p, p.w, p.l, p.pts]);

                    autoTable(doc, {
                        startY: currentY + 5,
                        head: [['Pos', 'Player', 'P', 'W', 'L', 'Pts']],
                        body: tableData,
                        theme: 'grid',
                        headStyles: { fillColor: [37, 99, 235] }
                    });

                    currentY = doc.lastAutoTable.finalY + 15;

                    if (currentY > 250 && index < Object.keys(poolPointsTables).length - 1) {
                        doc.addPage();
                        currentY = 20;
                    }
                });
            }

            if (currentY > 230) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFontSize(16);
            doc.text("Match Results", 14, currentY);
            currentY += 10;

            const matchData = validMatches.map(m => [
                m.type === 'pool' ? `Pool ${String.fromCharCode(65 + (m.pool_index || 0))}` : `Round ${m.round === 2 ? 'Final' : 'SF'}`,
                m.player_a_id || '-',
                `${m.score_a || 0} - ${m.score_b || 0}`,
                m.player_b_id || '-',
                m.winner_id ? m.winner_id : 'TBD'
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Stage', 'Player A', 'Score', 'Player B', 'Winner']],
                body: matchData,
                theme: 'striped',
                headStyles: { fillColor: [71, 85, 105] }
            });

            const fileName = (tournament.name || "results").toLowerCase().replace(/[^a-z0-9]/g, '_') + "_results.pdf";

            if ('showSaveFilePicker' in window) {
                try {
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{ description: 'PDF Document', accept: { 'application/pdf': ['.pdf'] } }]
                    });
                    const writable = await handle.createWritable();
                    await writable.write(doc.output('blob'));
                    await writable.close();
                    toast.success("PDF saved successfully!");
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                    console.warn("Picker failed, falling back to direct save", err);
                }
            }

            doc.save(fileName);
            toast.info("PDF Downloaded");
        } catch (error) {
            toast.error("Failed to export PDF.");
        }
    }, [tournament, validMatches, poolPointsTables, toast]);

    if (!tournament) return null;

    const poolIndices = Object.keys(matchesByPool).sort((a, b) => a - b);

    const handleSetWinner = useCallback(async (winnerId) => {
        if (!selectedMatch) return;
        try {
            await updateMatchResult(tournament.id, selectedMatch.id, winnerId, scores.a || 0, scores.b || 0, selectedMatch.scheduled_time);
            toast.success('Match result updated!');
            setSelectedMatch(null);
            setScores({ a: '', b: '' });
        } catch (error) {
            toast.error('Failed to update result.');
        }
    }, [selectedMatch, tournament.id, updateMatchResult, scores, toast]);

    const handleUpdateSchedule = useCallback(async (newTime) => {
        if (!selectedMatch) return;
        try {
            await updateMatchResult(tournament.id, selectedMatch.id, selectedMatch.winner_id, selectedMatch.score_a, selectedMatch.score_b, newTime);
            toast.success('Match schedule updated!');
        } catch (error) {
            toast.error('Failed to update schedule.');
        }
    }, [selectedMatch, tournament.id, updateMatchResult, toast]);

    const handleClearResult = useCallback(async () => {
        if (!selectedMatch) return;
        try {
            await updateMatchResult(tournament.id, selectedMatch.id, null, 0, 0);
            toast.info('Match result cleared.');
            setSelectedMatch(null);
            setScores({ a: '', b: '' });
        } catch (error) {
            toast.error('Failed to clear result.');
        }
    }, [selectedMatch, tournament.id, updateMatchResult, toast]);

    const handleGenerateFinals = useCallback(async () => {
        setGeneratingFinals(true);
        try {
            const res = await fetch(`http://localhost:5001/api/tournaments/${tournament.id}/generate-finals`, { method: 'POST' });
            if (res.ok) {
                await fetchTournaments();
                toast.success('Finals fixtures generated!');
            } else {
                toast.error('Failed to generate finals.');
            }
        } catch (err) {
            toast.error('Network error while generating finals.');
        }
        setGeneratingFinals(false);
    }, [tournament.id, fetchTournaments, toast]);

    const findHeadToHead = useMemo(() => {
        if (!vsPlayers.p1 || !vsPlayers.p2) return null;
        const history = validMatches.filter(m =>
            (m.player_a_id === vsPlayers.p1 && m.player_b_id === vsPlayers.p2) ||
            (m.player_a_id === vsPlayers.p2 && m.player_b_id === vsPlayers.p1)
        );
        const p1Wins = history.filter(m => m.winner_id === vsPlayers.p1).length;
        const p2Wins = history.filter(m => m.winner_id === vsPlayers.p2).length;
        return { history, p1Wins, p2Wins };
    }, [vsPlayers, validMatches]);

    return (
        <div className="animate-fade-in" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'var(--background)', zIndex: 1000, overflowY: 'auto'
        }}>
            <Confetti active={showConfetti} />
            <div className="container" style={{ position: 'relative' }}>
                <TournamentHeader
                    tournament={tournament} lastUpdated={lastUpdated} currentUser={currentUser}
                    isGenerating={isGenerating} handleGenerate={handleGenerate}
                    handleExportPDF={handleExportPDF} showSettings={showSettings}
                    setShowSettings={setShowSettings} onClose={onClose}
                />
                <TournamentStats
                    teamCount={tournament.teamCount} itemCount={tournament.players?.length || 0}
                    totalMatches={validMatches.length} completedMatches={validMatches.filter(m => m.winner_id).length}
                />

                {tournamentWinner && (
                    <div className="glass-card animate-slide-up" style={{
                        padding: '3rem', textAlign: 'center', marginBottom: 'var(--space-xl)',
                        background: 'linear-gradient(135deg, var(--primary), #3b82f6)', color: 'white'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
                        <h2 style={{ color: 'white', fontSize: '2.5rem' }}>Tournament Champion</h2>
                        <h1 style={{ color: 'white', fontSize: '4rem' }}>{tournamentWinner}</h1>
                    </div>
                )}

                <PointsTable poolPointsTables={poolPointsTables} />

                <div className="glass-card" style={{ padding: '2rem', marginBottom: 'var(--space-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ padding: '0.5rem', background: '#ecfeff', borderRadius: '12px' }}>🛡️</div>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Head-to-Head</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '2rem', alignItems: 'center' }}>
                        <select className="form-control" value={vsPlayers.p1} onChange={(e) => setVsPlayers({ ...vsPlayers, p1: e.target.value })}>
                            <option value="">Select Player 1</option>
                            {tournament.players.map(p => <option key={p.id} value={p.name2 ? `${p.name} & ${p.name2}` : p.name}>{p.name2 ? `${p.name} & ${p.name2}` : p.name}</option>)}
                        </select>
                        <div style={{ fontWeight: '900' }}>VS</div>
                        <select className="form-control" value={vsPlayers.p2} onChange={(e) => setVsPlayers({ ...vsPlayers, p2: e.target.value })}>
                            <option value="">Select Player 2</option>
                            {tournament.players.map(p => <option key={p.id} value={p.name2 ? `${p.name} & ${p.name2}` : p.name}>{p.name2 ? `${p.name} & ${p.name2}` : p.name}</option>)}
                        </select>
                    </div>
                    {findHeadToHead && (
                        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem' }}>
                                <div><div style={{ fontSize: '3rem' }}>{findHeadToHead.p1Wins}</div><div>WINS</div></div>
                                <div><div style={{ fontSize: '3rem' }}>{findHeadToHead.p2Wins}</div><div>WINS</div></div>
                            </div>
                        </div>
                    )}
                </div>

                <PoolFixtures
                    poolMatches={poolMatches} knockoutMatches={knockoutMatches}
                    poolIndices={poolIndices} matchesByPool={matchesByPool}
                    currentUser={currentUser} allPoolMatchesCompleted={allPoolMatchesCompleted}
                    generatingFinals={generatingFinals} onGenerateFinals={handleGenerateFinals}
                    setSelectedMatch={setSelectedMatch} setScores={setScores}
                />
                <KnockoutBracket
                    knockoutMatches={knockoutMatches} tournament={tournament}
                    poolMatches={poolMatches} currentUser={currentUser}
                    allPoolMatchesCompleted={allPoolMatchesCompleted}
                    setSelectedMatch={setSelectedMatch} setScores={setScores}
                />
            </div>

            {selectedMatch && (
                <div className="animate-fade-in" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
                }}>
                    <div className="glass-card animate-slide-up" style={{ width: '400px', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Set Match Result</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{selectedMatch.player_a_id}</span>
                                <input type="number" value={scores.a} onChange={(e) => setScores({ ...scores, a: e.target.value })} style={{ width: '60px' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>{selectedMatch.player_b_id}</span>
                                <input type="number" value={scores.b} onChange={(e) => setScores({ ...scores, b: e.target.value })} style={{ width: '60px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <button className="btn-primary" onClick={() => handleSetWinner(selectedMatch.player_a_id)}>A Wins</button>
                                <button className="btn-primary" onClick={() => handleSetWinner(selectedMatch.player_b_id)}>B Wins</button>
                            </div>
                            <button className="btn-secondary" onClick={handleClearResult}>Clear</button>
                            <button className="btn-secondary" onClick={() => setSelectedMatch(null)}>Cancel</button>

                            <div style={{ marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                                <h4 style={{ fontSize: '0.9rem' }}>🕒 Schedule</h4>
                                <input
                                    type="datetime-local"
                                    className="form-control"
                                    defaultValue={selectedMatch.scheduled_time ? DateTime.fromISO(selectedMatch.scheduled_time).toFormat("yyyy-MM-dd'T'HH:mm") : ''}
                                    onChange={(e) => handleUpdateSchedule(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentDetail;
