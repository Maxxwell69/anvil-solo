import { bot } from "../index";
import { addWithdrawWalletHandler } from "../library/withdrawHandler";

const { Commands } = require("../index");

export default new Commands(
  new RegExp(/^\/withdraw_wallet/),
  "Set Withdraw Wallet",
  "withdraw_wallet",
  true,
  async (msg: any) => {
    const fromId = msg.from.id;
    const chatId = msg.chat.id;
    if (fromId != chatId) {
      bot.sendMessage(msg.chat.id, `This command can only be used in DM.`, {});
      return;
    }
    addWithdrawWalletHandler(msg);
  },
  true
);