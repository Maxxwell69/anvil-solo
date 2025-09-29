const { Wallet } = require("../db/model");

const findOne = async (props: any) => {
  try {
    const { filter } = props;
    const result = await Wallet.find(filter);
    return result;
  } catch (error) {
    throw new Error("Failed to find walletInfo");
  }
};

const find = async () => {
  try {
    const result = await Wallet.find();
    return result;
  } catch (error) {
    throw new Error("Failed to find walletInfo");
  }
};

const create = async (
  userId: number,
  publicKey: string,
  privateKey: string | any
) => {
  try {
    const newWallet = new Wallet({
      userId,
      publicKey,
      privateKey,
    });

    const savedWallet = await newWallet.save();
    if (savedWallet) {
      return { status: true };
    } else {
      return { status: false };
    }
  } catch (error) {
    return { status: false, result: null };
  }
};

const deleteOne = async (props: any) => {
  try {
    const { filter } = props;
    const result = await Wallet.deleteOne(filter);
    return result;
  } catch (error) {
    throw new Error("Failed to delete walletInfo");
  }
};
const updateOne = async (props: any) => {
  try {
    const result = await Wallet.updateOne(props);
  } catch (error) {
    throw new Error("Failed to update swapInfo");
  }
};
const update = async (props: any) => {
  try {
    const result = await Wallet.findOneAndUpdate(
      { tokenId: props.tokenId },
      { $set: props },
      { new: true }
    );
  } catch (error) {
    throw new Error("Failed to update swapInfo");
  }
};
export default {
  findOne,
  create,
  deleteOne,
  find,
  updateOne,
  update,
};
