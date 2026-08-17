import { Markup } from 'telegraf';
import { userRepository } from '../../database/repositories/userRepository.js';

export const handleStart = async (ctx) => {
    const referrerId = ctx.startPayload;
    console.log(`Debug: Start payload (referrerId) = ${referrerId}`);
    
    const user = await userRepository.findById(ctx.from.id);
    if (!user) {
        await userRepository.create({
            telegram_id: ctx.from.id,
            username: ctx.from.username,
            first_name: ctx.from.first_name,
            referrer_id: referrerId || null
        });
        ctx.reply(
            '👋 *Welcome to Referral Bot!* 🤖\n\n' +
            'You are just a few steps away from earning commissions and building your network.\n\n' +
            'To get started, please activate your account:',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('💳 Activate Account (₦1,000)', 'start_deposit')
                ])
            }
        );
    } else if (user.status === 'BLOCKED') {
        ctx.reply('❌ *Your account has been blocked.*', { parse_mode: 'Markdown' });
    } else if (user.status !== 'ACTIVE') {
        ctx.reply(
            '⚠️ *Account Status: Inactive*\n\n' +
            'Your account is currently inactive. Please complete the activation to start earning.',
            {
                parse_mode: 'Markdown',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('💳 Activate Account (₦1,000)', 'start_deposit')
                ])
            }
        );
    } else {
        ctx.reply('✅ *Welcome Back!*\n\nUse the menu below to navigate:', {
            parse_mode: 'Markdown',
            ...Markup.keyboard([
                ['📊 Dashboard', '👥 My Team'],
                ['🔗 Invite Friends', '⚡ Upgrades'],
                ['💸 Withdraw', '❓ Help & Support']
            ]).resize().reply_markup
        });
    }
};
