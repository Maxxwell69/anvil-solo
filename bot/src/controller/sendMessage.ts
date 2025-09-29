import { bot } from '../index'
import swapController from "./swap";

export class sendBot {
    static sendMessage = async (chatId: number, message: string) => {
        console.log("bot_messageResived")
        await bot.sendMessage(chatId, message, {
            parse_mode: "HTML",
            disable_web_page_preview: true
        });
        console.log("Message sent successfully");
        return { success: true };
    }

    static editMessageReply = async(chat_id: number, message_id: number) => {
        bot.editMessageReplyMarkup(
            { inline_keyboard: [] },
            { chat_id: chat_id, message_id: message_id }
          );
    }

    static swapUpdateAPI = async(swapInfoUpdate: {
        _id: string,
        buyProgress: number,
        flag: boolean,
        isBalance: boolean,
        feeValue: number
    }) => {
        try {
            await swapController.swapUpdate(swapInfoUpdate);
            console.log("swapUpdateAPI_bot");
        } catch (error) {
            console.error("Error sending swap update:", error);
        }
    }
}