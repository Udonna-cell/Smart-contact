import { Scenes, Markup } from 'telegraf';
import { nanoid } from 'nanoid';
import { userRepository } from '../../database/repositories/userRepository.js';
import { withdrawalRepository } from '../../database/repositories/withdrawalRepository.js';

export const withdrawWizard = new Scenes.WizardScene(
    'WITHDRAW_WIZARD',
    (ctx) => {
        ctx.reply('💸 *Withdrawal*\n\nEnter the amount you wish to withdraw (Min: ₦1,000):', { parse_mode: 'Markdown' });
        return ctx.wizard.next();
    },
    async (ctx) => {
        const amount = parseFloat(ctx.message.text);
        const user = await userRepository.findById(ctx.from.id);
        
        if (isNaN(amount) || amount < 1000) {
            ctx.reply('⚠️ *Invalid amount*\n\nMinimum withdrawal is ₦1,000. Please try again or press /cancel.', { parse_mode: 'Markdown' });
            return ctx.scene.leave(); // Fix: Leave scene on invalid input
        }
        if (amount > user.balance_ngn) {
            ctx.reply(`⚠️ *Insufficient balance*\n\nYour current balance is *₦${user.balance_ngn}*.`, { parse_mode: 'Markdown' });
            return ctx.scene.leave(); // Fix: Leave scene on insufficient balance
        }

        ctx.wizard.state.withdrawData = { amount };
        ctx.reply('🏦 *Enter your Bank Name:*', { parse_mode: 'Markdown' });
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.withdrawData.bankName = ctx.message.text;
        ctx.reply('🔢 *Enter your Account Number (10 digits):*', { parse_mode: 'Markdown' });
        return ctx.wizard.next();
    },
    async (ctx) => {
        ctx.wizard.state.withdrawData.accountNumber = ctx.message.text;
        ctx.reply('👤 *Enter Account Name:*', { parse_mode: 'Markdown' });
        return ctx.wizard.next();
    },
    async (ctx) => {
        const data = ctx.wizard.state.withdrawData;
        data.accountName = ctx.message.text;
        
        // Save request
        const withdrawal = await withdrawalRepository.create({
            id: nanoid(),
            telegram_id: ctx.from.id,
            amount_ngn: data.amount,
            bank_name: data.bankName,
            account_number: data.accountNumber,
            account_name: data.accountName
        });
        
        // Deduct from balance
        const user = await userRepository.findById(ctx.from.id);
        await userRepository.update(ctx.from.id, { balance_ngn: user.balance_ngn - data.amount });
        
        ctx.reply(`✅ *Withdrawal request submitted*\n\n` +
                  `Amount: *₦${data.amount}*\n\n` +
                  `Your request has been submitted to the admin for processing.`, { parse_mode: 'Markdown' });
        
        return ctx.scene.leave();
    }
);
