import { Router, Request, Response } from 'express';
import { sendBot } from "../controller/sendMessage";

const router = Router();

router.post('/sendMessage', async (req: Request, res: Response) => {
    console.log("sendMessage_router");
    const message = req.body.text;
    const userId = req.body.chat_id;
    const response = await sendBot.sendMessage(userId, message);
    res.json(response);
});

router.post('/editMessage', async (req: Request, res: Response) => {
    const messageId = parseInt(req.body.messageId);
    const userId = req.body.userId;
    const response = await sendBot.editMessageReply(userId, messageId);
    res.json(response);
});

router.post('/swapUpdate', async (req: Request, res: Response) => {
    try {
        const { _id, buyProgress, flag, isBalance, feeValue } = req.body;
        await sendBot.swapUpdateAPI({
            _id,
            buyProgress,
            flag,
            isBalance,
            feeValue
        });
        res.json({ success: true });
        console.log("swapUpdate_router");
    } catch (error) {
        console.error('Error in swap update:', error);
        res.status(500).json({ error: 'Failed to update swap information' });
    }
});

export default router;