import { bot } from "../index";
import { tokenSettingHandler } from "../library/tokenSettingHandler";
const { Commands } = require("../index");

export default new Commands(
  new RegExp(/^\/token/),
  "TokenSetting Bot",
  "token",
  true,
  async (msg: any) => {
    const fromId = msg.from.id;
    const chatId = msg.chat.id;
    if (fromId !== chatId) {
      bot.sendMessage(msg.chat.id, `This command can only be used in DM.`, {});
      return;
    }
    tokenSettingHandler(msg);
  },
  true
);
