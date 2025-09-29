import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, NATIVE_MINT, TOKEN_2022_PROGRAM_ID, getTokenMetadata } from "@solana/spl-token";
import { ConfigService } from "./config";

const connection = new Connection(ConfigService.getConfig().solana.rpcUrl);

const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

export interface TokenBalance {
  mint: string;
  address?: string;
  symbol: string;
  amount: number;
  uiAmount: number;
  decimals: number;
  isNative?: boolean;
  tokenProgram?: string
}

/**
 * Fetches SOL balance for a given public key.
 * @param walletPublicKey The public key of the wallet.
 * @returns A Promise resolving to the SOL balance as TokenBalance.
 */
export async function getSolBalance(walletPublicKey: PublicKey): Promise<TokenBalance> {
  try {
    const balanceLamports = await connection.getBalance(walletPublicKey);
    return {
      mint: "SOL",
      symbol: "SOL",
      amount: balanceLamports,
      uiAmount: balanceLamports / LAMPORTS_PER_SOL,
      decimals: 9,
      isNative: true,
    };
  } catch (error) {
    console.error(`Error fetching SOL balance for ${walletPublicKey.toBase58()}:`, error);
    throw error;
  }
}

/**
 * Fetches SPL token balances for a given public key.
 * @param walletPublicKey The public key of the wallet.
 * @returns A Promise resolving to an array of TokenBalance for SPL tokens.
 */
export async function getSplTokenBalances(walletPublicKey: PublicKey): Promise<TokenBalance[]> {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { programId: TOKEN_PROGRAM_ID }
    );

    const tokenAccounts2022 = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      { programId: TOKEN_2022_PROGRAM_ID }
    );

    const tokenAccountsResp = [...tokenAccounts.value]
      .map(async (accountInfo): Promise<TokenBalance | null> => {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const amount = typeof parsedInfo.tokenAmount.amount === 'string'
          ? parseInt(parsedInfo.tokenAmount.amount, 10)
          : parsedInfo.tokenAmount.amount;
        const decimals = parsedInfo.tokenAmount.decimals;

        if (amount > 0) {
          let symbol = parsedInfo.mint; // Default to mint if symbol lookup fails
          try {
            // Ensure mint is a valid PublicKey string before creating PublicKey
            if (parsedInfo.mint && typeof parsedInfo.mint === 'string') {
              symbol = await getSymbol(new PublicKey(parsedInfo.mint), TOKEN_PROGRAM_ID);
            } else {
              console.warn(`Invalid mint address found: ${parsedInfo.mint} for token account ${accountInfo.pubkey.toBase58()}`);
            }
          } catch (symbolError) {
            console.warn(`Could not fetch symbol for mint ${parsedInfo.mint}:`, symbolError);
            // Fallback to mint address as symbol if getSymbol fails
          }

          return {
            mint: parsedInfo.mint,
            address: accountInfo.pubkey.toBase58(),
            symbol: symbol,
            amount: amount,
            uiAmount: amount / Math.pow(10, decimals),
            decimals: decimals,
            isNative: false,
            tokenProgram: TOKEN_PROGRAM_ID.toString()
          };
        }
        return null;
      });

    const tokenAccounts2022Resp = [...tokenAccounts2022.value]
      .map(async (accountInfo): Promise<TokenBalance | null> => {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const amount = typeof parsedInfo.tokenAmount.amount === 'string'
          ? parseInt(parsedInfo.tokenAmount.amount, 10)
          : parsedInfo.tokenAmount.amount;
        const decimals = parsedInfo.tokenAmount.decimals;

        if (amount > 0) {
          let symbol = parsedInfo.mint; // Default to mint if symbol lookup fails
          try {
            // Ensure mint is a valid PublicKey string before creating PublicKey
            if (parsedInfo.mint && typeof parsedInfo.mint === 'string') {
              symbol = await getSymbol(new PublicKey(parsedInfo.mint), TOKEN_2022_PROGRAM_ID);
            } else {
              console.warn(`Invalid mint address found: ${parsedInfo.mint} for token account ${accountInfo.pubkey.toBase58()}`);
            }
          } catch (symbolError) {
            console.warn(`Could not fetch symbol for mint ${parsedInfo.mint}:`, symbolError);
            // Fallback to mint address as symbol if getSymbol fails
          }

          return {
            mint: parsedInfo.mint,
            address: accountInfo.pubkey.toBase58(),
            symbol: symbol,
            amount: amount,
            uiAmount: amount / Math.pow(10, decimals),
            decimals: decimals,
            isNative: false,
            tokenProgram: TOKEN_2022_PROGRAM_ID.toString()
          };
        }
        return null;
      });

    const balancePromises = [...tokenAccountsResp, ...tokenAccounts2022Resp];

    // Await all promises and then filter out nulls
    const resolvedBalances = await Promise.all(balancePromises);
    return resolvedBalances.filter((balance): balance is TokenBalance => balance !== null);
  } catch (error) {
    console.error(`Error fetching SPL token balances for ${walletPublicKey.toBase58()}:`, error);
    throw error;
  }
}

/**
 * Fetches all token balances (SOL and SPL) for a given wallet public key string.
 * @param walletPublicKeyString The public key string of the wallet.
 * @returns A Promise resolving to an array of all TokenBalance.
 */
export async function getAllTokenBalances(walletPublicKeyString: string): Promise<TokenBalance[]> {
  try {
    const walletPublicKey = new PublicKey(walletPublicKeyString);
    const solBalancePromise = getSolBalance(walletPublicKey);
    const splBalancesPromise = getSplTokenBalances(walletPublicKey);

    const [solBalance, splBalances] = await Promise.all([
      solBalancePromise,
      splBalancesPromise,
    ]);

    const allBalances: TokenBalance[] = [solBalance, ...splBalances];
    return allBalances;
  } catch (error) {
    console.error(`Error fetching all token balances for ${walletPublicKeyString}:`, error);
    throw error;
  }
}


async function getSymbol(mintPublicKey: PublicKey, tokenProgramId: PublicKey): Promise<string | undefined> {
  try {
    if (TOKEN_2022_PROGRAM_ID.toString() == tokenProgramId.toString()) {
      const metadata = await getTokenMetadata(connection, mintPublicKey, "confirmed", tokenProgramId);

      return metadata?.symbol;
    } else {
      const encoder = new TextEncoder();

      const [metadataAddress] = PublicKey.findProgramAddressSync(
        [
          encoder.encode("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          mintPublicKey.toBuffer(),
        ],
        METADATA_PROGRAM_ID,
      );

      const accountInfo = await connection.getAccountInfo(metadataAddress);

      if (!accountInfo?.data) {
        throw new Error("Token metadata not found on-chain");
      }

      const symbol = accountInfo.data.slice(105, 115).toString().replace(/\0/g, "").trim();

      return symbol;
    }
  } catch (error) {
    console.error(`Error fetching symbol for mint ${mintPublicKey.toBase58()}:`, error);
    throw error;
  }
}
