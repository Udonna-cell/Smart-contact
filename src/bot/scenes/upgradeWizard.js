import { Scenes, Markup } from 'telegraf';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { depositRepository } from '../../database/repositories/depositRepository.js';

export const upgradeWizard = new Scenes.WizardScene(
    'UPGRADE_WIZARD',
    async (ctx) => {
        const type = ctx.scene.state.upgradeType || 'BUY_SLOTS';
        const amount = 500;
        
        ctx.wizard.state.depositData = {
            id: nanoid(),
            telegram_id: ctx.from.id,
            type,
            amount_ngn: amount,
            reference_code: `UPG-${nanoid(10).toUpperCase()}`
        };
        
        // Initialize Paystack transaction
        try {
            const response = await axios.post('https://api.paystack.co/transaction/initialize', {
                email: 'user@example.com', // Should be dynamic
                amount: amount * 100,
                reference: ctx.wizard.state.depositData.reference_code
            }, {
                headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
            });

            ctx.wizard.state.depositData.paystack_reference = response.data.data.reference;
            ctx.wizard.state.depositData.paystack_url = response.data.data.authorization_url;

            ctx.reply(
                `💳 *Paystack Upgrade Checkout*\n\n` +
                `Please tap the button below to pay *₦${amount.toLocaleString()}* via Paystack.\n\n` +
                `Reference: \`${ctx.wizard.state.depositData.reference_code}\``,
                {
                    parse_mode: 'Markdown',
                    ...Markup.inlineKeyboard([
                        Markup.button.url('🔗 Pay via Paystack', ctx.wizard.state.depositData.paystack_url),
                        Markup.button.callback('✅ I Have Paid', 'confirm_upgrade_payment')
                    ]).reply_markup
                }
            );
            return ctx.wizard.next();
        } catch (error) {
            console.error('Paystack Error:', error);
            ctx.reply('⚠️ *Payment Error*\n\nFailed to initialize payment. Please try again later.', { parse_mode: 'Markdown' });
            return ctx.scene.leave();
        }
    },
    async (ctx) => {
        if (ctx.callbackQuery && ctx.callbackQuery.data === 'confirm_upgrade_payment') {
            await depositRepository.create({
                ...ctx.wizard.state.depositData,
                reference_code: ctx.wizard.state.depositData.paystack_reference,
                status: 'PENDING'
            });
            
            ctx.answerCbQuery('Payment confirmation received. Admin will verify shortly.');
            ctx.editMessageText('⏳ *Upgrade Payment Notification Received!*\n\nAdmin is verifying your payment reference.', { parse_mode: 'Markdown' });
            
            // Notify Admin
            const adminChannelId = process.env.ADMIN_CHANNEL_ID;
            const message = `📥 <b>NEW PAYSTACK UPGRADE VERIFICATION REQUEST</b>\n\n` +
                            `👤 User ID: <code>${ctx.from.id}</code>\n` +
                            `💰 Amount: ₦${ctx.wizard.state.depositData.amount_ngn.toLocaleString()}\n` +
                            `📌 Paystack Ref: <code>${ctx.wizard.state.depositData.paystack_reference}</code>\n` +
                            `Type: ${ctx.wizard.state.depositData.type}`;
            
            ctx.telegram.sendMessage(adminChannelId, message, {
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard([
                    Markup.button.callback(`✅ Approve ${ctx.wizard.state.depositData.id}`, `approve_${ctx.wizard.state.depositData.id}`),
                    Markup.button.callback(`❌ Reject ${ctx.wizard.state.depositData.id}`, `reject_${ctx.wizard.state.depositData.id}`)
                ]).reply_markup
            });

            return ctx.scene.leave();
        }
        ctx.reply('⚠️ *Action Required*\n\nPlease click the "✅ I Have Paid" button after making the payment.', { parse_mode: 'Markdown' });
    }
);
