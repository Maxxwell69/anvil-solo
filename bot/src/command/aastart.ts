import { bot } from "../index";
import { startHandler } from "../library/startHandler";
import referralController from "../controller/ReferralBy";


const { Commands } = require("../index");

export default new Commands(
  new RegExp(/^\/start/),
  "Start Bot",
  "start",
  true,
  async (msg: any) => {
    const fromId = msg.from.id;
    const chatId = msg.chat.id;

    const referrerId = msg?.text?.split(' ')[1];

    if (referrerId) {
      if (referrerId === String(fromId)) {
        await bot.sendMessage(chatId, "🚫 You can't refer yourself!");
      } else {
        await referralController.create({
          userId: fromId,
          referrerId
        });

        const userName = await getUsername(referrerId);

        await bot.sendMessage(chatId, `🎉 You were referred by user  ${userName}`);

      }
    } else {
      await bot.sendMessage(chatId, '👋 Welcome to the bot!');
    }

    if (fromId != chatId) {
      bot.sendMessage(msg.chat.id, `This command can only be used in DM.`, {});
      return;
    }
    startHandler(msg);
  },
  true
);


async function getUsername(userId: number): Promise<string | null> {
  try {
    const chat = await bot.getChat(userId);
    return chat.username || null;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
}