import { bot, answerCallbacks } from "../index";
import walletController from "../controller/wallet";
import { decryptPrivateKey } from "../service";
import { removeAnswerCallback } from "./index";
import { checkSolBalance } from "../service/getBalance";
import { ConfigService } from "../service/config";
import { ellipsis } from "../service/utils";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import userListController from "../controller/userList";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAllTokenBalances, TokenBalance } from "../service/tokenService";
import { Keypair, SystemProgram, Transaction, sendAndConfirmTransaction as solanaSendAndConfirmTransaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferCheckedInstruction as splCreateTransferInstruction, TOKEN_PROGRAM_ID as SPL_TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

const awaitingWithdrawWallet = new Set<string>();
const estimatedSolTransferFeeLamports = 5000;
const connection = new Connection(ConfigService.getConfig().solana.rpcUrl);

export const addWithdrawWalletHandler = async (msg: any) => {
  try {
    if (answerCallbacks[msg.chat.id]) {
      removeAnswerCallback(msg.chat);
    }

    const userData = await userListController.findOne({
      filter: {
        userId: msg.chat.id,
      },
    });

    const message =
      `${userData?.withdrawWallet
        ? `Withdrawals go to: <code>${userData?.withdrawWallet}</code>\n`
        : `❗ No wallet configured for withdrawal!\n`
      }`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          ...(userData?.withdrawWallet
            ? [
              [
                {
                  text: "🏦 Change Wallet Address",
                  callback_data: "provide_withdraw_wallet",
                },
              ],
            ]
            : [
              [
                {
                  text: "🏦 Provide Wallet Address",
                  callback_data: "provide_withdraw_wallet",
                },
              ],
            ]),
          [{ text: "👈 Return", callback_data: "return" }],
        ],
      },
    };

    if (bot && typeof bot.sendMessage === 'function') {
      await bot.sendMessage(msg.chat.id, message, {
        parse_mode: "HTML",
        ...keyboard,
      });
    } else {
      console.error("Bot context is not available to send withdraw wallet message.");
    }
  } catch (error) {
    console.error("Error in withdrawHandler:", error);
    try {
      if (bot && typeof bot.sendMessage === 'function') {
        await bot.sendMessage(msg.chat.id, "❌ An error occurred while fetching your withdraw wallet. Please try again later.");
      }
    } catch (sendError) {
      console.error("Failed to send error message to user:", sendError);
    }
  }
};


export const provideWithdrawWallet = async (msg: any) => {
  try {
    const userId = msg.chat.id;
    awaitingWithdrawWallet.add(userId);

    await bot.sendMessage(userId, "💰 Please enter your wallet address:", {
      reply_markup: {
        force_reply: true,
        input_field_placeholder: "Enter Solana address",
        selective: true,
      },
    });

    const listener = async (responseMsg: any) => {
      if (
        !responseMsg.text ||
        !awaitingWithdrawWallet.has(userId) ||
        !responseMsg.reply_to_message ||
        responseMsg.reply_to_message.from.id == userId
      ) {
        return;
      }

      bot.removeListener("message", listener);
      awaitingWithdrawWallet.delete(userId);

      const walletAddress = responseMsg.text.trim();
      let publicKey: PublicKey;

      try {
        try {
          publicKey = new PublicKey(walletAddress);
        } catch (err) {
          await bot.sendMessage(userId, "❌ Invalid wallet address format. Please enter a valid Solana public key and try the command again.");
          await addWithdrawWalletHandler(msg);
          return;
        }

        await userListController.updateOne({
          userId,
          withdrawWallet: walletAddress
        });

        await bot.sendMessage(
          userId,
          `✅ Wallet address updated:\n<code>${walletAddress}</code>`,
          { parse_mode: "HTML" }
        );

        await addWithdrawWalletHandler(msg);
      } catch (error: any) {
        console.error("Error processing wallet address:", error);
        await bot.sendMessage(
          userId,
          `❌ Failed to update wallet. Error: ${error.message || 'Please try again.'}`
        );
      }
    };

    bot.on("message", listener);

    const timeoutId = setTimeout(() => {
      if (awaitingWithdrawWallet.has(userId)) {
        bot.removeListener("message", listener);
        awaitingWithdrawWallet.delete(userId);
        bot.sendMessage(userId, "⏰ You took too long to reply. Please use the command again if you want to set your wallet.").catch(err => console.error("Failed to send timeout message:", err));
      }
    }, 5 * 60 * 1000);

  } catch (error) {
    console.error("Error in provideReferralWallet setup:", error);
    try {
      const userId = msg.chat.id.toString();
      await bot.sendMessage(userId, "❌ An error occurred while trying to set up the wallet. Please try again later.");
    } catch (sendError) {
      console.error("Failed to send setup error message:", sendError);
    }
  }
};

export const withdrawWalletHandler = async (msg: any, action: string) => {
  const walletDbId = action.split(":")[1];
  const userId = msg.chat.id;

  try {
    const selectedWalletData = await walletController.findOne({
      filter: { _id: walletDbId },
    });

    if (!selectedWalletData || selectedWalletData.length === 0) {
      await bot.sendMessage(userId, "❌ Selected bot wallet not found. Please try again.");
      return;
    }
    const botWallet = selectedWalletData[0];
    const botWalletPublicKeyStr = botWallet?.publicKey;

    if (!botWalletPublicKeyStr) {
      await bot.sendMessage(userId, "❌ Bot wallet public key not found. Please try again.");
      return;
    }

    const userData = await userListController.findOne({
      filter: {
        userId
      },
    });

    if (!userData?.withdrawWallet) {
      const newText = `❗ No destination wallet configured for withdrawals! Please use the /withdraw_wallet command to set your withdrawal wallet first.`;
      await bot.sendMessage(userId, newText, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "🏦 Configure Destination Wallet", callback_data: "provide_withdraw_wallet" }], [{ text: "👈 Return", callback_data: "return" }]],
        },
      });
      return;
    }

    const balances = await getAllTokenBalances(botWalletPublicKeyStr);

    if (!balances || balances.length === 0) {
      await bot.sendMessage(userId, `ℹ️ Wallet ${ellipsis(botWalletPublicKeyStr)} has no token balances.`, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "Return 👈", callback_data: "return" }]],
        },
      });
      return;
    }

    const significantBalances = balances.filter(b => b.uiAmount > 0 || (b.isNative && b.amount > estimatedSolTransferFeeLamports));

    if (significantBalances.length === 0) {
      await bot.sendMessage(userId, `ℹ️ Wallet ${ellipsis(botWalletPublicKeyStr)} has no withdrawable balances.`, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "Return 👈", callback_data: "return" }]],
        },
      });

      return;
    }

    const keyboardButtons = significantBalances.map((token) => {
      if (token.isNative && token.amount <= estimatedSolTransferFeeLamports) {
        return null;
      }

      let mintIdentifier = token.mint;
      if (!token.isNative && token.mint.length > 12) {
        mintIdentifier = token.mint.substring(0, 6) + token.mint.slice(-6);
      }

      const callbackData = `wts:${walletDbId}:${mintIdentifier}:${token.isNative ? '1' : '0'}`;

      return {
        text: `💰 ${token.symbol}: ${token.uiAmount.toFixed(Math.min(token.decimals, 4))} | Withdraw`,
        callback_data: callbackData,
      };
    }).filter(button => button !== null);

    if (keyboardButtons.length === 0) {
      await bot.sendMessage(userId, `ℹ️ Wallet ${ellipsis(botWalletPublicKeyStr)} has SOL, but not enough to cover transaction fees for withdrawal. Other tokens may be present but SOL is needed for fees.`, {
        parse_mode: "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: "Return 👈", callback_data: "return" }]],
        },
      });

      return;
    }

    const inline_keyboard_rows = keyboardButtons.map(button => [button]);
    inline_keyboard_rows.push([{ text: "Return 👈", callback_data: "return" }]);

    await bot.sendMessage(userId, `
      ✅ Select token to withdraw from wallet ${ellipsis(botWalletPublicKeyStr)} to your configured address (${ellipsis(userData.withdrawWallet)}):
      ⚠️ If you intend to empty your wallet make sure you remove all other tokens before withdrawing SOL
      `, {
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: inline_keyboard_rows },
    });

  } catch (error) {
    console.error("Error in withdrawWalletHandler:", error);
    await bot.sendMessage(msg.chat.id, "❌ An error occurred while processing your withdrawal request. Please try again later.");
  }
};

export const handleWithdrawTokenSelected = async (msg: any, action: string) => {
  const parts = action.split(':');

  if (parts.length < 4 || parts[0] !== 'wts') {
    console.error("Invalid action format for handleWithdrawTokenSelected:", action);
    await bot.sendMessage(msg.chat.id, "❌ Invalid action. Please try again.");
    return;
  }

  const walletDbId = parts[1];
  const shortMintOrSol = parts[2];
  const isNative = parts[3] === '1';
  const userId = msg.chat.id;

  try {
    const selectedWalletData = await walletController.findOne({ filter: { _id: walletDbId } });

    if (!selectedWalletData || selectedWalletData.length === 0) {
      await bot.editMessageText("❌ Bot wallet not found.", { chat_id: userId, message_id: msg.message_id });
      return;
    }
    const botWalletRecord = selectedWalletData[0];

    if (!botWalletRecord || typeof botWalletRecord.privateKey !== 'string' || typeof botWalletRecord.publicKey !== 'string') {
      await bot.editMessageText("❌ Bot wallet details are missing or invalid.", { chat_id: userId, message_id: msg.message_id });
      return;
    }

    const botWalletPublicKeyString = botWalletRecord.publicKey;
    const botPrivateKeyString = botWalletRecord.privateKey;

    const decryptedKey = decryptPrivateKey(botPrivateKeyString);
    if (!decryptedKey) throw new Error("Decryption failed");

    const botKeypair = Keypair.fromSecretKey(
      Buffer.from(decryptedKey, "base64")
    );

    const botWalletPublicKey = new PublicKey(botWalletPublicKeyString);

    const userData = await userListController.findOne({ filter: { userId } });
    if (!userData || typeof userData.withdrawWallet !== 'string') {
      await bot.editMessageText("❌ Your destination wallet is not configured or is invalid.", { chat_id: userId, message_id: msg.message_id });
      return;
    }
    const userDestinationWalletString = userData.withdrawWallet;
    const userDestinationPublicKey = new PublicKey(userDestinationWalletString);

    const allBalances = await getAllTokenBalances(botWalletPublicKeyString);
    let tokenToWithdraw: TokenBalance | undefined;

    if (isNative) {
      tokenToWithdraw = allBalances.find(b => b.isNative && b.mint === shortMintOrSol);
    } else {
      const matchingTokens = allBalances.filter(b =>
        !b.isNative &&
        b.mint.length > 12 &&
        (b.mint.substring(0, 6) + b.mint.slice(-6)) === shortMintOrSol
      );
      if (matchingTokens.length === 1) {
        tokenToWithdraw = matchingTokens[0];
      } else if (matchingTokens.length > 1) {
        await bot.editMessageText("❌ Ambiguous token selection due to shortened identifier. Please contact support or try again later.", { chat_id: userId, message_id: msg.message.message_id });
        return;
      }
    }

    if (!tokenToWithdraw) {
      await bot.editMessageText("❌ Token not found in wallet, balance is zero, or identifier mismatch. Please try again.", { chat_id: userId, message_id: msg.message.message_id });
      return;
    }

    let transactionSignature: string | undefined;
    const transaction = new Transaction();

    if (isNative) {
      if (tokenToWithdraw.amount <= estimatedSolTransferFeeLamports) {
        await bot.editMessageText(`❌ Insufficient SOL balance (${tokenToWithdraw.uiAmount.toFixed(4)} SOL) to cover transaction fee.`, { chat_id: userId, message_id: msg.message_id });
        return;
      }
      const amountToSendLamports = tokenToWithdraw.amount - estimatedSolTransferFeeLamports;
      if (amountToSendLamports <= 0) {
        await bot.editMessageText(`❌ Not enough SOL to send after deducting fee.`, { chat_id: userId, message_id: msg.message_id });
        return;
      }

      transaction.add(
        SystemProgram.transfer({
          fromPubkey: botKeypair.publicKey,
          toPubkey: userDestinationPublicKey,
          lamports: amountToSendLamports,
        })
      );
      await bot.editMessageText(`⏳ Withdrawing ${amountToSendLamports / LAMPORTS_PER_SOL} SOL... Please wait.`, { chat_id: userId, message_id: msg.message_id });
      transactionSignature = await solanaSendAndConfirmTransaction(connection, transaction, [botKeypair], { commitment: 'confirmed', skipPreflight: false });

    } else {
      if (!tokenToWithdraw.address) {
        await bot.editMessageText("❌ SPL Token account address not found.", { chat_id: userId, message_id: msg.message_id });
        return;
      }
      if (tokenToWithdraw.amount <= 0) {
        await bot.editMessageText(`❌ Zero balance for token ${tokenToWithdraw.symbol}.`, { chat_id: userId, message_id: msg.message_id });
        return;
      }

      const solBalanceForFee = allBalances.find(b => b.isNative);
      if (!solBalanceForFee || solBalanceForFee.amount < estimatedSolTransferFeeLamports) {
        await bot.editMessageText(`❌ Insufficient SOL balance in bot wallet to cover SPL transaction fee.`, {
          chat_id: userId, message_id: msg.message_id, reply_markup: {
            inline_keyboard: [[{ text: "Return 👈", callback_data: "return" }]],
          }
        });

        return;
      }

      const sourceTokenAccount = new PublicKey(tokenToWithdraw.address);
      const mintPublicKey = new PublicKey(tokenToWithdraw.mint);

      const destinationAta = await getOrCreateAssociatedTokenAccount(
        connection,
        botKeypair,
        mintPublicKey,
        userDestinationPublicKey,
        false,
        'confirmed',
        {
          commitment: 'confirmed', skipPreflight: false,
        },
        new PublicKey(tokenToWithdraw.tokenProgram as string)
      );

      transaction.add(
        splCreateTransferInstruction(
          sourceTokenAccount,
          mintPublicKey,
          destinationAta.address,
          botKeypair.publicKey,
          tokenToWithdraw.amount,
          tokenToWithdraw.decimals,
          [],
          new PublicKey(tokenToWithdraw.tokenProgram as string)
        )
      );
      await bot.editMessageText(`⏳ Withdrawing ${tokenToWithdraw.uiAmount.toFixed(tokenToWithdraw.decimals)} ${tokenToWithdraw.symbol}... Please wait.`, { chat_id: userId, message_id: msg.message_id });
      transactionSignature = await solanaSendAndConfirmTransaction(connection, transaction, [botKeypair], { commitment: 'confirmed', skipPreflight: false });
    }

    if (transactionSignature) {
      const successMessage = `✅ Withdrawal successful!\nToken: ${tokenToWithdraw.symbol}\nAmount: ${isNative ? (tokenToWithdraw.amount - estimatedSolTransferFeeLamports) / LAMPORTS_PER_SOL : tokenToWithdraw.uiAmount.toFixed(tokenToWithdraw.decimals)}\nTx: <a href="https://solscan.io/tx/${transactionSignature}?cluster=${ConfigService.getConfig().solana.rpcUrl.includes('devnet') ? 'devnet' : 'mainnet-beta'}">${ellipsis(transactionSignature, 10)}</a>`;
      await bot.editMessageText(successMessage, {
        chat_id: userId,
        message_id: msg.message_id,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [[{ text: "Return 👈", callback_data: "return" }]],
        },
      });
    } else {
      await bot.editMessageText("⚠️ Withdrawal transaction might have failed or signature was not confirmed within specified time.", { chat_id: userId, message_id: msg.message_id });
    }

  } catch (error: any) {
    console.error("Error in handleWithdrawTokenSelected:", error);
    let errorMessage = "❌ An error occurred during withdrawal.";
    if (error.message) {
      errorMessage += `\nError: ${error.message.substring(0, 200)}`;
    }
    try {
      await bot.editMessageText(errorMessage, {
        chat_id: userId, message_id: msg.message_id, reply_markup: {
          inline_keyboard: [[{ text: "Return 👈", callback_data: "return" }]],
        },
      });
    } catch (editError) {
      console.error("Failed to send error message to user (edit):", editError);
      await bot.sendMessage(userId, errorMessage);
    }
  }
};
