import express, { Request } from "express";
import { Pool } from "pg";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import { register, RegisterRequest, login, LoginRequest, updateDarkmodeByUserId, UpdateDarkmodeRequest, updateLanguageByUserId, UpdateLanguageRequest, UpdateProfileRequest, updateProfileByUserId, UpdateLastTeamIdRequest, updateLastTeamIdByUserId, getInvitationsByUserId, CreateInvitationRequest, createInvitation, DeleteUserRequest, deleteUser, userTeamStatus, allUsers } from './users';
import { assignFine, AssignFineRequest, deletePriceList, finesByTeamId, finesByTeamIdAndUserId, FinesByTeamIdRequest, getMonthBottomPayer, getMonthTopPayer, MonthRequest, newFine, NewFineRequest } from "./fines";
import { getTeamsByUserId, newTeam, NewTeamRequest, getUsersByTeamId, UsersByTeamIdRequest, joinTeam, JoinTeamRequest } from "./teams";
import { CronJob } from 'cron';

let pool: Pool;
const app = express();

app.use(cors({ credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(morgan('dev'));

export function serverStart(_pool: Pool, port: number, host: string) {
    pool = _pool;
    let server = app.listen(port, host, () => {
        console.log(`Listening on ${host}:${port}`);
    });
    return server;
};

app.get('/status', (req, res) => {
    return res.sendStatus(200)
});

app.post('/register', async (req: Request<{}, {}, RegisterRequest>, res) => {
    try {
        let user = await register(pool, req.body);
        res.status(201).json(user);
    } catch (e) {
        res.status(409).json({ error: e.message });
    };
});

app.post('/login', async (req: Request<{}, {}, LoginRequest>, res) => {
    try {
        let user = await login(pool, req.body);
        res.status(201).json(user);
    } catch (e) {
        res.status(409).json({ error: e.message });
    };
});

app.post('/fines', async (req: Request<{}, {}, AssignFineRequest>, res) => {
    try {
        let fine = await assignFine(pool, req.body);
        res.status(201).json(fine);
    } catch (e) {
        console.log({ e });
        res.status(400).json({ error: e.message });
    };
});

app.post('/fines/create', async (req: Request<{}, {}, NewFineRequest>, res) => {
    console.log(req.body);
    try {
        let fine = await newFine(pool, req.body);
        res.status(201).json(fine);
    } catch (e) {
        res.status(400).json({ error: e.message });
    };
});

app.post('/teams', async (req: Request<{}, {}, NewTeamRequest>, res) => {
    try {
        let team = await newTeam(pool, req.body);
        res.status(201).json(team);
    } catch (e) {
        console.log({ e });
        res.status(400).json({ error: e.message });
    };
});

app.get('/teams', async (req: Request<{}, {}, {}, { user_id: string }>, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ error: 'Missing user_id' });
        }

        let teams = (await getTeamsByUserId(pool, { user_id })).map((team) => { return { ...team, image: team.image ? team.image.toString() : null } });
        res.status(200).json(teams);
    } catch (e) {
        console.log(e);
        res.status(400).json({ error: e.message });
    }
});

app.put('/darkmode', async (req: Request<{}, {}, UpdateDarkmodeRequest>, res) => {
    try {
        let result = await updateDarkmodeByUserId(pool, req.body);
        res.status(204).json(result);
    } catch (e) {
        res.status(400).json({ error: e.message })
    };
});

app.put('/language', async (req: Request<{}, {}, UpdateLanguageRequest>, res) => {
    try {
        let result = await updateLanguageByUserId(pool, req.body);
        res.status(204).json(result);
    } catch (e) {
        res.status(400).json({ error: e.message })
    };
});

app.put('/profile', async (req: Request<{}, {}, UpdateProfileRequest>, res) => {
    try {
        let result = await updateProfileByUserId(pool, req.body);
        res.status(204).json(result);
    } catch (e) {
        res.status(400).json({ error: e.message })
    };
});

app.put('/last-team', async (req: Request<{}, {}, UpdateLastTeamIdRequest>, res) => {
    try {
        let result = await updateLastTeamIdByUserId(pool, req.body);
        res.status(204).json(result);
    } catch (e) {
        res.status(400).json({ error: e.message })
    };
});

app.get('/teammates', async (req: Request<{}, {}, {}, { team_id: string }>, res) => {
    try {
        const { team_id } = req.query;
        if (!team_id) {
            return res.status(400).json({ error: 'Missing team_id' });
        }
        let result = await getUsersByTeamId(pool, { team_id });
        res.status(200).json(result);
    } catch (e) {
        res.status(400).json({ error: e.message })
    };
});

app.get('/invitation', async (req: Request<{}, {}, {}, { user_id: string }>, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ error: 'Missing user_id' });
        }

        let teams = (await getInvitationsByUserId(pool, { user_id })).map((team) => { return { ...team, image: team.image ? team.image.toString() : null } });
        res.status(200).json(teams);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/invitation', async (req: Request<{}, {}, CreateInvitationRequest>, res) => {
    try {
        let result = await createInvitation(pool, req.body);
        res.status(201).json(result);
    } catch (e) {
        res.status(409).json({ error: e.message });
    };
});

app.post('/join-team', async (req: Request<{}, {}, JoinTeamRequest>, res) => {
    try {
        let team = await joinTeam(pool, req.body);
        res.status(201).json(team);
    } catch (e) {
        console.log({ e });
        res.status(400).json({ error: e.message });
    };
});

app.delete('/user', async (req: Request<{}, {}, DeleteUserRequest>, res) => {
    try {
        let user = await deleteUser(pool, req.body);
        res.status(200).json(user);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.get('/overview/top-payer', async (req: Request<{}, {}, {}, { team_id: string }>, res) => {
    try {
        const { team_id } = req.query;
        if (!team_id) {
            return res.status(400).json({ error: 'Missing team_id' });
        }
        let result = await getMonthTopPayer(pool, { team_id });
        res.status(200).json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    };
});

app.get('/overview/bottom-payer', async (req: Request<{}, {}, {}, { team_id: string }>, res) => {
    try {
        const { team_id } = req.query;
        if (!team_id) {
            return res.status(400).json({ error: 'Missing team_id' });
        }
        let result = await getMonthBottomPayer(pool, { team_id });
        res.status(200).json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    };
});

app.get('/user-fines', async (req: Request<{}, {}, {}, { team_id: string, user_id: string }>, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ error: 'Missing user_id' });
        }
        const { team_id } = req.query;
        if (!team_id) {
            return res.status(400).json({ error: 'Missing team_id' });
        }
        let fines = await finesByTeamIdAndUserId(pool, { team_id, user_id });
        res.status(200).json(fines);
    } catch (e) {
        console.log(e);
        res.status(400).json({ error: e.message });
    };
});

app.get('/fines', async (req: Request<{}, {}, {}, { team_id: string }>, res) => {
    try {
        const { team_id } = req.query;
        if (!team_id) {
            return res.status(400).json({ error: 'Missing team_id' });
        }
        let fines = await finesByTeamId(pool, { team_id });
        console.log(fines);
        res.status(200).json(fines);
    } catch (e) {
        console.log({ e });

        res.status(400).json({ error: e.message });
    };
});

app.delete('/fines', async (req: Request<{}, {}, {}, { team_id: string }>, res) => {
    try {
        const { team_id } = req.query;

        if (!team_id) {
            return res.status(400).json({ error: 'Missing team_id' });
        }
        let fines = await deletePriceList(pool, { team_id });
        res.status(204).json(fines);
    } catch (e) {
        console.log(e.message);
        res.status(400).json({ error: e.message });
    };
});

app.get('/user/status', async (req: Request<{}, {}, {}, { team_id: string, user_id: string }>, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) {
            return res.status(400).json({ error: 'Missing user_id' });
        }
        const { team_id } = req.query;
        if (!team_id) {
            return res.status(400).json({ error: 'Missing team_id' });
        }
        let fines = await userTeamStatus(pool, { team_id, user_id });
        res.status(200).json(fines);
    } catch (e) {
        res.status(400).json({ error: e.message });
    };
});

app.get('/all-users', async (req: Request<{}, {}, {}, {}>, res) => {
    try {
        let result = await allUsers(pool);
        res.status(200).json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

import WebSocket from 'ws';
import console from "console";

const wss = new WebSocket.Server({ host: process.env.HOST, port: 3332 });
const connectedClients = new Set();

wss.on('connection', (ws: any) => {
    console.log('New client connected');

    connectedClients.add(ws);

    ws.on('message', async (message: any) => {
        try {
            const newMessage = JSON.parse(message);
            console.log({ newMessage });
            connectedClients.forEach((client) => {
                // @ts-ignore
                client.send(JSON.stringify({ data: newMessage }));
                console.log("Sending messing to client with type:", newMessage.type);
            });

        } catch (error) {
            console.error('Error parsing message:', error);
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
        connectedClients.delete(ws);
    });
});

let previousNumberOfUsers = 0;
let newUsersDifference = 0;
let initialized = false;
const job = new CronJob(
    '0 0 * * * *',
    async function () {

        const numberOfUsers = (await allUsers(pool)).length;
        newUsersDifference = numberOfUsers - previousNumberOfUsers;
        previousNumberOfUsers = numberOfUsers;

        if (!initialized) {
            initialized = !initialized;

        } else {
            if (newUsersDifference === 1) {
                console.log("You have gained", newUsersDifference, "new user in the past hour!");
            } else if (newUsersDifference > 1) {
                console.log("You have gained", newUsersDifference, "new users in the past hour!");
            }
        }



    },
    null,
    true
);
