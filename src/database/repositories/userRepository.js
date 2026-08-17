import db from '../connection.js';

export const userRepository = {
    async findById(telegramId, trx = null) {
        return (trx || db)('users').where({ telegram_id: telegramId }).first();
    },

    async create(user, trx = null) {
        const { telegram_id, username, first_name, referrer_id } = user;
        await (trx || db)('users').insert({
            telegram_id,
            username,
            first_name,
            referrer_id
        });
        return this.findById(telegram_id, trx);
    },

    async update(telegramId, updates, trx = null) {
        await (trx || db)('users')
            .where({ telegram_id: telegramId })
            .update(updates);
        return this.findById(telegramId, trx);
    },

    async findByUsername(username, trx = null) {
        return (trx || db)('users').where({ username }).first();
    },

    async getAll(trx = null) {
        return (trx || db)('users').select('*');
    }
};
