import knex from 'knex';
import { env } from '../config/env.js';

const db = knex({
    client: 'mysql2',
    connection: {
        host: env.DATABASE.host,
        user: env.DATABASE.user,
        password: env.DATABASE.password,
        database: env.DATABASE.name,
    },
    pool: { min: 2, max: 10 }
});

export default db;
