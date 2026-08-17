import { userRepository } from '../database/repositories/userRepository.js';
import { referralRepository } from '../database/repositories/referralRepository.js';
import { nanoid } from 'nanoid';
import db from '../database/connection.js';
import { CONSTANTS } from '../config/constants.js';

export async function distributeReferralCommission(payerId, depositId, amountNgn, externalTrx = null) {
    const process = async (trx) => {
        const payer = await userRepository.findById(payerId, trx);
        if (!payer || !payer.referrer_id) {
            return;
        }

        // Level 1 Referrer
        const level1Referrer = await userRepository.findById(payer.referrer_id, trx);
        if (level1Referrer && level1Referrer.slots_available > 0) {
            const commission = (amountNgn * (level1Referrer.referral_rate_bps / 10000));
            
            await userRepository.update(level1Referrer.telegram_id, {
                balance_ngn: parseFloat(level1Referrer.balance_ngn) + commission,
                total_earned_ngn: parseFloat(level1Referrer.total_earned_ngn) + commission,
                slots_available: level1Referrer.slots_available - 1
            }, trx);

            await referralRepository.create({
                id: nanoid(),
                deposit_id: depositId,
                beneficiary_id: level1Referrer.telegram_id,
                payer_id: payerId,
                level: 1,
                amount_ngn: commission,
                rate_applied_bps: level1Referrer.referral_rate_bps
            }, trx);
        }

        // Level 2 Referrer
        if (level1Referrer && level1Referrer.referrer_id) {
            const level2Referrer = await userRepository.findById(level1Referrer.referrer_id, trx);
            if (level2Referrer && level2Referrer.status === 'ACTIVE') {
                const commission = amountNgn * (CONSTANTS.REWARDS.DEFAULT_INDIRECT_BPS / 10000);

                await userRepository.update(level2Referrer.telegram_id, {
                    balance_ngn: parseFloat(level2Referrer.balance_ngn) + commission,
                    total_earned_ngn: parseFloat(level2Referrer.total_earned_ngn) + commission
                }, trx);

                await referralRepository.create({
                    id: nanoid(),
                    deposit_id: depositId,
                    beneficiary_id: level2Referrer.telegram_id,
                    payer_id: payerId,
                    level: 2,
                    amount_ngn: commission,
                    rate_applied_bps: CONSTANTS.REWARDS.DEFAULT_INDIRECT_BPS
                }, trx);
            }
        }
    };

    if (externalTrx) {
        await process(externalTrx);
    } else {
        await db.transaction(process);
    }
}
