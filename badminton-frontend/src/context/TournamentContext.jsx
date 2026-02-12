import React, { createContext, useContext, useState, useEffect } from 'react';

const TournamentContext = createContext();
const getApiUrl = () => {
    // Priority 1: Environment variable (for Production/Cloud)
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

    // Priority 2: Localtunnel subdomain fallback
    const hostname = window.location.hostname;
    if (hostname === 'badminton-app-test.loca.lt') return 'https://badminton-api-test.loca.lt/api';

    // Priority 3: Local Network / localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') return 'http://localhost:5001/api';
    return `http://${hostname}:5001/api`;
};
const API_URL = getApiUrl();

export const TournamentProvider = ({ children }) => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(() => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : { role: 'player' };
    });

    const fetchTournaments = async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${API_URL}/tournaments`);
            const data = await resp.json();
            setTournaments(data);
        } catch (err) {
            console.error('Failed to fetch tournaments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    useEffect(() => {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }, [currentUser]);

    const addTournament = async (tournament) => {
        try {
            const resp = await fetch(`${API_URL}/tournaments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tournament),
            });
            if (resp.ok) {
                await fetchTournaments();
            }
        } catch (err) {
            console.error('Failed to add tournament:', err);
        }
    };

    const deleteTournament = async (id) => {
        try {
            const resp = await fetch(`${API_URL}/tournaments/${id}`, {
                method: 'DELETE',
            });
            if (resp.ok) {
                await fetchTournaments();
            }
        } catch (err) {
            console.error('Failed to delete tournament:', err);
        }
    };

    const registerPlayer = async (tournamentId, player) => {
        try {
            const resp = await fetch(`${API_URL}/tournaments/${tournamentId}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(player),
            });
            if (resp.ok) {
                await fetchTournaments();
            }
        } catch (err) {
            console.error('Failed to register player:', err);
        }
    };

    const updateMatchResult = async (tournamentId, matchId, winnerId, scoreA, scoreB, scheduledTime) => {
        try {
            const resp = await fetch(`${API_URL}/matches/${matchId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ winnerId, tournamentId, scoreA, scoreB, scheduledTime }),
            });
            if (resp.ok) {
                await fetchTournaments();
            }
        } catch (err) {
            console.error('Failed to update match result:', err);
        }
    };

    const clearMatchResult = async (tournamentId, matchId) => {
        try {
            const resp = await fetch(`${API_URL}/matches/${matchId}/result?tournamentId=${tournamentId}`, {
                method: 'DELETE',
            });
            if (resp.ok) {
                await fetchTournaments();
            }
        } catch (err) {
            console.error('Failed to clear match result:', err);
        }
    };

    const generateFixtures = async (tournamentId) => {
        try {
            const resp = await fetch(`${API_URL}/tournaments/${tournamentId}/generate-fixtures`, {
                method: 'POST',
            });
            if (resp.ok) {
                await fetchTournaments();
            } else {
                const data = await resp.json();
                console.error('Fixture generation failed:', data.error);
            }
        } catch (err) {
            console.error('Failed to generate fixtures:', err);
        }
    };

    const getActivityLogs = async (tournamentId) => {
        try {
            const resp = await fetch(`${API_URL}/tournaments/${tournamentId}/activity`);
            return await resp.json();
        } catch (err) {
            console.error('Failed to fetch activity logs:', err);
            return [];
        }
    };

    return (
        <TournamentContext.Provider value={{
            tournaments,
            addTournament,
            deleteTournament,
            registerPlayer,
            updateMatchResult,
            clearMatchResult,
            fetchTournaments,
            generateFixtures,
            getActivityLogs,
            currentUser,
            setCurrentUser,
            loading
        }}>
            {children}
        </TournamentContext.Provider>
    );
};

export const useTournaments = () => useContext(TournamentContext);
