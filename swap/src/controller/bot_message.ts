import { ConfigService }  from "../service/config";
import fetch from "node-fetch";

export const sendTelegramMessage = async (
    userId: number,
    message: string) => {
        console.log("bot_message_sendMessage")
        try{
            const response = await fetch(`${ConfigService.getConfig().tgBot.token}/sendMessage`,{
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chat_id: userId,
                    text: message,
                }),
            })

            if (!response.ok) {
                console.log(`bot_message_sendMessageError:API request failed with status ${response.status}`);
            }

        }catch(error){
            console.log("bot_message_sendMessageError",error)
        }
    }