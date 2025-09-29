const { Referral } = require("../db/model");

const findOne = async (data: any) => {
  try {
    const result = await Referral.findOne(data);
    return result;
  } catch (error) {
    throw new Error("Failed to find adminDepositSettingInfo");
  }
};
const find = async () => {
  try {
    const result = await Referral.find();
    return result;
  } catch (error) {
    throw new Error("Failed to find adminDepositSettingInfo");
  }
};
const create = async (data: any) => {
  try {
    const _result = await Referral.findOne({
      admin: data.admin,
      period: data.period,
    });
    if (_result) {
      return {
        status: 201,
        msg: `Fee is set already.`,
      };
    } else {
      const newFeeData = new Referral(data);
      const result = await newFeeData.save();
      if (result) {
        return { status: 200, msg: `Fee months is set.` };
      } else {
        return {
          status: 201,
          msg: `Please try again later due to network overload`,
        };
      }
    }
  } catch (error) {
    console.log("Failed to create feedata");
    return {
      status: 500,
      msg: `Please try again later due to network overload.`,
    };
  }
};

const deleteOne = async (id: string) => {
  try {
    console.log("id: ", id);
    const result = await Referral.findByIdAndDelete(id);
    if (result) {
      return { status: 200, msg: `Fee is deleted.` };
    } else {
      return {
        status: 201,
        msg: `Please try again later due to network overload`,
      };
    }
  } catch (error) {
    console.log("Failed to delete feedata");
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
  deleteOne,
};
