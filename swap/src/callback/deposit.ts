//import { bot } from "../index";
import walletController from "../controller/wallet";
import { sendTelegramMessage } from "../controller/bot_message";
import { ConfigService }  from "../service/config";
import fetch from "node-fetch";

export const depositHandler = async (
  msg: any,
  tokenAddress: any,
  Symbol: string,
  miniAmount: number
) => {
  try {
    const response  = await fetch(`${ConfigService.getConfig().tgBot.token}/editMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: msg.chat.id,
       message_id: msg.message_id,
      }),
    })

    if (!response.ok) {
      console.log(`deposit_depositHandlerError:API request failed with status ${response.status}`);
  }


   /* bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: msg.chat.id, message_id: msg.message_id }
    );  */
    const user = await walletController.findOne({
      filter: {
        userId: msg.chat.id,
      },
    });
  const depositMessage =   `
  Please deposit to the following address and send <i>tx</i> link.
  <b>Minimum Amount: </b> ${miniAmount}   
  <b>Symbol: </b>  ${Symbol}
  <code>${user.publicKey}</code>`
  /* bot.sendMessage(
      msg.chat.id,
      `
Please deposit to the following address and send <i>tx</i> link.
<b>Minimum Amount: </b> ${miniAmount}   
<b>Symbol: </b>  ${Symbol}
<code>${user.publicKey}</code>`,
      {
        parse_mode: "HTML",
      }
    );  */
    sendTelegramMessage(msg.chat.id, depositMessage);
  } catch (error) {
    console.log("depositHandlerError: ", error);
  }
};
