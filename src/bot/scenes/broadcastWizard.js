import { Scenes, Markup } from 'telegraf';
import { userRepository } from '../../database/repositories/userRepository.js';

export const broadcastWizard = new Scenes.WizardScene(
    'BROADCAST_WIZARD',
    (ctx) => {
        ctx.reply('📢 *Broadcast*\n\nPlease enter the message you want to broadcast to all users:', { parse_mode: 'Markdown' });
        return ctx.wizard.next();
    },
    async (ctx) => {
        const message = ctx.message.text;
        const users = await userRepository.getAll();
        
        ctx.reply(`⏳ *Broadcasting* to *${users.length}* users...`, { parse_mode: 'Markdown' });
        
        let successCount = 0;
        for (const user of users) {
            try {
                await ctx.telegram.sendMessage(user.telegram_id, message);
                successCount++;
            } catch (err) {
                console.error(`Failed to send broadcast to ${user.telegram_id}:`, err);
            }
        }
        
        ctx.reply(`✅ *Broadcast complete!*\n\nSent to *${successCount}* users.`, { parse_mode: 'Markdown' });
        return ctx.scene.leave();
    }
);
