import { bot } from "../index";
import {
  checkSolBalance,
  checkSplTokenBalance,
} from "../service/getBalance";
import { ConfigService } from "../service/config";
import { deleteMessage, removeAnswerCallback } from "./index";
import walletController from "../controller/wallet";
import { getWalletTokenBalances } from "../service";

import axios from "axios";
import { NATIVE_MINT } from "@solana/spl-token";
interface TsplTokenInfo {
  address: string;
  decimals: number;
  amount: number;
}
let tokenAccount = {} as any;

export const balanceHandler = async (msg: any, action?: string) => {
  try {
    deleteMessage(msg);
    const id = action?.split(":")[1];
    const user = await walletController.findOne({
      filter: {
        _id: id,
      },
    });

    if (user.length > 0) {
      try {
        const solBalance = await checkSolBalance(user[0].publicKey);
        if (solBalance === undefined) {
          bot.sendMessage(
            msg.chat.id,
            `It failed to get balance due to network overload. Please try again later.`
          );
          return;
        }
        const splTokenInfo = (await getWalletTokenBalances(
          user[0].publicKey
        )) as Array<TsplTokenInfo>;
        const solTokenText =
          `<code>${user[0].publicKey}</code>\n` +
          `<b>Name: </b>  Solana\n` +
          `<b>Symbol: </b>  SOL\n` +
          `<b>Decimals: </b>  9\n` +
          `<b>Token Address:</b>  <code>${NATIVE_MINT.toString()}</code>\n` +
          `<b>Balance: </b>  ${solBalance}\n\n`;
        let splTokenText = ``;
        if (!!splTokenInfo && splTokenInfo.length > 0) {
          for (let i = 0; i < splTokenInfo.length; i++) {
            const response = await axios.post(
              `${ConfigService.getConfig().services.dexScreenerApiUrl}/${splTokenInfo[i].address}`
            );
            if (response?.status == 200 && response?.data?.pairs) {
              const tokenInfo = response.data.pairs[0].baseToken;
              splTokenText +=
                `<b>Name: </b>  ${tokenInfo.name}\n` +
                `<b>Symbol: </b>  ${tokenInfo.symbol}\n` +
                `<b>Decimals: </b>  ${splTokenInfo[i].decimals}\n` +
                `<b>Token Address:</b>  <code>${tokenInfo.address}</code>\n` +
                `<b>Balance: </b>  ${splTokenInfo[i].amount}\n\n`;
            } else {
              bot.sendMessage(
                msg.chat.id,
                `It failed to get balance due to network overload. Please try again later.`,
                {
                  parse_mode: "HTML",
                  reply_markup: {
                    inline_keyboard: [
                      [{ text: "Return 👈", callback_data: "return" }],
                    ],
                  },
                }
              );
              return;
            }
          }
        }
        const newText = solTokenText + splTokenText;
        tokenAccount[msg.chat.id] = {
          text: newText,
        };
        balanceModal(msg, tokenAccount);
      } catch (error) {
        console.log("Error accessing deposit information:", error);
      }
    } else {
      const nextText = `Wallet don't exist.`;
      bot.sendMessage(msg.chat.id, nextText, {});
    }
  } catch (error) {
    console.log("Unexpected error:", error);
  }
};

const balanceModal = async (msg: any, tokenAccount: any) => {
  try {
    const newText =
      `<b>Here is your current wallet balance:</b>\n` +
      `${tokenAccount[msg.chat.id]?.text}`;
    bot.sendMessage(msg.chat.id, newText, {
      parse_mode: "HTML",
      reply_markup: {
        inline_keyboard: [[{ text: "Return 👈", callback_data: "return" }]],
      },
    });
  } catch (error) {
    console.log("Error sending wallet balance message:", error);
  }
};
