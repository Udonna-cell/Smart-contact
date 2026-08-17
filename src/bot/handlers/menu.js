import { Markup } from 'telegraf';
import { userRepository } from '../../database/repositories/userRepository.js';
import { getTeamCount, getTeamDetails } from '../../utils/team.js';
import { env } from '../../config/env.js';

export const handleMenu = async (ctx) => {
    const text = ctx.message ? ctx.message.text : '';
    const userId = ctx.from.id;

    if (text === '📊 Dashboard') {
        const user = await userRepository.findById(userId);
        ctx.reply(
            `📊 *Your Dashboard*\n\n` +
            `💰 *Balance:* ₦${user.balance_ngn}\n` +
            `⚡ *Available Slots:* ${user.slots_available}\n` +
            `📈 *Referral Rate:* ${user.referral_rate_bps/100}%\n` +
            `👥 *Total Referrals:* ${user.total_referrals}`,
            { parse_mode: 'Markdown' }
        );
    } else if (text === '👥 My Team') {
        const count = await getTeamCount(userId);
        const details = await getTeamDetails(userId);
        let message = `👥 *Your Team*\n\nTotal referrals: *${count}*\n\n`;
        if (details.length === 0) {
            message += '_No team members yet._';
        } else {
            details.forEach(member => {
                message += `• @${member.username || 'NoUsername'} (${member.status})\n`;
            });
        }
        ctx.reply(message, { parse_mode: 'Markdown' });
    } else if (text === '⚡ Upgrades') {
        ctx.reply('🚀 *Choose an upgrade:*', {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
                Markup.button.callback('Buy 5 Slots (₦500)', 'upgrade_slots'),
                Markup.button.callback('Upgrade Rate +10% (₦500)', 'upgrade_rate')
            ]).reply_markup
        });
    } else if (text === '💸 Withdraw') {
        ctx.scene.enter('WITHDRAW_WIZARD');
    } else if (text === '🔗 Invite Friends') {
        const botUsername = ctx.botInfo.username;
        const referralLink = `${env.BOT_BASE_URL}${botUsername}?start=${userId}`;
        ctx.reply(
            `🔗 *Your Referral Link*\n\n` +
            `Share this link to earn commissions:\n\n` +
            `\`${referralLink}\`\n\n` +
            `💡 *Tip:* You will earn automatically when they activate!`,
            { parse_mode: 'Markdown' }
        );
    } else if (text === '❓ Help & Support') {
        ctx.reply('ℹ️ *Need help?*\n\nPlease contact our support team.');
    }
};

export const handleBackToMenu = async (ctx) => {
    ctx.answerCbQuery();
    ctx.editMessageText('Returning to main menu...');
    await ctx.reply('Welcome back! Use the menu below.', Markup.keyboard([
        ['📊 Dashboard', '👥 My Team'],
        ['⚡ Upgrades', '💸 Withdraw'],
        ['❓ Help & Support']
    ]).resize());
};

export const handleUpgradeCallback = async (ctx) => {
    const type = ctx.callbackQuery.data === 'upgrade_slots' ? 'BUY_SLOTS' : 'UPGRADE_RATE';
    ctx.scene.enter('UPGRADE_WIZARD', { upgradeType: type });
};
