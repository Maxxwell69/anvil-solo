import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import { ConfigService } from "../service/config";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
const connection = new Connection(ConfigService.getConfig().solana.rpcUrl);

export const subBalance = async (text: number) => {
  const r = Number(Math.floor(text * 1e6) / 1e6);
  return r;
};

export const checkSolBalance = async (addr: string) => {
  try {
    const publickey = new PublicKey(addr);
    const balance = (await connection.getBalance(publickey)) / 1e9;
   
    if (balance >= 0) {
      const solBalance = await subBalance(balance);
      return solBalance;
    } else {
      return await retryCheckSolBalance(addr);
    }
  } catch (error) {
    console.log("checkSolBalanceError: ", error);
    return await retryCheckSolBalance(addr);
  }
};

const retryCheckSolBalance = async (addr: string) => {
  try {
    const publickey = new PublicKey(addr);
    const balance = (await connection.getBalance(publickey)) / 1e9;
    if (balance >= 0) {
      const solBalance = await subBalance(balance);
      return solBalance;
    } else {
      return null;
    }
  } catch (error) {
    console.log("retryCheckSolBalanceError: ", error);
    return null;
  }
};

/**
 * Determines the token program ID for a given mint
 */
const getTokenProgramId = async (mintAddress: string): Promise<PublicKey> => {
  try {
    const mintPublicKey = new PublicKey(mintAddress);
    const mintAccount = await connection.getAccountInfo(mintPublicKey);
    
    if (mintAccount && mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID)) {
      return TOKEN_2022_PROGRAM_ID;
    }
    
    return TOKEN_PROGRAM_ID;
  } catch (error) {
    console.log("getTokenProgramIdError: ", error);
    return TOKEN_PROGRAM_ID;
  }
};

const getSPLTokenAccount = async (
  tokenMintAddress: string,
  walletPublicKey: string
) => {
  try {
    const mintPublicKey = new PublicKey(tokenMintAddress);
    const walletPubKey = new PublicKey(walletPublicKey);
    
    // First try with TOKEN_PROGRAM_ID
    try {
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPublicKey,
        walletPubKey,
        false,
        TOKEN_PROGRAM_ID
      );
      
      // Check if this account exists
      const accountInfo = await connection.getAccountInfo(associatedTokenAddress);
      if (accountInfo) {
        return associatedTokenAddress;
      }
    } catch (error) {
      // Continue to try TOKEN_2022_PROGRAM_ID
    }
    
    // Try with TOKEN_2022_PROGRAM_ID
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintPublicKey,
      walletPubKey,
      false,
      TOKEN_2022_PROGRAM_ID
    );
    
    return associatedTokenAddress;
  } catch (error) {
    console.log("getSPLTokenAccountError: ", error);
    return null;
  }
};

export const checkSplTokenBalance = async (
  tokenMintAddress: string,
  walletPublicKey: string
) => {
  try {
    const tokenAccount = await getSPLTokenAccount(
      tokenMintAddress,
      walletPublicKey
    );
    
    if (!tokenAccount) {
      return 0;
    }

    const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);
    if (tokenBalance?.value.uiAmount !== null && tokenBalance?.value.uiAmount !== undefined) {
      const splTokenBalance = await subBalance(tokenBalance?.value.uiAmount);
      return Number(splTokenBalance);
    } else {
      return await retrycheckSplTokenBalance(tokenMintAddress, walletPublicKey);
    }
  } catch (error) {
    console.log("checkSplTokenBalanceError: ", error);
    return await retrycheckSplTokenBalance(tokenMintAddress, walletPublicKey);
  }
};

const retrycheckSplTokenBalance = async (
  tokenMintAddress: string,
  walletPublicKey: string
) => {
  try {
    const tokenAccount = await getSPLTokenAccount(
      tokenMintAddress,
      walletPublicKey
    );

    if (!tokenAccount) {
      return 0;
    }

    const tokenBalance = await connection.getTokenAccountBalance(tokenAccount);

    if (tokenBalance?.value.uiAmount !== null && tokenBalance?.value.uiAmount !== undefined) {
      const splTokenBalance = await subBalance(tokenBalance?.value.uiAmount);
      return Number(splTokenBalance);
    } else {
      return 0;
    }
  } catch (error) {
    console.log("retrycheckSplTokenBalanceError: ", error);
    return 0;
  }
};
