import { depositRepository } from '../../database/repositories/depositRepository.js';
import { userRepository } from '../../database/repositories/userRepository.js';
import { distributeReferralCommission } from '../../utils/commission.js';
import db from '../../database/connection.js';
import { CONSTANTS } from '../../config/constants.js';

export async function approveDeposit(depositId) {
    return db.transaction(async (trx) => {
        const deposit = await depositRepository.findById(depositId, trx);
        if (!deposit || deposit.status !== 'PENDING') {
            throw new Error('Transaction already processed or not found.');
        }

        await depositRepository.updateStatus(depositId, 'APPROVED', null, trx);

        if (deposit.type === 'ACTIVATION') {
            await userRepository.update(deposit.telegram_id, { status: 'ACTIVE' }, trx);
            await distributeReferralCommission(deposit.telegram_id, deposit.id, deposit.amount_ngn, trx);
        } else if (deposit.type === 'BUY_SLOTS') {
            const user = await userRepository.findById(deposit.telegram_id, trx);
            await userRepository.update(deposit.telegram_id, { 
                slots_available: user.slots_available + CONSTANTS.REWARDS.SLOTS_PER_UPGRADE 
            }, trx);
        } else if (deposit.type === 'UPGRADE_RATE') {
            const user = await userRepository.findById(deposit.telegram_id, trx);
            const newRate = Math.min(user.referral_rate_bps + 1000, CONSTANTS.REWARDS.MAX_DIRECT_BPS);
            await userRepository.update(deposit.telegram_id, { 
                referral_rate_bps: newRate 
            }, trx);
        }

        return true;
    });
}
