import { bot } from "../index";
import { deleteMessage, deleteMessage1 } from ".";
import walletController from "../controller/wallet";
import swapController from "../controller/swap";
import { ellipsis } from "../service/utils";
import tokenSettingController from "../controller/tokenSetting";

export const deleteWallethandler = async (msg: any, action: string) => {
  try {
    const wallet_id = action.split(":")[1];
    const newText =
      `Would you like to delete your wallet?\n` +
      `Please check your wallet balance again.`;
    bot.sendMessage(msg.chat.id, newText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Cancel 👈", callback_data: "return" },
            {
              text: "OK ✔️",
              callback_data: `agree_delete_wallet:${wallet_id}`,
            },
          ],
        ],
      },
    });
  } catch (error) {
    console.log("Error handling reset wallet message:", error);
  }
};

export const confirmHandler = async (msg: any, action: string) => {
  try {
    await deleteMessage(msg);
    await deleteMessage1(msg, msg.message_id - 1);
    const wallet_id = action.split(":")[1];
    await walletController.deleteOne({
      filter: {
        _id: wallet_id,
      },
    });
    await swapController.deleteOne({
      filter: {
        wallet_id: wallet_id,
      },
    });

    bot.sendMessage(msg.chat.id, `✅ Delete is successfully completed.`);
  } catch (error) {
    console.log("Error during wallet reset:", error);
  }
};

export const deleteTokenHandler = async (msg: any) => {
  try {
    await deleteMessage(msg);
    const tokenInfo = await tokenSettingController.findOne({
      filter: {
        userId: msg.chat.id,
      },
    });
    let tokenData = [] as any;
    await tokenInfo.map((token: any) => {
      tokenData.push([
        {
          text: `${token.name} -> ${ellipsis(token.publicKey, 6)}`,
          callback_data: `selectToken_${token._id}`,
        },
      ]);
    });
    bot.sendMessage(msg.chat.id, `<b>Select token.</b>`, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: tokenData,
      },
    });
  } catch (error) {
    console.log("deleteTokenHandlerError:", error);
  }
};
export const selectTokenHandler = async (msg: any, action: string) => {
  try {
    await deleteMessage(msg);
    const id = action.split("_")[1];
    const tokenInfo = await tokenSettingController.findOne({
      filter: {
        _id: id,
      },
    });
    const newText =
      `Would you like to delete this token?\n\n` +
      `<b>Token Address: </b> <code>${tokenInfo[0].publicKey}</code>\n` +
      `<b>Name: </b>${tokenInfo[0].name}\n` +
      `<b>Symbol: </b>${tokenInfo[0].symbol}\n`;
    bot.sendMessage(msg.chat.id, newText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Cancel 👈", callback_data: "return" },
            {
              text: "OK ✔️",
              callback_data: `agree_delete_token:${tokenInfo[0].publicKey}`,
            },
          ],
        ],
      },
    });
  } catch (err) {
    console.log("selectTokenHandlerError:", err);
  }
};
export const confirmTokenHandler = async (msg: any, action: string) => {
  try {
    const token_publicKey = action.split(":")[1];
    console.log(token_publicKey, "11111111111111");
    bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: msg.chat.id, message_id: msg.message_id }
    );
    const r = await tokenSettingController.deleteOne({
      filter: {
        userId: msg.chat.id,
        publicKey: token_publicKey,
      },
    });

    if (r?.status === 200) {
      const swapData = await swapController.findOne({
        filter: { userId: msg.chat.id, quoteToken: token_publicKey },
      });
      if (swapData.data.length > 0) {
        await swapController.deleteMany({
          filter: {
            userId: msg.chat.id,
            quoteToken: token_publicKey,
          },
        });
        await walletController.updateOne({
          tokenId: token_publicKey,
          active: false,
        });
        bot.sendMessage(msg.chat.id, `✅ Reset is successfully completed.`);
      }
    } else if (r?.status === 202) {
      bot.sendMessage(msg.chat.id, `⚠️ Reset failed. Please try again.`);
    }
  } catch (error) {
    console.log("confirmTokenHandlerError:", error);
  }
};
