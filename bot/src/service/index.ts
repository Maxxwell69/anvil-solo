import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import crypto from "crypto";
import { ConfigService } from "../service/config";
import {
  Transaction,
  sendAndConfirmTransaction,
  clusterApiUrl,
  SystemProgram,
  ComputeBudgetProgram,
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import axios from "axios";
import Decimal from "decimal.js";
import { NATIVE_MINT, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccount, createAssociatedTokenAccountInstruction, createSyncNativeInstruction } from "@solana/spl-token";

import { API_URLS, publicKey } from "@raydium-io/raydium-sdk-v2";
//import { Program ,Wallet,AnchorProvider,web3} from "@coral-xyz/anchor";
import { checkSolBalance, checkSplTokenBalance } from "./getBalance";


const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = ConfigService.getConfig().encryption_salt;
const IV_LENGTH = 12;

const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");

export const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const getKeyPairFromPrivatekey = async (PRIVATE_KEY: any) => {
  try {
    const keypair = Keypair.fromSecretKey(Buffer.from(PRIVATE_KEY, "base64"));
    return keypair;
  } catch (error) {
    console.log("getKeyPairFromPrivatekeyError: ", error);
  }
};

/**
 * Encrypts a private key before storing it in the database.
 * @param privateKey The private key to encrypt.
 * @returns The encrypted private key.
 */
export const encryptPrivateKey = (privateKey: string) => {
  try {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
      throw new Error("Invalid encryption key length. Must be 32 characters.");
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    const encrypted = Buffer.concat([
      cipher.update(privateKey, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString("base64");
  } catch (error) {
    console.log("encryptPrivateKeyError: ", error);
  }
};

/**
 * Decrypts an encrypted private key stored in the database.
 * @param encryptedPrivateKey The encrypted private key to decrypt.
 * @returns The decrypted private key.
 */
export const decryptPrivateKey = (encryptedPrivateKey: string) => {
  try {
    if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
      throw new Error("Invalid encryption key length. Must be 32 characters.");
    }
    const encryptedBuffer = Buffer.from(encryptedPrivateKey, "base64");
    const iv = encryptedBuffer.slice(0, IV_LENGTH);
    const tag = encryptedBuffer.slice(IV_LENGTH, IV_LENGTH + 16);
    const encryptedText = encryptedBuffer.slice(IV_LENGTH + 16);

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY),
      iv
    );
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedText),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.log("decryptPrivateKeyError: ", error);
  }
};

export const getWalletTokenBalances = async (walletAddress: string) => {
  try {
    const walletPublicKey = new PublicKey(walletAddress);

    const tokenAccountsLegacy = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      }
    );

    const tokenAccounts2022 = await connection.getParsedTokenAccountsByOwner(

      walletPublicKey,

      { programId: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb") }

    );

    const tokenAccounts = [...tokenAccountsLegacy.value, ...tokenAccounts2022.value];

    const balances = tokenAccounts.map((tokenAccount) => {
      const accountData = tokenAccount.account.data.parsed.info;
      const address = accountData.mint as string;
      const decimals = accountData.tokenAmount.decimals as number;
      const amount = accountData.tokenAmount.uiAmount as number;

      return {
        address,
        decimals,
        amount,
      };
    });
    return balances;
  } catch (error) {
    console.error("Error fetching token balances:", error);
  }
};




export async function waitForTransactionConfirmation(
  connection: Connection,
  signature: string,
  timeout = 60000
): Promise<boolean> {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const status = await connection.getSignatureStatus(signature);

    if (status.value?.err) {
      throw new Error(`Transaction failed: ${status.value.err.toString()}`);
    }

    if (
      status.value?.confirmationStatus === "confirmed" ||
      status.value?.confirmationStatus === "finalized"
    ) {
      return true;
    }

    await delay(1000);
  }

  throw new Error("Transaction confirmation timeout");
}

const BOT_PRIVATE_KEY = "38MO0Gtt0+dxofl0IpVph9b6fCu032to+HFToWjqFWr8n+W/eXye9WiFJ0QCO52D+BBTA0C4ASlJpdfA0Uzsfw=="; // Replace with actual bot private key

export async function checkAndDistributeSOL(walletPrivateKeys: string[], ownerPrivateKey: string) {
  try {
    const MIN_SOL_BALANCE = 0.009;
    const decryptedOwnerKey = await decryptPrivateKey(ownerPrivateKey);
    if (!decryptedOwnerKey) {
      throw new Error('Failed to decrypt owner private key');
    }
    const owner = Keypair.fromSecretKey(Buffer.from(decryptedOwnerKey, "base64"));

    for (const walletKey of walletPrivateKeys) {
      const decryptedKey = await decryptPrivateKey(walletKey);
      if (!decryptedKey) {
        console.error(`Failed to decrypt wallet key: ${walletKey}`);
        continue;
      }
      const wallet = Keypair.fromSecretKey(Buffer.from(decryptedKey, "base64"));
      const balance = await checkSolBalance(wallet.publicKey.toString());

      if (balance === null || balance === undefined) {
        console.error(`Failed to get balance for wallet: ${wallet.publicKey.toString()}`);
        continue;
      }

      if (balance < MIN_SOL_BALANCE) {
        const transferAmount = MIN_SOL_BALANCE - balance;
        const transaction = new Transaction();
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: owner.publicKey,
            toPubkey: wallet.publicKey,
            lamports: Math.floor(transferAmount * LAMPORTS_PER_SOL)
          })
        );

        const signature = await sendAndConfirmTransaction(
          connection,
          transaction,
          [owner],
          { commitment: "confirmed" }
        );

        await waitForTransactionConfirmation(connection, signature);
        console.log(`Transferred ${transferAmount} SOL to ${wallet.publicKey.toString()}`);
      }
    }
  } catch (error) {
    console.error("Error in checkAndDistributeSOL:", error);
    throw error;
  }
}