import { Pool, QueryResult } from 'pg';
import { exitCode } from 'process';

export interface NewFineRequest {
    team_id: string,
    name: string,
    description: string,
    amount: number
};

export interface DeleteFineRequest {
    fine_id: string
};

export interface AssignFineRequest {
    user_id: string,
    team_id: string,
    fine_id: string,
    created_by_id: string
};

export interface FinePriceRequest {
    fine_id: string
};

export interface FinesByTeamIdAndUserIdRequest {
    team_id: string,
    user_id: string,
};

export interface FinesByTeamIdRequest {
    team_id: string,
}

export interface DeletePriceListRequest {
    team_id: string,
}

export interface MonthRequest {
    team_id: string
};

export interface Fine {
    id: string,
    team_id: string,
    name: string,
    description: string,
    amount: number
};

export const newFine = async (pool: Pool, newFineRequest: NewFineRequest) => {
    console.log('data in newFine:', newFineRequest);

    try {
        const result = await pool.query(
            'insert into fines (id, team_id, name, description, amount) values (gen_random_uuid(), $1, $2, $3, $4) returning *',
            [newFineRequest.team_id, newFineRequest.name, newFineRequest.description, newFineRequest.amount.toFixed(0)],
        );
        return (
            result.rows[0].id,
            result.rows[0].team_id,
            result.rows[0].name,
            result.rows[0].description,
            result.rows[0].amount
        );
    } catch (e) {
        console.log(e, e.message);
        return;
    }

};

export const deleteFine = async (pool: Pool, deleteFineRequest: DeleteFineRequest) => {
    const result = await pool.query(
        'delete from fines where id = $1',
        [deleteFineRequest.fine_id],
    );
    return result.rows[0];
};

export const assignFine = async (pool: Pool, assignFineRequest: AssignFineRequest) => {
    try {
        const result = await pool.query(
            'INSERT INTO teams_fines (id, user_id, team_id, fine_id, created_by_id) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *',
            [assignFineRequest.user_id, assignFineRequest.team_id, assignFineRequest.fine_id, assignFineRequest.created_by_id]
        );
        return result.rows[0];
    } catch (error) {
        console.error('Error assigning fine:', error);
        throw error;
    }
};

export const getFinePrice = async (pool: Pool, finePriceRequest: FinePriceRequest) => {
    let result = await pool.query(
        'select amount from fines where id = $1',
        [finePriceRequest.fine_id],
    );
    return result.rows[0];
};

export const finesByTeamIdAndUserId = async (pool: Pool, finesByTeamIdAndUserIdRequest: FinesByTeamIdAndUserIdRequest) => {
    let result = await pool.query(
        `
        SELECT fines.id, fines.name, fines.description, fines.amount 
        FROM fines 
        JOIN teams_fines ON fines.id = teams_fines.fine_id 
        WHERE teams_fines.user_id = $2 AND teams_fines.team_id = $1;

        `,
        [finesByTeamIdAndUserIdRequest.team_id, finesByTeamIdAndUserIdRequest.user_id],
    );
    return result.rows;
};

export const finesByTeamId = async (pool: Pool, finesByTeamIdRequest: FinesByTeamIdRequest) => {
    let result = await pool.query(
        `
        SELECT fines.id, fines.name, fines.description, fines.amount
        FROM fines
        WHERE team_id = $1
        `,
        [finesByTeamIdRequest.team_id],
    );
    return result.rows;
};

export const deletePriceList = async (pool: Pool, deletePriceListRequest: DeletePriceListRequest) => {
    let result = await pool.query(
        `
        DELETE
        FROM FINES
        WHERE team_id = $1
        RETURNING *
        `,
        [deletePriceListRequest.team_id]
    );
    return result.rows;
};

export const getMonthTopPayer = async (pool: Pool, monthRequest: MonthRequest) => {
    let result = await pool.query(
        `
        SELECT
            u.id AS id,
            u.name AS name,
            u.surname AS surname,
            SUM(f.amount) AS amount,
            COUNT(tf.id) AS count
        FROM
            users u
        JOIN
            teams_users tu ON u.id = tu.user_id
        JOIN
            teams_fines tf ON tu.user_id = tf.user_id
        JOIN
            fines f ON tf.fine_id = f.id
        WHERE
            tu.team_id = $1
        AND
            EXTRACT(MONTH FROM tf.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND
            EXTRACT(YEAR FROM tf.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY
            tu.team_id, u.id, u.name, u.surname
        ORDER BY
            amount DESC
        LIMIT 1;
        `,
        [monthRequest.team_id]
    );
    if (result.rowCount > 0) {
        return result.rows[0];
    }
    else {
        return null;
    }
};

export const getMonthBottomPayer = async (pool: Pool, monthRequest: MonthRequest) => {
    let result = await pool.query(
        `
        SELECT
            u.id AS id,
            u.name AS name,
            u.surname AS surname,
            SUM(f.amount) AS amount,
            COUNT(tf.id) AS count
        FROM
            users u
        JOIN
            teams_users tu ON u.id = tu.user_id
        JOIN
            teams_fines tf ON tu.user_id = tf.user_id
        JOIN
            fines f ON tf.fine_id = f.id
        WHERE
            tu.team_id = $1
        AND
            EXTRACT(MONTH FROM tf.created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
        AND
            EXTRACT(YEAR FROM tf.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        GROUP BY
            tu.team_id, u.id, u.name, u.surname
        ORDER BY
            amount
        LIMIT 1;
        `,
        [monthRequest.team_id]
    );
    if (result.rowCount > 0) {
        return result.rows[0];
    }
    else {
        return null;
    }
};