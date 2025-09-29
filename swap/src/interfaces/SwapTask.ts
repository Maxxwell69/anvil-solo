export enum SwapTaskType {
  BUY = 'BUY',
  SELL = 'SELL',
  CHECK_BALANCE = 'CHECK_BALANCE'
}

export enum SwapStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  WAITING_FOR_BALANCE = 'WAITING_FOR_BALANCE'
}

export interface SwapData {
  _id: string;
  dexId: string;
  baseToken: string;
  baseSymbol: string;
  baseName: string;
  quoteToken: string;
  quoteName: string;
  quoteSymbol: string;
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
  fee: number;
  active: boolean;
  dir: 'one' | 'two';
  wallet_id: string;
  feeValue: number;
  walletPrivateKeys: string[];
  swapDetails?: any[];
  status?: SwapStatus;
}

export interface SwapTask {
  id: string;
  type: SwapTaskType;
  data: SwapData;
  timestamp: string;
  retryCount?: number;
}

export interface SwapResult {
  taskId: string;
  success: boolean;
  txId?: string;
  error?: string;
  timestamp: string;
  updates: Partial<SwapData>;
}
