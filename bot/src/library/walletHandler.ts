import { bot } from "..";
import { ConfigService } from "../service/config";
import { encryptPrivateKey } from "../service";
import walletController from "../controller/wallet";
import userList from "../controller/userList";
import { alertMessage, deleteMessage } from ".";
import { decryptPrivateKey } from "../service";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";

const solanaWeb3 = require("@solana/web3.js");

let userWalletInfo = {} as any;
export const walletHandler = async (msg: any, type?: number) => {
  try {
   /* const userData = await userList.findOne({
      filter: {
        userId: msg.chat.id,
      },
    }); */
    const userWallet = await walletController.findOne({
      filter: {
        userId: msg.chat.id,
      },
    });
    
    if (userWallet.length == 0) {
      if (type == 1) {
        bot.sendMessage(msg.chat.id, `Please create your wallet.`, {});
        return;
      }
      addWalletHandler(msg, type);
    } else {
      getWalletHanlder(msg, type);
    }
    
  } catch (err) {
    console.log("Error wallet handler: ", err);
    console.log(msg.chat.id, "userWallet");
  }
};

export const addWalletHandler = async (msg: any, type?: number) => {
  await deleteMessage(msg);
  const keypair = solanaWeb3.Keypair.generate();
  const publicKey = keypair.publicKey.toString();
  const privateKey = await encryptPrivateKey(
    Buffer.from(keypair.secretKey).toString("base64")
  );
  const result = await walletController.create(
    msg.chat.id,
    publicKey,
    privateKey
  );
  if (result.status) {
    getWalletHanlder(msg, type);
  }
};

export const selectWalletHandler = async (msg: any, action: string) => {
  try {
    deleteMessage(msg);
    const id = action.split(":")[1];
    const selectedWallet = userWalletInfo[msg.chat.id].data.filter(
      (wallet: any) => wallet._id == id
    )[0];
    if (selectedWallet) {
      const newText =
        `The wallet is selected.\n\n` +
        `<code>${selectedWallet.publicKey}</code>`;

      bot.sendMessage(msg.chat.id, newText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Delete",
                callback_data: `delete_wallet:${selectedWallet._id}`,
              },
              {
                text: "Balance",
                callback_data: `balance_wallet:${selectedWallet._id}`,
              },
              {
                text: "Withdraw Funds",
                callback_data: `selectWithdrawWallet:${selectedWallet._id}`,
              }
            ],
            [{ text: "Return 👈", callback_data: "return" }],
          ],
        },
      });
    }
  } catch (error) {
    console.log("Error select wallet handler: ", error);
  }
};

const getWalletHanlder = async (msg: any, type?: number) => {
  const userWallet = await walletController.findOne({
    filter: {
      userId: msg.chat.id,
    },
  });
  userWalletInfo[msg.chat.id] = {
    data: userWallet,
  };
  let newText =
    type == 1
      ? `<b>Please select the wallet</b>\n\n`
      : `<b>Your Anvil Wallets is connected.</b>\n\n`;
  let walletArray = [] as any;
  await userWallet.map((user: any) => {
    walletArray.push([
      {
        text: user.publicKey,
        callback_data: `wallet_select:${user._id}:${type}`,
      },
    ]);
  });
  bot.sendMessage(msg.chat.id, newText, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        ...walletArray,
        type == 1
          ? [{ text: "Return 👈", callback_data: "return" }]
          : [
              { text: "Return 👈", callback_data: "return" },
              { text: "Add Wallet", callback_data: "add_wallet" },
            ],
      ],
    },
  });
};
