import db from '../connection.js';

export const depositRepository = {
    async create(deposit, trx = null) {
        await (trx || db)('deposits').insert(deposit);
        return this.findById(deposit.id, trx);
    },

    async findById(id, trx = null) {
        return (trx || db)('deposits').where({ id }).first();
    },

    async updateStatus(id, status, adminNotes = null, trx = null) {
        await (trx || db)('deposits')
            .where({ id })
            .update({ status, admin_notes: adminNotes });
        return this.findById(id, trx);
    },

    async findPending(trx = null) {
        return (trx || db)('deposits').where({ status: 'PENDING' });
    }
};
