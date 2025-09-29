import { bot } from "../index";
import { ConfigService } from "../service/config";
import { answerCallbacks } from "../index";
import { Message } from "node-telegram-bot-api";

export const removeAnswerCallback = (chat: any) => {
  answerCallbacks[chat.id] = null;
  delete answerCallbacks[chat.id];
};
export const generateCallbackOption = (message: Message, mode: string) => {
  return {
    chat_id: message.chat.id,
    message_id: message.message_id,
    parse_mode: mode,
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Go to Main",
            callback_data: "admin_ui",
          },
        ],
      ],
    },
  };
};
export const sendMessage = async (userid: string, message: string) => {
  bot.sendMessage(userid, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true,
  });
};

export const deleteMessage = async (message: Message) => {
  try {
    bot.deleteMessage(message.chat.id, message.message_id);
  } catch (err) {
    console.log("deleteMessage = ", err);
  }
};

export const deleteMessage1 = async (message: Message, message_id: number) => {
  try {
    bot.deleteMessage(message.chat.id, message_id);
  } catch (err) {
    console.log("deleteMessage = ", err);
  }
};
export const alertMessage = async (msg: any) => {
  const newText =
    `You can't use this bot because permission is de-actived.\n` +
    `Please contact admin`;
  bot.sendMessage(msg.chat.id, newText, {
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Contact Us",
            url: `${ConfigService.getConfig().social.support}`,
          },
        ],
      ],
    },
  });
};
export const subBalance = async (text: number) => {
  const r = Number(Math.floor(text * 1e6) / 1e6);
  return r;
};
