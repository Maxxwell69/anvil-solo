import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import crypto from "crypto";
import { ConfigService } from "../service/config";
// Load configuration
const config = ConfigService.load();

const ALGORITHM = "aes-256-gcm";
const ENCRYPTION_KEY = ConfigService.getConfig().encryption_salt;
const IV_LENGTH = 12;

const connection = new Connection(ConfigService.getConfig().solana.rpcUrl);

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

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPublicKey,
      {
        programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"),
      }
    );

    const balances = tokenAccounts.value.map((tokenAccount) => {
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
