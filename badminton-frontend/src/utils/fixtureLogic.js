export const generateKnockoutFixtures = (players) => {
    const numPlayers = players.length;
    const powerOfTwo = Math.pow(2, Math.ceil(Math.log2(numPlayers)));
    const matches = [];

    // Round 1 Setup
    for (let i = 0; i < powerOfTwo / 2; i++) {
        const playerA = players[i]?.id || null;
        const playerB = players[powerOfTwo - 1 - i]?.id || null;

        matches.push({
            id: `r1-m${i}`,
            round: 1,
            playerA: playerA,
            playerB: playerB,
            winnerId: null,
            nextMatchId: `r2-m${Math.floor(i / 2)}`,
            nextMatchSide: i % 2 === 0 ? 'A' : 'B'
        });
    }

    // Next Rounds Placeholders
    let currentRound = 2;
    let matchesInRound = powerOfTwo / 4;
    while (matchesInRound >= 1) {
        for (let i = 0; i < matchesInRound; i++) {
            matches.push({
                id: `r${currentRound}-m${i}`,
                round: currentRound,
                playerA: null,
                playerB: null,
                winnerId: null,
                nextMatchId: matchesInRound === 1 ? null : `r${currentRound + 1}-m${Math.floor(i / 2)}`,
                nextMatchSide: i % 2 === 0 ? 'A' : 'B'
            });
        }
        matchesInRound /= 2;
        currentRound++;
    }

    return matches;
};

export const generatePoolFixtures = (players, poolCount) => {
    const pools = Array.from({ length: poolCount }, () => []);

    // Randomly distribute players into pools
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    shuffled.forEach((player, index) => {
        pools[index % poolCount].push(player);
    });

    const matches = [];
    pools.forEach((pool, poolIndex) => {
        // Basic Round Robin for each pool
        for (let i = 0; i < pool.length; i++) {
            for (let j = i + 1; j < pool.length; j++) {
                matches.push({
                    id: `pool${poolIndex}-m${i}-${j}`,
                    type: 'pool',
                    poolIndex,
                    playerA: pool[i].id,
                    playerB: pool[j].id,
                    winnerId: null
                });
            }
        }
    });

    return { pools, matches };
};
