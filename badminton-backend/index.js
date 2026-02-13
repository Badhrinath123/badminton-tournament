const express = require('express');
const cors = require('cors');
const db = require('./db');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS !== '*'
        ? process.env.ALLOWED_ORIGINS.split(',')
        : '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: process.env.ALLOWED_ORIGINS && process.env.ALLOWED_ORIGINS !== '*'
}));
app.use(express.json());

// Test route
app.get('/test', (req, res) => {
    res.json({ message: 'Server is working!' });
});

// Swagger UI - try after json middleware
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerDocument));



// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

/**
 * @swagger
 * /api/tournaments:
 *   get:
 *     summary: Retrieve all tournaments
 *     responses:
 *       200:
 *         description: A list of tournaments with players and matches.
 */
app.get('/api/tournaments', async (req, res) => {
    try {
        const { rows: tournaments } = await db.query('SELECT *, team_count as "teamCount", use_pools as "usePools", pool_count as "poolCount", manager_name as "managerName", manager_phone as "managerPhone", manager_email as "managerEmail", rules, entry_fee as "entryFee", prize_pool as "prizePool" FROM tournaments ORDER BY created_at DESC');

        const fullTournaments = await Promise.all(tournaments.map(async (t) => {
            const { rows: players } = await db.query('SELECT * FROM players WHERE tournament_id = $1', [t.id]);
            const { rows: matches } = await db.query('SELECT * FROM matches WHERE tournament_id = $1', [t.id]);
            return { ...t, players, matches };
        }));

        res.json(fullTournaments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/tournaments:
 *   post:
 *     summary: Create a new tournament
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               type: { type: string }
 *               usePools: { type: boolean }
 *               poolCount: { type: integer }
 *               managerName: { type: string }
 *               managerPhone: { type: string }
 *               managerEmail: { type: string }
 *               players: { type: array }
 *               matches: { type: array }
 *     responses:
 *       201:
 *         description: Tournament created successfully.
 */
app.post('/api/tournaments', async (req, res) => {
    const { name, type, usePools, poolCount, managerName, managerPhone, managerEmail, teamCount, players, matches, rules, entryFee, prizePool } = req.body;

    // Validate power of 2 for knockout
    if (!usePools) {
        const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0;
        if (!isPowerOfTwo(teamCount)) {
            return res.status(400).json({ error: 'Knockout tournament team count must be a power of 2 (e.g., 2, 4, 8, 16, 32)' });
        }
    }

    try {
        const { rows: [tournament] } = await db.query(
            'INSERT INTO tournaments (name, type, use_pools, pool_count, manager_name, manager_phone, manager_email, team_count, rules, entry_fee, prize_pool) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [name, type, usePools, poolCount, managerName, managerPhone, managerEmail, teamCount, rules, entryFee, prizePool]
        );

        // Log tournament creation
        await logActivity(tournament.id, 'TOURNAMENT_CREATED', { name, type, teamCount });

        if (players && players.length > 0) {
            for (const p of players) {
                await db.query(
                    'INSERT INTO players (tournament_id, name, phone, email, name2, phone2, email2) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    [tournament.id, p.name, p.phone, p.email, p.name2, p.phone2, p.email2]
                );
            }
        }

        if (matches && matches.length > 0) {
            for (const m of matches) {
                await db.query(
                    'INSERT INTO matches (id, tournament_id, round, player_a_id, player_b_id, next_match_id, next_match_side, type, pool_index) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
                    [m.id, tournament.id, m.round, m.playerA, m.playerB, m.nextMatchId, m.nextMatchSide, m.type, m.poolIndex]
                );
            }
        }

        res.status(201).json(tournament);
    } catch (err) {
        console.error('Error in POST /api/tournaments:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

/**
 * @swagger
 * /api/tournaments/{id}:
 *   delete:
 *     summary: Delete a tournament
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Tournament deleted successfully.
 */
app.delete('/api/tournaments/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM tournaments WHERE id = $1', [id]);
        res.json({ success: true, message: 'Tournament deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/tournaments/{id}/register:
 *   post:
 *     summary: Register a player for a tournament
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       201:
 *         description: Player registered successfully.
 */
const generatePoolMatches = (players, poolCount) => {
    const pools = Array.from({ length: poolCount }, () => []);
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    shuffled.forEach((player, index) => {
        pools[index % poolCount].push(player);
    });

    const matches = [];
    pools.forEach((pool, poolIndex) => {
        for (let i = 0; i < pool.length; i++) {
            for (let j = i + 1; j < pool.length; j++) {
                const playerAName = pool[i].name2 ? `${pool[i].name} & ${pool[i].name2}` : pool[i].name;
                const playerBName = pool[j].name2 ? `${pool[j].name} & ${pool[j].name2}` : pool[j].name;
                matches.push({
                    id: `pool${poolIndex}-m${i}-${j}`,
                    type: 'pool',
                    poolIndex,
                    playerA: playerAName,
                    playerB: playerBName,
                });
            }
        }
    });

    return matches;
};

app.post('/api/tournaments/:id/register', async (req, res) => {
    const { id } = req.params;
    const { name, phone, email } = req.body;
    try {
        // Check tournament capacity
        const { rows: [tournament] } = await db.query('SELECT *, use_pools as "usePools", pool_count as "poolCount" FROM tournaments WHERE id = $1', [id]);
        const { rows: playersCount } = await db.query('SELECT COUNT(*) as count FROM players WHERE tournament_id = $1', [id]);

        if (parseInt(playersCount[0].count) >= tournament.team_count) {
            return res.status(400).json({ error: 'Tournament is full' });
        }

        // Register player
        const { rows: [player] } = await db.query(
            'INSERT INTO players (tournament_id, name, phone, email, name2, phone2, email2) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [id, name, phone, email, req.body.name2, req.body.phone2, req.body.email2]
        );

        // Get all players for assignment/generation
        const { rows: allPlayers } = await db.query(
            'SELECT id, name, name2 FROM players WHERE tournament_id = $1 ORDER BY created_at',
            [id]
        );

        if (tournament.usePools) {
            // Generate fixtures only when full
            if (allPlayers.length === tournament.team_count) {
                const matches = generatePoolMatches(allPlayers, tournament.poolCount);
                for (const m of matches) {
                    await db.query(
                        'INSERT INTO matches (id, tournament_id, player_a_id, player_b_id, type, pool_index) VALUES ($1, $2, $3, $4, $5, $6)',
                        [m.id, id, m.playerA, m.playerB, 'pool', m.poolIndex]
                    );
                }
            }
        } else {
            // Update knockout matches with player names
            const { rows: matches } = await db.query(
                'SELECT * FROM matches WHERE tournament_id = $1 AND round = 1 ORDER BY id',
                [id]
            );

            // Assign players to matches in order
            for (let i = 0; i < matches.length; i++) {
                const match = matches[i];
                const pA = allPlayers[i * 2];
                const pB = allPlayers[i * 2 + 1];

                const playerA = pA ? (pA.name2 ? `${pA.name} & ${pA.name2}` : pA.name) : null;
                const playerB = pB ? (pB.name2 ? `${pB.name} & ${pB.name2}` : pB.name) : null;

                await db.query(
                    'UPDATE matches SET player_a_id = $1, player_b_id = $2 WHERE id = $3 AND tournament_id = $4',
                    [playerA, playerB, match.id, id]
                );
            }
        }

        res.status(201).json(player);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/matches/{id}:
 *   patch:
 *     summary: Update a match winner and progress them
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Match updated successfully.
 */
// Activity Logging Helper
const logActivity = async (tournamentId, action, details) => {
    try {
        await db.query(
            'INSERT INTO activity_log (tournament_id, action, details) VALUES ($1, $2, $3)',
            [tournamentId, action, JSON.stringify(details)]
        );
    } catch (err) {
        console.error('Logging failed:', err);
    }
};

/**
 * @swagger
 * /api/matches/{id}:
 *   patch:
 *     summary: Update a match winner and progress them
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Match updated successfully.
 */
app.patch('/api/matches/:id', async (req, res) => {
    const { id } = req.params;
    const { winnerId, tournamentId, scoreA, scoreB, scheduledTime } = req.body;
    try {
        // Update the match winner and scores
        await db.query(
            'UPDATE matches SET winner_id = $1, score_a = $2, score_b = $3, scheduled_time = $4 WHERE id = $5 AND tournament_id = $6',
            [winnerId || null, scoreA, scoreB, scheduledTime, id, tournamentId]
        );

        // Log the activity
        await logActivity(tournamentId, 'MATCH_UPDATE', { id, winnerId, scoreA, scoreB, scheduledTime });

        // Get the current match to find next match info
        const { rows: [currentMatch] } = await db.query(
            'SELECT * FROM matches WHERE id = $1 AND tournament_id = $2',
            [id, tournamentId]
        );

        // If there's a next match, progress the winner
        if (currentMatch && currentMatch.next_match_id) {
            const field = currentMatch.next_match_side === 'A' ? 'player_a_id' : 'player_b_id';

            await db.query(
                `UPDATE matches SET ${field} = $1 WHERE id = $2 AND tournament_id = $3`,
                [winnerId, currentMatch.next_match_id, tournamentId]
            );
        }

        res.json({ success: true, message: 'Match updated and winner progressed' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/matches/{id}/result:
 *   delete:
 *     summary: Clear a match winner and reset progression
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Match result cleared successfully.
 */
app.delete('/api/matches/:id/result', async (req, res) => {
    const { id } = req.params;
    const { tournamentId } = req.query;
    try {
        const { rows: [currentMatch] } = await db.query('SELECT * FROM matches WHERE id = $1 AND tournament_id = $2', [id, tournamentId]);

        if (currentMatch) {
            // Clear current match winner
            await db.query('UPDATE matches SET winner_id = NULL WHERE id = $1 AND tournament_id = $2', [id, tournamentId]);

            // If it was progressed, clear it from the next match too
            if (currentMatch.next_match_id) {
                const field = currentMatch.next_match_side === 'A' ? 'player_a_id' : 'player_b_id';
                await db.query(`UPDATE matches SET ${field} = NULL WHERE id = $2 AND tournament_id = $3`, [null, currentMatch.next_match_id, tournamentId]);
            }
        }

        res.json({ success: true, message: 'Match result cleared' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /api/tournaments/{id}/generate-fixtures:
 *   post:
 *     summary: Manually generate fixtures for a tournament
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Fixtures generated successfully.
 */
app.post('/api/tournaments/:id/generate-fixtures', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows: [tournament] } = await db.query('SELECT *, use_pools as "usePools", pool_count as "poolCount" FROM tournaments WHERE id = $1', [id]);
        if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

        const { rows: allPlayers } = await db.query(
            'SELECT id, name, name2 FROM players WHERE tournament_id = $1 ORDER BY created_at',
            [id]
        );

        if (tournament.usePools) {
            // Check if matches already exist
            const { rows: existingMatches } = await db.query('SELECT COUNT(*) FROM matches WHERE tournament_id = $1', [id]);
            if (parseInt(existingMatches[0].count) > 0) {
                return res.status(400).json({ error: 'Fixtures already exist for this tournament' });
            }

            const matches = generatePoolMatches(allPlayers, tournament.poolCount);
            for (const m of matches) {
                await db.query(
                    'INSERT INTO matches (id, tournament_id, player_a_id, player_b_id, type, pool_index) VALUES ($1, $2, $3, $4, $5, $6)',
                    [m.id, id, m.playerA, m.playerB, 'pool', m.poolIndex]
                );
            }
            res.json({ success: true, message: 'Pool fixtures generated successfully', count: matches.length });
        } else {
            // Knockout fixtures are usually generated at creation, but let's allow re-generation if r1 is empty
            const { rows: r1Matches } = await db.query('SELECT * FROM matches WHERE tournament_id = $1 AND round = 1', [id]);
            const isFilled = r1Matches.some(m => m.player_a_id || m.player_b_id);

            if (isFilled) {
                return res.status(400).json({ error: 'Knockout fixtures already contain player data' });
            }

            // Implementation for knockout re-fill if needed
            res.status(400).json({ error: 'Manual generation only supported for Pool tournaments currently' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during fixture generation' });
    }
});

app.post('/api/tournaments/:id/generate-finals', async (req, res) => {
    const { id } = req.params;
    try {
        // Get all pool matches
        const { rows: matches } = await db.query('SELECT * FROM matches WHERE tournament_id = $1 AND type = $2', [id, 'pool']);

        if (matches.length === 0) {
            return res.status(400).json({ error: 'No pool matches found. Complete pool stage first.' });
        }

        // Check if knockout finals already exist
        const { rows: existingKnockouts } = await db.query('SELECT COUNT(*) FROM matches WHERE tournament_id = $1 AND type = $2', [id, 'knockout-final']);
        if (parseInt(existingKnockouts[0].count) > 0) {
            return res.status(400).json({ error: 'Knockout finals already generated' });
        }

        // Group matches by pool_index
        const poolGroups = {};
        matches.forEach(m => {
            if (!poolGroups[m.pool_index]) poolGroups[m.pool_index] = [];
            poolGroups[m.pool_index].push(m);
        });

        const poolCount = Object.keys(poolGroups).length;
        if (poolCount < 2) {
            return res.status(400).json({ error: 'Need at least 2 pools for cross-pool semi-finals' });
        }

        // Calculate rankings within each pool
        const poolRankings = {};
        Object.keys(poolGroups).forEach(poolIndex => {
            const stats = {};
            const poolMatches = poolGroups[poolIndex];

            poolMatches.forEach(m => {
                // Initialize both players if not exists
                if (!stats[m.player_a_id]) stats[m.player_a_id] = { player: m.player_a_id, wins: 0, losses: 0, played: 0 };
                if (!stats[m.player_b_id]) stats[m.player_b_id] = { player: m.player_b_id, wins: 0, losses: 0, played: 0 };

                if (m.winner_id) {
                    stats[m.player_a_id].played++;
                    stats[m.player_b_id].played++;

                    // Winner gets a win
                    stats[m.winner_id].wins++;

                    // Loser gets a loss
                    const loserId = m.player_a_id === m.winner_id ? m.player_b_id : m.player_a_id;
                    stats[loserId].losses++;
                }
            });

            // Sort by wins (descending), then losses (ascending), then played (descending)
            poolRankings[poolIndex] = Object.values(stats)
                .sort((a, b) => {
                    if (b.wins !== a.wins) return b.wins - a.wins;
                    if (a.losses !== b.losses) return a.losses - b.losses;
                    return b.played - a.played;
                });
        });

        // Get top 2 from each pool
        const pool0Top2 = poolRankings[0]?.slice(0, 2) || [];
        const pool1Top2 = poolRankings[1]?.slice(0, 2) || [];

        if (pool0Top2.length < 2 || pool1Top2.length < 2) {
            return res.status(400).json({ error: 'Each pool must have at least 2 teams to generate semi-finals' });
        }

        // Generate Cross-Pool Semi-Finals
        // SF1: Pool 0 Winner vs Pool 1 Runner-up
        // SF2: Pool 1 Winner vs Pool 0 Runner-up
        const semiFinals = [
            {
                id: 'final-r1-m0',
                round: 1,
                playerA: pool0Top2[0].player,  // Pool 0 Winner
                playerB: pool1Top2[1].player,  // Pool 1 Runner-up
                nextMatchId: 'final-r2-m0',
                nextMatchSide: 'A',
                type: 'knockout-final'
            },
            {
                id: 'final-r1-m1',
                round: 1,
                playerA: pool1Top2[0].player,  // Pool 1 Winner
                playerB: pool0Top2[1].player,  // Pool 0 Runner-up
                nextMatchId: 'final-r2-m0',
                nextMatchSide: 'B',
                type: 'knockout-final'
            }
        ];

        // Generate Finals (Round 2)
        const finals = [
            {
                id: 'final-r2-m0',
                round: 2,
                playerA: null,
                playerB: null,
                nextMatchId: null,
                nextMatchSide: null,
                type: 'knockout-final'
            }
        ];

        // Insert all matches
        const allMatches = [...semiFinals, ...finals];
        for (const m of allMatches) {
            await db.query(
                'INSERT INTO matches (id, tournament_id, round, player_a_id, player_b_id, next_match_id, next_match_side, type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [m.id, id, m.round, m.playerA, m.playerB, m.nextMatchId, m.nextMatchSide, m.type]
            );
        }

        res.json({
            success: true,
            message: 'Cross-pool semi-finals and finals generated successfully',
            poolRankings: {
                pool0: pool0Top2,
                pool1: pool1Top2
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/tournaments/:id/activity', async (req, res) => {
    const { id } = req.params;
    try {
        const { rows: logs } = await db.query(
            'SELECT * FROM activity_log WHERE tournament_id = $1 ORDER BY created_at DESC LIMIT 50',
            [id]
        );
        res.json(logs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Start server immediately
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);

    // Initialize DB after server is up
    const initDb = async () => {
        try {
            console.log('Verifying database schema...');
            const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
            await db.query(schema);
            console.log('Database schema verified/initialized.');
        } catch (err) {
            console.error('Database initialization warning (server still running):', err.message);
        }
    };
    initDb();
});

// Basic health check for Render
app.get('/health', (req, res) => res.status(200).send('OK'));
