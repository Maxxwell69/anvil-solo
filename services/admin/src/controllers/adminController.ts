require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  Tokens,
  Swap,
  FeeCollectData,
  UserList,
  Wallet,
  ReferralAction,
  Referral,
  Fee,
  ReferralBy,
} = require("../models");
const appConfig = require('../app-config');
const saltRounds = 10;

interface TsplTokenInfo {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  balance: number;
}

const getTokenList = async (data: any) => {
  try {
    const query = data.keyword.trim();
    const regex = new RegExp(query, "i");
    const result = await Tokens.find({
      $or: [
        { name: { $regex: regex } },
        { publicKey: { $regex: regex } },
        { userId: !Number(query) ? 0 : Number(query) },
      ],
    });
    return { err: 0, result: result };
  } catch (ex) {
    return { err: 1, msg: "poolList: cannot found pool data" };
  }
};

const getTradesList = async (data: any) => {
  try {
    const query = data.keyword.trim();
    const regex = new RegExp(query, "i");

    const result = await Swap.aggregate([
      {
        $match: {
          $or: [
            { baseToken: { $regex: regex } },
            { baseName: { $regex: regex } },
            { quoteToken: { $regex: regex } },
            { quoteName: { $regex: regex } },
            { pairAddress: { $regex: regex } },
            { userId: !Number(query) ? 0 : Number(query) },
          ]
        }
      },
      {
        $addFields: {
          fundingWallet: { $toObjectId: "$wallet_id" }
        }
      },
      {
        $lookup: {
          from: "wallets",
          localField: "fundingWallet",
          foreignField: "_id",
          as: "wallet"
        }
      },
      {
        $unwind: {
          path: "$wallet",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          baseToken: 1,
          baseSymbol: 1,
          baseName: 1,
          baseBalance: 1,
          quoteToken: 1,
          quoteName: 1,
          quoteSymbol: 1,
          quoteBalance: 1,
          pairAddress: 1,
          baseDecimal: 1,
          quoteDecimal: 1,
          amount: 1,
          amountToken: 1,
          userId: 1,
          buy: 1,
          sell: 1,
          buyProgress: 1,
          sellProgress: 1,
          flag: 1,
          isBalance: 1,
          loopTime: 1,
          priorityFee: 1,
          active: 1,
          dir: 1,
          wallet_id: 1,
          fundingWallet: "$wallet.publicKey"
        }
      }
    ]);

    return { err: 0, result: result };
  } catch (ex) {
    const result: any[] = [];
    return { err: 1, result: result, msg: "Can't Find the Trade Data." };
  }
};

const getFeeData = async (data: any) => {
  try {
    const query = data.keyword.trim();
    const regex = new RegExp(query, "i");
    const result = await FeeCollectData.find({
      $or: [
        { sender: !Number(query) ? 0 : Number(query) },
        { receiver: { $regex: regex } },
        { txId: { $regex: regex } },
        { period: !Number(query) ? 0 : Number(query) },
        { start_date: { $regex: regex } },
        { end_date: { $regex: regex } },
      ],
    }).sort({ lastUpdated: -1 });
    return { err: 0, result: result };
  } catch (error) {
    console.log("Failed to find adminDepositSettingInfo:", error);
  }
};

const getUserList = async (data: any) => {
  try {
    const query = data.keyword.trim();
    const regex = new RegExp(query, "i");
    const userList = await UserList.find({
      $or: [
        { userName: { $regex: regex } },
        { userId: !Number(query) ? 0 : Number(query) },
      ],
    });
    const FeeData = await FeeCollectData.find({});
    let result = [];

    for (const user of userList) {
      const referralInfo = await findOnereferralBy(
        user.userId
      );

      result.push({
        userId: user.userId,
        userName: user.userName,
        premium: false,
        referralCount: referralInfo.count || 0,
      })
    }

    return { err: 0, result: result };
  } catch (ex) {
    return { err: 1, msg: "poolData: cannot found pool data" };
  }
};

const login = async (email: string, password: string) => {
  try {
    if (!email || !password) {
      const result = {
        message: "Please enter email and password",
      };
      return { error: 1, result: result };
    } else if (
      email === appConfig.admin.superAdminEmail &&
      password === appConfig.admin.superAdminPassword
    ) {
      const data = {
        email: email,
        name: appConfig.admin.superAdminName,
      } as any;
      const token = jwt.sign(data, appConfig.jwtSecret, {
        expiresIn: "144h",
      });
      const result = {
        token: token,
        message: "success",
      };
      return { error: 0, result: result };
    } else {
      const result = {
        message: "Invalid email or password",
      };
      return { error: 1, result: result };
    }
  } catch (ex) {
    return { error: 2, msg: ex };
  }
};

const getWallet = async (userId: number) => {
  try {
    const getUserWallet = await Wallet.findOne({ userId: userId });
    return { error: 0, result: getUserWallet };
  } catch (err) {
    console.log("To get the balance is failed: ", err);
  }
};

const getUserDetail = async (userId: number) => {
  try {
    const userDetail = await UserList.findOne({ userId: userId });
    if (!userDetail) {
      return { error: 1, msg: "User not found" };
    }
    return { error: 0, result: userDetail };
  } catch (ex) {
    return { error: 1, msg: "Failed to fetch user details" };
  }
};

const updateBotFee = async ({
  userId,
  fee,
}: {
  userId: number;
  fee: number;
}) => {
  try {
    const userIdNumber = Number(userId);
    if (isNaN(userIdNumber)) {
      return { error: 1, msg: "Invalid user ID format" };
    }

    const result = await Fee.findOneAndUpdate(
      { userId: userIdNumber },
      { $set: { fee: fee } },
      { new: true, upsert: true }
    );

    if (result) {
      return { error: 0, result: { message: "Fee updated successfully" } };
    } else {
      return { error: 1, msg: "Failed to update fee" };
    }
  } catch (ex) {
    console.log("Failed to update bot fee:", ex);
    return { error: 1, msg: "Failed to update bot fee" };
  }
};

const updateReferralFee = async ({
  userId,
  fee,
}: {
  userId: number;
  fee: number;
}) => {
  try {
    const userIdNumber = Number(userId);
    if (isNaN(userIdNumber)) {
      return { error: 1, msg: "Invalid user ID format" };
    }

    const referralAction = await Referral.findOne({
      userId: userIdNumber,
    });

    if (!referralAction) {
      const newReferralAction = new Referral({
        userId: userIdNumber,
        action: true,
        wallet: "", // Required field based on schema
        feeEarn: appConfig.swap.referralFee,
      });
      await newReferralAction.save();
      return { error: 0, result: { message: "Referral action enabled" } };
    } else {
      //  const actionBoolean = action === "true";
      await Referral.updateOne(
        { userId: userIdNumber },
        { $set: { feeEarn: fee } }
      );

      return {
        error: 0,
        result: {
          message: `Referral fee update ${fee}`,
        },
      };
    }
  } catch (ex) {
    return { error: 1, msg: "Failed to toggle referral action" };
  }
};

//ReferralAction
const toggleReferral = async (userId: number, action: string) => {
  try {
    const userIdNumber = Number(userId);
    if (isNaN(userIdNumber)) {
      return { error: 1, msg: "Invalid user ID format" };
    }

    const referralAction = await Referral.findOne({
      userId: userIdNumber,
    });

    if (!referralAction) {
      const newReferralAction = new Referral({
        userId: userIdNumber,
        action: true,
        wallet: "", // Required field based on schema
        feeEarn: appConfig.swap.referralFee,
      });
      await newReferralAction.save();
      return { error: 0, result: { message: "Referral action enabled" } };
    } else {
      const actionBoolean = action === "true";
      await Referral.updateOne(
        { userId: userIdNumber },
        { $set: { action: action } }
      );

      return {
        error: 0,
        result: {
          message: `Referral action ${actionBoolean ? "enabled" : "disabled"}`,
        },
      };
    }
  } catch (ex) {
    return { error: 1, msg: "Failed to toggle referral action" };
  }
};

const toggleStatus = async (userId: number) => {
  try {
    const userIdNumber = Number(userId);
    if (isNaN(userIdNumber)) {
      return { error: 1, msg: "Invalid user ID format" };
    }

    const referralAction = await Referral.findOne({
      userId: userIdNumber,
    });
    if (!referralAction) {
      const newReferralAction = new Referral({
        userId: userIdNumber,
        action: true,
      });
      await newReferralAction.save();
      //  return { enabled: true };
      return { error: 0, result: { enabled: true } };
    } else {
      const action = referralAction.action;
      /*  return {
        enabled: action,
      }; */
      return { error: 0, result: { enabled: action } };
    }
  } catch (ex) {
    //console.log("Failed to toggle status");
    return { error: 1, msg: "Failed to toggle status" };
  }
};

const referralInfo = async (userId: number) => {
  try {
    const userIdNumber = Number(userId);
    if (isNaN(userIdNumber)) {
      return { error: 1, msg: "Invalid user ID format" };
    }

    const referralInfos = await Referral.findOne({
      userId: userIdNumber,
    });
    if (!referralInfos) {
      return { error: 1, msg: "Referral action not found" };
    } else {
      return { error: 0, result: referralInfos };
    }
  } catch (ex) {
    return { error: 1, msg: "Failed to get referral fee" };
  }
};

const botFeeInfo = async (userId: number) => {
  try {
    const userIdNumber = Number(userId);
    if (isNaN(userIdNumber)) {
      return { error: 1, msg: "Invalid user ID format" };
    }

    const botFeeInfos = await Fee.findOne({
      userId: userIdNumber,
    });
    if (!botFeeInfos) {
      return { error: 1, msg: "Referral action not found" };
    } else {
      return { error: 0, result: botFeeInfos };
    }
  } catch (ex) {
    return { error: 1, msg: "Failed to get bot fee" };
  }
};

interface IReferralBy extends Document {
  userId: number;
  referrerId: number;
}

/**
 * Function to get all userIds for a given referrerId
 * @param referrerId - The referrerId to filter by
 * @returns Promise<number[]> - List of userIds
 */
async function getUserIdsByReferrerId(userId: number): Promise<number[]> {
  try {
    const referrerId = Number(userId);
    const results = await ReferralBy.find({ referrerId }, "userId").exec();
    return results.map((doc: IReferralBy) => doc.userId);
  } catch (error) {
    console.error("Error fetching userIds:", error);
    throw error;
  }
}

const findOnereferralBy = async (userId: any) => {
  try {
    const results = await ReferralBy.find({ referrerId: userId });
    if (!results || results.length === 0) {
      return {
        count: 0,
        referrals: [],
      };
    }
    return {
      count: results.length,
      referrals: results,
    };
  } catch (error) {
    console.error("Error in findOnereferralBy:", error);
    return {
      count: 0,
      referrals: [],
    };
  }
};

module.exports = {
  getTokenList,
  getTradesList,
  getFeeData,
  getUserList,
  login,
  getWallet,
  getUserDetail,
  updateBotFee,
  updateReferralFee,
  toggleReferral,
  toggleStatus,
  referralInfo,
  botFeeInfo,
  getUserIdsByReferrerId,
};
