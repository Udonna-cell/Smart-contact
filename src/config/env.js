import dotenv from 'dotenv';
dotenv.config();

const requiredEnv = [
    'BOT_TOKEN',
    'DATABASE_HOST',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'ADMIN_TELEGRAM_IDS',
    'ADMIN_CHANNEL_ID',
    'PAYSTACK_SECRET_KEY',
    'BOT_BASE_URL'
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Environment variable ${key} is missing.`);
    }
}

export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3000', 10),
    BOT_TOKEN: process.env.BOT_TOKEN,
    BOT_BASE_URL: process.env.BOT_BASE_URL,
    DATABASE: {
        host: process.env.DATABASE_HOST,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        name: process.env.DATABASE_NAME,
    },
    ADMIN_TELEGRAM_IDS: process.env.ADMIN_TELEGRAM_IDS.split(',').map(id => parseInt(id.trim(), 10)),
    ADMIN_CHANNEL_ID: process.env.ADMIN_CHANNEL_ID,
    PAYSTACK: {
        secretKey: process.env.PAYSTACK_SECRET_KEY,
        publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    }
};
