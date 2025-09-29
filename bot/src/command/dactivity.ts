import { bot } from "../index";
import { swapHandler } from "../library/swapHandler";
const { Commands } = require("../index");

export default new Commands(
  new RegExp(/^\/activity/),
  "Activity bot",
  "activity",
  true,
  async (msg: any) => {
    const fromId = msg.from.id;
    const chatId = msg.chat.id;
    if (fromId !== chatId) {
      bot.sendMessage(msg.chat.id, `This command can only be used in DM.`, {});
      return;
    }
    swapHandler(msg);
  },
  true
);
