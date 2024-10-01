import 'dotenv/config';
import { initServer } from "./app/main";

initServer(parseInt(process.env.PORT), process.env.HOST);
