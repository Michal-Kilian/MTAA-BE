import { Pool } from 'pg';
import { initDb } from './db';
import { serverStart, } from './endpoints';

export function initServer(port: number, host: string) {
  console.log('Starting server at port', port);

  const poolConfig = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: false,
  };

  console.log(
    'Connecting to database at ' + poolConfig.host + ':' + poolConfig.port,
  );

  const pool = new Pool(poolConfig);
  initDb(pool);

  const server = serverStart(pool, port, host);

  return async () => {
    console.log('Stopping server');
    server.close(() => console.log('Server stopped'));
    await pool.end();
  };
}