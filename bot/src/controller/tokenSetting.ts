import { publicKey } from "@raydium-io/raydium-sdk-v2";

const { Tokens } = require("../db/model");
const { Swap } = require("../db/model");

const findOne = async (props: any) => {
  try {
    const { filter } = props;
    const result = await Tokens.find(filter);
    return result;
  } catch (error) {
    throw new Error("Failed to find tokenSettingInfo");
  }
};

const find = async () => {
  try {
    const result = await Tokens.find();
    return result;
  } catch (error) {
    throw new Error("Failed to find tokenSettingInfo");
  }
};

const create = async (tokenInfo: any) => {
  try {
    const result = Tokens.find({
      symbol: tokenInfo.symbol,
      publicKey: tokenInfo.publicKey,
    });
    if (result.length > 0) {
      return { status: false, msg: `Token is set already.` };
    }
    const newToken = new Tokens(tokenInfo);
    const newTokenSave = await newToken.save();
    if (newTokenSave) {
      return { status: true, msg: `Token is set` };
    } else {
      return {
        status: false,
        msg: `Token setting is failed. please try again.`,
      };
    }
  } catch (error) {
    return { status: false, msg: `Token setting is failed. please try again.` };
  }
};

const deleteOne = async (props: any) => {
  const { filter } = props;
  try {
    const result = await Tokens.deleteOne(filter);
    if (result) {
      return { status: 200 };
    } else {
      return { status: 202 };
    }
  } catch (error) {
    throw new Error("Failed to delete tokenSettingInfo");
  }
};

export default {
  findOne,
  find,
  create,
  deleteOne,
};
