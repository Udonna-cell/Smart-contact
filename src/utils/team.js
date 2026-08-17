import db from '../database/connection.js';

export const getTeamCount = async (telegramId) => {
    const result = await db('users')
        .where({ referrer_id: telegramId })
        .count('telegram_id as count')
        .first();
    return result.count;
};

export const getTeamDetails = async (telegramId) => {
    return await db('users')
        .select('username', 'status')
        .where({ referrer_id: telegramId });
};
