import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import routes from './routes';
import { startCronJobs } from './cron';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

export const prisma = new PrismaClient();

// Middlewares
app.use(cors({
    origin: function (origin, callback) {
        // Permitir qualquer origem para evitar bloqueios de CORS entre locais e produção
        callback(null, true);
    },
    credentials: true
}));
app.use(express.json());

// Main Routes
app.use('/api', routes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Rabbit Backend Server is running on port ${port}`);
    startCronJobs();
});
