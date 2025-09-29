import {
  walletHandler,
  addWalletHandler,
  selectWalletHandler,
} from "../library/walletHandler";
import { returnHandler } from "../library/returnHandler";
import {
  tokenSettingHandler,
  addTokenHanlder,
} from "../library/tokenSettingHandler";
import {
  swapHandler,
  swapSettingHandler,
  swapConfirmHandler,
  enterFeeHandler,
  swapDeleteHandler,
  swapStopHandler,
  swapActiveHandler,
  dirConfirm,
  tradeTimeSetting,
  selectSwapTokenHandler,
  swapListHandler,
  swapSettingAddHandler,
  selectSwapWalletHandler,
} from "../library/swapHandler";
import {
  deleteWallethandler,
  confirmHandler,
  deleteTokenHandler,
  confirmTokenHandler,
  selectTokenHandler,
} from "../library/deleteHandler";
import { balanceHandler } from "../library/balanceHandler";
import { provideReferralWallet} from "../library/referralHandler";
import { provideWithdrawWallet, withdrawWalletHandler, handleWithdrawTokenSelected } from "../library/withdrawHandler"; // Added handleWithdrawTokenSelected
import { referralHandler } from "../library/referralHandler";
export const callBackHandler = async (msg: any, action: string | any) => {
  switch (action) {
    default: {
      if (action.startsWith("open_wallet")) {
        walletHandler(msg, 0);
      } else if (action.startsWith("token_setting")) {
        tokenSettingHandler(msg);
      } else if (action.startsWith("open_activity")) {
        swapHandler(msg);
      } else if (action.startsWith("open_referral")) {
        referralHandler(msg.chat.id);
      }
       else if (action.startsWith("return")) {
        returnHandler(msg);
      } else if (action.startsWith("add_wallet")) {
        addWalletHandler(msg, 0);
      } else if (action.startsWith("wallet_select")) {
        const type = Number(action.split(":")[2]);
        if (type == 1) {
          balanceHandler(msg, action);
        } else {
          selectWalletHandler(msg, action);
        }
      } else if (action.startsWith("delete_wallet")) {
        deleteWallethandler(msg, action);
      } else if (action.startsWith("agree_delete_wallet")) {
        confirmHandler(msg, action);
      } else if (action.startsWith("balance_wallet")) {
        balanceHandler(msg, action);
      } else if (action.startsWith("delete_token")) {
        deleteTokenHandler(msg);
      } else if (action.startsWith("add_token")) {
        addTokenHanlder(msg);
      } else if (action.startsWith("selectToken_")) {
        selectTokenHandler(msg, action);
      } else if (action.startsWith("agree_delete_token")) {
        confirmTokenHandler(msg, action);
      } else if (action.startsWith("agree_swap_delete")) {
        swapConfirmHandler(msg);
      } else if (action.startsWith("enterFee_")) {
        enterFeeHandler(msg, action);
      } else if (action.startsWith("swap_setting_add")) {
        swapSettingAddHandler(msg, action);
      } else if (action.startsWith("swap_delete")) {
        swapDeleteHandler(msg, action);
      } else if (action.startsWith("swap_stop")) {
        swapStopHandler(msg, action);
      } else if (action.startsWith("swap_active")) {
        swapActiveHandler(msg, action);
      } else if (action.startsWith("swapList")) {
        swapListHandler(msg, action);
      } else if (action.startsWith("selectSwapToken_")) {
        selectSwapTokenHandler(msg, action);
      } else if (action.startsWith("selectSwapWallet")) {
        selectSwapWalletHandler(msg, action);
      } else if (action.startsWith("direction_")) {
        dirConfirm(msg, action);
      } else if (action.startsWith("trade_")) {
        tradeTimeSetting(msg, action);
      } else if (action.startsWith("provide_withdraw_wallet")) {
        provideWithdrawWallet(msg);
      } else if (action.startsWith("selectWithdrawWallet")) {
        withdrawWalletHandler(msg, action);
      } else if (action.startsWith("wts:")) {
        handleWithdrawTokenSelected(msg, action);
      } else if (action.startsWith("provide_referral_wallet")) {
        provideReferralWallet(msg);
      }

      break;
    }
  }
};
