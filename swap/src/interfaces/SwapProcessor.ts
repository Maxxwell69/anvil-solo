/**
 * Represents the data structure for a swap operation
 */
export interface SwapData {
  userId: string;
  _id: string;
  baseToken: string;
  quoteToken: string;
  baseSymbol: string;
  quoteSymbol: string;
  baseDecimal: number;
  quoteDecimal: number;
  amount: number;
  amountToken: number;
  swapDetails: Array<{
    publicKey: string;
    privateKey: string;
  }>;
  buy: number;
  sell: number;
  buyProgress: number;
  sellProgress: number;
  flag: boolean;
  isBalance: boolean;
  priorityFee: string;
  dir: string;
  fee: number;
  feeValue: number;
  dexId: string;
  pairAddress: string;
  baseName: string;
  quoteName: string;
  walletPrivateKeys?: string[];
}

/**
 * Result of a swap operation
 */
export interface SwapResult {
  success: boolean;
  txId?: string;
  error?: Error;
}

/**
 * Interface for processing swap operations
 */
export interface SwapProcessor {
  /**
   * Process a swap operation
   * @param data The swap data to process
   * @returns The result of the swap operation
   */
  processSwap(data: SwapData): Promise<SwapResult>;
}
