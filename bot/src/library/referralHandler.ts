import { bot, botUsername } from "../index";
import referralController from "./../controller/referral";
import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ConfigService } from "../service/config";

const awaitingReferralWallet = new Set<string>();
const MIN_BALANCE_SOL = 0.01;

export const referralHandler = async (userId: string) => {
  try {
    const referralInfo = await referralController.findOne({
      userId
    });

    const message =
      `Here’s your unique referral code: <code>${userId}</code>\n` +
      `Referral link: <code>https://t.me/${botUsername}?start=${userId}</code>\n` +
      `🔗 Share this code with your friends and earn exciting rewards when they sign up using it!\n` +
      `${referralInfo?.wallet
        ? `Earnings go to: <code>${referralInfo.wallet}</code>\n`
        : `❗ No wallet configured for rewards!\n`
      }`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          ...(referralInfo?.wallet
            ? [
              [
                {
                  text: "🏦 Change Wallet Address",
                  callback_data: "provide_referral_wallet",
                },
              ],
            ]
            : [
              [
                {
                  text: "🏦 Provide Wallet Address",
                  callback_data: "provide_referral_wallet",
                },
              ],
            ]),
          [{ text: "👈 Return", callback_data: "return" }],
        ],
      },
    };

    if (bot && typeof bot.sendMessage === 'function') {
      await bot.sendMessage(userId, message, {
        parse_mode: "HTML",
        ...keyboard,
      });
    } else {
      console.error("Bot context is not available to send referral message.");
    }
  } catch (error) {
    console.error("Error in referralHandler:", error);
    try {
      if (bot && typeof bot.sendMessage === 'function') {
        await bot.sendMessage(userId, "❌ An error occurred while fetching your referral information. Please try again later.");
      }
    } catch (sendError) {
      console.error("Failed to send error message to user:", sendError);
    }
  }
};

export const provideReferralWallet = async (msg: any) => {
  try {
    const userId = msg.chat.id;
    awaitingReferralWallet.add(userId);

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
        !awaitingReferralWallet.has(userId) ||
        !responseMsg.reply_to_message ||
        responseMsg.reply_to_message.from.id == userId
      ) {
        return;
      }

      bot.removeListener("message", listener);
      awaitingReferralWallet.delete(userId);

      const walletAddress = responseMsg.text.trim();
      let publicKey: PublicKey;

      try {
        try {
          publicKey = new PublicKey(walletAddress);
        } catch (err) {
          await bot.sendMessage(userId, "❌ Invalid wallet address format. Please enter a valid Solana public key and try the command again.");
          return;
        }

        const connection = new Connection(ConfigService.getConfig().solana.rpcUrl, 'confirmed');
        let balanceSol = 0;
        try {
          const balanceLamports = await connection.getBalance(publicKey);
          balanceSol = balanceLamports / LAMPORTS_PER_SOL;
        } catch (balanceError: any) {
          console.error(`Failed to get balance for ${walletAddress}:`, balanceError);
          await bot.sendMessage(userId, `❌ Could not verify wallet balance. Please ensure the wallet exists on the blockchain. Proceeding without balance check.`);
          return;
        }

        if (balanceSol < MIN_BALANCE_SOL) {
          await bot.sendMessage(userId, `❌ Wallet balance is too low (${balanceSol.toFixed(4)} SOL). Minimum required balance is ${MIN_BALANCE_SOL} SOL to cover the rent. Please top up and try again.`);
          await referralHandler(userId);
          return;
        }

        await referralController.updateOne({
          filter: { userId },
          update: { wallet: walletAddress },
          options: { upsert: true }
        });

        await bot.sendMessage(
          userId,
          `✅ Wallet address updated:\n<code>${walletAddress}</code>`,
          { parse_mode: "HTML" }
        );

        await referralHandler(userId);
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
      if (awaitingReferralWallet.has(userId)) {
        bot.removeListener("message", listener);
        awaitingReferralWallet.delete(userId);
        bot.sendMessage(userId, "⏰ You took too long to reply. Please use the command again if you want to set your wallet.").catch(err => console.error("Failed to send timeout message:", err));
      }
    }, 5 * 60 * 1000);

  } catch (error) {
    console.error("Error in provideReferralWallet setup:", error);
    try {
      const userId = msg.chat.id.toString();
      await bot.sendMessage(userId, "❌ An error occurred while trying to set up the wallet prompt. Please try again later.");
    } catch (sendError) {
      console.error("Failed to send setup error message:", sendError);
    }
  }
};
