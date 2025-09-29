import mongoose from "mongoose";
const Schema = mongoose.Schema;

const AdminSettingSchema = new Schema({
  userId: { type: Number, required: true },
  fee: { type: Number, required: true },
  miniAmount: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

const AdminListSchema = new Schema({
  userId: { type: Number, required: true },
  userName: { type: String, required: true },
});

const FeeSettingSchema = new Schema({
  admin: { type: Number, required: true },
  amount: { type: Number, required: true },
  period: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

const UserListSchema = new Schema({
  userId: { type: Number, required: true },
  userName: { type: String, required: true },
  permission: { type: Boolean, default: false },
  fee: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

const SwapSchema = new Schema({
  baseToken: { type: String, required: true },
  baseSymbol: { type: String, required: true },
  baseName: { type: String, required: true },
  quoteToken: { type: String, required: true },
  quoteName: { type: String, required: true },
  quoteSymbol: { type: String, required: true },
  pairAddress: { type: String, required: true },
  baseDecimal: { type: Number, required: true },
  quoteDecimal: { type: Number, required: true },
  amount: { type: Number, required: true },
  amountToken: { type: Number, required: true },
  userId: { type: Number, required: true },
  buy: { type: Number, required: true },
  sell: { type: Number, required: true },
  buyProgress: { type: Number, default: 0 },
  sellProgress: { type: Number, default: 0 },
  flag: { type: Boolean, default: true },
  isBalance: { type: Boolean, default: true },
  loopTime: { type: Number, required: true },
  priorityFee: { type: String, required: true },
  fee: { type: Number, requried: true },
  active: { type: Boolean, default: true },
  dir: { type: String, required: true },
  wallet_id: { type: String, required: true },
  feeValue: { type: Number, default: 0 },
});

const UserWalletSchema = new Schema({
  userId: { type: Number, required: true },
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true },
  tokenId: { type: String, default: "" },
  active: { type: Boolean, default: false },
  lastUpdated: { type: Date, default: Date.now },
});

const TokenSettingSchema = new Schema({
  userId: { type: Number, required: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  pairInfo: { type: Array, required: true },
  decimal: { type: Number, required: true },
  publicKey: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

const FeeColletSchema = new Schema({
  sender: { type: Number, required: true },
  receiver: { type: String, required: true },
  txId: { type: String },
  amount: { type: Number, required: true },
  period: { type: Number, required: true },
  active: { type: Boolean, required: true },
  description: { type: String, required: true },
  start_date: { type: String, required: true },
  end_date: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export const Swap = mongoose.model("swaps", SwapSchema);
export const Tokens = mongoose.model("tokens", TokenSettingSchema);
export const Wallet = mongoose.model("wallets", UserWalletSchema);
export const AdminSetting = mongoose.model("adminSettings", AdminSettingSchema);
export const AdminList = mongoose.model("adminLists", AdminListSchema);
export const UserList = mongoose.model("userLists", UserListSchema);
export const FeeData = mongoose.model("feeSettingDatas", FeeSettingSchema);
export const FeeCollectData = mongoose.model("feeCollects", FeeColletSchema);

export const getMaxFromCollection = async (
  collection: mongoose.Model<any>,
  field = "_id"
) => {
  const v = await collection.countDocuments({});
  return (v as number) || 0;
};
