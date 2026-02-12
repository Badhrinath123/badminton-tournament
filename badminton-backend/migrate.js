const db = require('./db');

const migrate = async () => {
    try {
        console.log('Starting migration...');

        // Add columns to players table
        await db.query(`
            ALTER TABLE players 
            ADD COLUMN IF NOT EXISTS name2 TEXT,
            ADD COLUMN IF NOT EXISTS phone2 TEXT,
            ADD COLUMN IF NOT EXISTS email2 TEXT
        `);
        console.log('Updated players table');

        // Add columns to matches table
        await db.query(`
            ALTER TABLE matches 
            ADD COLUMN IF NOT EXISTS score_a INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS score_b INTEGER DEFAULT 0
        `);
        console.log('Updated matches table');

        console.log('Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
