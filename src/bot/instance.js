import { Telegraf, Scenes, session } from 'telegraf';
import dotenv from 'dotenv';
import { handleStart } from './handlers/start.js';
import { depositWizard } from './scenes/depositWizard.js';
import { withdrawWizard } from './scenes/withdrawWizard.js';
import { upgradeWizard } from './scenes/upgradeWizard.js';
import { broadcastWizard } from './scenes/broadcastWizard.js';

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);
const stage = new Scenes.Stage([depositWizard, withdrawWizard, upgradeWizard, broadcastWizard]);

bot.use(session());
bot.use(stage.middleware());

import { handleMenu, handleUpgradeCallback, handleBackToMenu } from './handlers/menu.js';
import { adminRouter } from './handlers/adminMenu.js';
import { approveDeposit } from './handlers/admin.js';
import { depositRepository } from '../database/repositories/depositRepository.js';

bot.start((ctx) => {
    // Telegraf's start command automatically parses payload from ctx.startPayload
    handleStart(ctx);
});

adminRouter(bot);

bot.action('back_to_menu', handleBackToMenu);
bot.action('start_deposit', (ctx) => ctx.scene.enter('DEPOSIT_WIZARD'));
bot.action(['upgrade_slots', 'upgrade_rate'], handleUpgradeCallback);
bot.hears(['📊 Dashboard', '👥 My Team', '⚡ Upgrades', '💸 Withdraw', '🔗 Invite Friends', '❓ Help & Support'], handleMenu);

bot.action(/^approve_(.+)$/, async (ctx) => {
    const depositId = ctx.match[1];
    try {
        await approveDeposit(depositId);
        ctx.editMessageText('✅ *Deposit Approved.*', { parse_mode: 'Markdown' });
        
        const deposit = await depositRepository.findById(depositId);
        ctx.telegram.sendMessage(deposit.telegram_id, `🎉 *Payment Confirmed!*\n\nYour deposit of ₦${deposit.amount_ngn.toLocaleString()} has been approved.`, { parse_mode: 'Markdown' });
    } catch (err) {
        ctx.reply('⚠️ *Error*\n\n' + err.message, { parse_mode: 'Markdown' });
    }
});

bot.action(/^reject_(.+)$/, async (ctx) => {
    const depositId = ctx.match[1];
    await depositRepository.updateStatus(depositId, 'REJECTED');
    ctx.editMessageText('❌ *Deposit Rejected.*', { parse_mode: 'Markdown' });
    
    const deposit = await depositRepository.findById(depositId);
    ctx.telegram.sendMessage(deposit.telegram_id, `❌ *Payment Rejected*\n\nYour deposit of ₦${deposit.amount_ngn.toLocaleString()} was rejected by the admin.`, { parse_mode: 'Markdown' });
});

bot.catch((err, ctx) => {
    console.error('Unhandled bot error:', err);
    if (ctx) {
        ctx.reply('⚠️ *Unexpected error*\n\nAn unexpected error occurred. Please try again later.', { parse_mode: 'Markdown' });
    }
});

export default bot;
