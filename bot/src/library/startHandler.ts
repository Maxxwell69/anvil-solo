import path from "path";
import { bot } from "../index";
import { ConfigService } from "../service/config";
import walletController from "../controller/wallet";
import adminSetting from "../controller/adminSetting";
import userListController from "../controller/userList";
import tokenSettingController from "../controller/tokenSetting";
import { removeAnswerCallback } from "./index";
import feeController from "../controller/fee";

interface TuserList {
  userId: number;
  userName: string;
  permission: boolean;
  fee: number;
}

interface TdepositData {
  userId: number;
  miniAmount: number;
  fee: number;
}
export const startHandler = async (msg: any) => {
  try {
    removeAnswerCallback(msg.chat);
    const result = await adminSetting.find();
    const data = result?.result as Array<TdepositData>;
    /*  if (data?.length <= 0 && msg.chat.id !== ConfigService.getConfig().SUPER_ADMIN_ID) {
        bot.sendMessage(
          msg.chat.id,
          `You have not been Whitelisted please contact Admin.`
        );
        return;
      } */

    const helpText =
      `<b>Bot Commands</b>\n` +
      `/token - add token to swap\n` +
      `/activity - set swap status\n` +
      `/balance - see wallet balance\n` +
      `/wallet - see wallet info\n` +
      `/withdraw - set withdraw wallet`;
    const adminHelpText =
      `<b>Bot Commands</b>\n` +
      `/manage - set data to use bot\n` +
      `/addactive - add user permission\n` +
      `/token - add token to swap\n` +
      `/activity - set swap status\n` +
      `/balance - see wallet balance\n` +
      `/wallet - see wallet info\n` +
      `/withdraw - set withdraw wallet`;
    if (msg.chat.id == ConfigService.getConfig().tgBot.superAdmin) {
      bot.sendMessage(msg.chat.id, adminHelpText, { parse_mode: "HTML" });
    } else {
      bot.sendMessage(msg.chat.id, helpText, { parse_mode: "HTML" });

    }

    const userExists = await userListController.exists({
      filter: {
        userId: Number(msg.chat.id),
      }
    });

    if(!userExists) {
      const userList = {
        userId: msg.chat.id,
        userName: msg.chat.username,
        fee: ConfigService.getConfig().swap.feePercentage,// msg.chat.id === ConfigService.getConfig().SUPER_ADMIN_ID ? 0 : data[0].fee,
      } as TuserList;

      await userListController.create(userList);

      await feeController.create({
        userId: msg.chat.id,
        fee: ConfigService.getConfig().swap.feePercentage,
      });
    }

    const userCount = await userListController.getCount();

    const user = await walletController.findOne({
      filter: {
        userId: msg.chat.id,
      },
    });
    const user1 = await tokenSettingController.findOne({
      filter: {
        userId: msg.chat.id,
      },
    });

    const videoPath = path.join(__dirname, "../../assets/AmariSilva.mp4");

    await bot
      .sendVideo(
        msg.chat.id,
        ConfigService.getConfig().tgBot.introVideo,
        // videoPath,
        {
          parse_mode: "HTML",
          duration: 45,
        },
        {
          contentType: "application/octet-stream",
          filename: "AmariSilva.mp4",
        }
      )

      .then(async (a) => {
        bot.sendMessage(
          msg.chat.id,
          `Welcome to <b>Anvil Bot! v2.5</b>  (Total Users: ${Number(userCount)})
  
Meet the Anvil Bot, Shogun’s foundation tool for growth. Like an anvil, it allows you to add material and swing the hammer, building the coin’s strength with each calculated trade.\n 
Through strategic trade ratios, the bot empowers users to forge stability over time, supporting liquidity and enhancing value. Every trade reinforces the coin, turning market activity into a resilient structure.\n 
With the Anvil Bot, you hold the power to shape the coin’s future with precision and control.
  
  <a href="${ConfigService.getConfig().social.website}">Anvil Bot Website</a> | <a href="${ConfigService.getConfig().social.twitter
          }">Twitter</a> | <a href="${ConfigService.getConfig().social.telegram
          }">Telegram</a> | <a href="${ConfigService.getConfig().social.support}">Anvil Bot Guide</a>`,
          user.length > 0
            ? user1.length > 0
              ? {
                parse_mode: "HTML",
                disable_web_page_preview: true,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🟢  Token Setting 💰",
                        callback_data: "token_setting",
                      },
                      {
                        text: "🟢  Open Wallet 🤖",
                        callback_data: "open_wallet",
                      },
                    ],
                    [
                      {
                        text: "🚀 Boost Token",
                        callback_data: "open_activity",
                      },
                      {
                        text: "🤝 Become an affiliate",
                        callback_data: "open_referral",
                      },
                    ],
                    [
                      {
                        text: "Support",
                        url: `${ConfigService.getConfig().social.support}`,
                      },
                      {
                        text: "Learn more 🔗",
                        url: `${ConfigService.getConfig().social.support}`,
                      },
                    ],
                  ],
                },
              }
              : {
                parse_mode: "HTML",
                disable_web_page_preview: true,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🟠  Token Setting 💰",
                        callback_data: "token_setting",
                      },
                      {
                        text: "🟢  Open Wallet 🤖",
                        callback_data: "open_wallet",
                      },
                    ],
                    [
                      {
                        text: "🚀 Boost Token",
                        callback_data: "open_activity",
                      },
                      {
                        text: "🤝 Become an affiliate",
                        callback_data: "open_referral",
                      },
                    ],
                    [
                      {
                        text: "Support",
                        url: `${ConfigService.getConfig().social.support}`,
                      },
                      {
                        text: "Learn more 🔗",
                        url: `${ConfigService.getConfig().social.support}`,
                      },
                    ],
                  ],
                },
              }
            : user1.length > 0
              ? {
                parse_mode: "HTML",
                disable_web_page_preview: true,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🟢  Token Setting 💰",
                        callback_data: "token_setting",
                      },
                      {
                        text: "🟠  Open Wallet 🤖",
                        callback_data: "open_wallet",
                      },
                    ],
                    [
                      {
                        text: "🚀 Boost Token",
                        callback_data: "open_activity",
                      },
                      {
                        text: "🤝 Become an affiliate",
                        callback_data: "open_referral",
                      },
                    ],
                    [
                      {
                        text: "Support",
                        url: `${ConfigService.getConfig().social.support}`,
                      },
                      {
                        text: "Learn more 🔗",
                        url: `${ConfigService.getConfig().social.support}`,
                      },
                    ],
                  ],
                },
              }
              : {
                parse_mode: "HTML",
                disable_web_page_preview: true,
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "🟠  Token Setting 💰",
                        callback_data: "token_setting",
                      },
                      {
                        text: "🟠  Open Wallet 🤖",
                        callback_data: "open_wallet",
                      },
                    ],
                    [
                      {
                        text: "🚀 Boost Token",
                        callback_data: "open_activity",
                      },
                      {
                        text: "🤝 Become an affiliate",
                        callback_data: "open_referral",
                      },
                    ],
                    [
                      {
                        text: "Support",
                        url: `${ConfigService.getConfig().social.support}`,
                      },
                      {
                        text: "Learn more 🔗",
                        url: `${ConfigService.getConfig().social.support}`,
                      },
                    ],
                  ],
                },
              }
        );
      });
  } catch (error) {
    console.log("startHandlerError: ", error);
  }
};
