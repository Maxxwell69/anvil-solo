import { bot } from "../index";
import { walletHandler } from "../library/walletHandler";
const { Commands } = require("../index");

export default new Commands(
  new RegExp(/^\/balance/),
  "Balance bot",
  "balance",
  true,
  async (msg: any) => {
    const fromId = msg.from.id;
    const chatId = msg.chat.id;
    if (fromId != chatId) {
      bot.sendMessage(msg.chat.id, `This command can only be used in DM.`, {});
      return;
    }
    walletHandler(msg, 1);
  },
  true
);
