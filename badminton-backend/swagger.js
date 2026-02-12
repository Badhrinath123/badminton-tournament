// Manual Swagger specification
const swaggerDocument = {
    openapi: '3.0.0',
    info: {
        title: 'Badminton Tournament API',
        version: '1.0.0',
        description: 'API for managing badminton tournaments, players, and match fixtures.',
    },
    servers: [
        {
            url: 'http://localhost:5001',
            description: 'Development server',
        },
    ],
    paths: {
        '/api/tournaments': {
            get: {
                summary: 'Get all tournaments',
                description: 'Retrieve all tournaments with their players and matches',
                responses: {
                    '200': {
                        description: 'List of tournaments',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                    },
                                },
                            },
                        },
                    },
                },
            },
            post: {
                summary: 'Create a tournament',
                description: 'Create a new tournament with players and matches',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    type: { type: 'string', enum: ['singles', 'doubles'] },
                                    teamCount: { type: 'integer' },
                                    usePools: { type: 'boolean' },
                                    poolCount: { type: 'integer' },
                                    managerName: { type: 'string' },
                                    managerPhone: { type: 'string' },
                                    managerEmail: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Tournament created',
                    },
                },
            },
        },
        '/api/tournaments/{id}': {
            delete: {
                summary: 'Delete a tournament',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Tournament deleted',
                    },
                },
            },
        },
        '/api/tournaments/{id}/register': {
            post: {
                summary: 'Register a player',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'integer' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    phone: { type: 'string' },
                                    email: { type: 'string' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '201': {
                        description: 'Player registered',
                    },
                },
            },
        },
        '/api/matches/{id}': {
            patch: {
                summary: 'Update match result',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                ],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    winnerId: { type: 'string' },
                                    tournamentId: { type: 'integer' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: 'Match updated',
                    },
                },
            },
        },
        '/api/matches/{id}/result': {
            delete: {
                summary: 'Clear match result',
                parameters: [
                    {
                        name: 'id',
                        in: 'path',
                        required: true,
                        schema: { type: 'string' },
                    },
                    {
                        name: 'tournamentId',
                        in: 'query',
                        required: true,
                        schema: { type: 'integer' },
                    },
                ],
                responses: {
                    '200': {
                        description: 'Match result cleared',
                    },
                },
            },
        },
    },
};

module.exports = swaggerDocument;
