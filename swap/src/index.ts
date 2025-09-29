//import { bot } from "../bot";
import { apiSwap } from "./swap";
import { ConfigService } from "./service/config";
import swapInfoController from "./controller/swap";
import { checkSolBalance, checkSplTokenBalance } from "./service/getBalance";
import { delay } from "./service";
import { sendSol } from "./service/utils";
import TelegramBot from "node-telegram-bot-api";
import { sendTelegramMessage } from "./controller/bot_message";
import { connectDatabase } from "./db";
import { NATIVE_MINT } from "@solana/spl-token";
import { Logger } from "./interfaces/Logger";
// Load configuration
const config = ConfigService.load();


let isSolStatus = {} as any;

export const executeSwap = async (userList: any, logger: Logger) => {
  const {
    dexId,
    pairAddress,
    amount,
    amountToken,
    baseDecimal,
    quoteDecimal,
    baseSymbol,
    quoteSymbol,
    baseToken,
    quoteToken,
    swapDetails,
    userId,
    _id,
    buy,
    sell,
    buyProgress,
    sellProgress,
    flag,
    isBalance,
    priorityFee,
    dir,
    fee,
    feeValue,
    walletPrivateKeys,
  } = userList;
  try {
    const currentSolBalance = (await checkSolBalance(
      swapDetails[0].publicKey
    )) as any;

    if (dir == "one") {
      if (buyProgress < buy && flag) {
        if (baseToken === NATIVE_MINT.toString()) {
          const currentSolBalance = (await checkSolBalance(
            swapDetails[0].publicKey
          )) as any;
          if (currentSolBalance === null || currentSolBalance === undefined) return;
          let priorityFeeValue = 0;
          if (priorityFee === "high") {
            priorityFeeValue = 0.01;
          } else if (priorityFee === "medium") {
            priorityFeeValue = 0.003;
          } else {
            priorityFeeValue = 0.001;
          }
          if (currentSolBalance >= amount + priorityFeeValue) {
            const result = await apiSwap(
              dexId,
              pairAddress,
              amount,
              baseDecimal,
              baseToken,
              quoteToken,
              swapDetails[0].privateKey,
              priorityFee,
              walletPrivateKeys,
              userId,
              logger,
              amountToken,
              true,
              quoteDecimal
            );

            if (result?.status == 200 && result?.txId) {
              const newBuyProgress = buyProgress + 1;
              let swapInfoUpdate = {};
              if (buy == newBuyProgress) {
                swapInfoUpdate = {
                  _id: _id,
                  buyProgress: 0,
                  flag: false,
                  isBalance: true,
                  feeValue: 0,
                };
              } else {
                swapInfoUpdate = {
                  _id: _id,
                  buyProgress: newBuyProgress,
                  flag: true,
                  isBalance: true,
                  feeValue: 0,
                };
              }
              await swapInfoController.swapUpdate(swapInfoUpdate);
              const BuyMessage = ` You bought the token.\n 
              Swap for ${Number(amount)} ${baseSymbol} -> ${quoteSymbol}
              <a href="${ConfigService.getConfig().solana.solscanUrl}/${
                result.txId
              }"><i>View on Solscan</i></a>`;
            } else {
              return;
            }
          } else {
            if (isBalance) {
              const value = amount + priorityFeeValue - currentSolBalance;
              await inputTokenCheck(
                userId,
                baseToken,
                baseSymbol,
                value,
                swapDetails[0].publicKey
              );
              const swapInfoUpdate = {
                _id: _id,
                isBalance: false,
              };
              // Call the bot service to update swap information
              await swapInfoController.swapUpdate(swapInfoUpdate);
            } else {
              return;
            }
          }
        }
      } else if (sellProgress < sell && !flag) {
        const currentTokenBalance = (await checkSplTokenBalance(
          quoteToken,
          swapDetails[0].publicKey
        )) as any;
        if (currentTokenBalance === null || currentTokenBalance === undefined) return;
        if (amountToken > currentTokenBalance || currentTokenBalance == 0) {
          if (isBalance) {
            const value = amountToken - currentTokenBalance;
            await inputTokenCheck(
              userId,
              quoteToken,
              quoteSymbol,
              value,
              swapDetails[0].publicKey
            );
            const swapInfoUpdate = {
              _id: _id,
              isBalance: false,
            };
          } else {
            return;
          }
        } else {
          const result = await apiSwap(
            dexId,
            pairAddress,
            amountToken,
            quoteDecimal,
            quoteToken,
            baseToken,
            swapDetails[0].privateKey,
            priorityFee,
            walletPrivateKeys,
            userId,
            logger
          );
          if (result?.status == 200 && result?.txId) {
            const newSellProgress = sellProgress + 1;
            let swapInfoUpdate = {};
            if (sell == newSellProgress) {
              swapInfoUpdate = {
                _id: _id,
                sellProgress: 0,
                flag: true,
                isBalance: true,
                feeValue: 0,
              };
            } else {
              swapInfoUpdate = {
                _id: _id,
                sellProgress: newSellProgress,
                flag: false,
                isBalance: true,
                feeValue: 0,
              };
            }
            // Call the bot service to update swap information
            await swapInfoController.swapUpdate(swapInfoUpdate);
            const soldMessage = `
            You sold the token.
            Reverse swap for ${Number(
              amountToken
            )} ${quoteSymbol} -> ${baseSymbol}
            <a href="${ConfigService.getConfig().solana.solscanUrl}/${result.txId}">View on Solscan</a>`;
          } else {
            return;
          }
        }
      } else {
        return;
      }
    } else if (dir == "two") {
      if (flag && !isSolStatus[_id.toString()]?.isSol) {
        const currentSolBalance = (await checkSolBalance(
          swapDetails[0].publicKey
        )) as any;
        
        if (currentSolBalance === null || currentSolBalance === undefined) return;
        let priorityFeeValue = 0;
        if (priorityFee === "high") {
          priorityFeeValue = 0.01;
        } else if (priorityFee === "medium") {
          priorityFeeValue = 0.003;
        } else {
          priorityFeeValue = 0.001;
        }
        if (
          currentSolBalance <
          (amount + priorityFeeValue) * (buy - buyProgress) + priorityFeeValue
        ) {
          const currentTokenBalance = (await checkSplTokenBalance(
            quoteToken,
            swapDetails[0].publicKey
          )) as any;
          if (currentTokenBalance === null || currentTokenBalance === undefined) return;
          if (currentTokenBalance < amountToken * buy) {
            if (isBalance) {
              const value = Number(
                parseFloat(
                  (
                    (amount + priorityFeeValue) * (buy - buyProgress) +
                    priorityFeeValue
                  ).toString()
                ).toFixed(4)
              );
              await inputTokenCheck(
                userId,
                baseToken,
                baseSymbol,
                value,
                swapDetails[0].publicKey
              );
              const swapInfoUpdate = {
                _id: _id,
                isBalance: false,
              };
              // Call the bot service to update swap information
              await swapInfoController.swapUpdate(swapInfoUpdate);
              isSolStatusFunc(_id.toString(), false);
            } else {
              return;
            }
          } else {
            isSplTokenStatusFunc(_id.toString(), true);
            const swapInfoUpdate = {
              _id: _id,
              sellProgress: 0,
              buyProgress: 0,
              buy: sell,
              sell: buy,
              flag: false,
              isBalance: true,
            };
            // Call the bot service to update swap information
            await swapInfoController.swapUpdate(swapInfoUpdate);
            /*  try {
                await fetch(`${ConfigService.getConfig().BOT_API}/swapUpdate`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(swapInfoUpdate)
                });
              } catch (error) {
                console.error('Error calling swap update API:', error);
              } */
            return;
          }
        } else {
          isSolStatusFunc(_id.toString(), true);
        }
      }

      if (!flag && !isSolStatus[_id.toString()]?.isSplToken) {
        const currentTokenBalance = (await checkSplTokenBalance(
          quoteToken,
          swapDetails[0].publicKey
        )) as any;
        if (currentTokenBalance === null || currentTokenBalance === undefined) return;
        if (currentTokenBalance < amountToken * sell) {
          const currentSolBalance = (await checkSolBalance(
            swapDetails[0].publicKey
          )) as any;
          if (currentSolBalance === null || currentSolBalance === undefined) return;
          let priorityFeeValue = 0;
          if (priorityFee === "high") {
            priorityFeeValue = 0.01;
          } else if (priorityFee === "medium") {
            priorityFeeValue = 0.003;
          } else {
            priorityFeeValue = 0.001;
          }
          if (
            currentSolBalance <
            (amount + priorityFeeValue) * (sell - sellProgress) +
              priorityFeeValue
          ) {
            if (isBalance) {
              const value = Number(
                parseFloat(
                  (
                    (amount + priorityFeeValue) * buy +
                    priorityFeeValue
                  ).toString()
                ).toFixed(4)
              );
              await inputTokenCheck(
                _id.toString(),
                baseToken,
                baseSymbol,
                value,
                swapDetails[0].publicKey
              );
              const swapInfoUpdate = {
                _id: _id,
                isBalance: false,
              };
              // Call the bot service to update swap information
              await swapInfoController.swapUpdate(swapInfoUpdate);
              isSolStatusFunc(_id.toString(), false);
            } else {
              return;
            }
          } else {
            const swapInfoUpdate = {
              _id: _id,
              sellProgress: 0,
              buyProgress: 0,
              buy: sell,
              sell: buy,
              flag: true,
              isBalance: true,
            };
            // Call the bot service to update swap information
            await swapInfoController.swapUpdate(swapInfoUpdate);
            isSolStatusFunc(_id.toString(), true);
            return;
          }
        } else {
          const currentSolBalance = (await checkSolBalance(
            swapDetails[0].publicKey
          )) as any;
          if (currentSolBalance === null || currentSolBalance === undefined) return;
          let priorityFeeValue = 0;
          if (priorityFee === "high") {
            priorityFeeValue = 0.01;
          } else if (priorityFee === "medium") {
            priorityFeeValue = 0.003;
          } else {
            priorityFeeValue = 0.001;
          }
          if (currentSolBalance < priorityFeeValue * sell) {
            if (isBalance) {
              const value = Number(
                parseFloat(
                  (priorityFeeValue * sell - currentSolBalance).toString()
                ).toFixed(4)
              );
              await inputTokenCheck(
                userId,
                baseToken,
                baseSymbol,
                value,
                swapDetails[0].publicKey
              );
              const swapInfoUpdate = {
                _id: _id,
                isBalance: false,
              };
              // Call the bot service to update swap information
              await swapInfoController.swapUpdate(swapInfoUpdate);
            } else {
              return;
            }
          } else {
            isSplTokenStatusFunc(_id.toString(), true);
          }
        }
      }
      if (isSolStatus[_id.toString()]?.isSol && flag && buyProgress < buy) {
        const result = await apiSwap(
          dexId,
          pairAddress,
          amount,
          baseDecimal,
          baseToken,
          quoteToken,
          swapDetails[0].privateKey,
          priorityFee,
          walletPrivateKeys,
          userId,
          logger,
          amountToken,
          true,
          quoteDecimal
        );
        if (result?.status == 200 && result?.txId) {
          const newBuyProgress = buyProgress + 1;
          let swapInfoUpdate = {};
          if (buy == newBuyProgress) {
            isSplTokenStatusFunc(_id.toString(), false);
            isSolStatusFunc(_id.toString(), true);
            swapInfoUpdate = {
              _id: _id,
              buyProgress: 0,
              flag: false,
              isBalance: true,
              feeValue: 0,
            };
          } else {
            swapInfoUpdate = {
              _id: _id,
              buyProgress: newBuyProgress,
              flag: true,
              isBalance: true,
              feeValue: 0,
            };
          }
          // Call the bot service to update swap information
          await swapInfoController.swapUpdate(swapInfoUpdate);
          const buy2Message = `
          You bought the token.\n 
          Swap for ${Number(amount)} ${baseSymbol} -> ${quoteSymbol}
          <a href="${ConfigService.getConfig().solana.solscanUrl}/${
            result.txId
          }"><i>View on Solscan</i></a>`;
        } else {
          return;
        }
      }
      if (
        isSolStatus[_id.toString()]?.isSplToken &&
        sellProgress < sell &&
        !flag
      ) {
        const result = await apiSwap(
          dexId,
          pairAddress,
          amountToken,
          quoteDecimal,
          quoteToken,
          baseToken,
          swapDetails[0].privateKey,
          priorityFee,
          walletPrivateKeys,
          userId,
          logger
        );
        if (result?.status == 200 && result?.txId) {
          const newSellProgress = sellProgress + 1;
          let swapInfoUpdate = {};
          if (sell == newSellProgress) {
            isSolStatusFunc(_id.toString(), false);
            isSplTokenStatusFunc(_id.toString(), true);
            swapInfoUpdate = {
              _id: _id,
              sellProgress: 0,
              flag: true,
              isBalance: true,
              feeValue: 0,
            };
          } else {
            swapInfoUpdate = {
              _id: _id,
              sellProgress: newSellProgress,
              flag: false,
              isBalance: true,
              feeValue: 0,
            };
          }
          // Call the bot service to update swap information
          await swapInfoController.swapUpdate(swapInfoUpdate);
          const sold2Message = `
          You sold the token.
          Reverse swap for ${Number(
            amountToken
          )} ${quoteSymbol} -> ${baseSymbol}
          <a href="${ConfigService.getConfig().solana.solscanUrl}/${result.txId}">View on Solscan</a>`;
        } else {
          return;
        }
      } else {
        return;
      }
    }
  } catch (error) {
    console.error("Error executing swap:", error);
  }
};

const isSolStatusFunc = (userId: string, flag: boolean) => {
  isSolStatus[userId] = {
    isSol: flag,
  };
};
const isSplTokenStatusFunc = (userId: string, flag: boolean) => {
  isSolStatus[userId] = {
    isSplToken: flag,
  };
};

const inputTokenCheck = async (
  userId: number,
  tokenAddress: any,
  Symbol: string,
  miniAmount: number,
  publicKey: string
) => {
  const notEnoughToken = `
  You have not the ${Symbol} token amount enough.
  <b>Required Minimum ${Symbol} Amount: </b> ${miniAmount}
  Wallet Address: <code>${publicKey}</code>
  `;
};
