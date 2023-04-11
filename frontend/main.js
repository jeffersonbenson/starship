import '@picocss/pico'
import './assets/line-awesome.min.css'

import * as web3 from '@solana/web3.js';
import { Buffer } from 'buffer';
window.global = window;
global.Buffer = global.Buffer || Buffer;


window.makePayment = async (pubkey, form) => {
  const connection = new web3.Connection(web3.clusterApiUrl(import.meta.env.CLUSTER_API_URL), { confirmTransactionInitialTimeout: 5000 });

  console.log('connection established!');

  let transferAmount = 1 * web3.LAMPORTS_PER_SOL;

  const escrow_wallet = new web3.PublicKey(import.meta.env.VITE_ESCROW_WALLET);

  let ix = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: window.solana.publicKey,
      toPubkey: escrow_wallet,
      lamports: transferAmount,
    }),
  );
  // Setting the variables for the transaction
  ix.feePayer = await window.solana.publicKey;
  let blockhashObj = await connection.getLatestBlockhash();
  ix.recentBlockhash = await blockhashObj.blockhash;

  console.log('sending transaction...');
  let signed = await window.solana.signTransaction(ix);
  let signature = await connection.sendRawTransaction(signed.serialize());
  // const confirmation = await connection.confirmTransaction(blockhashObj.blockhash,blockhashObj.lastValidBlockHeight,signature);
  const confirmation = await connection.confirmTransaction(signature);
  console.log("Signature: ", signature);
};

window.stopPod = async (name) => {
  console.log("stopping pod");
  console.log(name);
};

window.addTime = async (uid) => {
  console.log("adding time");
  console.log(uid);
};

import Alpine from 'alpinejs'
 
window.Alpine = Alpine
 
Alpine.start()