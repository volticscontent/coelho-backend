"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronJobs = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const server_1 = require("../server");
const s3Service_1 = require("../services/s3Service");
const startCronJobs = () => {
    // Roda de 1 em 1 hora verificando abandono
    node_cron_1.default.schedule('0 * * * *', async () => {
        console.log('[CRON] Verificando sessões abandonadas...');
        try {
            // 2 horas é o tempo para expirar caso o usuário não caia num checkout / obrigado
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            const expiredSessions = await server_1.prisma.session.findMany({
                where: {
                    status: 'PENDING',
                    updatedAt: {
                        lt: twoHoursAgo
                    }
                }
            });
            for (const session of expiredSessions) {
                if (session.childrenData && Array.isArray(session.childrenData)) {
                    for (const child of session.childrenData) {
                        if (child.photoUrl) {
                            console.log(`[CRON] Deletando foto abandonada: ${child.photoUrl}`);
                            await (0, s3Service_1.deleteFile)(child.photoUrl);
                        }
                    }
                }
                await server_1.prisma.session.update({
                    where: { id: session.id },
                    data: { status: 'EXPIRED' }
                });
                console.log(`[CRON] Sessão ${session.id} expirada e fotos apagadas.`);
            }
        }
        catch (error) {
            console.error('[CRON] Erro ao deletar sessões expiradas: ', error);
        }
    });
    console.log('[CRON] Jobs agendados com sucesso.');
};
exports.startCronJobs = startCronJobs;
