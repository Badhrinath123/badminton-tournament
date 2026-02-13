CREATE TABLE IF NOT EXISTS tournaments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'singles' or 'doubles'
    use_pools BOOLEAN DEFAULT FALSE,
    pool_count INTEGER DEFAULT 2,
    manager_name TEXT,
    manager_phone TEXT,
    manager_email TEXT,
    team_count INTEGER DEFAULT 8,
    status TEXT DEFAULT 'active',
    rules TEXT,
    entry_fee TEXT,
    prize_pool TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    name2 TEXT, -- For doubles
    phone2 TEXT, -- For doubles
    email2 TEXT, -- For doubles
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY, -- e.g., 'r1-m0' or 'pool0-m0-1'
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER,
    player_a_id TEXT, -- ID from frontend logic or local mapping
    player_b_id TEXT,
    winner_id TEXT,
    score_a INTEGER DEFAULT 0,
    score_b INTEGER DEFAULT 0,
    next_match_id TEXT,
    next_match_side TEXT, -- 'A' or 'B'
    type TEXT, -- 'knockout' or 'pool'
    pool_index INTEGER,
    scheduled_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
