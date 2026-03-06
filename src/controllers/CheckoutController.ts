import { Request, Response } from 'express';
import { prisma } from '../server';
import { uploadFile } from '../services/s3Service';

export const createSession = async (req: Request, res: Response) => {
    try {
        const {
            product,
            quantity,
            options,
            totalPrice,
            customerName,
            customerEmail,
            customerPhone,
            clientUserAgent,
            clientIp,
            fbp,
            fbc
        } = req.body;

        console.log('[Checkout] Session creation requested');
        console.log('[Checkout] Body params:', req.body);
        const files = req.files as Express.Multer.File[];
        console.log(`[Checkout] Received ${files ? files.length : 0} files`);
        const childrenDataRaw = req.body.childrenData;

        let childrenData: any[] = [];
        if (childrenDataRaw) {
            childrenData = JSON.parse(childrenDataRaw);
            console.log('[Checkout] Parsed childrenData:', childrenData);
        }

        if (files && files.length > 0) {
            let fileIndex = 0;
            for (let i = 0; i < childrenData.length; i++) {
                if (childrenData[i].hasPhoto && fileIndex < files.length) {
                    const file = files[fileIndex];
                    console.log(`[Checkout] Uploading photo for child ${childrenData[i].name}...`);
                    try {
                        const url = await uploadFile(file.buffer, file.mimetype, file.originalname);
                        childrenData[i].photoUrl = url;
                        console.log(`[Checkout] Photo uploaded successfully! URL: ${url}`);
                    } catch (uploadError) {
                        console.error('[Checkout] FAILED to upload photo:', uploadError);
                        throw uploadError; // Re-throw to be caught by the outer catch
                    }
                    fileIndex++;
                }
            }
        }

        let parsedOptions: string[] = [];
        if (options) {
            parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
        }

        const session = await prisma.session.create({
            data: {
                product,
                quantity: quantity ? parseInt(quantity, 10) : 1,
                options: parsedOptions,
                totalPrice: totalPrice ? parseFloat(totalPrice) : 0,
                customerName,
                customerEmail,
                customerPhone,
                childrenData: childrenData,
                clientUserAgent,
                clientIp,
                fbp,
                fbc,
                status: 'PENDING'
            }
        });

        res.status(201).json({ sessionId: session.id });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
};

export const confirmSession = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            res.status(400).json({ error: 'Session ID is required' });
            return;
        }

        const session = await prisma.session.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            res.status(404).json({ error: 'Session not found' });
            return;
        }

        if (session.status === 'CONFIRMED') {
            res.json({ success: true, message: 'Session already confirmed' });
            return;
        }

        const updatedSession = await prisma.session.update({
            where: { id: sessionId },
            data: { status: 'CONFIRMED' }
        });

        // TODO: Disparar CAPI Tracking (Meta Pixel Purchase event)

        res.json({ success: true, session: updatedSession });
    } catch (error) {
        console.error('Error confirming session:', error);
        res.status(500).json({ error: 'Failed to confirm session' });
    }
};
