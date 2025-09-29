import { getKeyPairFromPrivatekey } from ".";
import { ConfigService } from "../service/config";
import {
  PublicKey,
  Connection,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { decryptPrivateKey } from ".";

const cron = require("node-cron");

const connection = new Connection(ConfigService.getConfig().solana.rpcUrl, {
  commitment: "confirmed",
  confirmTransactionInitialTimeout: 50000,
});

export const formatDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
};

export const ishash = (input: string) => {
  const hashPatterns = {
    MD5: /^[a-fA-F0-9]{32}$/,
    SHA1: /^[a-fA-F0-9]{40}$/,
    SHA256: /^[a-fA-F0-9]{64}$/,
    SHA512: /^[a-fA-F0-9]{128}$/,
  };

  for (const [hashType, regex] of Object.entries(hashPatterns)) {
    if (regex.test(input)) {
      return true;
    }
  }

  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  if (base58Regex.test(input)) {
    return true;
  }

  const base64Regex = /^[A-Za-z0-9+/=]+$/;
  if (base64Regex.test(input)) {
    return true;
  }

  return false;
};
export const ellipsis = (address: string, start: number = 4) => {
  if (!address || address === null) return "";
  const len = start + 7;
  return address.length > len
    ? `${address?.slice(0, start)}...${address?.slice(-6)}`
    : address;
};

export const sendSol = async (
  amount: number,
  toAddress: string,
  privatekey: string
) => {
  try {
    const Pv = (await decryptPrivateKey(privatekey)) as string;
    const sender = (await getKeyPairFromPrivatekey(Pv)) as any;
    const to = new PublicKey(toAddress);

    const { lastValidBlockHeight, blockhash } =
      await connection.getLatestBlockhash({
        commitment: "finalized",
      });
    let newNonceTx = new Transaction();

    newNonceTx.feePayer = sender.publicKey;
    newNonceTx.recentBlockhash = blockhash;
    newNonceTx.lastValidBlockHeight = lastValidBlockHeight;
    newNonceTx.add(
      SystemProgram.transfer({
        fromPubkey: sender.publicKey,
        toPubkey: to,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const tx = await sendAndConfirmTransaction(connection, newNonceTx, [
      sender,
    ]);
    return { txId: tx, msg: `` };
  } catch (err: any) {
    return {
      txId: null,
      msg: `Please try again later due to network overload`,
    };
  }
};
