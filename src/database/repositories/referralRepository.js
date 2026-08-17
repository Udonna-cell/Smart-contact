import db from '../connection.js';

export const referralRepository = {
    async create(payout, trx = null) {
        await (trx || db)('referral_payouts').insert(payout);
        return this.findById(payout.id, trx);
    },

    async findById(id, trx = null) {
        return (trx || db)('referral_payouts').where({ id }).first();
    }
};
