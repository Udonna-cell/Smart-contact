import db from '../connection.js';

export const withdrawalRepository = {
    async create(withdrawal, trx = null) {
        await (trx || db)('withdrawals').insert(withdrawal);
        return this.findById(withdrawal.id, trx);
    },

    async findById(id, trx = null) {
        return (trx || db)('withdrawals').where({ id }).first();
    },

    async updateStatus(id, status, trx = null) {
        await (trx || db)('withdrawals')
            .where({ id })
            .update({ status });
        return this.findById(id, trx);
    }
};
