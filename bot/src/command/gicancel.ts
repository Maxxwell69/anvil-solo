import { bot } from "../index";
import { ConfigService } from "../service/config";
import userList from "../controller/userList";
const { Commands } = require("../index");
const { removeAnswerCallback, sendMessage } = require("../library/index");

export default new Commands(
  new RegExp(/^\/cancel/),
  "Cancel Bot",
  "cancel",
  true,
  async (msg: any) => {
    const fromId = msg.from.id;
    const chatId = msg.chat.id;
    if (fromId != chatId) {
      bot.sendMessage(msg.chat.id, `This command can only be used in DM.`, {});
      return;
    }
    removeAnswerCallback(msg.chat);
    sendMessage(msg.chat.id, `<b>All active commands have been canceled.</b>`);
  },
  true
);
