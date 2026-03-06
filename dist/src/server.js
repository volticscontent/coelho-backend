"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const routes_1 = __importDefault(require("./routes"));
const cron_1 = require("./cron");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
exports.prisma = new client_1.PrismaClient();
// Middlewares
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*'
}));
app.use(express_1.default.json());
// Main Routes
app.use('/api', routes_1.default);
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Rabbit Backend Server is running on port ${port}`);
    (0, cron_1.startCronJobs)();
});
