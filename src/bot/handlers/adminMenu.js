import { Markup } from 'telegraf';
import { adminMiddleware } from '../middlewares/admin.js';
import { depositRepository } from '../../database/repositories/depositRepository.js';
import { userRepository } from '../../database/repositories/userRepository.js';

export const handleAdminMenu = (ctx) => {
    ctx.reply('🛠 *Administrative Dashboard*\n\nPlease select an action:', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('🔍 Pending Deposits', 'admin_list_deposits')],
            [Markup.button.callback('👥 Manage Users', 'admin_manage_users')],
            [Markup.button.callback('📢 Broadcast Message', 'admin_broadcast')]
        ])
    });
};

const listPendingDeposits = async (ctx) => {
    const deposits = await depositRepository.findPending();
    if (deposits.length === 0) {
        return ctx.reply('✅ *No pending deposits* require attention.', { parse_mode: 'Markdown' });
    }

    for (const deposit of deposits) {
        ctx.reply(
            `📦 <b>Pending Deposit</b>\n\n` +
            `• <b>ID:</b> <code>${deposit.id}</code>\n` +
            `• <b>User ID:</b> <code>${deposit.telegram_id}</code>\n` +
            `• <b>Amount:</b> ₦${deposit.amount_ngn.toLocaleString()}\n` +
            `• <b>Type:</b> ${deposit.type}`,
            {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    Markup.button.callback('✅ Approve', `approve_${deposit.id}`),
                    Markup.button.callback('❌ Reject', `reject_${deposit.id}`)
                ]).reply_markup
            }
        );
    }
};

const manageUsers = async (ctx) => {
    const users = await userRepository.getAll();
    if (users.length === 0) {
        return ctx.reply('ℹ️ *No user records* found in the database.', { parse_mode: 'Markdown' });
    }

    let message = '👥 *System User Overview*\n\n';
    users.forEach(user => {
        message += `• \`${user.telegram_id}\` | @${user.username || 'N/A'} | *Status:* ${user.status}\n`;
    });
    
    ctx.reply(message, { parse_mode: 'Markdown' });
};

export const adminRouter = (bot) => {
    bot.command('admin', adminMiddleware, handleAdminMenu);
    
    bot.action('admin_list_deposits', adminMiddleware, listPendingDeposits);
    bot.action('admin_manage_users', adminMiddleware, manageUsers);
    bot.action('admin_broadcast', adminMiddleware, (ctx) => ctx.scene.enter('BROADCAST_WIZARD'));
};
