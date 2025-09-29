import { bot } from "../index";
import { ConfigService } from "../service/config";
import { checkSolBalance } from "../service/getBalance";
import { deleteMessage, removeAnswerCallback, subBalance } from "./index";
import swapController from "../controller/swap";
import walletController from "../controller/wallet";
import { ellipsis } from "../service/utils";
import { convertTokenAmount } from "../service/getTokenPrice";
import tokenSettingController from "../controller/tokenSetting";
import userList from "../controller/userList";
const solanaWeb3 = require("@solana/web3.js");
import {
  encryptPrivateKey,
  decryptPrivateKey,
  waitForTransactionConfirmation,
} from "../service";
import swapInfoController from "../controller/swap";
import { SendTransactionError } from "@solana/web3.js";
import feeController from "../controller/fee";

const {
  PublicKey,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");
const connection = new Connection(ConfigService.getConfig().solana.rpcUrl);

interface TBuyAndSell {
  buyNumber: number;
  sellNumber: number;
}

let swapData = {} as any;
let walletInfo = {} as any;
let swapSettingInfo = {} as any;
let minimumAmount = ConfigService.getConfig().swap.minimumAmount;
let gasFee = ConfigService.getConfig().solana.networkFee;
let dataInfo = {} as any;
let swapTokenInfo = {} as any;
let BuyAndSellNumber = {} as { [key: number]: TBuyAndSell };
let loopTime = {} as any;
let walletPrivateKeys = {} as any;

export const swapHandler = async (msg: any) => {
  try {
    removeAnswerCallback(msg.chat);
    const walletInfo = await walletController.findOne({
      filter: { userId: msg.chat.id },
    });

    if (walletInfo.length == 0) {
      await bot.sendMessage(msg.chat.id, `Create the your wallet.`, {});
      return;
    }
    const tokenInfo = await tokenSettingController.findOne({
      filter: {
        userId: msg.chat.id,
      },
    });
    if (tokenInfo.length > 0) {
      let tokenData = [] as any;
      await tokenInfo.map((token: any) => {
        tokenData.push([
          {
            text: `${token.name} -> ${ellipsis(token.publicKey, 6)}`,
            callback_data: `selectSwapToken_${token.publicKey}`,
          },
        ]);
      });
      tokenData.push(
        [{ text: "👈 Return", callback_data: "return" }]
      );
      
      bot.sendMessage(msg.chat.id, `<b>Select token.</b>`, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: tokenData,
        },
      });
    } else {
      bot.sendMessage(msg.chat.id, `Please set the token to swap.`, {
        parse_mode: "HTML",
      });
    }
  } catch (error) {
    console.error("Error swap setting: ", error);
  }
};
export const selectSwapTokenHandler = async (msg: any, action: string) => {
  try {
    deleteMessage(msg);
    const publicKey = action.split("_")[1];
    swapTokenInfo[msg.chat.id] = await swapController.findOne({
      filter: {
        userId: msg.chat.id,
        quoteToken: publicKey,
      },
    });
    if (swapTokenInfo[msg.chat.id].status == 200) {
      if (swapTokenInfo[msg.chat.id].data.length > 0) {
        const newText = `You can see current setting status and add new one.`;
        let inline_keyboard = [] as any;
        await swapTokenInfo[msg.chat.id].data.map((swapItem: any) => {
          inline_keyboard.push([
            {
              text: `Swap 1(Amount: ${swapItem.amount} sol, Buy:${swapItem.buy}, Sell: ${swapItem.sell}, Active: ${swapItem.active})`,
              callback_data: `swapList:${swapItem._id}`,
            },
          ]);
        });
        bot.sendMessage(msg.chat.id, newText, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              ...inline_keyboard,
              [
                { text: "👈 Return", callback_data: "return" },
                {
                  text: "🔄 Add Swap",
                  callback_data: `swap_setting_add:${publicKey}`,
                },
              ],
            ],
          },
        });
      } else {
        const newText = `Please set swap status.`;
        bot.sendMessage(msg.chat.id, newText, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "👈 Return", callback_data: "return" },
                {
                  text: "🔄 Add Swap",
                  callback_data: `swap_setting_add:${publicKey}`,
                },
              ],
            ],
          },
        });
      }
    }
  } catch (error) {
    console.error("Error swap setting: ", error);
  }
};

export const swapListHandler = async (msg: any, action: string) => {
  try {
    deleteMessage(msg);
    const id = action.split(":")[1];
    swapData = await swapController.findOne({
      filter: {
        _id: id,
      },
    });

    if (swapData.data.length > 0) {
      const activeOption = swapData.data[0].active
        ? [
          [
            {
              text: "🛑 Stop",
              callback_data: `swap_stop:${swapData.data[0]._id}`,
            },
          ],
        ]
        : [
          [
            {
              text: "🔥 Active",
              callback_data: `swap_active:${swapData.data[0]._id}`,
            },
          ],
        ];
      const wallet_info = await walletController.findOne({
        filter: {
          _id: swapData.data[0].wallet_id,
        },
      });
      await bot.sendMessage(
        msg.chat.id,
        `
<b>BaseToken: </b> ${swapData.data[0].baseToken}
<b>Name: </b>  ${swapData.data[0].baseName}
<b>Symbol: </b>  ${swapData.data[0].baseSymbol}

<b>QuoteToken: </b> ${swapData.data[0].quoteToken}
<b>Name: </b>  ${swapData.data[0].quoteName}
<b>Symbol: </b>  ${swapData.data[0].quoteSymbol}

<b>Swap Amount:: </b> ${swapData.data[0].amount}
<b>LoopTime: </b> ${swapData.data[0].loopTime} mins
<b>Buy times: </b> ${swapData.data[0].buy}
<b>Sell times: </b> ${swapData.data[0].sell}
<b>Direction: </b> ${swapData.data[0].dir}-way
<b>Fee per trade: </b> ${swapData.data[0].fee * 100} %
<b>Wallet: </b> <code>${wallet_info[0].publicKey}</code>
  `,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              ...activeOption,
              [
                { text: "👈 Return", callback_data: "return" },
                {
                  text: "🔄 Delete",
                  callback_data: `swap_delete:${swapData.data[0].wallet_id}`,
                },
              ],
            ],
          },
        }
      );
    }
  } catch (error) {
    console.log("Error swapListHandler: ", error);
  }
};

export const swapSettingAddHandler = async (msg: any, action: string) => {
  try {
    deleteMessage(msg);
    const publicKey = action.split(":")[1];
    walletInfo[msg.chat.id] = {
      tokenPublickey: publicKey,
    };
    const walletData = await walletController.findOne({
      filter: {
        userId: msg.chat.id,
        active: false,
      },
    });
    if (walletData.length > 0) {
      const newText = `Please select wallet.`;
      let inline_keyboard = [] as any;
      await Promise.all(
        walletData.map(async (list: any) => {
          const balance = await checkSolBalance(list.publicKey);
          if (!!balance && balance >= ConfigService.getConfig().swap.minimumDepositAmount) {
            inline_keyboard.push([
              {
                text: `${ellipsis(list.publicKey, 6)} -> ${balance} sol`,
                callback_data: `selectSwapWallet:${list._id}`,
              },
            ]);
          }
        })
      );
      if (inline_keyboard.length > 0) {
        bot.sendMessage(msg.chat.id, newText, {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              ...inline_keyboard,
              [
                {
                  text: "👈 Return",
                  callback_data: "return",
                },
              ],
            ],
          },
        });
      } else {
        bot.sendMessage(msg.chat.id, `Please deposit SOL in your wallets.`);
      }
    } else {
      const newText =
        `The available wallet don't exist.\n` + `Please add new wallet.`;
      bot.sendMessage(msg.chat.id, newText, {});
    }
  } catch (error) {
    console.log("Error swapSettingAddHandler: ", error);
  }
};

export const selectSwapWalletHandler = async (msg: any, action: string) => {
  try {
    const wallet_id = action.split(":")[1];
    const tokenInfo = await tokenSettingController.findOne({
      filter: {
        userId: msg.chat.id,
        publicKey: walletInfo[msg.chat.id].tokenPublickey,
      },
    });
    generateAndStoreWallets(msg.chat.id);
    const wallet = await walletController.findOne({
      filter: { _id: wallet_id },
    });
    const balance = await checkSolBalance(wallet[0].publicKey);
    const data = tokenInfo[0].pairInfo;

    dataInfo[msg.chat.id] = {
      dexId: data[0]?.dexId,
      inToken: data[0]?.inToken,
      inName: data[0]?.inName,
      inSymbol: data[0].inSymbol,
      balance: balance,
      outToken: tokenInfo[0].publicKey,
      outName: tokenInfo[0].name,
      outSymbol: tokenInfo[0].symbol,
      pairAddress: data[0].pairAddress,
      decimal: tokenInfo[0].decimal,
      wallet_id: wallet_id,
    };
    swapSettingHandler(msg);
  } catch (error) {
    console.log("Error selectSwapWalletHandler: ", error);
  }
};

export const swapDeleteHandler = async (msg: any, action: string) => {
  try {
    const chatId = msg.chat.id;
    const wallet_id = action.split(":")[1];
    const r = await swapController.deleteOne({
      filter: { wallet_id: wallet_id },
    });
    const v = await walletController.updateOne({
      _id: wallet_id,
      active: false,
    });
    if (r) {
      await bot.sendMessage(chatId, `Delete is completed successfully.`, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "👈 Return",
                callback_data: "return",
              },
            ],
          ],
        },
      });
    } else {
      await bot.sendMessage(chatId, `Delete failed. Please try again later.`, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "👈 Return",
                callback_data: "return",
              },
            ],
          ],
        },
      });
    }
  } catch (error) {
    console.error("Error swap setting: ", error);
  }
};

export const swapStopHandler = async (msg: any, action: string) => {
  try {
    if (!msg?.chat?.id || !action) {
      console.error("swapStopHandler: Invalid message or action parameters");
      return;
    }

    const chatId = msg.chat.id;
    const id = action.split(":")?.[1];

    if (!id) {
      console.error("swapStopHandler: Invalid action format - missing ID");
      await bot.sendMessage(
        chatId,
        "Invalid swap operation. Please try again."
      );
      return;
    }

    console.log(`Attempting to stop swap with ID: ${id} for chat: ${chatId}`);

    // First get the swap data to ensure it exists
    const swapData = await swapController
      .findOne({
        filter: { _id: id },
      })
      .catch((err) => {
        console.error("swapStopHandler: Database query error:", err);
        return null;
      });

    if (!swapData?.data?.[0]) {
      console.error(`swapStopHandler: Swap data not found for ID: ${id}`);
      await bot.sendMessage(chatId, "Swap data not found. Please try again.");
      return;
    }

    // Update swap status
    const r = {
      _id: id,
      active: false,
    };

    const updateResult = await swapController.updateOne(r).catch((err) => {
      console.error("swapStopHandler: Failed to update swap status:", err);
      return null;
    });

    if (!updateResult) {
      await bot.sendMessage(
        chatId,
        "Failed to stop swap. Please try again later."
      );
      return;
    }

    const wallet = await walletController
      .findOne({
        filter: { _id: swapData.data[0].wallet_id },
      })
      .catch((err) => {
        console.error("swapStopHandler: Failed to fetch wallet:", err);
        return null;
      });

    if (!wallet?.[0]) {
      console.error(
        `swapStopHandler: Wallet not found for ID: ${swapData.data[0].wallet_id}`
      );
      await bot.sendMessage(
        chatId,
        "Wallet not found. Please check wallet configuration."
      );
      return;
    }

    const feeWallet = await swapInfoController
      .findOne({
        filter: {
          baseName: swapData.data[0].baseName,
          wallet_id: wallet[0]._id,
        },
      })
      .catch((err) => {
        console.error("swapStopHandler: Failed to fetch fee wallet:", err);
        return null;
      });

    if (feeWallet?.data?.[0]?.walletPrivateKeys) {
      try {
        await drainbotWalletsToOne(
          feeWallet.data[0].walletPrivateKeys,
          wallet[0].publicKey
        );
      } catch (err) {
        console.error("swapStopHandler: Failed to drain wallets:", err);
      }
    }

    try {
      await bot.deleteMessage(chatId, msg.message_id as number);
    } catch (err) {
      console.error("swapStopHandler: Failed to delete message:", err);
    }

    await bot
      .sendMessage(
        chatId,
        `
<b>BaseToken: </b> ${swapData.data[0].baseToken}
<b>Name: </b>  ${swapData.data[0].baseName}
<b>Symbol: </b>  ${swapData.data[0].baseSymbol}

<b>QuoteToken: </b> ${swapData.data[0].quoteToken}
<b>Name: </b>  ${swapData.data[0].quoteName}
<b>Symbol: </b>  ${swapData.data[0].quoteSymbol}

<b>Swap Amount:: </b> ${swapData.data[0].amount} 
<b>LoopTime: </b> ${swapData.data[0].loopTime} mins
<b>Buy times: </b> ${swapData.data[0].buy} 
<b>Sell times: </b> ${swapData.data[0].sell}
<b>Direction: </b> ${swapData.data[0].dir}-way
<b>Fee per trade: </b> ${swapData.data[0].fee * 100} %
<b>Wallet: </b> <code>${wallet[0].publicKey}</code>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "🔥 Active",
                  callback_data: `swap_active:${swapData.data[0]._id}`,
                },
              ],
              [
                { text: "👈 Return", callback_data: "return" },
                {
                  text: "🔄 Delete",
                  callback_data: `swap_delete:${swapData.data[0].wallet_id}`,
                },
              ],
            ],
          },
        }
      )
      .catch((err) => {
        console.error("swapStopHandler: Failed to send status message:", err);
      });
  } catch (error) {
    console.error("swapStopHandler error:", error);
    try {
      await bot.sendMessage(
        msg.chat.id,
        "An error occurred while stopping the swap. Please try again."
      );
    } catch (err) {
      console.error("swapStopHandler: Failed to send error message:", err);
    }
  }
};

export const swapActiveHandler = async (msg: any, action: string) => {
  try {
    const chatId = msg.chat.id;
    const id = action.split(":")[1];

    // First get the swap data to ensure it exists
    const swapData = await swapController.findOne({
      filter: { _id: id },
    });

    if (!swapData?.data?.[0]) {
      await bot.sendMessage(chatId, "Swap data not found. Please try again.");
      return;
    }

    // Update swap status
    const r = {
      _id: id,
      active: true,
    };
    await swapController.updateOne(r);

    // Get wallet info with validation
    const wallet = await walletController.findOne({
      filter: { _id: swapData.data[0].wallet_id },
    });

    if (!wallet?.[0]) {
      await bot.sendMessage(
        chatId,
        "Wallet not found. Please check wallet configuration."
      );
      return;
    }

    await bot.deleteMessage(chatId, msg?.message_id as number);
    await bot.sendMessage(
      chatId,
      `
<b>BaseToken: </b> ${swapData.data[0].baseToken}
<b>Name: </b>  ${swapData.data[0].baseName}
<b>Symbol: </b>  ${swapData.data[0].baseSymbol}

<b>QuoteToken: </b> ${swapData.data[0].quoteToken}
<b>Name: </b>  ${swapData.data[0].quoteName}
<b>Symbol: </b>  ${swapData.data[0].quoteSymbol}

<b>Swap Amount:: </b> ${swapData.data[0].amount} 
<b>LoopTime: </b> ${swapData.data[0].loopTime} mins
<b>Buy times: </b> ${swapData.data[0].buy} 
<b>Sell times: </b> ${swapData.data[0].sell}
<b>Direction: </b> ${swapData.data[0].dir}-way
<b>Fee per trade: </b> ${swapData.data[0].fee * 100} %
<b>Wallet: </b> <code>${wallet[0].publicKey}</code>
`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🛑 Stop",
                callback_data: `swap_stop:${swapData.data[0]._id}`,
              },
            ],
            [
              { text: "👈 Return", callback_data: "return" },
              {
                text: "🔄 Delete",
                callback_data: `swap_delete:${swapData.data[0].wallet_id}`,
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.log("swapActiveHandler error:", error);
  }
};

export const swapSettingHandler = async (msg: any) => {
  try {
    deleteMessage(msg);
    const newText = `Select the time between trades.\n`;

    const reply_markup = {
      inline_keyboard: [
        [
          { text: "⏱️  3 mins", callback_data: "trade_3" },
          { text: "⏳  5 mins", callback_data: "trade_5" },
        ],
        [
          { text: "🕒  10 mins", callback_data: "trade_10" },
          { text: "⏰  15 mins", callback_data: "trade_15" },
        ],
        [{ text: "👈  Return", callback_data: "return" }],
      ],
    };

    await bot.sendMessage(msg.chat.id, newText, {
      parse_mode: "HTML",
      reply_markup: reply_markup,
    });
  } catch (error) {
    console.log("swapSettingHandlerError: ", error);
  }
};

export const tradeTimeSetting = async (msg: any, action: string) => {
  try {
    deleteMessage(msg);
    const time = action.split("_")[1];
    loopTime[msg.chat.id] = {
      time: Number(time),
    };
    BuyAndSellInput(msg);
  } catch (error) {
    console.log("Error tradeTimeSetting: ", error);
  }
};

export const swapConfirmHandler = async (msg: any) => {
  try {
    await bot.sendMessage(
      msg.chat.id,
      `Do you really want to delete this swap?`,
      {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "👈 Return", callback_data: "return" },
              {
                text: "OK ",
                callback_data: `swap_delete:${swapData.data[0].wallet_id}`,
              },
            ],
          ],
        },
      }
    );
  } catch (error) {
    console.log("swapConfirmHandlerError: ", error);
  }
};

const BuyAndSellInput = async (msg: any) => {
  try {
    const newText =
      `Choose Buy/Sell ratio: 2 buys to 1 sell EG. 2_1\n` +
      `Note: keep it simple. 2_1 , 1_1, 3_2\n`;
    await bot
      .sendMessage(msg.chat.id, newText, {
        parse_mode: "HTML",
        reply_markup: {
          force_reply: true,
        },
      })
      .then(async (sentMessage) => {
        await bot.onReplyToMessage(
          sentMessage.chat.id,
          sentMessage.message_id,
          async (reply) => {
            const InputNumber = reply.text?.trim() as any;
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
              ].includes(InputNumber)
            ) {
              return;
            }
            if (
              InputNumber.indexOf("_") === -1 ||
              InputNumber.split("_").length !== 2 ||
              isNaN(InputNumber.split("_")[0]) ||
              isNaN(InputNumber.split("_")[1]) ||
              Number.isInteger(InputNumber.split("_")[0]) ||
              Number.isInteger(InputNumber.split("_")[1])
            ) {
              return isValidBuyAndSell(msg.chat.id);
            } else {
              BuyAndSellNumber[msg.chat.id] = {
                buyNumber: Number(InputNumber.split("_")[0]),
                sellNumber: Number(InputNumber.split("_")[1]),
              };
              await directionSetting(msg.chat.id);
            }
          }
        );
      });
  } catch (error) {
    console.log("BuyAndSellInputError: ", error);
  }
};

const isValidBuyAndSell = async (chatId: any) => {
  try {
    const newText = `Please enter the valid type.\n\n` + `ex: 3_5`;
    await bot
      .sendMessage(chatId, newText, {
        parse_mode: "HTML",
        reply_markup: {
          force_reply: true,
        },
      })
      .then(async (sentMessage) => {
        await bot.onReplyToMessage(
          sentMessage.chat.id,
          sentMessage.message_id,
          async (reply) => {
            const InputNumber = reply.text?.trim() as any;
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
              ].includes(InputNumber)
            ) {
              return;
            }
            if (
              InputNumber.indexOf("_") === -1 ||
              InputNumber.split("_").length !== 2 ||
              isNaN(InputNumber.split("_")[0]) ||
              isNaN(InputNumber.split("_")[1]) ||
              Number.isInteger(InputNumber.split("_")[0]) ||
              Number.isInteger(InputNumber.split("_")[1])
            ) {
              return isValidBuyAndSell(chatId);
            } else {
              BuyAndSellNumber[chatId] = {
                buyNumber: Number(InputNumber.split("_")[0]),
                sellNumber: Number(InputNumber.split("_")[1]),
              };
              await directionSetting(chatId);
            }
          }
        );
      });
  } catch (error) {
    console.log("isValidBuyAndSellError: ", error);
  }
};
const shortenString = async (
  str: string,
  startLength: number,
  endLength: number
) => {
  if (str.length <= startLength + endLength) {
    return str;
  }
  return str.slice(0, startLength) + "..." + str.slice(str.length - endLength);
};
const directionSetting = async (chatId: number) => {
  const newText = `Please select direction to swap.`;
  const reply_markup = {
    inline_keyboard: [
      [{ text: "One-Way Direction", callback_data: "direction_one" }],
      [{ text: "Two-Way Direction", callback_data: "direction_two" }],
      [{ text: "👈 Return", callback_data: "return" }],
    ],
  };
  bot.sendMessage(chatId, newText, {
    parse_mode: "HTML",
    reply_markup: reply_markup,
    disable_web_page_preview: true,
  });
};
export const dirConfirm = async (msg: any, action: string) => {
  deleteMessage(msg);
  const dir = action.split("_")[1].trim();
  await SwapAmountHandler(msg.chat.id, dir);
};
const SwapAmountHandler = async (chatId: any, dir: string) => {
  try {
    const userlist = await feeController.findOne({ userId: chatId });
    if (dataInfo[chatId].inBalance < minimumAmount + gasFee) {
      await bot.sendMessage(
        chatId,
        `
Wallet Insufficient funds
<b>Minimum Amount: </b> ${minimumAmount + gasFee} SOL
<b>Command Line: </b> /deposit`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "👈 Return",
                  callback_data: "return",
                },
              ],
            ],
          },
        }
      );
      return;
    } else {
      await bot.sendMessage(
        chatId,
        `
Enter the Amount per trade In Sol minimum ${minimumAmount}
<b>Current Balance: </b> ${dataInfo[chatId].balance} SOL
<b>Fee per trade: </b> ${userlist.fee * 100} %`,
        { parse_mode: "HTML" }
      );
    }

    await bot
      .sendMessage(
        chatId,
        `
  <b> Enter the Per trade amount (SOL)</b> `,
        {
          parse_mode: "HTML",
          reply_markup: {
            force_reply: true,
          },
        }
      )
      .then(async (sentMessage) => {
        await bot.onReplyToMessage(
          sentMessage.chat.id,
          sentMessage.message_id,
          async (reply) => {
            try {
              const amountSol = reply.text?.trim() as any;
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
                ].includes(amountSol)
              ) {
                return;
              }
              if (
                isNaN(amountSol) ||
                dataInfo[chatId].inBalance <
                Number(amountSol) + ConfigService.getConfig().solana.networkFee ||
                minimumAmount > Number(amountSol)
              ) {
                promptSwapAmount(chatId, dir);
              } else {
                const info = await connection.getParsedAccountInfo(
                  new PublicKey(dataInfo[chatId].inToken)
                );
                const baseDecimal = info?.value?.data?.parsed?.info?.decimals;
                const amount1 = (await convertTokenAmount(
                  amountSol,
                  dataInfo[chatId].inToken,
                  dataInfo[chatId].outToken
                )) as any;
                if (isNaN(amount1)) {
                  bot.sendMessage(
                    chatId,
                    `Please enter again due to network overload.`
                  );
                  promptSwapAmount(chatId, dir);
                } else {
                  const amountToken = await subBalance(Number(amount1));
                  swapSettingInfo[chatId] = {
                    dexId: dataInfo[chatId].dexId,
                    baseToken: dataInfo[chatId].inToken,
                    baseSymbol: dataInfo[chatId].inSymbol,
                    baseName: dataInfo[chatId].inName,
                    quoteToken: dataInfo[chatId].outToken,
                    quoteSymbol: dataInfo[chatId].outSymbol,
                    quoteName: dataInfo[chatId].outName,
                    pairAddress: dataInfo[chatId].pairAddress,
                    amount: Number(amountSol),
                    amountToken: Number(amountToken),
                    userId: chatId,
                    baseDecimal: baseDecimal,
                    quoteDecimal: dataInfo[chatId].decimal,
                    loopTime: loopTime[chatId].time,
                    buy: BuyAndSellNumber[chatId]?.buyNumber,
                    sell: BuyAndSellNumber[chatId]?.sellNumber,
                    dir: dir,
                    fee: userlist.fee,
                    wallet_id: dataInfo[chatId].wallet_id,
                    walletPrivateKeys: walletPrivateKeys[chatId].keys,
                  };
                  priorityFeeInput(chatId);
                }
              }
            } catch (error) {
              console.error("Error swap amount setting:", error);
            }
          }
        );
      });
  } catch (error) {
    console.log("SwapAmountHandlerError: ", error);
  }
};

const promptSwapAmount = async (chatId: any, dir: string) => {
  try {
    const userlist = await userList.findOne({ filter: { userId: chatId } });
    const newText =
      ` <b>Current Balance: </b> ${dataInfo[chatId].inBalance}  ${dataInfo[chatId].inSymbol}\n` +
      `<b>Fee per trade: </b> ${userlist.fee * 100} %`;
    await bot.sendMessage(chatId, newText, { parse_mode: "HTML" });
    await bot
      .sendMessage(
        chatId,
        `
   <b> Enter the Per trade amount (SOL)</b> `,
        {
          parse_mode: "HTML",
          reply_markup: {
            force_reply: true,
          },
        }
      )
      .then(async (sentMessage) => {
        await bot.onReplyToMessage(
          sentMessage.chat.id,
          sentMessage.message_id,
          async (reply) => {
            try {
              const amountSol = reply.text?.trim() as any;
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
                ].includes(amountSol)
              ) {
                return;
              }
              if (
                isNaN(amountSol) ||
                dataInfo[chatId].inBalance <
                Number(amountSol) + ConfigService.getConfig().solana.networkFee ||
                minimumAmount > Number(amountSol)
              ) {
                promptSwapAmount(sentMessage.chat.id, dir);
              } else {
                const info = await connection.getParsedAccountInfo(
                  new PublicKey(dataInfo[chatId].inToken)
                );
                const baseDecimal = info?.value?.data?.parsed?.info?.decimals;
                const amount1 = (await convertTokenAmount(
                  amountSol,
                  dataInfo[chatId].inToken,
                  dataInfo[chatId].outToken
                )) as any;
                if (isNaN(amount1)) {
                  bot.sendMessage(
                    chatId,
                    `Please enter again due to network overload.`
                  );
                  promptSwapAmount(chatId, dir);
                } else {
                  const amountToken = await subBalance(Number(amount1));
                  swapSettingInfo[chatId] = {
                    dexId: dataInfo[chatId].dexId,
                    baseToken: dataInfo[chatId].inToken,
                    baseSymbol: dataInfo[chatId].inSymbol,
                    baseName: dataInfo[chatId].inName,
                    quoteToken: dataInfo[chatId].outToken,
                    quoteSymbol: dataInfo[chatId].outSymbol,
                    quoteName: dataInfo[chatId].outName,
                    pairAddress: dataInfo[chatId].pairAddress,
                    amount: Number(amountSol),
                    amountToken: Number(amountToken),
                    userId: chatId,
                    baseDecimal: baseDecimal,
                    quoteDecimal: dataInfo[chatId].decimal,
                    loopTime: loopTime[chatId].time,
                    buy: BuyAndSellNumber[chatId]?.buyNumber,
                    sell: BuyAndSellNumber[chatId]?.sellNumber,
                    dir: dir,
                    fee: userlist.fee,
                    wallet_id: dataInfo[chatId].wallet_id,
                    walletPrivateKeys: walletPrivateKeys[chatId].keys,
                  };
                  priorityFeeInput(chatId);
                }
              }
            } catch (error) {
              console.error("Error swap amount prompt:", error);
            }
          }
        );
      });
  } catch (error) {
    console.log("promptSwapAmountError: ", error);
  }
};

const priorityFeeInput = async (chatId: number) => {
  await bot.sendMessage(chatId, `Please enter the priority fee for the swap.`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀   High",
            callback_data: "enterFee_high",
          },
        ],
        [
          {
            text: "🚈   Medium",
            callback_data: "enterFee_medium",
          },
        ],
        [
          {
            text: "🔄   Small",
            callback_data: "enterFee_small",
          },
        ],
        [
          {
            text: "👈   Return",
            callback_data: "return",
          },
        ],
      ],
    },
  });
};
export const enterFeeHandler = async (msg: any, action: string) => {
  try {
    deleteMessage(msg);
    const chatId = msg.chat.id;
    const status = action.split("_")[1];
    swapSettingInfo[msg.chat.id] = {
      ...swapSettingInfo[msg.chat.id],
      priorityFee: status,
    };
    const r = await swapController.create(swapSettingInfo[msg.chat.id]);
    if (r) {
      await walletController.updateOne({
        wallet_id: swapSettingInfo[chatId].wallet_id,
        tokenId: swapSettingInfo[chatId].quoteToken,
        active: true,
      });
      const wallet = await walletController.findOne({
        filter: { _id: swapSettingInfo[chatId].wallet_id },
      });
      await bot.sendMessage(
        chatId,
        `
✅  <b>Swap is valid.</b>
                
<b>BaseToken Address: </b>  ${swapSettingInfo[chatId].baseToken}
<b>Name: </b>  ${swapSettingInfo[chatId].baseName}
<b>Symbol: </b>  ${swapSettingInfo[chatId].baseSymbol}
        
<b>QuoteToken Address: </b>  ${swapSettingInfo[chatId].quoteToken} 
<b>Name: </b>  ${swapSettingInfo[chatId].quoteName}
<b>Symbol: </b>  ${swapSettingInfo[chatId].quoteSymbol}
        
<b>PairAddress:</b>  ${swapSettingInfo[chatId].pairAddress}
<b>LoopTime:</b>  ${swapSettingInfo[chatId].loopTime} mins
<b>Buy times</b>  ${swapSettingInfo[chatId]?.buy}
<b>Sell times</b>  ${swapSettingInfo[chatId]?.sell}
<b>Swap Amount: </b>  ${swapSettingInfo[chatId].amount}
<b>Priority Fee: </b> ${swapSettingInfo[chatId].priorityFee}
<b>Directoin: </b> ${swapSettingInfo[chatId].dir}-way
<b>Fee per trade: </b> ${swapSettingInfo[chatId].fee * 100} %
<b>Wallet: </b> <code>${wallet[0].publicKey}</code>
  `,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "👈 Return",
                  callback_data: "return",
                },
                {
                  text: "Delete ",
                  callback_data: "agree_swap_delete",
                },
              ],
            ],
          },
        }
      );
    }
  } catch (error) {
    console.log("enterFeeHandlerError: ", error);
  }
};

const generateAndStoreWallets = async (chatId: number) => {
  try {
    const wallets = [];
    for (let i = 0; i < 5; i++) {
      const keypair = solanaWeb3.Keypair.generate();
      const privateKey = encryptPrivateKey(
        Buffer.from(keypair.secretKey).toString("base64")
      );
      wallets.push(privateKey);
    }
    walletPrivateKeys[chatId] = {
      keys: wallets,
    };
    return true;
  } catch (error) {
    console.error("Error generating wallets:", error);
    return false;
  }
};

export const drainbotWalletsToOne = async (
  walletPrivateKeys: string[],
  targetWalletAddress: string,
  batchSize: number = 5
) => {
  try {
    // const feeInfo = await connection.getLatestBlockhash();
    // const estimatedFeeLamports = 2 * feeInfo.feeCalculator.lamportsPerSignature; // conservative estimate
    const estimatedFeeLamports = 5000; // conservative estimate

    let totalTransferred = 0;

    const chunks = chunkArray(walletPrivateKeys, batchSize);

    for (const [batchIndex, chunk] of chunks.entries()) {
      console.log(`\n🚚 Processing batch ${batchIndex + 1}/${chunks.length}`);

      const results = await Promise.allSettled(
        chunk.map(async (walletKey) => {
          try {
            const feeInfo = await connection.getLatestBlockhash();
            const decryptedKey = decryptPrivateKey(walletKey);
            if (!decryptedKey) throw new Error("Decryption failed");

            const wallet = Keypair.fromSecretKey(
              Buffer.from(decryptedKey, "base64")
            );
            const pubkey = wallet.publicKey;

            const balanceLamports = await connection.getBalance(
              pubkey,
              "confirmed"
            );

            if (balanceLamports <= estimatedFeeLamports) {
              console.warn(
                `⛔ Wallet ${pubkey.toString()} has insufficient balance: ${(
                  balanceLamports / LAMPORTS_PER_SOL
                ).toFixed(5)} SOL`
              );
              return 0;
            }

            const transferableLamports = balanceLamports - estimatedFeeLamports;

            const tx = new Transaction().add(
              SystemProgram.transfer({
                fromPubkey: pubkey,
                toPubkey: new PublicKey(targetWalletAddress),
                lamports: transferableLamports,
              })
            );

            tx.recentBlockhash = feeInfo.blockhash;
            tx.feePayer = pubkey;

            const sig = await sendAndConfirmTransaction(
              connection,
              tx,
              [wallet],
              {
                commitment: "confirmed",
                skipPreflight: false,
              }
            );

            await waitForTransactionConfirmation(connection, sig);

            const transferredSol = transferableLamports / LAMPORTS_PER_SOL;

            console.log(
              `✅ Sent ${transferredSol.toFixed(
                5
              )} SOL from ${pubkey.toString()} ➡️ ${targetWalletAddress}`
            );
            return transferredSol;
          } catch (error: any) {
            console.error(`❌ Error from wallet: ${error.message}`);
            return 0;
          }
        })
      );

      for (const r of results) {
        if (r.status === "fulfilled") totalTransferred += r.value;
      }
    }

    return {
      success: true,
      totalTransferred,
      message: `✔️ Total of ${totalTransferred.toFixed(
        5
      )} SOL transferred to <code>${targetWalletAddress}</code>`,
    };
  } catch (error: any) {
    console.log("Error in drainbotWalletsToOne:", error);
    return {
      success: false,
      totalTransferred: 0,
      message: `Error: ${error.message}`,
    };
  }
};

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}
