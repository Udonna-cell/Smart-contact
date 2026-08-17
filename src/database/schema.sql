-- MySQL Schema for Referral Rewards Bot

CREATE TABLE IF NOT EXISTS users (
    telegram_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    status ENUM('UNPAID', 'ACTIVE', 'BLOCKED') DEFAULT 'UNPAID',
    referrer_id BIGINT,
    slots_available INT DEFAULT 5,
    referral_rate_bps INT DEFAULT 4000,
    balance_ngn DECIMAL(12,2) DEFAULT 0.00,
    total_earned_ngn DECIMAL(12,2) DEFAULT 0.00,
    total_withdrawn_ngn DECIMAL(12,2) DEFAULT 0.00,
    total_referrals INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referrer_id) REFERENCES users(telegram_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS deposits (
    id VARCHAR(36) PRIMARY KEY,
    telegram_id BIGINT,
    type ENUM('ACTIVATION', 'BUY_SLOTS', 'UPGRADE_RATE'),
    amount_ngn DECIMAL(12,2) NOT NULL,
    reference_code VARCHAR(255) UNIQUE NOT NULL,
    paystack_reference VARCHAR(255),
    paystack_url VARCHAR(500),
    proof_file_id VARCHAR(255),
    sender_name VARCHAR(255),
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') DEFAULT 'PENDING',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS referral_payouts (
    id VARCHAR(36) PRIMARY KEY,
    deposit_id VARCHAR(36),
    beneficiary_id BIGINT,
    payer_id BIGINT,
    level INT,
    amount_ngn DECIMAL(12,2),
    rate_applied_bps INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deposit_id) REFERENCES deposits(id),
    FOREIGN KEY (beneficiary_id) REFERENCES users(telegram_id),
    FOREIGN KEY (payer_id) REFERENCES users(telegram_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS withdrawals (
    id VARCHAR(36) PRIMARY KEY,
    telegram_id BIGINT,
    amount_ngn DECIMAL(12,2) NOT NULL,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    status ENUM('PENDING', 'PAID', 'DECLINED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (telegram_id) REFERENCES users(telegram_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bank_accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    bank_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
