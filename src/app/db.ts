import { Pool } from 'pg';

const INIT_UUID_EXTENSION = `
    create extension if not exists "uuid-ossp";
`;

const INIT_USERS = `
    create table if not exists users (
        id uuid primary key,
        name varchar(255) not null,
        surname varchar(255) not null,
        email text unique not null,
        password_hash varchar(72) not null,
        darkmode varchar(50) not null default 'false',
        language varchar(50) not null default 'sk',
        last_team_id uuid,
        created_at timestamptz default CURRENT_TIMESTAMP not null,
        updated_at timestamptz default CURRENT_TIMESTAMP not null
    );
`;

const INIT_TEAMS = `
    create table if not exists teams (
        id uuid primary key,
        name varchar(255) unique not null,
        image bytea,
        created_at timestamptz default CURRENT_TIMESTAMP not null,
        updated_at timestamptz default CURRENT_TIMESTAMP not null
    );
`;

const INIT_FINES = `
    create table if not exists fines (
        id uuid primary key,
        team_id uuid not null references teams(id) on delete cascade, 
        name varchar(255) not null,
        description text,
        amount integer,
        created_at timestamptz default CURRENT_TIMESTAMP not null,
        updated_at timestamptz default CURRENT_TIMESTAMP not null
    );
`;

const INIT_TEAMS_USERS = `
    create table if not exists teams_users (
        id uuid primary key,
        user_id uuid not null references users(id) on delete cascade,
        team_id uuid not null references teams(id) on delete cascade,
        user_role varchar(255) not null,
        number integer,
        created_at timestamptz default CURRENT_TIMESTAMP not null,
        updated_at timestamptz default CURRENT_TIMESTAMP not null
    );
`;

const INIT_TEAMS_FINES = `
    create table if not exists teams_fines (
        id uuid primary key,
        user_id uuid not null references users(id) on delete cascade,
        team_id uuid not null references teams(id) on delete cascade,
        fine_id uuid not null references fines(id) on delete cascade,
        created_by_id uuid not null references users(id) on delete cascade,
        created_at timestamptz default CURRENT_TIMESTAMP not null,
        updated_at timestamptz default CURRENT_TIMESTAMP not null
    );
`;

const INIT_INVITATIONS = `
    create table if not exists invitations (
        id uuid primary key,
        team_id uuid not null references teams(id) on delete cascade, 
        user_id uuid not null references users(id) on delete cascade,
        dress_number integer not null,
        created_at timestamptz default CURRENT_TIMESTAMP not null,
        updated_at timestamptz default CURRENT_TIMESTAMP not null
    );
`;

const INIT_UPDATED_AT = `
    create or replace function update_updated_at()
        returns trigger as $$
        begin
            NEW.updated_at = CURRENT_TIMESTAMP;
            return NEW;
        end;
        $$ language plpgsql;
`;

const INIT_UPDATED_AT_USERS = `
    create or replace trigger users_updated_at
        before update on users
        for each row
        execute function update_updated_at();
`;

const INIT_UPDATED_AT_TEAMS = `
    create or replace trigger teams_updated_at
        before update on teams
        for each row
        execute function update_updated_at();
`;

const INIT_UPDATED_AT_FINES = `
    create or replace trigger fines_updated_at
        before update on fines
        for each row
        execute function update_updated_at();
`;

const INIT_UPDATED_AT_TEAMS_USERS = `
    create or replace trigger teams_users_updated_at
        before update on teams_users
        for each row
        execute function update_updated_at();
`;

const INIT_UPDATED_AT_TEAMS_FINES = `
    create or replace trigger teams_fines_updated_at
        before update on teams_fines
        for each row
        execute function update_updated_at();
`;

const INIT_UPDATED_AT_INVITATIONS = `
    create or replace trigger invitations_updated_at
        before update on invitations
        for each row
        execute function update_updated_at();
`;

export async function initDb(pool: Pool) {
    const client = await pool.connect();
    client.query(INIT_UUID_EXTENSION);
    client.query(INIT_USERS);
    client.query(INIT_TEAMS);
    client.query(INIT_FINES);
    client.query(INIT_TEAMS_USERS);
    client.query(INIT_TEAMS_FINES);
    client.query(INIT_INVITATIONS);

    client.query(INIT_UPDATED_AT);
    client.query(INIT_UPDATED_AT_USERS);
    client.query(INIT_UPDATED_AT_TEAMS);
    client.query(INIT_UPDATED_AT_FINES);
    client.query(INIT_UPDATED_AT_TEAMS_USERS);
    client.query(INIT_UPDATED_AT_TEAMS_FINES);
    client.query(INIT_UPDATED_AT_INVITATIONS);
};