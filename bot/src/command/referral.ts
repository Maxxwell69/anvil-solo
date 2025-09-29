import { bot } from "../index";
import { referralHandler } from "../library/referralHandler";
import { ConfigService } from "../service/config";
import referralController from "../controller/referral";

const { Commands } = require("../index");

export default new Commands(
  new RegExp(/^\/referral/),
  "referral & earn",
  "referral",
  true,
  async (msg: any) => {
    const fromId = msg.from.id;
    const chatId = msg.chat.id;
    if (fromId != chatId) {
      bot.sendMessage(msg.chat.id, `This command can only be used in DM.`, {});
      return;
    }

    const referralAction = await referralController.findOne({
      userId: chatId,
    });

    if (referralAction) {
      if (referralAction.action === false) {
        bot.sendMessage(msg.chat.id, `Affiliate service is disabled`, {});
      } else {
        referralHandler(chatId);
      }
    } else {
      referralHandler(chatId);
    }
  },
  true
);
