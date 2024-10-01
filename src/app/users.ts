import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { Team } from './teams';

export interface RegisterRequest {
    email: string,
    name: string,
    surname: string,
    password: string
};

export interface LoginRequest {
    email: string,
    password: string
};

export interface UpdateDarkmodeRequest {
    darkmode: string,
    user_id: string
};

export interface UpdateLanguageRequest {
    language: string,
    user_id: string
};

export interface UpdateLastTeamIdRequest {
    last_team_id: string,
    user_id: string
}

export interface UserIdStatusRequest {
    team_id: string,
    user_id: string
}

export interface UpdateProfileRequest {
    name: string,
    surname: string,
    email: string,
    password: string,
    user_id: string,
}

export interface User {
    id: string,
    name: string,
    surname: string,
    email: string,
    password_hash: string,
    darkmode: boolean,
    language: string,
    last_team_id: string,
};

export interface CreateInvitationRequest {
    invited_user_id: string,
    team_id: string,
    dress_number: string,
};

export interface InvitationsByUserIdRequest {
    user_id: string,
};

export interface DeleteUserRequest {
    user_id: string
}

export const register = async (pool: Pool, registerRequest: RegisterRequest): Promise<User> => {
    const hash = await bcrypt.hash(registerRequest.password, 10);
    let result = await pool.query(
        'insert into users (id, name, surname, email, password_hash) values (gen_random_uuid(), $1, $2, $3, $4) returning *',
        [registerRequest.name, registerRequest.surname, registerRequest.email, hash]
    );
    return (
        result.rows[0].id,
        result.rows[0].name,
        result.rows[0].surname,
        result.rows[0].email,
        result.rows[0].password_hash,
        result.rows[0].darkmode,
        result.rows[0].language,
        result.rows[0].last_team_id
    );
};

export const login = async (pool: Pool, loginRequest: LoginRequest): Promise<User> => {
    let result = await pool.query(
        'select * from users where email = $1',
        [loginRequest.email]
    );

    if (result.rows.length === 0) {
        throw new Error('Invalid email or password');
    }

    const user: User = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        surname: result.rows[0].surname,
        email: result.rows[0].email,
        password_hash: result.rows[0].password_hash,
        darkmode: result.rows[0].darkmode,
        language: result.rows[0].language,
        last_team_id: result.rows[0].last_team_id
    };

    const match = await bcrypt.compare(loginRequest.password, result.rows[0].password_hash);

    if (!match) {
        throw new Error('Invalid email or password');
    }

    return user;
};

export const updateDarkmodeByUserId = async (pool: Pool, updateDarkmodeRequest: UpdateDarkmodeRequest) => {
    let result = await pool.query(
        'UPDATE users SET darkmode = $1 WHERE id = $2 RETURNING *',
        [updateDarkmodeRequest.darkmode, updateDarkmodeRequest.user_id],
    );
    return result.rows[0]
};

export const updateLanguageByUserId = async (pool: Pool, updateLanguageRequest: UpdateLanguageRequest) => {
    let result = await pool.query(
        'update users set language = $1 where id = $2 returning *',
        [updateLanguageRequest.language, updateLanguageRequest.user_id],
    );
    return result.rows[0]
};

export const updateLastTeamIdByUserId = async (pool: Pool, updateLastTeamIdRequest: UpdateLastTeamIdRequest) => {
    let result = await pool.query(
        'update users set last_team_id = $1 where id = $2 returning *',
        [updateLastTeamIdRequest.last_team_id, updateLastTeamIdRequest.user_id],
    );
    return result.rows[0];
};

export const updateProfileByUserId = async (pool: Pool, updateProfileRequest: UpdateProfileRequest) => {
    const hash = await bcrypt.hash(updateProfileRequest.password, 10);

    let result = await pool.query(
        'update users set name = $1, surname = $2, email = $3, password_hash = $4 where id = $5 returning *',
        [updateProfileRequest.name, updateProfileRequest.surname, updateProfileRequest.email, hash, updateProfileRequest.user_id],
    );
    return result.rows[0];
};


export const getInvitationsByUserId = async (pool: Pool, invitationsByUserIdRequest: InvitationsByUserIdRequest): Promise<Array<Team>> => {
    let result = await pool.query(
        `
        SELECT t.id, t.name, t.image, COUNT(tu.team_id) AS teammatesCount
        FROM public.teams t
        LEFT JOIN public.teams_users tu ON t.id = tu.team_id
        WHERE t.id IN (
            SELECT team_id
            FROM public.invitations
            WHERE user_id = $1
        )
        GROUP BY t.id, t.name, t.image;
        `,
        [invitationsByUserIdRequest.user_id]
    );
    return result.rows;
};

export const createInvitation = async (pool: Pool, createInvitationRequest: CreateInvitationRequest) => {
    try {
        const queryResult = await pool.query('SELECT id FROM users WHERE email = $1', [createInvitationRequest.invited_user_id]);

        if (queryResult.rows.length === 0) {
            throw new Error('User not found');
        }

        const userId = queryResult.rows[0].id;

        const existingMemberCheck = await pool.query(
            'SELECT COUNT(*) FROM teams_users WHERE team_id = $1 AND user_id = $2',
            [createInvitationRequest.team_id, userId]
        );

        if (existingMemberCheck.rows[0].count > 0) {
            throw new Error('User is already a member of the team');
        }

        const insertResult = await pool.query(
            `
            INSERT INTO invitations (id, team_id, user_id, dress_number)
            VALUES (gen_random_uuid(), $2, $1, $3) 
            RETURNING *;
            `,
            [userId, createInvitationRequest.team_id, createInvitationRequest.dress_number]
        );

        return insertResult.rows;
    } catch (error) {
        throw new Error('Failed to create invitation: ' + error.message);
    }
};

export const deleteUser = async (pool: Pool, deleteUserRequest: DeleteUserRequest) => {
    let result = await pool.query(
        'delete from users where id = $1 returning *',
        [deleteUserRequest.user_id],
    );
    return result.rows[0];
};

export const userTeamStatus = async (pool: Pool, userIdStatusRequest: UserIdStatusRequest) => {
    let result = await pool.query(
        `
        SELECT user_role
        FROM teams_users
        WHERE team_id = $1 AND user_id = $2
        `,
        [userIdStatusRequest.team_id, userIdStatusRequest.user_id],

    );
    return result.rows;
};

export const allUsers = async (pool: Pool) => {
    let result = await pool.query(
        `
        SELECT users.id
        FROM users
        `
    );
    return result.rows;
};
