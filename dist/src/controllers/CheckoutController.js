"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmSession = exports.createSession = void 0;
const server_1 = require("../server");
const s3Service_1 = require("../services/s3Service");
const createSession = async (req, res) => {
    try {
        const { product, quantity, options, totalPrice, customerName, customerEmail, customerPhone, clientUserAgent, clientIp, fbp, fbc } = req.body;
        const files = req.files;
        const childrenDataRaw = req.body.childrenData;
        let childrenData = [];
        if (childrenDataRaw) {
            childrenData = JSON.parse(childrenDataRaw);
        }
        if (files && files.length > 0) {
            let fileIndex = 0;
            for (let i = 0; i < childrenData.length; i++) {
                if (childrenData[i].hasPhoto && fileIndex < files.length) {
                    const file = files[fileIndex];
                    const url = await (0, s3Service_1.uploadFile)(file.buffer, file.mimetype, file.originalname);
                    childrenData[i].photoUrl = url;
                    fileIndex++;
                }
            }
        }
        let parsedOptions = [];
        if (options) {
            parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
        }
        const session = await server_1.prisma.session.create({
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
    }
    catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: 'Failed to create session' });
    }
};
exports.createSession = createSession;
const confirmSession = async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            res.status(400).json({ error: 'Session ID is required' });
            return;
        }
        const session = await server_1.prisma.session.findUnique({
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
        const updatedSession = await server_1.prisma.session.update({
            where: { id: sessionId },
            data: { status: 'CONFIRMED' }
        });
        // TODO: Disparar CAPI Tracking (Meta Pixel Purchase event)
        res.json({ success: true, session: updatedSession });
    }
    catch (error) {
        console.error('Error confirming session:', error);
        res.status(500).json({ error: 'Failed to confirm session' });
    }
};
exports.confirmSession = confirmSession;
