import db from '../../database/connection.js';

export const getPendingDeposits = async () => {
    const [rows] = await db.execute(
        'SELECT * FROM deposits WHERE status = "PENDING"'
    );
    return rows;
};
