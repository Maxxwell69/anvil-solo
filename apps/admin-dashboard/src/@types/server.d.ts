declare interface ServerResponse {
  result?: any;
  error?: number;
}

declare interface ResultType {
  err: string;
  result: string;
}

declare interface Window {
  ethereum: any;
  solana: any;
  phantom: any;
}

declare interface StoreType {
  chartWidth: number;
  updated: number;
  loading?: boolean;
  email: string;
  name: string;
  token: string;
  logined: boolean;
  lasttime: number;
}
declare interface useStoreTypes extends StoreType {
  update(payload: { [key: string]: string | number | boolean });
  call(url: string, params?: any): Promise<ServerResponse | null>;
}

declare module "*.png";
declare module "*.svg";
declare module "*.jpeg";
declare module "*.jpg";

declare interface ReducerObject {
  type: string;
  payload: any;
}

declare interface TokenInterface {
  userId: number;
  name: string;
  symbol: string;
  pairInfo: any;
  decimal: number;
  publicKey: string;
  lastUpdated: any;
}

declare interface SwapInterface {
  baseToken: string;
  baseSymbol: string;
  baseName: string;
  baseBalance: number;
  quoteToken: string;
  quoteName: string;
  quoteSymbol: string;
  quoteBalance: number;
  pairAddress: string;
  baseDecimal: number;
  quoteDecimal: number;
  amount: number;
  amountToken: number;
  userId: number;
  buy: number;
  sell: number;
  buyProgress: number;
  sellProgress: number;
  flag: boolean;
  isBalance: boolean;
  loopTime: number;
  priorityFee: string;
  active: boolean;
  dir: string;
}

declare interface BalanceInterface {
  name: string;
  symbol: string;
  decimal: number;
  address: string;
  balance: number;
}

declare interface SplTokenInfo {
  address: string;
  decimals: number;
  amount: number;
}

declare interface FeeInterface {
  sender: number;
  receiver: string;
  txId: string;
  amount: number;
  period: number;
  active: boolean;
  description: string;
  start_date: string;
  end_date: string;
  lastUpdated: any;
}

declare interface HistoryInterface {
  sender: string;
  fromTokenAddress: string;
  fromTokenName: string;
  fromTokenDecimals: number;
  fromAmount: number;
  toTokenAddress: string;
  toTokenName: string;
  toTokenSymbol: string;
  toTokenDecimals: number;
  receiver: string;
  feeUsd: number;
  tradeUsdAmount: number;
  feeNativeToken: number;
  hash: string;
  swapedAmount: number;
  resultHash: string;
  status: number;
  created: number;
  updated: number;
}

declare interface AlertInterface {
  address: string;
  title: string;
  content: string;
  read: boolean;
  deleted: boolean;
  created: number;
}

declare interface UserInterface {
  email: string;
  name: string;
  created: number;
  tokens: number;
}

declare interface TransactionQueueInterface {
  fromTokenAddress: string;
  toTokenAddress: string;
  fromTokenSymbol: string;
  toTokenSymbol: string;
  inAmount: string;
  depositedAmount: string;
  toAddress: string;
  sender: string;
  orderId: string;
  hash: string;
  status: number;
  updated: number;
  created: number;
}

declare interface HashHistoryInterface {
  hash: string;
  usd: number;
  created: number;
}

declare interface TokensInterface {
  pairaddress: string;
  tokenaddress: string;
  basetokenname: string;
  basetokensymbol: string;
  basetokenaddress: string;
  quotetokenname: string;
  quotetokensymbol: string;
  quotetokenaddress: string;
  img: string;
  price: number;
  priceChain: number;
  liquidity: number;
  marketcap: number;
  pricechange5m: number;
  pricechange1h: number;
  pricechange6h: number;
  pricechange24h: number;
  pricechange7d: number;
  paircreated: number;
  volume5m: number;
  sells5m: number;
  buys5m: number;
  sellVolume5m: number;
  buyVolume5m: number;
  variation5m: number;
  variationChain5m: number;
  price1h: number;
  priceChain1h: number;
  volume1h: number;
  sells1h: number;
  buys1h: number;
  sellVolume1h: number;
  buyVolume1h: number;
  variation1h: number;
  variationChain1h: number;
  price6h: number;
  priceChain6h: number;
  volume6h: number;
  sells6h: number;
  buys6h: number;
  sellVolume6h: number;
  buyVolume6h: number;
  variation6h: number;
  variationChain6h: number;
  price24h: number;
  priceChain24h: number;
  volume24h: number;
  sells24h: number;
  buys24h: number;
  sellVolume24h: number;
  buyVolume24h: number;
  variation24h: number;
  variationChain24h: number;
  totalSupply: number;
  holders: number;
  transactions: number;
  pooledMain: number;
  pooledSide: number;
  creator: string;
  audited: boolean;
  telegram: string;
  twitter: string;
  discord: string;
  scanurl: string;
  coingecko: string;
  website: string;
  email: string;
  youtube: string;
  medium: string;
  github: string;
  favs: number;
  ads: string;
  fdv: number;
  boost: number;
  status: number;
  created: number;
  updated: number;
}

declare interface WatchlistInterface {
  email: string;
  pairaddr: string;
  updated: number;
  created: number;
}

declare interface TokenTradesInterface {
  token: string;
  address: string;
  datetime: number;
  type: string;
  price: number;
  totalusd: number;
  sol: number;
  tokenamount: number;
  tx: string;
  maker: string;
  created: number;
}

declare interface TopTradersInterface {
  token: string;
  address: string;
  maker: string;
  total: number;
  bought: number;
  sold: number;
  balance: number;
  pnl: number;
  updated: number;
}

declare interface HoldersInterface {
  token: string;
  holder: string;
  rate: number;
  amount: number;
  usdamount: number;
  txns: number;
}

declare interface LiquidityProvidersInterface {
  token: string;
  provider: string;
  rate: number;
  amount: number;
  usdamount: number;
  txns: number;
}
