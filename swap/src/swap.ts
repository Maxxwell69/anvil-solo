import {
    Transaction,
    sendAndConfirmTransaction,
    sendAndConfirmRawTransaction,
    Keypair,
    Connection,
    PublicKey,
    SystemProgram,
    ComputeBudgetProgram,
    LAMPORTS_PER_SOL
} from "@solana/web3.js";
import axios from "axios";
import Decimal from "decimal.js";
import {
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    createAssociatedTokenAccount,
    createAssociatedTokenAccountInstruction,
    createSyncNativeInstruction
} from "@solana/spl-token";
import { decryptPrivateKey, delay } from "./service/index";
import { API_URLS, closeAccountInstruction, publicKey } from "@raydium-io/raydium-sdk-v2";
import { Program, Wallet, AnchorProvider, web3 } from "@coral-xyz/anchor";
import idl from "./pumpswap";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { ConfigService } from "./service/config";
import feeController from "./controller/fee";
import { fetchTokenAccountData } from "./token-config";
import { BN } from "bn.js";
import { checkSolBalance, checkSplTokenBalance } from "./service/getBalance";
import walletController from "./controller/wallet";
import referralByController from "./controller/ReferralBy";
import referralController from "./controller/referral";
import { Logger } from "./interfaces/Logger";
const JITO_API_URL = "https://mainnet.block-engine.jito.wtf/api/v1/transactions";

const connection = new Connection(ConfigService.getConfig().solana.rpcUrl, {
    commitment: "confirmed",
    confirmTransactionInitialTimeout: 50000,
});
export let walletPublic = "" as string;

interface SwapCompute {
    id: string;
    success: true;
    version: "V0" | "V1";
    openTime?: undefined;
    msg: undefined;
    data: {
        swapType: "BaseIn" | "BaseOut";
        inputMint: string;
        inputAmount: string;
        outputMint: string;
        outputAmount: string;
        otherAmountThreshold: string;
        slippageBps: number;
        priceImpactPct: number;
        routePlan: {
            poolId: string;
            inputMint: string;
            outputMint: string;
            feeMint: string;
            feeRate: number;
            feeAmount: string;
        }[];
    };
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const rateLimiter = {
    lastCallTime: 0,
    minInterval: 500,

    async throttle() {
        const now = Date.now();
        const timeSinceLastCall = now - this.lastCallTime;

        if (timeSinceLastCall < this.minInterval) {
            await delay(this.minInterval - timeSinceLastCall);
        }

        this.lastCallTime = Date.now();
    },
};


async function waitForTransactionConfirmation(
    connection: Connection,
    signature: string,
    timeout = 120000
): Promise<boolean> {
    const start = Date.now();

    while (Date.now() - start < timeout) {
        const status = await connection.getSignatureStatus(signature);

        if (status.value?.err) {
            console.log(status.value.err);
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

/**
 * Determines the token program ID for a given mint by checking the token accounts
 * @param mintAddress - The mint address to check
 * @returns TOKEN_PROGRAM_ID or TOKEN_2022_PROGRAM_ID
 */
async function getTokenProgramId(mintAddress: string): Promise<PublicKey> {
    try {
        // Fetch mint account info to determine the program ID
        const mintPubkey = new PublicKey(mintAddress);
        const mintInfo = await connection.getAccountInfo(mintPubkey);

        if (mintInfo && mintInfo.owner) {
            if (mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
                return TOKEN_2022_PROGRAM_ID;
            }
            if (mintInfo.owner.equals(TOKEN_PROGRAM_ID)) {
                return TOKEN_PROGRAM_ID;
            }
        }
    } catch (error) {
        console.error(`Error fetching mint info for ${mintAddress}:`, error);
    }

    // Default to TOKEN_PROGRAM_ID if not found or error occurs
    return TOKEN_PROGRAM_ID;
}

async function batchDistributeSOL(
    walletPrivateKeys: string[],
    ownerPrivateKey: string,
) {
    try {
        const MIN_SOL_BALANCE = 0.002;
        const BUFFER = 0.001;

        const decryptedOwnerKey = decryptPrivateKey(ownerPrivateKey);
        if (!decryptedOwnerKey) throw new Error("Failed to decrypt owner key");

        const owner = Keypair.fromSecretKey(
            Buffer.from(decryptedOwnerKey, "base64")
        );
        const rentExemptBalance =
            await connection.getMinimumBalanceForRentExemption(0);
        const minRequired = Math.max(
            MIN_SOL_BALANCE,
            rentExemptBalance / LAMPORTS_PER_SOL
        );

        const transaction = new Transaction();
        let totalLamportsToSend = 0;

        for (const walletKey of walletPrivateKeys) {
            try {
                const decryptedKey = decryptPrivateKey(walletKey);
                if (!decryptedKey) {
                    console.error(`Failed to decrypt wallet key: ${walletKey}`);
                    continue;
                }

                const wallet = Keypair.fromSecretKey(
                    Buffer.from(decryptedKey, "base64")
                );
                const pubkey = wallet.publicKey;
                const balance = await checkSolBalance(pubkey.toString());

                if (balance === null || balance === undefined) {
                    console.error(
                        `Failed to get balance for wallet: ${wallet.publicKey.toString()}`
                    );
                    continue;
                }

                if (balance < minRequired) {
                    const transferAmount = Math.max(0, minRequired - balance + BUFFER);
                    const lamports = Math.floor(transferAmount * LAMPORTS_PER_SOL);
                    totalLamportsToSend += lamports;

                    transaction.add(
                        SystemProgram.transfer({
                            fromPubkey: owner.publicKey,
                            toPubkey: pubkey,
                            lamports,
                        })
                    );
                }
            } catch (error) {
                console.error(`Wallet processing failed:`, error);
                continue;
            }
        }

        if (transaction.instructions.length === 0) {
            return;
        }

        const ownerBalance = await checkSolBalance(owner.publicKey.toString());
        if (
            ownerBalance === null ||
            ownerBalance === undefined ||
            ownerBalance * LAMPORTS_PER_SOL < totalLamportsToSend
        ) {
            throw new Error(
                "Owner does not have enough SOL to complete all transfers."
            );
        }

        const latestBlockhash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = owner.publicKey;

        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [owner],
            {
                commitment: "confirmed",
                skipPreflight: false,
            }
        );

        await waitForTransactionConfirmation(connection, signature);
    } catch (err) {
        console.error("Batch transfer failed:", err);
    }
}

export const apiSwap = async (
    dexId: String,
    pairAddress: String,
    inputAmount: number,
    baseDecimal: number,
    inputMintAddress: string,
    outMintAddress: string,
    walletPrivateKey: string,
    priorityFee: string,
    walletPrivateKeys: string[],
    userId: number,
    logger: Logger,
    preferredOutputAmount?: number,
    useSwapBaseOut?: boolean,
    quoteDecimal?: number
) => {
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            await rateLimiter.throttle();
            await batchDistributeSOL(walletPrivateKeys, walletPrivateKey);

            const privateKey = (decryptPrivateKey(walletPrivateKey)) as string;
            if (!privateKey) {
                throw new Error("Failed to decrypt owner private key");
            }

            const randomIndex = Math.floor(Math.random() * walletPrivateKeys.length);
            const selectedBotKey = walletPrivateKeys[randomIndex];
            const decryptedBotKey = (decryptPrivateKey(
                selectedBotKey
            )) as string;
            if (!decryptedBotKey) {
                throw new Error("Failed to decrypt bot private key");
            }

            const botKeypair = Keypair.fromSecretKey(Buffer.from(decryptedBotKey, "base64"));

            const owner: Keypair = Keypair.fromSecretKey(
                Buffer.from(privateKey, "base64")
            );
            const inputMint = inputMintAddress;
            const outputMint = outMintAddress;
            const amount = new Decimal(inputAmount)
                .mul(Math.pow(10, baseDecimal))
                .toFixed(0);

            const slippage = ConfigService.getConfig().swap.slippage || 5;
            const slippageBps = slippage * 100;

            const referrerInfo = await referralByController.findOne({ userId });
            const feeByUserId = await feeController.findOne({ userId });
            const feeBasisPoints = feeByUserId?.fee ? new BN(feeByUserId?.fee * 10000) : new BN(ConfigService.getConfig().swap.feePercentage * 10000);


            const [isInputSol, isOutputSol] = [
                inputMint === NATIVE_MINT.toBase58(),
                outputMint === NATIVE_MINT.toBase58(),
            ];

            const { tokenAccounts } = (await fetchTokenAccountData(owner)) as any;

            // Find existing token accounts for input and output mints
            const inputTokenAccount = tokenAccounts.find(
                (a: any) => a.mint.toBase58() === inputMint
            );
            const outputTokenAccount = tokenAccounts.find(
                (a: any) => a.mint.toBase58() === outputMint
            );

            // Determine the correct token program IDs for input and output mints
            const inputTokenProgramId = await getTokenProgramId(inputMint);
            const outputTokenProgramId = await getTokenProgramId(outputMint);

            // Use existing token account addresses if they exist, otherwise derive the associated token address with correct program ID
            const inputTokenAcc = inputTokenAccount
                ? inputTokenAccount.publicKey
                : await getAssociatedTokenAddress(new PublicKey(inputMint), owner.publicKey, false, inputTokenProgramId);
            const outputTokenAcc = outputTokenAccount
                ? outputTokenAccount.publicKey
                : await getAssociatedTokenAddress(new PublicKey(outputMint), owner.publicKey, false, outputTokenProgramId);

            const hasInputTokenAcc = !!inputTokenAccount;
            const hasOutputTokenAcc = !!outputTokenAccount;

            const { data: priorityFeeData } = await axios.get<{
                id: string;
                success: boolean;
                data: { default: { vh: number; h: number; m: number } };
            }>(`${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`);

            let priorityFeeValue = 0;
            if (priorityFee === "high") {
                priorityFeeValue = priorityFeeData.data.default.vh;
            } else if (priorityFee === "medium") {
                priorityFeeValue = priorityFeeData.data.default.h;
            } else {
                priorityFeeValue = priorityFeeData.data.default.m;
            }

            let txs: Transaction[] = [];
            if (dexId === "raydium") {
                // Choose endpoint based on whether we want exact output (swap-base-out) or exact input (swap-base-in)
                const swapEndpoint = useSwapBaseOut && preferredOutputAmount
                    ? `${API_URLS.SWAP_HOST}/compute/swap-base-out?outputMint=${outputMint}&inputMint=${inputMint}&amount=${new Decimal(preferredOutputAmount).mul(Math.pow(10, quoteDecimal || 0)).toFixed(0)}&slippageBps=${slippageBps}&txVersion=LEGACY`
                    : `${API_URLS.SWAP_HOST}/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&txVersion=LEGACY`;

                const { data: swapResponse } = await axios.get<SwapCompute>(swapEndpoint);

                if (!swapResponse.success) {
                    return { status: 403, msg: `Swap failed: ${swapResponse.msg}` };
                }

                let data;
                try {
                    const response = await axios.post<{
                        id: string;
                        version: string;
                        success: boolean;
                        data: { transaction: string }[];
                    }>(`${API_URLS.SWAP_HOST}/transaction/swap-base-in`, {
                        computeUnitPriceMicroLamports: String(priorityFeeValue),
                        swapResponse,
                        txVersion: 'LEGACY',
                        wallet: owner.publicKey.toBase58(),
                        wrapSol: isInputSol,
                        unwrapSol: isOutputSol,
                        inputAccount: isInputSol ? undefined : inputTokenAcc?.toBase58(),
                        outputAccount: isOutputSol ? undefined : outputTokenAcc?.toBase58(),
                    });
                    data = response.data;
                } catch (error: any) {
                    logger.error(`failed to build transaction via Raydium API due to ${error.toString()}`)
                    throw error;
                }

                if (!data.success || !data.data) {
                    return { status: 403, msg: `Swap transactions failed` };
                }

                for (let i = 0; i < data.data.length; i++) {
                    const _tx = data.data[i];
                    let tx = Transaction.from(Buffer.from(_tx.transaction, "base64"));

                    const solAmount = (() => {
                        if (isInputSol) {
                            return new BN(swapResponse.data.inputAmount)
                        } else {
                            return new BN(swapResponse.data.outputAmount)
                        }
                    })();

                    // Only add fee transfers to the last transaction
                    if (i === data.data.length - 1) {
                        if (referrerInfo?.referrerId) {
                            const referralInfo = await referralController.findOne({
                                userId: referrerInfo.referrerId,
                            });

                            const referralFeeBasisPoints = new BN(referralInfo.feeEarn * 10000);
                            const swapFee = solAmount?.mul(feeBasisPoints).div(new BN(10000));
                            const referralFee = swapFee.mul(referralFeeBasisPoints).div(new BN(10000));
                            const adminFee = swapFee.sub(referralFee);

                            tx.add(
                                SystemProgram.transfer({
                                    fromPubkey: owner.publicKey,
                                    toPubkey: new PublicKey(referralInfo.wallet),
                                    lamports: referralFee.toNumber()
                                })
                            );

                            tx.add(
                                SystemProgram.transfer({
                                    fromPubkey: owner.publicKey,
                                    toPubkey: new PublicKey(ConfigService.getConfig().swap.adminWalletAddress),
                                    lamports: adminFee.toNumber()
                                })
                            );

                        } else {
                            const swapFee = solAmount?.mul(feeBasisPoints).div(new BN(10000));

                            tx.add(
                                SystemProgram.transfer({
                                    fromPubkey: owner.publicKey,
                                    toPubkey: new PublicKey(ConfigService.getConfig().swap.adminWalletAddress),
                                    lamports: swapFee.toNumber()
                                })
                            );
                        }
                    }

                    txs.push(tx);
                };
            } else {
                const wallet = new Wallet(web3.Keypair.fromSecretKey(owner.secretKey))
                const provider = new AnchorProvider(
                    connection,
                    wallet,
                    { commitment: "confirmed" }
                );
                const PUMPSWAP_PROGRAM_ID = new PublicKey("pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA");
                const GLOBAL_CONFIG_PUBKEY = new PublicKey("ADyA8hdefvWN2dbGGWFotbzWxrAvLW83WG6QCVXvJKqw");
                const FEE_RECIPIENT_PUBKEY = new PublicKey("7VtfL8fvgNfhz17qKRMjzQEXgbdpnHHHQRh54R9jP2RJ");
                const [EVENT_AUTHORITY_PDA] = PublicKey.findProgramAddressSync(
                    [Buffer.from("__event_authority")],
                    PUMPSWAP_PROGRAM_ID
                );

                const program = new Program<any>(idl, provider);
                const poolPubkey = new PublicKey(pairAddress as string);

                const poolAccount = await (program.account as any).pool.fetch(poolPubkey);

                // Derive the coin_creator_vault_authority PDA
                const [coinCreatorVaultAuthority] = PublicKey.findProgramAddressSync(
                    [
                        Buffer.from("creator_vault"),
                        poolAccount.coinCreator.toBuffer()
                    ],
                    program.programId
                );

                const baseMintAddress = !isInputSol ? inputMintAddress : outMintAddress;
                const quoteMintAddress = NATIVE_MINT.toBase58();
                const baseMintPubkey = new PublicKey(baseMintAddress);
                const quoteMintPubkey = NATIVE_MINT;
                const inputAmount = new BN(amount);
                const globalConfigData = await (program.account as any).globalConfig.fetch(GLOBAL_CONFIG_PUBKEY);
                const lpFeeBasisPoints = new BN((globalConfigData as any).lpFeeBasisPoints.toString());
                const protocolFeeBasisPoints = new BN((globalConfigData as any).protocolFeeBasisPoints.toString());
                const coinCreatorVaultAta = await getAssociatedTokenAddress(NATIVE_MINT, coinCreatorVaultAuthority, true);
                const poolBaseTokenAccount = await getAssociatedTokenAddress(baseMintPubkey, poolPubkey, true);
                const poolQuoteTokenAccount = await getAssociatedTokenAddress(quoteMintPubkey, poolPubkey, true);
                const poolBaseReserve = new BN((await connection.getTokenAccountBalance(poolBaseTokenAccount)).value.amount);
                const poolQuoteReserve = new BN((await connection.getTokenAccountBalance(poolQuoteTokenAccount)).value.amount);

                const tx = new Transaction();
                let solAmount;

                tx.add(ComputeBudgetProgram.setComputeUnitPrice({ microLamports: priorityFeeValue || 100000 }));

                if (isInputSol) {
                    let quoteAmount: InstanceType<typeof BN>;
                    let minBaseAmountOut: InstanceType<typeof BN>;
                    let maxQuoteAmountIn: InstanceType<typeof BN>;

                    if (useSwapBaseOut && preferredOutputAmount) {
                        const desiredTokenOutput = new BN(new Decimal(preferredOutputAmount).mul(Math.pow(10, quoteDecimal || 0)).toFixed(0));

                        const p_buy = desiredTokenOutput;
                        if (p_buy.gte(poolBaseReserve)) throw Error("Desired output exceeds pool reserves.");

                        const numerator = p_buy.mul(poolQuoteReserve);
                        const denominator = poolBaseReserve.sub(p_buy);
                        if (denominator.isZero() || denominator.isNeg()) throw Error("Pool would be depleted (reverse calc).");
                        const u_buy = numerator.div(denominator);

                        const s_buy = lpFeeBasisPoints.add(protocolFeeBasisPoints);
                        const a_buy = new BN(10000).add(s_buy);
                        quoteAmount = u_buy.mul(a_buy).div(new BN(10000));

                        minBaseAmountOut = desiredTokenOutput;
                        maxQuoteAmountIn = quoteAmount.mul(new BN(10000 + slippageBps)).div(new BN(10000));
                    } else {
                        quoteAmount = inputAmount;
                        const s_buy = lpFeeBasisPoints.add(protocolFeeBasisPoints);
                        const a_buy = new BN(10000).add(s_buy);
                        const u_buy = quoteAmount.mul(new BN(10000)).div(a_buy);
                        const h_buy = poolBaseReserve.mul(u_buy);
                        const l_buy = poolQuoteReserve.add(u_buy);
                        if (l_buy.isZero()) throw Error("Pool would be depleted (buy calc).");
                        const p_buy = h_buy.div(l_buy);

                        minBaseAmountOut = p_buy;
                        maxQuoteAmountIn = quoteAmount.mul(new BN(10000 + slippageBps)).div(new BN(10000));
                    }

                    solAmount = inputAmount;

                    if (!hasInputTokenAcc) {
                        tx.add(
                            createAssociatedTokenAccountInstruction(
                                owner.publicKey,
                                inputTokenAcc,
                                owner.publicKey,
                                quoteMintPubkey,
                                TOKEN_PROGRAM_ID,
                                ASSOCIATED_TOKEN_PROGRAM_ID
                            )
                        );
                    };

                    if (!hasOutputTokenAcc) {
                        const baseTokenProgramId = await getTokenProgramId(baseMintAddress);
                        tx.add(
                            createAssociatedTokenAccountInstruction(
                                owner.publicKey,
                                outputTokenAcc,
                                owner.publicKey,
                                baseMintPubkey,
                                baseTokenProgramId,
                                ASSOCIATED_TOKEN_PROGRAM_ID
                            )
                        )
                    };

                    tx.add(
                        SystemProgram.transfer({
                            fromPubkey: owner.publicKey,
                            toPubkey: inputTokenAcc,
                            lamports: maxQuoteAmountIn.toNumber(),
                        }),
                        createSyncNativeInstruction(inputTokenAcc)
                    );

                    const baseTokenProgramId = await getTokenProgramId(baseMintAddress);
                    const ix = await (program.methods as any)
                        .buy(minBaseAmountOut, maxQuoteAmountIn)
                        .accounts({
                            pool: poolPubkey,
                            user: owner.publicKey,
                            globalConfig: GLOBAL_CONFIG_PUBKEY,
                            baseMint: baseMintPubkey,
                            quoteMint: quoteMintPubkey,
                            userBaseTokenAccount: outputTokenAcc,
                            userQuoteTokenAccount: inputTokenAcc,
                            poolBaseTokenAccount: poolBaseTokenAccount,
                            poolQuoteTokenAccount: poolQuoteTokenAccount,
                            protocolFeeRecipient: FEE_RECIPIENT_PUBKEY,
                            protocolFeeRecipientTokenAccount: await getAssociatedTokenAddress(quoteMintPubkey, FEE_RECIPIENT_PUBKEY, true),
                            baseTokenProgram: baseTokenProgramId,
                            quoteTokenProgram: TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            eventAuthority: EVENT_AUTHORITY_PDA,
                            program: PUMPSWAP_PROGRAM_ID,
                            coinCreatorVaultAta,
                            coinCreatorVaultAuthority
                        })
                        .instruction();
                    tx.add(ix);
                } else {
                    const baseAmount = inputAmount;
                    if (baseAmount.gt(poolBaseReserve)) throw Error("Cannot sell more base tokens than pool reserves.");
                    const s_sell = poolQuoteReserve.mul(baseAmount);
                    const a_sell = poolBaseReserve.sub(baseAmount);
                    if (a_sell.isZero()) throw Error("Pool would be depleted (sell calc).");
                    const u_sell = s_sell.div(a_sell);
                    const h_sell = u_sell.mul(lpFeeBasisPoints).div(new BN(10000));
                    const l_sell = u_sell.mul(protocolFeeBasisPoints).div(new BN(10000));
                    const p_sell = u_sell.sub(h_sell).sub(l_sell);
                    const minQuoteAmountOut = p_sell.mul(new BN(10000).sub(new BN(slippageBps))).div(new BN(10000));

                    solAmount = minQuoteAmountOut;

                    if (!hasInputTokenAcc) {
                        const baseTokenProgramId = await getTokenProgramId(baseMintAddress);
                        tx.add(
                            createAssociatedTokenAccountInstruction(
                                owner.publicKey,
                                inputTokenAcc,
                                owner.publicKey,
                                baseMintPubkey,
                                baseTokenProgramId,
                                ASSOCIATED_TOKEN_PROGRAM_ID
                            )
                        );
                    };

                    if (!hasOutputTokenAcc) {
                        tx.add(
                            createAssociatedTokenAccountInstruction(
                                owner.publicKey,
                                outputTokenAcc,
                                owner.publicKey,
                                quoteMintPubkey,
                                TOKEN_PROGRAM_ID,
                                ASSOCIATED_TOKEN_PROGRAM_ID
                            )
                        );
                    };

                    const baseTokenProgramId = await getTokenProgramId(baseMintAddress);
                    const ix = await (program.methods as any)
                        .sell(baseAmount, minQuoteAmountOut)
                        .accounts({
                            pool: poolPubkey,
                            user: owner.publicKey,
                            globalConfig: GLOBAL_CONFIG_PUBKEY,
                            baseMint: baseMintPubkey,
                            quoteMint: quoteMintPubkey,
                            userBaseTokenAccount: inputTokenAcc,
                            userQuoteTokenAccount: outputTokenAcc,
                            poolBaseTokenAccount: poolBaseTokenAccount,
                            poolQuoteTokenAccount: poolQuoteTokenAccount,
                            protocolFeeRecipient: FEE_RECIPIENT_PUBKEY,
                            protocolFeeRecipientTokenAccount: await getAssociatedTokenAddress(quoteMintPubkey, FEE_RECIPIENT_PUBKEY, true),
                            baseTokenProgram: baseTokenProgramId,
                            quoteTokenProgram: TOKEN_PROGRAM_ID,
                            systemProgram: SystemProgram.programId,
                            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                            eventAuthority: EVENT_AUTHORITY_PDA,
                            program: PUMPSWAP_PROGRAM_ID,
                            coinCreatorVaultAta,
                            coinCreatorVaultAuthority
                        })
                        .instruction();
                    tx.add(ix);
                    tx.add(
                        closeAccountInstruction({
                            tokenAccount: outputTokenAcc,
                            payer: owner.publicKey,
                            owner: owner.publicKey,
                        })
                    );
                }

                if (referrerInfo?.referrerId) {
                    const referralInfo = await referralController.findOne({
                        userId: referrerInfo.referrerId,
                    });

                    const referralFeeBasisPoints = new BN(referralInfo.feeEarn * 10000);
                    const swapFee = solAmount?.mul(feeBasisPoints).div(new BN(10000));
                    const referralFee = swapFee.mul(referralFeeBasisPoints).div(new BN(10000));
                    const adminFee = swapFee.sub(referralFee);

                    tx.add(
                        SystemProgram.transfer({
                            fromPubkey: owner.publicKey,
                            toPubkey: new PublicKey(referralInfo.wallet),
                            lamports: referralFee.toNumber()
                        })
                    );

                    tx.add(
                        SystemProgram.transfer({
                            fromPubkey: owner.publicKey,
                            toPubkey: new PublicKey(ConfigService.getConfig().swap.adminWalletAddress),
                            lamports: adminFee.toNumber()
                        })
                    );

                } else {
                    const swapFee = solAmount?.mul(feeBasisPoints).div(new BN(10000));

                    tx.add(
                        SystemProgram.transfer({
                            fromPubkey: owner.publicKey,
                            toPubkey: new PublicKey(ConfigService.getConfig().swap.adminWalletAddress),
                            lamports: swapFee.toNumber()
                        })
                    );
                }

                txs.push(tx);
            }

            let lastTxId = '';
            for (const tx of txs) {
                await rateLimiter.throttle();
                const latestBlockhash = await connection.getLatestBlockhash();

                tx.recentBlockhash = latestBlockhash.blockhash;
                tx.feePayer = botKeypair.publicKey;
                tx.partialSign(botKeypair);
                tx.partialSign(owner);

                const txId = await sendJitoTx(tx);
                lastTxId = txId;

                logger.info(`Swap processed tx: ${txId}`);

                await waitForTransactionConfirmation(connection, txId);
            }
            return { status: 200, txId: lastTxId };
        } catch (error: any) {
            logger.error(error.toString());
            return {
                status: 403,
                msg: `Error in apiSwap: ${error}`,
            };
        }
    }
};


async function sendJitoTx(transaction: Transaction): Promise<string> {
    const serializedTx = transaction.serialize()

    const payload = {
        jsonrpc: "2.0",
        id: 1,
        method: "sendTransaction",
        params: [bs58.encode(serializedTx)],
    };

    const response = await axios.post(JITO_API_URL, payload, {
        headers: { 'Content-Type': 'application/json' },
    });

    if (response.data.error) throw response.data.error;

    return response.data.result;
}
