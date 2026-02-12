const db = require('./db');

const migrateElite = async () => {
    try {
        console.log('Starting Elite Migration...');

        // 1. Update tournaments table for rules, fees, and prizes
        await db.query(`
            ALTER TABLE tournaments 
            ADD COLUMN IF NOT EXISTS rules TEXT,
            ADD COLUMN IF NOT EXISTS entry_fee TEXT,
            ADD COLUMN IF NOT EXISTS prize_pool TEXT
        `);
        console.log('✅ Updated tournaments table (Rules, Fees, Prizes)');

        // 2. Update matches table for scheduling
        await db.query(`
            ALTER TABLE matches 
            ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP
        `);
        console.log('✅ Updated matches table (Scheduled Time)');

        // 3. Create activity_log table for auditing
        await db.query(`
            CREATE TABLE IF NOT EXISTS activity_log (
                id SERIAL PRIMARY KEY,
                tournament_id INTEGER REFERENCES tournaments(id) ON DELETE CASCADE,
                action TEXT NOT NULL,
                details TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created activity_log table');

        console.log('🚀 Elite Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Elite Migration failed:', err);
        process.exit(1);
    }
};

migrateElite();
