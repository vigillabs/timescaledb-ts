import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

export const app = express();
export const port = process.env.PORT as string;

app.use(express.json());
app.use('/api', routes);
