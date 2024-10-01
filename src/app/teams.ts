import { Pool } from "pg";

export interface NewTeamRequest {
    name: string,
    image_base64: string,
    userId: string,
};

export interface TeamsByUserIdRequest {
    user_id: string
};

export interface UsersByTeamIdRequest {
    team_id: string
};

export interface MembersCountByTeamIdRequest {
    team_id: string
};

export interface Team {
    id: string,
    name: string,
    image: Buffer
};

export interface JoinTeamRequest {
    user_id: string,
    team_id: string,
};

export const newTeam = async (pool: Pool, newTeamRequest: NewTeamRequest): Promise<Team> => {
    console.log(newTeamRequest);

    let result;
    if (newTeamRequest.image_base64) {
        //const imageBuffer = Buffer.from(newTeamRequest.image_base64);
        //const imageBuffer = Buffer.from("\\x" + Buffer.from(newTeamRequest.image_base64, "base64").toString("hex"));

        result = await pool.query(
            'insert into teams (id, name, image) values (gen_random_uuid(), $1, $2) returning *',
            [newTeamRequest.name, newTeamRequest.image_base64]
        );
    }
    else {
        result = await pool.query(
            'insert into teams (id, name) values (gen_random_uuid(), $1) returning *',
            [newTeamRequest.name]
        );
    };

    let teamId = result.rows[0].id;
    const adminNumber = 0;

    await pool.query(
        'insert into teams_users (id, user_id, team_id, user_role, number) values (gen_random_uuid(), $1, $2, $3, $4)',
        [newTeamRequest.userId, teamId, "admin", adminNumber]
    );

    await pool.query(
        'update users set last_team_id = $1 where id = $2',
        [teamId, newTeamRequest.userId]
    );
    const team: Team = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        image: result.rows[0].image
    };
    return team;
};

export const getTeamsByUserId = async (pool: Pool, teamsByUserIdRequest: TeamsByUserIdRequest): Promise<Array<Team>> => {
    let result = await pool.query(
        `SELECT t.id, t.name, t.image, COUNT(tu.team_id) AS teammatesCount
            FROM public.teams t
            LEFT JOIN public.teams_users tu ON t.id = tu.team_id
            WHERE t.id IN (
                SELECT team_id
                FROM public.teams_users
                WHERE user_id = $1
            )
            GROUP BY t.id, t.name, t.image;
        `,
        [teamsByUserIdRequest.user_id]
    );
    return result.rows;
};

export const getUsersByTeamId = async (pool: Pool, usersByTeamIdRequest: UsersByTeamIdRequest) => {
    let result = await pool.query(
        'select users.id, users.name, users.surname, teams_users.number from users join teams_users on users.id = teams_users.user_id where teams_users.team_id = $1',
        [usersByTeamIdRequest.team_id],
    );
    return result.rows;
};

export const getMembersCountByTeamId = async (pool: Pool, membersCountByTeamIdRequest: MembersCountByTeamIdRequest) => {
    let result = await pool.query(
        'select count(*) from teams_users where team_id = $1',
        [membersCountByTeamIdRequest.team_id]
    );
    return result.rows[0];
};

export const joinTeam = async (pool: Pool, joinTeamRequest: JoinTeamRequest) => {
    try {
        const invitationResult = await pool.query(
            'SELECT dress_number FROM invitations WHERE team_id = $1 AND user_id = $2',
            [joinTeamRequest.team_id, joinTeamRequest.user_id]
        );

        const dressNumber = invitationResult.rows[0]?.dress_number;

        await pool.query(
            'DELETE FROM invitations WHERE team_id = $1 AND user_id = $2',
            [joinTeamRequest.team_id, joinTeamRequest.user_id]
        );

        const result = await pool.query(
            'INSERT INTO teams_users (id, team_id, user_id, user_role, number) VALUES (gen_random_uuid(), $1, $2, $3, $4) RETURNING *',
            [joinTeamRequest.team_id, joinTeamRequest.user_id, "guest", dressNumber]
        );

        return result.rows[0];
    } catch (error) {
        console.error('Error joining team:', error);
        throw error;
    }
};
