import { Scenes, Markup } from 'telegraf';
import { nanoid } from 'nanoid';
import axios from 'axios';
import { depositRepository } from '../../database/repositories/depositRepository.js';

export const depositWizard = new Scenes.WizardScene(
    'DEPOSIT_WIZARD',
    async (ctx) => {
        const amount = 1000; // Default activation amount

        ctx.wizard.state.depositData = {
            id: nanoid(),
            telegram_id: ctx.from.id,
            type: 'ACTIVATION',
            amount_ngn: amount,
            reference_code: `NGN-${nanoid(10).toUpperCase()}`
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

            console.log('Paystack API Response:', response.data);

            ctx.wizard.state.depositData.paystack_reference = response.data.data.reference;
            ctx.wizard.state.depositData.paystack_url = response.data.data.authorization_url;

            ctx.reply(
                `💳 *Paystack Payment Checkout*\n\n` +
                `Please tap the button below to pay *₦${amount.toLocaleString()}* via Paystack.\n\n` +
                `Reference: \`${ctx.wizard.state.depositData.reference_code}\``,
                {
                    parse_mode: 'Markdown',
                    reply_markup: Markup.inlineKeyboard([
                        Markup.button.url('🔗 Pay via Paystack', ctx.wizard.state.depositData.paystack_url),
                        Markup.button.callback('✅ I Have Paid', 'confirm_payment')
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
        if (ctx.callbackQuery && ctx.callbackQuery.data === 'confirm_payment') {
            await depositRepository.create({
                ...ctx.wizard.state.depositData,
                reference_code: ctx.wizard.state.depositData.paystack_reference
            });
            
            ctx.answerCbQuery('Payment confirmation received. Admin will verify shortly.');
            ctx.editMessageText('⏳ *Payment Notification Received!*\n\nAdmin is verifying your payment reference.', { parse_mode: 'Markdown' });
            
            // Notify Admin
            const adminChannelId = process.env.ADMIN_CHANNEL_ID;
            const message = `📥 <b>NEW PAYSTACK DEPOSIT VERIFICATION REQUEST</b>\n\n` +
                            `👤 User ID: <code>${ctx.from.id}</code>\n` +
                            `💰 Amount: ₦${ctx.wizard.state.depositData.amount_ngn.toLocaleString()}\n` +
                            `📌 Paystack Ref: <code>${ctx.wizard.state.depositData.paystack_reference}</code>\n` +
                            `Type: ACTIVATION`;
            
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
