import { Keypair } from "@solana/web3.js";

function generateNewWallet() {
  try {
    // Create a new random keypair
    const newWallet = Keypair.generate();

    // Get the private key in base58 format
    const privateKey = Buffer.from(newWallet.secretKey).toString('base64');
    const publicKey = newWallet.publicKey.toBase58();

    console.log('New Wallet Generated:');
    console.log('Public Key:', publicKey);
    console.log('Private Key:', privateKey);

    return {
      publicKey,
      privateKey
    };
  } catch (error) {
    console.error('Error generating wallet:', error);
    throw error;
  }
}

// Generate a new wallet and display the keys
generateNewWallet();