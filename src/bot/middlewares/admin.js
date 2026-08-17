import dotenv from 'dotenv';
dotenv.config();

const ADMIN_IDS = process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => parseInt(id.trim()));

export const adminMiddleware = (ctx, next) => {
    if (ADMIN_IDS.includes(ctx.from.id)) {
        return next();
    }
    ctx.reply('🚫 *Access Denied*\n\nThis command is for admins only.', { parse_mode: 'Markdown' });
};
