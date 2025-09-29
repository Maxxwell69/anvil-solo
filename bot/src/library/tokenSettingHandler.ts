import { bot } from "..";
import axios from "axios";
import { ConfigService } from "../service/config";
import tokenController from "../controller/tokenSetting";
import userList from "../controller/userList";
import { NATIVE_MINT } from "@solana/spl-token";
const { PublicKey, Connection } = require("@solana/web3.js");

const connection = new Connection(ConfigService.getConfig().solana.rpcUrl);

interface TtokenInfo {
  userId: number;
  name: string;
  symbol: string;
  pairInfo: any;
  decimal: number;
  publicKey: string;
}
export const tokenSettingHandler = async (msg: any) => {
  try {
    const userData = await userList.findOne({
      filter: {
        userId: msg.chat.id,
      },
    });

    const user = await tokenController.findOne({
      filter: {
        userId: msg.chat.id,
      },
    });
    if (user.length == 0) {
      addTokenHanlder(msg);
    } else {
      let Text = "✅ Token is valid.\n";
      user.map((list: any) => {
        Text +=
          `🟣 <b>Token Address: </b> <code>${list.publicKey}</code>\n` +
          `🟢 <b>Token Name: </b> ${list.name}\n` +
          `🟠 <b>Token Symbol: </b> ${list.symbol}\n\n`;
      });

      bot.sendMessage(msg.chat.id, Text, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Add Token ", callback_data: "add_token" },
              {
                text: "Delete ",
                callback_data: "delete_token",
              },
            ],
            [{ text: "Return 👈", callback_data: "return" }],
          ],
        },
      });
    }
  } catch (err) {
    console.error("Error token Setting: ", err);
  }
};
export const addTokenHanlder = async (msg: any) => {
  if (
    ![
      "/cancel",
      "/support",
      "/start",
      "/wallet",
      "/token",
      "/deposit",
      "/withdraw",
      "/balance",
      "/activity",
      "/totaluser",
      "/addpermission",
      "/manage",
      "/addactive",
    ].includes(msg.text)
  ) {
    bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      { chat_id: msg.chat.id, message_id: msg.message_id }
    );
  }
  bot
    .sendMessage(
      msg.chat.id,
      `
<b>Please enter the token address to swap.</b>`,
      {
        parse_mode: "HTML",
        reply_markup: {
          force_reply: true,
        },
      }
    )
    .then(async (sentMessage) => {
      bot.onReplyToMessage(
        sentMessage.chat.id,
        sentMessage.message_id,
        async (reply) => {
          const tokenAddress = reply.text?.trim() as string;
          if (
            [
              "/cancel",
              "/support",
              "/start",
              "/wallet",
              "/token",
              "/deposit",
              "/withdraw",
              "/balance",
              "/activity",
              "/totaluser",
              "/addpermission",
              "/manage",
              "/addactive",
            ].includes(tokenAddress)
          ) {
            return;
          }
          const tokenInfo = await isValidSolanaToken(tokenAddress, msg);
          if (tokenInfo?.status == 200 && tokenInfo.result) {
            const r = await tokenController.create(tokenInfo.result);
            if (r?.status) {
              bot.sendMessage(
                msg.chat.id,
                `Setting is completed successfully .

🟣 <b>Token Address: </b> <code>${tokenInfo?.result.publicKey}</code>

🟢 <b>Token Name: </b> ${tokenInfo?.result.name}

🟠 <b>Token Symbol: </b> ${tokenInfo?.result.symbol}`,
                {
                  parse_mode: "HTML",
                  reply_markup: {
                    inline_keyboard: [
                      [
                        {
                          text: "Return 👈",
                          callback_data: "return",
                        },
                        {
                          text: "Delete 👈",
                          callback_data: "delete_token",
                        },
                      ],
                    ],
                  },
                }
              );
            } else {
              bot.sendMessage(msg.chat.id, r?.msg, { parse_mode: "HTML" });
            }
          } else {
            const newText = `Sorry, you can't use this bot because pair info doesn't proper for this bot`;
            bot.sendMessage(msg.chat.id, newText, { parse_mode: "HTML" });
            promptForTokenAddress(msg);
          }
        }
      );
    });
};
const isValidSolanaToken = async (tokenAddress: string | any, msg: any) => {
  try {
    const response = await axios.post(`${ConfigService.getConfig().services.dexScreenerApiUrl}/${tokenAddress}`);
    if (response?.status == 200 && response?.data?.pairs) {
      let data = response.data.pairs;
      if (data[0].quoteToken.address == NATIVE_MINT.toString()) {
        const info = await connection.getParsedAccountInfo(
          new PublicKey(tokenAddress)
        );
        const decimal = info?.value?.data?.parsed?.info?.decimals;
        let pairInfo = [];
        for (let i = 0; i < data.length; i++) {
          if (
            data[i].dexId === "raydium" &&
            data[i].baseToken.address === tokenAddress
          ) {
            pairInfo.push({
              
              dexId: "raydium",
              inToken: data[i].quoteToken.address,
              inName: data[i].quoteToken.name,
              inSymbol: data[i].quoteToken.symbol,
              inLiquidity: data[i].liquidity.quote,
              outLiquidity: data[i].liquidity.base,
              pairAddress: data[i].pairAddress,
            });
          } else if (
            data[i].dexId === "pumpswap" &&
            data[i].baseToken.address === tokenAddress
          ) {
            pairInfo.push({
              dexId: "pumpswap",
              inToken: data[i].quoteToken.address,
              inName: data[i].quoteToken.name,
              inSymbol: data[i].quoteToken.symbol,
              inLiquidity: data[i].liquidity.quote,
              outLiquidity: data[i].liquidity.base,
              pairAddress: data[i].pairAddress,
            });
          } 
         
        }
        const tokenInfo1 = {
          userId: msg.chat.id,
          name: data[0].baseToken.name,
          symbol: data[0].baseToken.symbol,
          pairInfo: pairInfo,
          decimal: decimal,
          publicKey: tokenAddress,
        } as TtokenInfo;
        return { result: tokenInfo1, status: 200 };
      } else {
        return {
          result: null,
          status: 202,
        };
      }
    } else {
      return { result: null, status: 400 };
    }
  } catch (error) {
    console.log("isValidSolanaTokenError: ", error);
  }
};

const promptForTokenAddress = async (msg: any) => {
  try {
    bot
      .sendMessage(
        msg.chat.id,
        `
<b>Please the valid token address.</b>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            force_reply: true,
          },
        }
      )
      .then(async (sentMessage) => {
        bot.onReplyToMessage(
          sentMessage.chat.id,
          sentMessage.message_id,
          async (reply) => {
            const tokenAddress = reply.text?.trim() as string;
            if (
              [
                "/cancel",
                "/support",
                "/start",
                "/wallet",
                "/token",
                "/deposit",
                "/withdraw",
                "/balance",
                "/activity",
                "/totaluser",
                "/addpermission",
                "/manage",
                "/addactive",
              ].includes(tokenAddress)
            ) {
              return;
            }
            const tokenInfo = await isValidSolanaToken(tokenAddress, msg);
            if (tokenInfo?.status == 200 && tokenInfo?.result) {
              const r = await tokenController.create(tokenInfo?.result);
              if (r) {
                bot.sendMessage(
                  msg.chat.id,
                  `Setting is completed successfully.

🟣 <b>Token Address: </b> <code>${tokenInfo?.result.publicKey}</code>

🟢 <b>Token Name: </b> ${tokenInfo?.result.name}

🟠 <b>Token Symbol: </b> ${tokenInfo?.result.symbol}`,
                  {
                    parse_mode: "HTML",
                    reply_markup: {
                      inline_keyboard: [
                        [
                          {
                            text: "Return 👈",
                            callback_data: "return",
                          },
                        ],
                      ],
                    },
                  }
                );
              }
            } else {
              const newText = `Sorry, you can't use this bot because pair info doesn't proper for this bot`;
              bot.sendMessage(msg.chat.id, newText, { parse_mode: "HTML" });
              promptForTokenAddress(msg);
            }
          }
        );
      });
  } catch (error) {
    console.log("promptForTokenAddress: ", error);
  }
};
