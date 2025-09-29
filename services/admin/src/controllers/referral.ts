const { Referral } = require("../models/index");
const { ReferralBy } = require("../models/index");

const findOne = async (props: any) => {
  try {
    const result = await Referral.findOne(props);
    return result;
  } catch (error) {
    throw new Error("Failed to find feeInfo");
  }
};

const find = async () => {
  try {
    const result = await Referral.find();
    return result;
  } catch (error) {
    throw new Error("Failed to find fee list");
  }
};

const create = async (props: any) => {
  try {
    const _result = await Referral.findOne({ userId: props.userId });
    if (_result) {
      return {
        status: 201,
        msg: `Fee is already set for this user.`,
      };
    }
    const newFee = new Referral(props);
    const result = await newFee.save();
    if (result) {
      return { status: 200, msg: `Fee is set successfully.` };
    } else {
      return {
        status: 201,
        msg: `Please try again later due to network overload`,
      };
    }
  } catch (error) {
    console.log("Failed to create fee");
    return {
      status: 500,
      msg: `Please try again later due to network overload.`,
    };
  }
};

const updateOne = async (props: any) => {
  try {
    const result = await Referral.findOneAndUpdate(
      { userId: props.userId },
      { $set: { feeEarn: props.feeEarn } },
      { new: true }
    );
    if (result) {
      return { status: 200, msg: `Fee is updated successfully.` };
    } else {
      return {
        status: 201,
        msg: `User fee not found or update failed`,
      };
    }
  } catch (error) {
    console.log("Failed to update fee");
    return {
      status: 500,
      msg: `Please try again later due to network overload.`,
    };
  }
};

const findOnereferralBy = async (userId: any) => {
  try {
    const result = await ReferralBy.findOne({ userId });

    return { error: 1, result: { referrerId: result?.referrerId || null } }
  } catch (error) {
    console.error("Error in findOnereferralBy:", error);
    return { error: 1, msg: "Invalid user ID format" };
  }
};

const updateOneReferralBy = async (props: any) => {
  try {
    const result = await ReferralBy.findOneAndUpdate(
      { userId: props.userId },
      { $set: { referrerId: props.referrerId } },
      { upsert: true }
    );
    if (result) {
      return { status: 200, msg: `refferid is updated successfully.` };
    } else {
      return {
        status: 201,
        msg: `User refferId not found or update failed`,
      };
    }
  } catch (error) {
    console.log("Failed to update refferId");
    return {
      status: 500,
      msg: `Please try again later due to network overload.`,
    };
  }
};

export default {
  find,
  findOne,
  create,
  updateOne,
  findOnereferralBy,
  updateOneReferralBy,
};
