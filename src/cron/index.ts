import cron from 'node-cron';
import { prisma } from '../server';
import { deleteFile } from '../services/s3Service';

export const startCronJobs = () => {
    // Roda de 1 em 1 hora verificando abandono
    cron.schedule('0 * * * *', async () => {
        console.log('[CRON] Verificando sessões abandonadas...');
        try {
            // 2 horas é o tempo para expirar caso o usuário não caia num checkout / obrigado
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

            const expiredSessions = await prisma.session.findMany({
                where: {
                    status: 'PENDING',
                    updatedAt: {
                        lt: twoHoursAgo
                    }
                }
            });

            for (const session of expiredSessions) {
                if (session.childrenData && Array.isArray(session.childrenData)) {
                    for (const child of session.childrenData as any[]) {
                        if (child.photoUrl) {
                            console.log(`[CRON] Deletando foto abandonada: ${child.photoUrl}`);
                            await deleteFile(child.photoUrl);
                        }
                    }
                }

                await prisma.session.update({
                    where: { id: session.id },
                    data: { status: 'EXPIRED' }
                });

                console.log(`[CRON] Sessão ${session.id} expirada e fotos apagadas.`);
            }
        } catch (error) {
            console.error('[CRON] Erro ao deletar sessões expiradas: ', error);
        }
    });

    console.log('[CRON] Jobs agendados com sucesso.');
};
