const db = require('./db');

const resetDb = async () => {
    try {
        await db.query('DROP TABLE IF EXISTS matches;');
        await db.query('DROP TABLE IF EXISTS players;');
        await db.query('DROP TABLE IF EXISTS tournaments;');
        console.log('Tables dropped successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error dropping tables:', err);
        process.exit(1);
    }
};

resetDb();
